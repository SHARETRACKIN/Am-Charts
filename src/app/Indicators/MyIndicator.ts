import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5stock from "@amcharts/amcharts5/stock";
  
// Defining custom settings
export interface MyIndicatorSettings extends am5stock.IIndicatorSettings {
    margin?: number;
    seriesStyle?: "Solid" | "Dashed";
    showFill?: boolean;
  }
  
  // Define indicator class
export class MyIndicator extends am5stock.Indicator {
  
    // Declaring custom settings use
    declare public _settings: MyIndicatorSettings;
  
    public override _editableSettings: am5stock.IIndicatorEditableSetting[] = [{
      key: "margin",
      name: "Margin",
      type: "number"
    }, {
      key: "seriesColor",
      name: "Color",
      type: "color"
    }, {
      key: "seriesStyle",
      name: "Line Style",
      type: "dropdown",
      options: ["Solid", "Dashed"]
    }, {
      key: "showFill",
      name: "Show fill",
      type: "checkbox"
    }];
  
    declare series: am5xy.SmoothedXLineSeries;
  
    public override _afterNew() {
  
      // Set default indicator name
      this._setDefault("name", "My Indicator");
      this._setDefault("margin", 100);
      this._setDefault("seriesColor", am5.color(0x045153));
      this._setDefault("seriesStyle", "Solid");
      this._setDefault("showFill", true);
  
      // Setting up indicator elements
      const stockSeries = this.get("stockSeries");
      const chart = stockSeries.chart;
  
      if (chart) {
        const series = chart.series.push(am5xy.SmoothedXLineSeries.new(this._root, {
          valueXField: "valueX",
          valueYField: "valueY1",
          openValueYField: "valueY2",
          groupDataDisabled: true,
          calculateAggregates: true,
          xAxis: stockSeries.get("xAxis"),
          yAxis: stockSeries.get("yAxis"),
          themeTags: ["indicator"],
          name: "My Indicator",
          legendLabelText: "{name}",
          legendValueText: "high: [bold]{valueY}[/] - low: [bold]{openValueY}[/]",
          legendRangeValueText: "",
          stroke: this.get("seriesColor"),
          fill: this.get("seriesColor")
        }));
  
        series.fills.template.setAll({
          fillOpacity: 0.3,
          visible: true
        });
  
        this.series = series;
        this._handleLegend(series);
      }
  
      // Don't forget inherited stuff
      super._afterNew();
    }
  
    public override _beforeChanged() {
  
      if (this.isDirty("margin")) {
        this.markDataDirty();
      }
  
      if (this.isDirty("seriesStyle")) {
        const style = this.get("seriesStyle");
        if (style == "Dashed") {
          this.series.strokes.template.set("strokeDasharray", [4, 4]);
        }
        else {
          this.series.strokes.template.remove("strokeDasharray");
        }
      }
  
      if (this.isDirty("showFill")) {
        this.series.fills.template.set("visible", this.get("showFill"));
      }
  
      // Don't forget inherited stuff
      super._beforeChanged();
    }
  
    public override prepareData() {
      // Setting up data
      const stockSeries = this.get("stockSeries");
      const dataItems = stockSeries.dataItems;
      let data = this._getDataArray(dataItems);
  
      const margin = this.get("margin", 0);
  
      am5.array.each(data, function(item, i) {
        let baseValue = dataItems[i].get("valueY", 0);
        item.valueY1 = baseValue + Math.round(Math.random() * margin);
        item.valueY2 = baseValue - Math.round(Math.random() * margin);
      });
  
      this.series.data.setAll(data);
    }
  
  }

