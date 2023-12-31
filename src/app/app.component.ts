import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHandler, HttpHeaders, HttpParams, HttpXhrBackend } from '@angular/common/http';
import { AuthenticationRequest } from './models/authentication-request';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5stock from "@amcharts/amcharts5/stock";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { DatePipe } from '@angular/common';
import { MyIndicator } from './Indicators/MyIndicator';
import { Indicators } from '@amcharts/amcharts5/.internal/charts/stock/toolbar/IndicatorControl';
import { any } from '@amcharts/amcharts5/.internal/core/util/Array';
import { RSI_EMA } from './Indicators/RSI-EMA';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  title = 'am-chart-standalone';
  private mainHttpClient: HttpClient;
  arrayResponse: any[] = [];
  stringResponse: string = "";
  public tickers: any[] = [];
  mainConfigService: string = 'https://localhost:5003/';

  userObject: AuthenticationRequest = {
    UserName: "Encompass Admin",
    Password: "3ykw0AlS!5"
  }

  // userObject: AuthenticationRequest = {
  //   UserName: "Admin",
  //   Password: "Admin!12345"
  // }

  constructor(httpClient: HttpClient,)
  {
    this.mainHttpClient = httpClient;
  }

  ngOnInit(): void {

    const headers = new HttpHeaders({
      'Content-Type': ' application/json;odata.metadata=minimal;odata.streaming=true'
    });
    let endpoint = `${this.mainConfigService}${'api/Authentication/Authenticate'}`;
    this.mainHttpClient.post(endpoint, JSON.stringify(this.userObject), { headers })
    .subscribe(
      (response: any) => {
        // Check if the response contains the 'serialnumber' property with value -2
        if (response.serialnumber === -2) {
          return;
         
        } else {
          

          am5.addLicense("AM5S418949442"); 
      
          let headers = new HttpHeaders()
          headers = headers.append('content-type','application/json')
          headers = headers.append('Authorization', 'Bearer ' + response.token);
        
          let endpoint = `${this.mainConfigService}${'api/odata/CKS_SharetEquitiesHistory?%24orderby=Date&%24select=Close%2CDate%2CHigh%2CLow%2COpen%2CVolume&%24filter=(ShareCode%20eq%20%27SOL%27%20and%20High%20gt%200%20and%20Low%20gt%200%20and%20Close%20gt%200)'}`;
          this.mainHttpClient.get<any>(endpoint, { headers })
            .subscribe(
              (response: { [x: string]: any; }) => {
                this.arrayResponse = JSON.parse(JSON.stringify(response["value"]))
                if (this.arrayResponse.length > 0) {
                  changeAllJSONArrayDateToUTCDateString(this.arrayResponse);
                  this.stringResponse = JSON.stringify(this.arrayResponse);
                  // this.stringResponse = this.stringResponse.replace(new RegExp('DateUpdated', 'g'), 'Date')
                  // this.stringResponse = this.stringResponse.replace(new RegExp('LastTradedVolume', 'g'), 'Volume')
                  this.arrayResponse = JSON.parse(this.stringResponse)
                }
                

                let tickersArrayResponse: any[] = [];
                let tickersStringResponse: string = "";

                let endpoint = `${'https://localhost:5003/api/odata/CKS_SharetEquities?%24select=ShareCode%2CShareCodeID%2CCompanyName'}`;
                const httpClient = new HttpClient(new HttpXhrBackend({ 
                  build: () => new XMLHttpRequest() 
                }));
                httpClient.get<any>(endpoint, { headers })
                  .subscribe(
                    (response: { [x: string]: any; }) => {
                      tickersArrayResponse = JSON.parse(JSON.stringify(response["value"]))
                      if (tickersArrayResponse.length > 0) {
                        tickersStringResponse = JSON.stringify(tickersArrayResponse);
                        tickersStringResponse = tickersStringResponse.replace(new RegExp('CompanyName', 'g'), 'label')
                        tickersStringResponse = tickersStringResponse.replace(new RegExp('ShareCodeID', 'g'), 'id')
                        tickersStringResponse = tickersStringResponse.replace(new RegExp('ShareCode', 'g'), 'subLabel')
                        tickersArrayResponse = JSON.parse(tickersStringResponse)

                        this.tickers = tickersArrayResponse;
                      } else {
                        this.tickers = [ { subLabel: "SOL", id: "SOL", label: "SASOL LIMITED" } ]
                      }

                        // Vincent Second Chart - *************************************************************************************************************************

                        //*********************************************************************************************************************************************************************************** */
                        // Create root element
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/getting-started/#Root_element
                        let root = am5.Root.new("chartdiv");


                        // Set themes
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/concepts/themes/
                        root.setThemes([
                          am5themes_Animated.new(root)
                        ]);


                        // Create a stock chart
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/charts/stock-chart/#Instantiating_the_chart
                        let stockChart = root.container.children.push(am5stock.StockChart.new(root, {
                        }));


                        // Set global number format
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/concepts/formatters/formatting-numbers/
                        root.numberFormatter.set("numberFormat", "#,###.00");


                        // Create a main stock panel (chart)
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/charts/stock-chart/#Adding_panels
                        let mainPanel = stockChart.panels.push(am5stock.StockPanel.new(root, {
                          wheelY: "zoomX",
                          panX: true,
                          panY: false
                        }));


                        // Create value axis
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
                        let valueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
                          renderer: am5xy.AxisRendererY.new(root, {
                            pan: "zoom",
                          }),
                          extraMin: 0.1, // adds some space for the main series
                          tooltip: am5.Tooltip.new(root, {}),
                          numberFormat: "#,###.00",
                          extraTooltipPrecision: 2
                        }));

                        let dateAxis = mainPanel.xAxes.push(am5xy.GaplessDateAxis.new(root, {
                          baseInterval: {
                            timeUnit: "day",
                            count: 1
                          },
                          groupData: true,
                          renderer: am5xy.AxisRendererX.new(root, {}),
                          tooltip: am5.Tooltip.new(root, {})
                        }));


                        // Add series
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
                        let valueSeries = mainPanel.series.push(am5xy.CandlestickSeries.new(root, {
                          name: "SOL",
                          clustered: false,
                          valueXField: "Date",
                          valueYField: "Close",
                          highValueYField: "High",
                          lowValueYField: "Low",
                          openValueYField: "Open",
                          calculateAggregates: true,
                          xAxis: dateAxis,
                          yAxis: valueAxis,
                          legendValueText: "open: [bold]{openValueY}[/] high: [bold]{highValueY}[/] low: [bold]{lowValueY}[/] close: [bold]{valueY}[/]",
                          legendRangeValueText: "{valueYClose}",
                          tooltip: am5.Tooltip.new(root, {
                            pointerOrientation: "horizontal",
                            labelText: "open: {openValueY}\nlow: {lowValueY}\nhigh: {highValueY}\nclose: {valueY}"
                          })
                        }));


                        // Set main value series
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/charts/stock-chart/#Setting_main_series
                        stockChart.set("stockSeries", valueSeries);


                        // Add a stock legend
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/charts/stock-chart/stock-legend/
                        let valueLegend = mainPanel.plotContainer.children.push(am5stock.StockLegend.new(root, {
                          stockChart: stockChart
                        }));


                        // Create volume axis
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
                        let volumeAxisRenderer = am5xy.AxisRendererY.new(root, {
                          inside: true
                        });

                        volumeAxisRenderer.labels.template.set("forceHidden", true);
                        volumeAxisRenderer.grid.template.set("forceHidden", true);

                        let volumeValueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
                          numberFormat: "#.#a",
                          height: am5.percent(20),
                          y: am5.percent(100),
                          centerY: am5.percent(100),
                          renderer: volumeAxisRenderer
                        }));

                        // Add series
                        // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
                        let volumeSeries = mainPanel.series.push(am5xy.ColumnSeries.new(root, {
                          name: "Volume",
                          clustered: false,
                          valueXField: "Date",
                          valueYField: "Volume",
                          xAxis: dateAxis,
                          yAxis: volumeValueAxis,
                          legendValueText: "[bold]{valueY.formatNumber('#,###.0a')}[/]"
                        }));

                        volumeSeries.columns.template.setAll({
                          strokeOpacity: 0,
                          fillOpacity: 0.5
                        });

                        // color columns by stock rules
                        volumeSeries.columns.template.adapters.add("fill", function(fill, target) {
                          let dataItem = target.dataItem;
                          if (dataItem) {
                            return stockChart.getVolumeColor(dataItem);
                          }
                          return fill;
                        })


                        // Set main series
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/charts/stock-chart/#Setting_main_series
                        stockChart.set("volumeSeries", volumeSeries);
                        valueLegend.data.setAll([valueSeries, volumeSeries]);


                        // Add cursor(s)
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
                        mainPanel.set("cursor", am5xy.XYCursor.new(root, {
                          yAxis: valueAxis,
                          xAxis: dateAxis,
                          snapToSeries: [valueSeries],
                          snapToSeriesBy: "y!"
                        }));


                        // Add scrollbar
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
                        let scrollbar = mainPanel.set("scrollbarX", am5xy.XYChartScrollbar.new(root, {
                          orientation: "horizontal",
                          height: 50
                        }));
                        stockChart.toolsContainer.children.push(scrollbar);

                        let sbDateAxis = scrollbar.chart.xAxes.push(am5xy.GaplessDateAxis.new(root, {
                          baseInterval: {
                            timeUnit: "day",
                            count: 1
                          },
                          groupData: true,
                          renderer: am5xy.AxisRendererX.new(root, {})
                        }));

                        let sbValueAxis = scrollbar.chart.yAxes.push(am5xy.ValueAxis.new(root, {
                          renderer: am5xy.AxisRendererY.new(root, {})
                        }));

                        let sbSeries = scrollbar.chart.series.push(am5xy.LineSeries.new(root, {
                          valueYField: "Close",
                          valueXField: "Date",
                          xAxis: sbDateAxis,
                          yAxis: sbValueAxis
                        }));

                        sbSeries.fills.template.setAll({
                          visible: true,
                          fillOpacity: 0.3
                        });


                        // Function that dynamically loads data
                        function loadData(ticker: string, series: am5xy.XYSeries[]) {
                          let arrayResponse: any[] = [];
                          let stringResponse: string = "";

                          let endpoint = `${'https://localhost:5003/api/odata/CKS_SharetEquitiesHistory?%24orderby=Date&%24select=Close%2CDate%2CHigh%2CLow%2COpen%2CVolume&%24filter=(ShareCode%20eq%20%27'}${ticker}${'%27%20and%20High%20gt%200%20and%20Low%20gt%200%20and%20Close%20gt%200)'}`;
                          const httpClient = new HttpClient(new HttpXhrBackend({ 
                            build: () => new XMLHttpRequest() 
                          }));
                          httpClient.get<any>(endpoint, { headers })
                            .subscribe(
                              (response: { [x: string]: any; }) => {
                                arrayResponse = JSON.parse(JSON.stringify(response["value"]))
                                if (arrayResponse.length > 0) {
                                  changeAllJSONArrayDateToUTCDateString(arrayResponse);
                                  stringResponse = JSON.stringify(arrayResponse);
                                  arrayResponse = JSON.parse(stringResponse)

                                  am5.array.each(series, function(item) {
                                    item.data.setAll(arrayResponse);
                                  });
                                }
                              },
                              (error: any) => {
                                console.log(error);
                              })
                        }

                        // // Load initial data for the first series
                        // let currentGranularity = "day";
                        // loadData("IMP", [valueSeries, volumeSeries, sbSeries], currentGranularity);

                        // // Add comparing series
                        // addComparingSeries("IMP");

                        // Set up main indices selector
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/charts/stock/toolbar/comparison-control/
                        var mainSeriesControl = am5stock.DropdownListControl.new(root, {
                          stockChart: stockChart,
                          name: valueSeries.get("name"),
                          icon: am5stock.StockIcons.getIcon("Search"),
                          fixedLabel: true,
                          searchable: true,
                          searchCallback: function(query) {
                            var mainSeries = stockChart.get("stockSeries");
                            var mainSeriesID = mainSeries ? mainSeries.get("name") : "";
                            var list = getTicker(query);
                            am5.array.each(list, function(item) {
                              if (item.id == mainSeriesID) {
                                (item as am5stock.IDropdownListItem).disabled = true;
                              } else {
                                (item as am5stock.IDropdownListItem).disabled = false;
                              }
                            })
                            return list;
                          }
                        });

                        
                        mainSeriesControl.events.on("selected", function(ev) {
                          mainSeriesControl.set("name", (ev.item as am5stock.IDropdownListItem).subLabel);
                          valueSeries.set("name", (ev.item as am5stock.IDropdownListItem).id);
                          loadData(((ev.item as am5stock.IDropdownListItem).subLabel as string), [valueSeries, volumeSeries, sbSeries]);
                        });
                        

                        // Set up comparison control
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/charts/stock/toolbar/comparison-control/
                        let comparisonControl = am5stock.ComparisonControl.new(root, {
                          stockChart: stockChart,
                          searchable: true,
                          searchCallback: (query) => {
                            var compared = stockChart.getPrivate("comparedSeries", []);
                            var main = stockChart.get("stockSeries") as any;
                            if (compared.length > 4) {
                              return [{
                                label: "A maximum of 5 comparisons is already selected. Remove some to add new ones.",
                                id: "count",
                                info: true
                              }];
                            };

                            var comparedIds: (string | undefined)[] = [];
                            am5.array.each(compared, function(series) {
                              comparedIds.push(series.get("name"));
                            });

                            var list = getTicker(query);
                            am5.array.each(list, function(item) {
                              if (comparedIds.indexOf(item.id) !== -1 || main.get("name") == item.id) {
                                (item as am5stock.IDropdownListItem).disabled = true;
                              } else {
                                (item as am5stock.IDropdownListItem).disabled = false;
                              }
                            })
                            return list;
                          }
                        });


                        comparisonControl.events.on("selected", function(ev) {
                          addComparingSeries((ev.item as am5stock.IDropdownListItem).subLabel as string);
                        });

                        function addComparingSeries(label: string) {
                          let series = am5xy.LineSeries.new(root, {
                            name: label,
                            valueYField: "Close",
                            calculateAggregates: true,
                            valueXField: "Date",
                            xAxis: dateAxis,
                            yAxis: valueAxis,
                            legendValueText: "{valueY.formatNumber('#.00')}"
                          });
                          let comparingSeries = stockChart.addComparingSeries(series);
                          loadData(label, [comparingSeries]);
                        }

                        const getTicker = (search: string) => {
                          search = search.toLowerCase();
                          return this.tickers.filter((item) => {
                            return item.label.toLowerCase().match(search) || item.subLabel.toLowerCase().match(search);
                          });
                        }
                        
                        
                        // Set up series type switcher
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/charts/stock/toolbar/series-type-control/
                        let seriesSwitcher = am5stock.SeriesTypeControl.new(root, {
                          stockChart: stockChart
                        });

                        seriesSwitcher.events.on("selected", function (ev) {
                          setSeriesType((ev.item as am5stock.IDropdownListItem).id);
                        });

                        function getNewSettings(series: am5xy.XYSeries) {
                          let newSettings: any = [];
                          am5.array.each(["name", "valueYField", "highValueYField", "lowValueYField", "openValueYField", "calculateAggregates", "valueXField", "xAxis", "yAxis", "legendValueText", "stroke", "fill"], function(setting: any) {
                            newSettings[setting] = series.get(setting);
                          });
                          return newSettings;
                        }

                        function setSeriesType(seriesType: string) {
                          // Get current series and its settings
                          let currentSeries = stockChart.get("stockSeries")!;
                          let newSettings = getNewSettings(currentSeries);

                          // Remove previous series
                          let data = currentSeries.data.values;
                          mainPanel.series.removeValue(currentSeries);

                          // Create new series
                          let series;
                          switch (seriesType) {
                            case "line":
                              series = mainPanel.series.push(am5xy.LineSeries.new(root, newSettings));
                              break;
                            case "candlestick":
                            case "procandlestick":
                              newSettings.clustered = false;
                              series = mainPanel.series.push(am5xy.CandlestickSeries.new(root, newSettings));
                              if (seriesType == "procandlestick") {
                                series.columns.template.get("themeTags")!.push("pro");
                              }
                              break;
                            case "ohlc":
                              newSettings.clustered = false;
                              series = mainPanel.series.push(am5xy.OHLCSeries.new(root, newSettings));
                              break;
                          }

                          // Set new series as stockSeries
                          if (series) {
                            valueLegend.data.removeValue(currentSeries);
                            series.data.setAll(data);
                            stockChart.set("stockSeries", series);
                            let cursor = mainPanel.get("cursor");
                            if (cursor) {
                              cursor.set("snapToSeries", [series]);
                            }
                            valueLegend.data.insertIndex(0, series);
                          }
                        }


                        // Interval switcher
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/charts/stock/toolbar/interval-control/
                        let intervalSwitcher = am5stock.IntervalControl.new(root, {
                          stockChart: stockChart,
                          items: [
                            //{ id: "1 minute", label: "1 minute", interval: { timeUnit: "minute", count: 1 } },
                            { id: "1 day", label: "1 day", interval: { timeUnit: "day", count: 1 } },
                            { id: "1 week", label: "1 week", interval: { timeUnit: "week", count: 1 } },
                            { id: "1 month", label: "1 month", interval: { timeUnit: "month", count: 1 } }
                          ]
                        });

                        intervalSwitcher.events.on("selected", function(ev: any) {
                          // Determine selected granularity
                          //currentGranularity = ev.item.interval.timeUnit;

                          // Get series
                          const valueSeries = stockChart.get("stockSeries")!;
                          const volumeSeries = stockChart.get("volumeSeries")!;

                          // Set up zoomout
                          valueSeries.events.once("datavalidated", function() {
                            mainPanel.zoomOut();
                          });

                          // Load data for all series (main series + comparisons)
                          const promises: unknown[] = [];

                          promises.push(loadData(valueSeries.get("name") as string, [valueSeries, volumeSeries, sbSeries]))
                          am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
                            promises.push(loadData(series.get("name")!, [series]));
                          });

                          // Once data loading is done, set `baseInterval` on the DateAxis
                          Promise.all(promises).then(function() {
                            let chosenitem: string = ev.item.interval.timeUnit as string;

                            if (chosenitem === "day") {
                              dateAxis.set("groupData", true);
                            } else if (chosenitem === "month") { 
                              dateAxis.set("groupData", false);
                            } else if (chosenitem === "week") {
                              dateAxis.set("groupData", false);
                            }
                            dateAxis.set("baseInterval", ev.item.interval);

                            if (chosenitem === "day") {
                              sbDateAxis.set("groupData", true);
                            } else if (chosenitem === "month") { 
                              sbDateAxis.set("groupData", false);
                            } else if (chosenitem === "week") {
                              sbDateAxis.set("groupData", false);
                            }
                            sbDateAxis.set("baseInterval", ev.item.interval);
                          });
                        });
                        


                        // // Add custom indicator - THIS ADD'S THE NEW INDICATOR TO THE CHART AT START UP!!!
                        // let myIndicator = stockChart.indicators.push(MyIndicator.new(root, {
                        //   stockChart: stockChart,
                        //   stockSeries: valueSeries,
                        //   legend: valueLegend
                        // }));
                        

                        // Get current indicators
                        //let indicators = indicatorControl.get("indicators", []);
                        
                        // Add custom indicator to the top of the list - THIS HAS AN ISSUE!!!

                        // Create indicator control
                        let allIndicatorsControl = am5stock.IndicatorControl.new(root, {
                          stockChart: stockChart,
                          legend: valueLegend
                        });

                        let allIndicators = allIndicatorsControl.get("indicators");

                        // Set indicator list back
                        allIndicatorsControl.set("indicators", allIndicators);
                        allIndicatorsControl.set("name", "All Indicators")
                        
                        let myIndicators = [{
                            id: "myIndicator",
                            name: "My Indicator",
                            callback: function() {
                              const myIndicator = stockChart.indicators.push(MyIndicator.new(root, {
                                stockChart: stockChart,
                                stockSeries: valueSeries,
                                legend: valueLegend
                              }));
                              return myIndicator;
                            }
                          },
                          {
                            id: "RSI_EMA",
                            name: "RSI and EMA",
                            callback: function() {
                              const RSI_EMAIndicator = stockChart.indicators.push(RSI_EMA.new(root, {
                                stockChart: stockChart,
                                stockSeries: valueSeries,
                                legend: valueLegend
                              }));
                              return RSI_EMAIndicator;
                            }
                          }]; // = <any[]>([]);

                        // indicators = setMyArrayIndicator();
                        // function setMyArrayIndicator() {
                        //   ([{
                        //     id: "myIndicator",
                        //     name: "My indicator",
                        //     callback: function() {
                        //       const myIndicator = stockChart.indicators.push(MyIndicator.new(root, {
                        //         stockChart: stockChart,
                        //         stockSeries: valueSeries,
                        //         legend: valueLegend
                        //       }));
                        //       return myIndicator;
                        //     }
                        //   }]);
                        //   return indicators;
                        // }

                        // Create indicator control
                        let indicatorControl = am5stock.IndicatorControl.new(root, {
                          stockChart: stockChart,
                          legend: valueLegend
                        });
                        
                        // Set indicator list back
                        indicatorControl.set("indicators", myIndicators);
                        indicatorControl.set("name", "Custom Indicators")


                        // Stock toolbar
                        // -------------------------------------------------------------------------------
                        // https://www.amcharts.com/docs/v5/charts/stock/toolbar/
                        let toolbar = am5stock.StockToolbar.new(root, {
                          container: document.getElementById("chartcontrols")!,
                          stockChart: stockChart,
                          controls: [
                            mainSeriesControl,
                            comparisonControl,
                            indicatorControl,
                            allIndicatorsControl,
                            // am5stock.IndicatorControl.new(root, {
                            //   stockChart: stockChart,
                            //   legend: valueLegend
                            // }),
                            am5stock.DateRangeSelector.new(root, {
                              stockChart: stockChart
                            }),
                            am5stock.PeriodSelector.new(root, {
                              stockChart: stockChart,
                              periods: [
                                { timeUnit: "day", count: 1, name: "1D" },
                                { timeUnit: "day", count: 5, name: "5D" },
                                { timeUnit: "month", count: 1, name: "1M" },
                                { timeUnit: "month", count: 3, name: "3M" },
                                { timeUnit: "month", count: 6, name: "6M" },
                                { timeUnit: "ytd", name: "YTD" },
                                { timeUnit: "year", count: 1, name: "1Y" },
                                { timeUnit: "year", count: 2, name: "2Y" },
                                { timeUnit: "year", count: 5, name: "5Y" },
                                { timeUnit: "max", name: "Max" },
                                // { timeUnit: "minute", count: 60, name: "1 Minute" },
                                // { timeUnit: "minute", count: 120, name: "2 Minute" },
                                // { timeUnit: "minute", count: 300, name: "5 Minute" },
                                // { timeUnit: "minute", count: 900, name: "15 Minute" },
                                // { timeUnit: "minute", count: 1800, name: "30 Minute" },
                                // { timeUnit: "hour", count: 1, name: "1 Hour" },
                                // { timeUnit: "hour", count: 4, name: "4 Hours" },
                                ],
                            }),
                            intervalSwitcher,
                            // am5stock.PeriodSelector.new(root, {
                            //   stockChart: stockChart
                            // }),
                            seriesSwitcher,
                            am5stock.DrawingControl.new(root, {
                              stockChart: stockChart
                            }),
                            am5stock.ResetControl.new(root, {
                              stockChart: stockChart
                            }),
                            am5stock.SettingsControl.new(root, {
                              stockChart: stockChart
                            }),
                            // am5stock.ComparisonControl.new(root, {
                            //   stockChart: stockChart
                            // }),
                          ]
                        })

                        // set data to all series
                        valueSeries.data.setAll(this.arrayResponse);
                        volumeSeries.data.setAll(this.arrayResponse);
                        sbSeries.data.setAll(this.arrayResponse);

                                // Make stuff animate on load
                        https://www.amcharts.com/docs/v5/concepts/animations/
                        valueSeries.appear(1000);
                        stockChart.appear(1000, 100);

                        stockChart.appear(500);

                        // Vincent Second Chart - *************************************************************************************************************************

                        
                      },
                      (error: any) => {
                        console.log(error);
                      })
            

                      //Covert datetime by GMT offset 
                      //If toUTC is true then return UTC time other wise return local time
                      function convertLocalDateToUTCAndReturnUTC(date: string | number | Date, toUTC: boolean) {
                        date = new Date(date);
                        //Local time converted to UTC
                        //console.log("Time: " + date);

                        //let date2 = new Date(date.toLocaleDateString("en-ZA") + " " + date.toLocaleTimeString("en-ZA"));
                        let pipe = new DatePipe('en-US');
                    
                        const time = pipe.transform(date, 'mediumTime', 'UTC');
                        const date2 = pipe.transform(date, 'yyyy/MM/dd', 'UTC');
                    
                        //return date + ' ' + time;
                        let newDate = new Date(date2 + ' ' + time);

                        var localOffset = newDate.getTimezoneOffset() * 60000;
                        var localTime = newDate.getTime();
                        if (toUTC) {
                            date = localTime + localOffset;
                        } else {
                            date = localTime - localOffset;
                        }

                        //var testdate = new Date(date);

                        return date;
                      }


                      function changeAllJSONArrayDateToUTCDateString(arrayResponseToUse: any[]) {
                        arrayResponseToUse.forEach(function (item) {
                          
                          item.Date = convertLocalDateToUTCAndReturnUTC(item.Date, true);

                          // item.Close = item.Close /100;
                          // item.Open = item.Open / 100;
                        });
                      }

                    },
                    (error: any) => {
                      console.log(error);
                      this.tickers = [ { subLabel: "SOL", id: "SOL", label: "SASOL LIMITED" } ]
                    })
        }
      },
      (error: any) => {
        console.log(error);

      }
    );


  }


}

