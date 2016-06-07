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

/**
 *
    "cv-geo-feature-layer": "world-countries",
    "cv-geo-feature-attribute": "geo_code",
    "cv-geo-feature-mode": "cloropleth"
 *
 */
angular.module('cv.views.cube').controller("CubesViewerViewsCubeChartMapController", ['$rootScope', '$scope', '$element', '$timeout', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, $element, $timeout, cvOptions, cubesService, viewsService) {

	$scope.map = null;

	$scope.initialize = function() {
		// Add chart view parameters to view definition
	};

	$scope.$on('gridDataUpdated', function() {
		$timeout(function() {
			$scope.drawChartMap();
		}, 0);
	});

	/**
	 * Draws a vertical bars chart.
	 */
	$scope.drawChartMap = function () {

		var view = $scope.view;
		var dataRows = $scope.view.grid.data;
		var columnDefs = view.grid.columnDefs;

		var container = $($element).find(".cv-map-container").get(0);
		$(container).empty();

		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.dimensionParts(view.params.xaxis).label : "None")

		var projection = ol.proj.get('EPSG:3857');

	    var raster = new ol.layer.Tile({
	    	source: new ol.source.XYZ({
	    		url: 'http://tile.openstreetmap.org/{z}/{x}/{y}.png'
	        })
	    });

	    var vector = new ol.layer.Vector({
	    	title: "Features layer",
	    	source: new ol.source.Vector({
	    		url: 'maps/ne_110m_admin_0_countries.geo.json',
	    		format: new ol.format.GeoJSON(),
	    		projection: projection,
	        }),
	        projection: projection
	    });

	    $scope.map = new ol.Map({
	    	layers: [raster, vector],  // raster
	        target: container,
	        view: new ol.View({
	        	center: [876970.8463461736, 5859807.853963373],
	        	projection: ol.proj.get('EPSG:3857'),
	        	zoom: 6
	        })
	    });

	    $scope.layerVector = vector;

	    $timeout(function() {
	    // Walk rows to define features

	    var allValues = [];
	    $(dataRows).each(function(idx, e) {
	    	for (var i = 1; i < columnDefs.length; i++) {
	    		if (columnDefs[i].field in e) {
	    			var value = e[columnDefs[i].field];
	    			allValues.push(value);
	    		}
	    	}
	    });

	    var createTextStyle = function(feature, text) {
	    	return new ol.style.Text({
	    	    textAlign: 'center',
	    	    textBaseline: 'middle',
	    	    font: '10px Verdana',
	    	    text: text, // getText(feature),
	    	    fill: new ol.style.Fill({color: 'black'}),
	    	    stroke: new ol.style.Stroke({color: 'white', width: 1.0})
    	  	});
    	};

    	var ag = $.grep(view.cube.aggregates, function(ag) { return ag.ref == view.params.yaxis })[0];
    	var colFormatter = $scope.columnFormatFunction(ag);

    	var numRows = dataRows.length;
	    $(dataRows).each(function(idx, e) {
	    	for (var i = 1; i < columnDefs.length; i++) {
	    		if (columnDefs[i].field in e) {


	    			var value = e[columnDefs[i].field];
	    			var valueFormatted = colFormatter(value);
	    			var label = e._cell['geo.geo_label'];

//	    			console.debug(e._cell);

	    			if (value !== undefined) {
	    				//serie.push( { "x": i, "y":  (value != undefined) ? value : 0 } );
	    				$($scope.layerVector.getSource().getFeatures()).each(function(idx, feature) {
//	    					console.debug(feature);
	    					if (feature.getProperties().iso_a2 == e._cell['geo.geo_code']) {
//	    						console.debug("Match");
	    						var colorScale = d3.scale.linear().range(['white', 'red']);
	    						var color = colorScale(d3.scale.quantize().domain([d3.min(allValues), d3.max(allValues)]).range([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])(value));
	    						feature.setStyle(
	    							new ol.style.Style({
	    								fill: new ol.style.Fill({color: color, opacity: 0.7}),  // colorArr[colorindex]
	    								stroke: new ol.style.Stroke({color: "#ffffff", width: 2,opacity: 0.7} ),
	    								text: createTextStyle(feature, label + "\n" + valueFormatted)
	    							})
	    						);
	    					}
	    				});
	    			}
	    		}
	    	}
	    });
	    }, 2000);

	    /*
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


