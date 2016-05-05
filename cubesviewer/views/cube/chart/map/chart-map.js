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
 */
angular.module('cv.views.cube').controller("CubesViewerViewsCubeChartMapController", ['$rootScope', '$scope', '$element', '$timeout', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, $element, $timeout, cvOptions, cubesService, viewsService) {

	$scope.map = null;

	$scope.initialize = function() {
	};

	$scope.$on('GridDataUpdated', function() {
		$timeout(function() {
			$scope.drawChartMap();
		}, 0);
	});


	/**
	 * Draws a vertical bars chart.
	 */
	$scope.drawChartMap = function () {

		var view = $scope.view;
		var dataRows = $scope.gridData;
		var columnDefs = $scope.gridOptions.columnDefs;

		var container = $($element).find(".cv-map-container").get(0);
		$(container).empty();

		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.cvdim_parts(view.params.xaxis).label : "None")

		var projection = ol.proj.get('EPSG:3857');

	    var raster = new ol.layer.Tile({
	    	source: new ol.source.XYZ({
	    		url: 'http://tile.openstreetmap.org/{z}/{x}/{y}.png'
	        })
	    });

	    var vector = new ol.layer.Vector({
	    	source: new ol.source.Vector({
	    		url: 'maps/countries_world_20150828.kml',
	    		format: new ol.format.KML()
	        })
	    });

	    var map = new ol.Map({
	    	layers: [raster],
	        target: container,
	        view: new ol.View({
	        	center: [876970.8463461736, 5859807.853963373],
	        	projection: projection,
	        	zoom: 10
	        })
	    });


		/*
	    // TODO: Check there's only one value column
		var d = [];
	    var numRows = dataRows.length;
	    var serieCount = 0;
	    $(dataRows).each(function(idx, e) {
	    	serie = [];
	    	for (var i = 1; i < columnDefs.length; i++) {
	    		if (columnDefs[i].field in e) {
	    			var value = e[columnDefs[i].field];
	    			serie.push( { "x": i, "y":  (value != undefined) ? value : 0 } );
	    		} else  {
	    			if (view.params.charttype == "lines-stacked") {
	    				serie.push( { "x": i, "y":  0 } );
	    			}
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

	    var ag = $.grep(view.cube.aggregates, function(ag) { return ag.ref == view.params.yaxis })[0];
	    var colFormatter = $scope.columnFormatFunction(ag);

	    nv.addGraph(function() {
	    	var chart = nv.models.lineChart()
	    		.useInteractiveGuideline(true)
	    		.showLegend(!!view.params.chartoptions.showLegend)
	    		.margin({left: 120});

	    	chart.xAxis
	    		.axisLabel(xAxisLabel)
	    		.tickFormat(function(d,i) {
	    			return (columnDefs[d].name);
			    });

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

	        $scope.$parent.$parent.chart = chart;
	    	return chart;
	    });
		*/

	};

	$scope.initialize();

}]);


