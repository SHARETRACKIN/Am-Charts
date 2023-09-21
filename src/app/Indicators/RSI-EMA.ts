import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5stock from "@amcharts/amcharts5/stock";

// Defining custom settings
export interface RSI_EMASettings extends am5stock.IIndicatorSettings {
    period?: number;
    oversoldLevel?: number;
    overboughtLevel?: number;
	increasingColor?: am5.Color;
	decreasingColor?: am5.Color;
    // seriesStyle?: "Solid" | "Dashed";
    // showFill?: boolean;
  }
  
  // Define indicator class
export class RSI_EMA extends am5stock.Indicator {
    // Declaring custom settings use
    declare public _settings: RSI_EMASettings;

    public override _editableSettings: am5stock.IIndicatorEditableSetting[] = [
    {
      key: "period",
      name: "Period",
      type: "number"
    }, 
    {
      key: "oversoldLevel",
      name: "Over Sold Level",
      type: "number"
    }, 
    {
      key: "overboughtLevel",
      name: "Overbought Level",
      type: "number"
    }, 
    {
        key: "increasingColor",
        name: this.root.language.translateAny("Increasing"),
        type: "color"
	}, 
    {
		key: "decreasingColor",
		name: this.root.language.translateAny("Decreasing"),
		type: "color"
    },
    {
      key: "seriesColor",
      name: "Color",
      type: "color"
    }
    // {
    //   key: "seriesStyle",
    //   name: "Line Style",
    //   type: "dropdown",
    //   options: ["Solid", "Dashed"]
    // }, 
    // {
    //   key: "showFill",
    //   name: "Show fill",
    //   type: "checkbox"
    //}
    ];
  
	public panel!: am5stock.StockPanel;
	public xAxis!: am5xy.DateAxis<am5xy.AxisRenderer>;
	public yAxis!: am5xy.ValueAxis<am5xy.AxisRenderer>;

    declare public series: am5xy.LineSeries;
	public signalSeries!: am5xy.LineSeries;
    public differenceSeries!: am5xy.ColumnSeries;

    public _createSeries(): am5xy.LineSeries {
		return this.panel.series.push(am5xy.LineSeries.new(this._root, {
			themeTags: ["indicator"],
			xAxis: this.xAxis,
			yAxis: this.yAxis,
			valueXField: "valueX",
			valueYField: "RSIEMA",
			groupDataDisabled: true,
			stroke: this.get("seriesColor"),
			fill: undefined
		}))
	}
  
    public override _afterNew() {
  
      // Set default indicator name
      this._setDefault("name", "RSI and EMA");
      this._setDefault("period", 3);
      this._setDefault("oversoldLevel", 30);
      this._setDefault("overboughtLevel", 70);
      this._setDefault("seriesColor", am5.color(0x045153));
      //this._setDefault("seriesStyle", "Solid");
      //this._setDefault("showFill", true);
  
      const chart = this.panel;

      if (chart) {

          const signalSeries = chart.series.push(am5xy.LineSeries.new(this._root, {
              valueXField: "valueX",
              valueYField: "signal",
              xAxis: this.xAxis,
              yAxis: this.yAxis,
              groupDataDisabled: true,
              themeTags: ["indicator", "signal"]
          }))

          this.signalSeries = signalSeries;

          const differenceSeries = chart.series.push(am5xy.ColumnSeries.new(this._root, {
              valueXField: "valueX",
              valueYField: "difference",
              xAxis: this.xAxis,
              yAxis: this.yAxis,
              groupDataDisabled: true,
              themeTags: ["indicator", "difference"]
          }))

          this.differenceSeries = differenceSeries;
      }


    //   // Setting up indicator elements
    //   const stockSeries = this.get("stockSeries");
    //   const chart = stockSeries.chart;
  
    //   if (chart) {
    //     const series = chart.series.push(am5xy.LineSeries.new(this._root, {
    //         valueXField: "valueX",
    //         valueYField: "ma",
    //         groupDataDisabled: true,
    //         calculateAggregates: true,
    //         xAxis: stockSeries.get("xAxis"),
    //         yAxis: stockSeries.get("yAxis"),
    //         themeTags: ["indicator", "movingaverage"],
    //         name: "RSI and EMA",
    //         legendLabelText: "{name}",
    //         legendValueText: "high: [bold]{valueY}[/] - low: [bold]{openValueY}[/]",
    //         legendRangeValueText: "",
    //         stroke: this.get("seriesColor"),
    //         fill: this.get("seriesColor")
    //       }))

    //       series.fills.template.setAll({
    //         fillOpacity: 0.3,
    //         visible: true
    //       });
    //       this.series = series;

    //     this._handleLegend(series);
    //   }

    //   if (chart) {
    //     const series = chart.series.push(am5xy.SmoothedXLineSeries.new(this._root, {
    //       valueXField: "valueX",
    //       valueYField: "valueY1",
    //       openValueYField: "valueY2",
    //       groupDataDisabled: true,
    //       calculateAggregates: true,
    //       xAxis: stockSeries.get("xAxis"),
    //       yAxis: stockSeries.get("yAxis"),
    //       themeTags: ["indicator"],
    //       name: "RSI and EMA",
    //       legendLabelText: "{name}",
    //       legendValueText: "high: [bold]{valueY}[/] - low: [bold]{openValueY}[/]",
    //       legendRangeValueText: "",
    //       stroke: this.get("seriesColor"),
    //       fill: this.get("seriesColor")
    //     }));
  
    //     series.fills.template.setAll({
    //       fillOpacity: 0.3,
    //       visible: true
    //     });
  
    //     this.series = series;
    //     this._handleLegend(series);
    //   }
  
      // Don't forget inherited stuff
      super._afterNew();
    }
  

	public override _prepareChildren() {
		if (this.isDirty("period")) {
			this._dataDirty = true;
			this.setCustomData("fastPeriod", this.get("period"));
		}
		super._prepareChildren();
	}

	public override _updateChildren() {
		super._updateChildren();

		if (this.isDirty("increasingColor") || this.isDirty("decreasingColor")) {
			const template = this.differenceSeries.columns.template;
			const increasing = this.get("increasingColor");
			const decreasing = this.get("decreasingColor");
			template.states.create("riseFromPrevious", { fill: increasing, stroke: increasing });
			template.states.create("dropFromPrevious", { fill: decreasing, stroke: decreasing });
			this._dataDirty = true;
		}

		// if (this.isDirty("signalColor")) {
		// 	this._updateSeriesColor(this.signalSeries, this.get("signalColor"), "signalColor");
		// }

		const dataItem = this.series.dataItem;
		if (dataItem) {
			const dataContext = dataItem.dataContext as any;
			if (dataContext) {
				dataContext.fastPeriod = this.get("period");

				const seriesColor = this.get("seriesColor");
				if (seriesColor) {
					dataContext.seriesColor = seriesColor.toCSSHex();
				}

				// const signalColor = this.get("signalColor");
				// if (signalColor) {
				// 	dataContext.signalColor = signalColor.toCSSHex();
				// }
			}
		}
	}


    // public override _beforeChanged() {
  
    //   if (this.isDirty("period")) {
    //     this.markDataDirty();
    //   }
  
    //   if (this.isDirty("oversoldLevel")) {
    //     this.markDataDirty();
    //   }
  
    //   if (this.isDirty("overboughtLevel")) {
    //     this.markDataDirty();
    //   }
  
    // //   if (this.isDirty("seriesStyle")) {
    // //     const style = this.get("seriesStyle");
    // //     if (style == "Dashed") {
    // //       this.series.strokes.template.set("strokeDasharray", [4, 4]);
    // //     }
    // //     else {
    // //       this.series.strokes.template.remove("strokeDasharray");
    // //     }
    // //   }
  
    // //   if (this.isDirty("showFill")) {
    // //     this.series.fills.template.set("visible", this.get("showFill"));
    // //   }
  
    //   // Don't forget inherited stuff
    //   super._beforeChanged();
    // }
  
    public override prepareData() {

		if (this.series) {
			const dataItems = this.get("stockSeries").dataItems;

			let data = this._getDataArray(dataItems);
			let period = this.get("period", 12);

			this._ema(data, period, "value_y", "emaFast");

			// period = this.get("slowPeriod", 26);
			// this._ema(data, period, "value_y", "emaSlow");

			am5.array.each(data, (dataItem) => {
				let emaFast = dataItem.emaFast;
				let emaSlow = dataItem.emaSlow;

				if (emaFast != null && emaSlow != null) {
					dataItem.macd = emaFast - emaSlow;
				}
			})

			// period = this.get("signalPeriod", 9);
			// this._ema(data, period, "macd", "signal");

			const increasingColor = this.get("increasingColor", am5.color(0x00ff00)).toCSSHex();
			const decreasingColor = this.get("decreasingColor", am5.color(0xff0000)).toCSSHex();

			let p = -Infinity;
			am5.array.each(data, (dataItem) => {
				let macd = dataItem.macd
				let signal = dataItem.signal;
				if (macd != null && signal != null) {
					let difference = macd - signal;
					dataItem.difference = difference;

					let color = increasingColor;

					if (difference < p) {
						color = decreasingColor;
					}
					dataItem.differenceColor = color;
					p = difference;
				}
			})

			this.differenceSeries.data.setAll(data);
			this.signalSeries.data.setAll(data);
			this.series.data.setAll(data);
		}


        // // Setting up data
        // const stockSeries = this.get("stockSeries");
        // const dataItems = stockSeries.dataItems;
        // let data = this._getDataArray(dataItems);

        // // RSI parameters
        // const period = this.get("period", 0);
        // const oversoldLevel = this.get("oversoldLevel", 0);
        // const overboughtLevel = this.get("overboughtLevel", 0);
            
        // // Calculate RSI
        // function calculateRSI(data: string | any[]) {
        //     const changes = [];
        //     for (let i = 1; i < data.length; i++) {
        //         changes.push(data[i].valueX - data[i - 1].valueX);
        //     }
        //     let gains = [];
        //     let losses = [];
        //     for (let i = 0; i < changes.length; i++) {
        //         if (changes[i] > 0) {
        //             gains.push(changes[i]);
        //             losses.push(0);
        //         } else {
        //             gains.push(0);
        //             losses.push(Math.abs(changes[i]));
        //         }
        //     }
        //     let avgGain = calculateAverage(gains, period);
        //     let avgLoss = calculateAverage(losses, period);
        //     const rs = avgGain / avgLoss;
        //     const rsi = 100 - (100 / (1 + rs));
        //     return rsi;
        // }

        // // Calculate average
        // function calculateAverage(arr: any[], period: number) {
        //     const sum = arr.slice(0, period).reduce((total, value) => total + value, 0);
        //     return sum / period;
        // }

        // // Check for crossover signals
        // function checkCrossover(data: string | any[], rsi: string | any[], ema: string | any[]) {
        //     const lastData = data[data.length - 1];
        //     const lastRSI = rsi[rsi.length - 1];
        //     const lastEMA = ema[ema.length - 1];
        //     if (lastRSI < oversoldLevel && lastData.valueX > lastEMA) {
        //         console.log("Go Long");
        //     } else if (lastRSI < oversoldLevel && lastData.valueX <= lastEMA) {
        //         console.log("Hold Long");
        //     } else if (lastRSI > overboughtLevel && lastData.valueX < lastEMA) {
        //         console.log("Go Short");
        //     } else if (lastRSI > overboughtLevel && lastData.valueX >= lastEMA) {
        //         console.log("Hold Short");
        //     } else {
        //         console.log("No Signal");
        //     }
        // }

        // // Usage example
        // const rsi: string | any[] = [];
        // const ema: string | any[] = [];

        // // Calculate RSI and EMA for each data point
        // for (let i = period; i <= data.length; i++) {
        //     const currentData = data.slice(i - period, i);
        //     const currentRSI = calculateRSI(currentData);
        //     rsi.push(currentRSI);
        // }

        // // Calculate EMA based on rsi
        // for (let i = period; i <= rsi.length; i++) {
        //     const currentEMA = calculateAverage(rsi.slice(i - period, i), period);
        //     ema.push(currentEMA);
        // }


        // // am5.array.each(data, function(item, i) {

        // //     // Calculate RSI and EMA for each data point
        // //     const currentData = data.slice(i - period, i);
        // //     const currentRSI = calculateRSI(currentData);
        // //     item.valueX = currentRSI

        // //     // // Calculate EMA based on rsi
        // //     // for (let i = period; i <= rsi.length; i++) {
        // //     //     item.valueX = calculateAverage(rsi.slice(i - period, i), period);
        // //     // }

        // // });

        // // Check crossover signals 
        // //checkCrossover(data, rsi, ema);

        // this.series.data.setAll(ema);
    }
  
  }

