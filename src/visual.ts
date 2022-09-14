'use strict';

//TODO: messages when last field is removed from the well
//TODO: make expand/collapse button icon different

import './../style/visual.less';
import powerbi from 'powerbi-visuals-api';
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import { valueFormatter } from 'powerbi-visuals-utils-formattingutils';
import { VisualSettings } from './settings';

// import * as d3select from 'd3-selection';

var DataTable = require('datatables.net')();
import 'datatables.net-dt';
import { formatDefaultLocale } from 'd3';

export class Visual implements IVisual {
  private settings: VisualSettings;
  private container: HTMLElement;

  constructor(options: VisualConstructorOptions) {
    console.log('Visual constructor', options);

    /** Visual container */
    this.container = options.element.appendChild(document.createElement('div'));
    this.container.setAttribute('style', 'width:auto');
    $(this.container).html('<p>Looks like we have no data - Go add some in the field wells</p>');
  }

  public update(options: VisualUpdateOptions) {
    console.log('Visual update', options);

    this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);

    /** Test 1: Data view has valid bare-minimum entries */
    let dataViews = options.dataViews;
    if (
      !dataViews ||
      !dataViews[0] ||
      !dataViews[0].table ||
      !dataViews[0].table.rows ||
      !dataViews[0].table.columns ||
      !dataViews[0].metadata
    ) {
      $(this.container).html('<p>Looks like we have no data - Go add some in the field wells</p>');
      return;
    }

    /** If we get this far, we can trust that we can work with the data! */
    let table = dataViews[0].table;

    let summaryColumns: Array<any> = table.columns.filter((col) => {
      return !col.roles.detailHTML;
    });

    let detailColumnindex = table.columns.findIndex((col) => {
      return col.roles.detailHTML;
    });

    if (summaryColumns.length === 0) {
      $(this.container).html(
        '<p>Looks like we have only detail rows - we need summary data to attach to those details. Go add a summary data item in the field well</p>'
      );
      return;
    }

    $(this.container).html('<table id="betterTable" class="display compact better-table"></table>');

    if (summaryColumns) {
      summaryColumns.sort((a, b) => {
        return a.rolesIndex.summaryRowColumn[0] - b.rolesIndex.summaryRowColumn[0];
      });

      const columns = summaryColumns.map((col) => {
        return {
          title: col.displayName,
          data: col.index,
          className: null,
          orderable: true,
          defaultContent: '-',
          width: 'auto',
          type: col.type,
          format: col.format,
        };
      });

      if (detailColumnindex !== -1) {
        columns.unshift({
          title: '',
          className: 'dt-control',
          orderable: false,
          data: null,
          defaultContent: '',
          width: '1%',
          type: 'control',
          format: null,
        });
      }

      const tableHeight = options.viewport.height - 80;

      let formatTableData = (columns, rows) => {
        let formatDate = (date, format) => {
          let formatter = valueFormatter.create({ format: format });
          return formatter.format(new Date(date));
        };

        let formatNumber = (number, format) => {
          let formatter = valueFormatter.create({ value: 0, format: format });
          return formatter.format(number);
        };

        columns.forEach((col, index) => {
          if (col.type.dateTime) {
            col.render = function (data, type, row, meta) {
              return type === 'display' && data !== null ? formatDate(data, col.format) : data;
            };
          }
          if (col.type.numeric) {
            col.render = function (data, type, row, meta) {
              return type === 'display' ? formatNumber(data, col.format) : data;
            };
          }
        });
      };

      let intialiseDataTable = () => {
        formatTableData(columns, table.rows);

        let betterTable = $('#betterTable').DataTable({
          data: table.rows,
          columns: columns,
          scrollY: tableHeight + 'px',
          scrollCollapse: true,
          paging: false,
          info: false,
          order: detailColumnindex !== -1 ? [[1, 'asc']] : [[0, 'asc']],
        });

        $('#betterTable').on('click', 'td.dt-control', function () {
          let tr = $(this).closest('tr');
          let row = betterTable.row(tr);

          if (row.child.isShown()) {
            row.child.hide();
            tr.removeClass('shown');
          } else {
            row.child(formatDetail(row.data())).show();
            tr.addClass('shown');
          }
        });
      };

      if (DataTable.isDataTable('#betterTable')) {
        $('#betterTable').DataTable().destroy();
      }

      intialiseDataTable();

      let formatDetail = (d) => {
        return `<div class="table-detail">${d[detailColumnindex]}</div>`;
      };
    }
  }

  private static parseSettings(dataView: DataView): VisualSettings {
    return VisualSettings.parse(dataView) as VisualSettings;
  }

  /**
   * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
   * objects and properties you want to expose to the users in the property pane.
   *
   */
  public enumerateObjectInstances(
    options: EnumerateVisualObjectInstancesOptions
  ): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
    return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
  }
}
