'use strict';

import './../style/visual.less';
import powerbi from 'powerbi-visuals-api';
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

import { VisualSettings } from './settings';
// import * as d3select from 'd3-selection';

var DataTables = require('datatables.net')();
import 'datatables.net-dt';

export class Visual implements IVisual {
  private settings: VisualSettings;
  private container: JQuery<HTMLElement>;
  private initialLoop: boolean = true;
  private betterTable: any;

  constructor(options: VisualConstructorOptions) {
    console.log('Visual constructor', options);
    /** Visual container */
    $(options.element).append('<table id="betterTable" class="display compact better-table" width="100%"></table>');
  }

  public update(options: VisualUpdateOptions) {
    console.log('betterTable update', this.betterTable);

    this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);

    /** Test 1: Data view has valid bare-minimum entries */
    let dataViews = options.dataViews;
    console.log('Test 1: Valid data view...');
    if (
      !dataViews ||
      !dataViews[0] ||
      !dataViews[0].table ||
      !dataViews[0].table.rows ||
      !dataViews[0].table.columns ||
      !dataViews[0].metadata
    ) {
      console.log('Test 1 FAILED. No data to draw table.');
      return;
    }

    /** If we get this far, we can trust that we can work with the data! */
    let table = dataViews[0].table;

    const columns = table.columns.map((col) => {
      return { title: col.displayName };
    });

    console.log('columns', columns);

    if (this.initialLoop) {
      console.log('Initial loop...');

      this.initialLoop = false;
    } else {
      console.log('Not initial loop...');
      try {
        console.log('betterTable', this.betterTable);

        this.betterTable.destroy();
        $('#betterTable').empty();
      } catch (e) {
        console.log(e);
      }
    }

    const tableHeight = options.viewport.height - 100;

    this.betterTable = $('#betterTable').DataTable({
      data: table.rows,
      columns: columns,
      scrollY: tableHeight + 'px',
      scrollCollapse: true,
      paging: false,
    });

    console.log('Table rendered!');
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
