/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * If your version of the Software supports interaction with it remotely through
 * a computer network, the above copyright notice and this permission notice
 * shall be accessible to all users.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

/*
 * Series chart object. Contains view functions for the 'chart' mode.
 * This is an optional component, part of the cube view.
 */

angular.module('cv.views.cube').controller("CubesViewerViewsCubeChartController", ['$rootScope', '$scope', '$timeout', '$element', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, $timeout, $element, cvOptions, cubesService, viewsService) {

	$scope.$parent.gridData = [];
	$scope.$parent.gridApi = null;
	$scope.$parent.gridOptions = { data: $scope.$parent.gridData, columnDefs: [] };


	$scope.initialize = function() {
		// Add chart view parameters to view definition
		$scope.view.params = $.extend(
			{},
			{ "charttype" : "bars-vertical", "chartoptions": { showLegend: true } },
			$scope.view.params
		);
	};

	$scope.$watch("view._cubeDataUpdated", function(newVal) {
		if (newVal) {
			$scope.view._cubeDataUpdated = false;
			$scope.loadData();
		}
	});

	$scope.loadData = function() {

		var view = $scope.view;

		// Check if we can produce a table
		if (view.params.yaxis == null) return;

		var browser_args = cubesService.buildBrowserArgs($scope.view, $scope.view.params.xaxis != null ? true : false, false);
		var browser = new cubes.Browser(cubesService.cubesserver, $scope.view.cube);
		var jqxhr = browser.aggregate(browser_args, $scope._loadDataCallback);
		jqxhr.always(function() {
			//view.cubesviewer.views.unblockView(view);
		});

	};

	$scope._loadDataCallback = function(data, status) {
		$scope.processData(data);
		$rootScope.$apply();
	};

	$scope.processData = function(data) {

		$scope.gridData = [];
		$scope.gridOptions.data = $scope.gridData;
		$scope.gridOptions.columnDefs = [];

		var view = $scope.view;
		var rows = $scope.gridData;
		var columnDefs = $scope.gridOptions.columnDefs;

		// Process data
		//$scope._sortData (data.cells, view.params.xaxis != null ? true : false);
	    $scope._addRows(data);

		// Join keys
		if (view.params.drilldown.length > 0) {
			columnDefs.splice (0, view.params.drilldown.length, {
				name: "key"
			});

			$(rows).each(function(idx, e) {
				var jointkey = [];
				for (var i = 0; i < view.params.drilldown.length; i++) jointkey.push(e["key" + i]);
				e["key"] = jointkey.join(" / ");
			});
		}

		$scope.$broadcast("GridDataUpdated");

	};

	/*
	 * Adds rows.
	 */
	$scope._addRows = function(data) {

		console.debug("FIXME: addRows method in charts controller is duplicated (from series controller)!")

		var view = $scope.view;
		var rows = $scope.gridData;

		var counter = 0;
		var dimensions = view.cube.dimensions;
		var measures = view.cube.measures;
        var details = view.cube.details;

		// Copy drilldown as we'll modify it
		var drilldown = view.params.drilldown.slice(0);

		// Include X Axis if necessary
		if (view.params.xaxis != null) {
			drilldown.splice(0,0, view.params.xaxis);
		}
		var baseidx = ((view.params.xaxis == null) ? 0 : 1);

		var addedCols = [];
		$(data.cells).each(function (idx, e) {

			var row = [];
			var key = [];

			// For the drilldown level, if present
			for (var i = 0; i < drilldown.length; i++) {

				// Get dimension
				var parts = view.cube.cvdim_parts(drilldown[i]);
				var infos = parts.hierarchy.readCell(e, parts.level);

				// Values and Labels
				var drilldown_level_values = [];
				var drilldown_level_labels = [];

				$(infos).each(function(idx, info) {
					drilldown_level_values.push (info.key);
					drilldown_level_labels.push (info.label);
				});

				key.push (drilldown_level_labels.join(" / "));

			}

			// Set key
			var colKey = (view.params.xaxis == null) ? view.params.yaxis : key[0];
			var value = (e[view.params.yaxis]);
			var rowKey = (view.params.xaxis == null) ? key.join (' / ') : key.slice(1).join (' / ');

			// Search or introduce
			var row = $.grep(rows, function(ed) { return ed["key"] == rowKey; });
			if (row.length > 0) {
				row[0][colKey] = value;
			} else {
				var newrow = {};
				newrow["key"] = rowKey;
				newrow[colKey] = value;

				for (var i = baseidx ; i < key.length; i++) {
					newrow["key" + (i - baseidx)] = key[i];
				}
				rows.push ( newrow );
			}


			// Add column definition if the column hasn't been added yet
			if (addedCols.indexOf(colKey) < 0) {
				addedCols.push(colKey);

				var ag = $.grep(view.cube.aggregates, function(ag) { return ag.ref == view.params.yaxis })[0];

				var col = {
					name: colKey,
					field: colKey,
					index : colKey,
					cellClass : "text-right",
					sorttype : "number",
					width : 75, //cubesviewer.views.cube.explore.defineColumnWidth(view, colKey, 75),
					cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ col.colDef.formatter(COL_FIELD, row, col) }}</div>',
					formatter: $scope.columnFormatFunction(ag),
					//footerValue: $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col)
					//formatoptions: {},
					//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
					//footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>';
				};
				$scope.gridOptions.columnDefs.push(col);
			}
		});

		//var label = [];data
		$(view.params.drilldown).each (function (idx, e) {
			var col = {
				name: view.cube.cvdim_dim(e).label,
				field: "key" + idx,
				index : "key" + idx,
				//cellClass : "text-right",
				//sorttype : "number",
				width : 190, //cubesviewer.views.cube.explore.defineColumnWidth(view, "key" + idx, 190)
				//cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ col.colDef.formatter(COL_FIELD, row, col) }}</div>',
				//formatter: $scope.columnFormatFunction(ag),
				//footerValue: $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col)
				//formatoptions: {},
				//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
				//footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>';
			};
			$scope.gridOptions.columnDefs.splice(idx, 0, col);
		});

		if (view.params.drilldown.length == 0 && rows.length > 0) {
			rows[0]["key0"] = view.params.yaxis;

			var col = {
				name: "Measure",
				field: "key0",
				index : "key0",
				//cellClass : "text-right",
				//sorttype : "number",
				width : 190, //cubesviewer.views.cube.explore.defineColumnWidth(view, "key0", 190)
				//cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ col.colDef.formatter(COL_FIELD, row, col) }}</div>',
				//formatter: $scope.columnFormatFunction(ag),
				//footerValue: $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col)
				//formatoptions: {},
				//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
				//footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>';
			};
			$scope.gridOptions.columnDefs.splice(0, 0, col);
		}

	};

	$scope.cleanupNvd3 = function() {
		console.debug("WARNING! Cleanup function disabled: review.");
		/*
		var len = nv.graphs.length;
		while (len--) {
			if (! ($.contains(document.documentElement, nv.graphs[len].container))) {
			    // Element is detached, destroy graph
				nv.graphs.splice (len,1);
			}
		}
		*/
	};

	$scope.resizeChart = function(size) {
		var view = $scope.view;
		$($element).find('svg').height(size);
		$($element).find('svg').resize();
	};

	$scope.$on("$destroy", function() {
		$scope.cleanupNvd3();
	});

	$scope.initialize();

}]);



function cubesviewerViewCubeChart() {


	/**
	 */
	this.drawChartLines = function (view, colNames, dataRows, dataTotals) {

		var container = $('#seriesChart-' + view.id).find("svg").get(0);
		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.cvdim_parts(view.params.xaxis).label : "None")

	    var d = [];

	    // TODO: Check there's only one value column

	    var numRows = dataRows.length;
	    var serieCount = 0;
	    $(dataRows).each(function(idx, e) {
	    	serie = [];
	    	for (var i = 1; i < colNames.length; i++) {
	    		if (colNames[i] in e) {
	    			var value = e[colNames[i]];
	    			serie.push( { "x": i, "y": value } );
	    		} else {
	    			serie.push( { "x": i, "y": 0 } );
	    		}
	    	}
	    	var series = { "values": serie, "key": e["key"] != "" ? e["key"] : view.params.yaxis };
	    	if (view.params["chart-disabledseries"]) {
	    		if (view.params["chart-disabledseries"]["key"] == (view.params.drilldown.join(","))) {
	    			series.disabled = !! view.params["chart-disabledseries"]["disabled"][series.key];
	    		}
	    	}
	    	d.push(series);
	    	serieCount++;
	    });
	    d.sort(function(a,b) { return a.key < b.key ? -1 : (a.key > b.key ? +1 : 0) });

	    /*
	    xticks = [];
	    for (var i = 1; i < colNames.length; i++) {
    		xticks.push([ i, colNames[i] ]);
	    }
	    */

	    var ag = $.grep(view.cube.aggregates, function(ag) { return ag.ref == view.params.yaxis })[0];
		var colFormatter = cubesviewer.views.cube.columnFormatFunction(view, ag);

	    if (view.params.charttype != "lines-stacked") {

		    nv.addGraph(function() {
		    	var chart = nv.models.lineChart()
		    		.useInteractiveGuideline(true)
		    		.showLegend(!!view.params.chartoptions.showLegend)
		    		.margin({left: 120})
		    		;

		    	chart.xAxis
		    		.axisLabel(xAxisLabel)
		    		.tickFormat(function(d,i) {
				                return (colNames[d]);
				     })	;

	    		chart.yAxis.tickFormat(function(d,i) {
		        	return colFormatter(d);
		        });

		    	d3.select(container)
		    		.datum(d)
		    		.call(chart);

		    	nv.utils.windowResize(chart.update);

		    	  // Handler for state change
		          chart.dispatch.on('stateChange', function(newState) {
		        	  view.params["chart-disabledseries"] = {
		        			  "key": view.params.drilldown.join(","),
		        			  "disabled": {}
		        	  };
		        	  for (var i = 0; i < newState.disabled.length; i++) {
		        		  view.params["chart-disabledseries"]["disabled"][d[i]["key"]] =  newState.disabled[i];
		        	  }
		          });


		    	return chart;
		    });

	    } else {

		    nv.addGraph(function() {
	    	  var chart = nv.models.stackedAreaChart()
	    	                //.x(function(d) { return d[0] })
	    	                //.y(function(d) { return d[1] })
	    	  				.showLegend(!!view.params.chartoptions.showLegend)
	    	  				.margin({left: 130})
	    	                .clipEdge(true)
	    	                .useInteractiveGuideline(true);

	    	  if (	view.params["chart-stackedarea-style"] ) {
	    		  chart.style ( view.params["chart-stackedarea-style"] );
	    	  }

	    	  chart.xAxis
	    	  	  .axisLabel(xAxisLabel)
	    	      .showMaxMin(false)
	    	      .tickFormat(function(d,i) {
			                return (colNames[d]);
			       })	;

	    	  chart.yAxis.tickFormat(function(d,i) {
	    		  return colFormatter(d);
	    	  });

	    	  d3.select(container)
	    	    .datum(d)
	    	      .call(chart);

	    	  nv.utils.windowResize(chart.update);

	    	  // Handler for state change
	          chart.dispatch.on('stateChange', function(newState) {
	        	  view.params["chart-stackedarea-style"] = newState.style;
	        	  view.params["chart-disabledseries"] = {
	        			  "key": view.params.drilldown.join(","),
	        			  "disabled": {}
	        	  };
	        	  for (var i = 0; i < newState.disabled.length; i++) {
	        		  view.params["chart-disabledseries"]["disabled"][d[i]["key"]] =  newState.disabled[i];
	        	  }
	          });

	    	  return chart;
	    	});

	    }



	};

	/**
	 */
	/*
	this.drawChartLinesCumulative = function (view, colNames, dataRows, dataTotals) {

		var container = $('#seriesChart-' + view.id).find("svg").get(0);
		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.getDimensionParts(view.params.xaxis).label : "None")

	    var d = [];


	    numRows = dataRows.length;
	    var serieCount = 1;
	    $(dataRows).each(function(idx, e) {
	    	serie = [];
	    	for (var i = 1; i < colNames.length; i++) {
	    		if ( (colNames[i] in e) && (e[colNames[i]] != null) && (e[colNames[i]]) ) {
	    			var value = e[colNames[i]];
	    			serie.push( { "x": i, "y": parseFloat(value) } );
	    		} else {
	    			serie.push( { "x": i, "y": 0 } );
	    		}
	    	}
	    	d.push({ "values": serie, "key": e["key"] != "" ? e["key"] : view.params.yaxis });
	    });
	    d.sort(function(a,b) { return a.key < b.key ? -1 : (a.key > b.key ? +1 : 0) });

	    nv.addGraph(function() {
	        var chart = nv.models.cumulativeLineChart()
                          //.x(function(d) { return d.x })
		                  //.y(function(d) { return d.y })
		                  .showLegend(!!view.params.chartoptions.showLegend)
		                  .color(d3.scale.category20().range())
	                      //.color(d3.scale.category10().range())
		                  .useInteractiveGuideline(true)
	                      ;

	         chart.xAxis
	            .axisLabel(xAxisLabel)
			      .tickFormat(function(d,i) {
			                return (colNames[d]);
			       })	;

	         chart.yAxis
	         .tickFormat(d3.format(',.2f'));

	        d3.select(container)
	            .datum(d)
	          .transition().duration(500)
	            .call(chart);

    	  // Handler for state change
	          chart.dispatch.on('stateChange', function(newState) {
	        	  view.params["chart-stackedarea-style"] = newState.style;
	        	  view.params["chart-disabledseries"] = {
	        			  "key": view.params.drilldown.join(","),
	        			  "disabled": newState.disabled
	        	  };
	          });

	        //TODO: Figure out a good way to do this automatically
	        nv.utils.windowResize(chart.update);

	        return chart;
      });

	};
	*/

	/**
	 */
	this.drawChartPie = function (view, colNames, dataRows, dataTotals) {

		var container = $('#seriesChart-' + view.id).find("svg").get(0);
		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.cvdim_parts(view.params.xaxis).label : "None")

	    var d = [];

		// Check if we can produce a pie
		if (colNames.length > 2) {
			$('#' + view.id).find('.cv-view-viewdata').empty();
			$('#' + view.id).find('.cv-view-viewdata').append('<h3>Series Chart</h3><div><i>Cannot present a Pie Chart when more than one column is present.</i></div>');
			return;
		}

	    var numRows = dataRows.length;
	    var serieCount = 0;
	    $(dataRows).each(function(idx, e) {
	    	serie = [];
	    	var value = e[colNames[1]];
    		if ((value != undefined) && (value > 0)) {

    	    	var series = { "y": value, "key": e["key"] != "" ? e["key"] : colNames[0] };
    	    	if (view.params["chart-disabledseries"]) {
    	    		if (view.params["chart-disabledseries"]["key"] == (view.params.drilldown.join(","))) {
    	    			series.disabled = !! view.params["chart-disabledseries"]["disabled"][series.key];
    	    		}
    	    	}

    	    	d.push(series);
    			serieCount++;

    		}

	    });
	    d.sort(function(a,b) { return a.y < b.y ? -1 : (a.y > b.y ? +1 : 0) });

	    xticks = [];
	    for (var i = 1; i < colNames.length; i++) {
    		xticks.push([ i - 1, colNames[i] ]);
	    }

	    var ag = $.grep(view.cube.aggregates, function(ag) { return ag.ref == view.params.yaxis })[0];
		var colFormatter = cubesviewer.views.cube.columnFormatFunction(view, ag);

	    nv.addGraph(function() {

	        var chart = nv.models.pieChart()
	            .x(function(d) { return d.key })
	            .y(function(d) { return d.y })
	            .showLegend(!!view.params.chartoptions.showLegend)
	            //.color(d3.scale.category20().range())
	            //.width(width)
	            //.height(height)
	            .labelType("percent");
	            //.donut(true);

	        /*
		    chart.pie
		        .startAngle(function(d) { return d.startAngle/2 -Math.PI/2 })
		        .endAngle(function(d) { return d.endAngle/2 -Math.PI/2 });
		        */

	        chart.valueFormat(function(d,i) {
	        	return colFormatter(d);
	        });

	          d3.select(container)
	              .datum(d)
	              //.attr('width', width)
	              //.attr('height', height)
	              .call(chart);

	        nv.utils.windowResize(chart.update);

	    	  // Handler for state change
	          chart.dispatch.on('stateChange', function(newState) {
	        	  view.params["chart-disabledseries"] = {
	        			  "key": view.params.drilldown.join(","),
	        			  "disabled": {}
	        	  };
	        	  for (var i = 0; i < newState.disabled.length; i++) {
	        		  view.params["chart-disabledseries"]["disabled"][d[i]["key"]] =  newState.disabled[i];
	        	  }
	          });

	        return chart;
	    });

	};

	/**
	 */
	this.drawChartRadar = function (view, colNames, dataRows, dataTotals) {

		var container = $('#seriesChart-' + view.id).get(0);

		// Check if we can produce a pie
		if (colNames.length < 4) {
			$('#' + view.id).find('.cv-view-viewdata').empty();
			$('#' + view.id).find('.cv-view-viewdata').append('<h3>Series Chart</h3><div><i>Cannot present a Radar Chart when less than 3 data columns are present.</i></div>');
			return;
		}

	    var d = [];

	    numRows = dataRows.length;
	    $(dataRows).each(function(idx, e) {
	    	serie = [];
	    	for (var i = 1; i < colNames.length; i++) {
	    		var value = e[colNames[i]];
	    		if (value != undefined) {
	    			serie.push( [i-1, value] );
	    		} else {
	    			serie.push( [i-1, 0] );
	    		}
	    	}
	    	d.push({ data: serie, label: e["key"] != "" ? e["key"] : view.params.yaxis });
	    });
	    d.sort(function(a,b) { return a.label < b.label ? -1 : (a.label > b.label ? +1 : 0) });

	    xticks = [];
	    for (var i = 1; i < colNames.length; i++) {
    		xticks.push([ i - 1, colNames[i] ]);
	    }

	    $(container).height(350);
	    view.flotrDraw = Flotr.draw(container, d, {
	    	HtmlText: ! view.doExport,
	    	shadowSize: 2,
	    	height: 350,
	        radar: {
	            show: true
	        },
	        mouse: {
	            track: true,
	            relative: true
	        },
	        grid: {
	            circular: true,
	            minorHorizontalLines: true
	        },
	        legend: {
	            position: "se",
	            backgroundColor: "#D2E8FF"
	        },
	        xaxis: {
	            ticks: xticks
	        },
	        yaxis: {
	        }
	    });

	};

};

