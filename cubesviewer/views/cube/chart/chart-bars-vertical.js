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
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*
 * Series chart object. Contains view functions for the 'chart' mode.
 * This is an optional component, part of the cube view.
 */

"use strict";

angular.module('cv.views.cube').controller("CubesViewerViewsCubeChartBarsVerticalController", ['$rootScope', '$scope', '$element', '$timeout', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, $element, $timeout, cvOptions, cubesService, viewsService) {

	$scope.chart = null;

	$scope.initialize = function() {
	};

	$scope.$on('gridDataUpdated', function() {
		$scope.chartCtrl.cleanupNvd3();
		$timeout(function() {
			$scope.drawChartBarsVertical();
		}, 0);
	});

	/**
	 * Draws a vertical bars chart.
	 */
	$scope.drawChartBarsVertical = function () {

		var view = $scope.view;
		var dataRows = $scope.view.grid.data;
		var columnDefs = view.grid.columnDefs;

		var container = $($element).find("svg").get(0);
		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.dimensionParts(view.params.xaxis).label : "");

	    var d = [];

	    var numRows = dataRows.length;
	    var serieCount = 0;
	    $(dataRows).each(function(idx, e) {
	    	var serie = [];
	    	for (var i = 1; i < columnDefs.length; i++) {
	    		var value = e[columnDefs[i].field];
	    		serie.push( { "x": columnDefs[i].name, "y":  (value != undefined) ? value : 0 } );
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
    		xticks.push([ i * 10, colNames[i] ]);
	    }
	    */

	    var chartOptions = {
	    	  //barColor: d3.scale.category20().range(),
	    	  delay: 1200,
	    	  groupSpacing: 0.1,
	    	  //reduceXTicks: false,
	    	  //staggerLabels: true
	    };

	    var ag = $.grep(view.cube.aggregates, function(ag) { return ag.ref == view.params.yaxis })[0];
		var colFormatter = $scope.columnFormatFunction(ag);

	    nv.addGraph(function() {
	        var chart = nv.models.multiBarChart()
		          //.margin({bottom: 100})
		          .showLegend(!!view.params.chartoptions.showLegend)
		          .margin({left: 120});

	    	if (view.params["chart-barsvertical-stacked"]) {
	    		chart.stacked ( view.params["chart-barsvertical-stacked"] );
	    	}

	        chart.options(chartOptions);
	        chart.multibar.hideable(true);

	        //chart.xAxis.axisLabel(xAxisLabel).showMaxMin(true).tickFormat(d3.format(',0f'));
	        chart.xAxis.axisLabel(xAxisLabel);

	        //chart.yAxis.tickFormat(d3.format(',.2f'));
	        chart.yAxis.tickFormat(function(d,i) {
	        	return colFormatter(d);
	        });

	        d3.select(container)
	            .datum(d)
	            .call(chart);

	        //nv.utils.windowResize(chart.update);

    	    // Handler for state change
            chart.dispatch.on('stateChange', function(newState) {
            	view.params["chart-barsvertical-stacked"] = newState.stacked;
            	view.params["chart-disabledseries"] = {
        			  "key": view.params.drilldown.join(","),
        			  "disabled": {}
            	};
            	for (var i = 0; i < newState.disabled.length; i++) {
            		view.params["chart-disabledseries"]["disabled"][d[i]["key"]] =  newState.disabled[i];
            	}
            	view.updateUndo();
            });

	        //chart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });

            $scope.chartCtrl.chart = chart;

	        return chart;

	    });

	}

	$scope.initialize();

}]);


