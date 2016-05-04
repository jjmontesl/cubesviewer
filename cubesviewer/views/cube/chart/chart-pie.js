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

/*
 * Series chart object. Contains view functions for the 'chart' mode.
 * This is an optional component, part of the cube view.
 */
angular.module('cv.views.cube').controller("CubesViewerViewsCubeChartBarsVerticalController", ['$rootScope', '$scope', '$element', '$timeout', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, $element, $timeout, cvOptions, cubesService, viewsService) {

	$scope.chart = null;

	$scope.initialize = function() {
	};

	$scope.$on('GridDataUpdated', function() {
		console.debug("Grid data ready: draw bars vertical.");
		$timeout(function() {
			$scope.drawChartBarsVertical();
		}, 0);
	});

	/**
	 * Draws a vertical bars chart.
	 */
	$scope.drawChartBarsVertical = function () {

		var view = $scope.view;
		var dataRows = $scope.gridData;
		var columnDefs = $scope.gridOptions.columnDefs;

		console.debug(dataRows);
		console.debug(columnDefs);

		var container = $($element).find("svg").get(0);
		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.cvdim_parts(view.params.xaxis).label : "None")

	    var d = [];

	    var numRows = dataRows.length;
	    var serieCount = 0;
	    $(dataRows).each(function(idx, e) {
	    	serie = [];
	    	for (var i = 1; i < columnDefs.length; i++) {
	    		var value = e[columnDefs[i].name];
	    		if (value != undefined) {
	    			serie.push( { "x": columnDefs[i].name, "y":  value } );
	    		} else {
	    			serie.push( { "x": columnDefs[i].name, "y":  0} );
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
    		xticks.push([ i * 10, colNames[i] ]);
	    }
	    */

	    chartOptions = {
	    	  //barColor: d3.scale.category20().range(),
	    	  delay: 1200,
	    	  groupSpacing: 0.1,
	    	  //reduceXTicks: false,
	    	  //staggerLabels: true
	    };

	    var ag = $.grep(view.cube.aggregates, function(ag) { return ag.ref == view.params.yaxis })[0];
		var colFormatter = $scope.columnFormatFunction(ag);

	    nv.addGraph(function() {
	        var chart;
	        chart = nv.models.multiBarChart()
		          //.margin({bottom: 100})
		          .showLegend(!!view.params.chartoptions.showLegend)
		          .margin({left: 120});

	    	if (view.params["chart-barsvertical-stacked"]) {
	    		chart.stacked ( view.params["chart-barsvertical-stacked"] );
	    	}

	        chart.options(chartOptions);
	        chart.multibar.hideable(true);
	        chart.xAxis.axisLabel(xAxisLabel).showMaxMin(true).tickFormat(d3.format(',0f'));

	        //chart.yAxis.tickFormat(d3.format(',.2f'));
	        chart.yAxis.tickFormat(function(d,i) {
	        	return colFormatter(d);
	        });

	        d3.select(container)
	            .datum(d)
	            .call(chart);

	        nv.utils.windowResize(chart.update);

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
	          });

	        //chart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });

	        return chart;
	    });

	}


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

	$scope.initialize();

}]);


