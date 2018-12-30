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

'use strict';

/**
 *
    "cv-geo-feature-layer": "world-countries",
    "cv-geo-feature-attribute": "geo_code",
    "cv-geo-feature-mode": "cloropleth"
 *
 */
angular.module('cv.views.cube').controller("CubesViewerViewsCubeChartMapController", ['$rootScope', '$scope', '$element', '$timeout', '$log','cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, $element, $timeout, $log, cvOptions, cubesService, viewsService) {

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

		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.dimensionParts(view.params.xaxis).label : "None");


		// Select column
		var geoLevels = [];
		$(view.params.drilldown).each(function(idx, e) {
			var dimParts = view.cube.dimensionParts(e);
			if (dimParts.level.isGeoLevel()) geoLevels.push(dimParts.level);
		});

		// Get geo info from model
		$scope.geoLevel = null;
		if (geoLevels.length > 0) {
			$scope.geoLevel = geoLevels[0];
		} else {
			return;
		}

		console.debug($scope.geoLevel);

		var projectionId = $scope.geoLevel.info['cv-geo-crs'] ? $scope.geoLevel.info['cv-geo-crs'] : 'EPSG:3857';
		$scope.mapProjection = ol.proj.get(projectionId);

		// Create layers
		var mapLayers = $scope.geoLevel.info['cv-geo-map-layers'];
		$scope.mapLayers = $scope.createLayers(mapLayers);

	    $scope.map = new ol.Map({
	    	layers: $scope.mapLayers['_order'],
	        target: container,
	        view: new ol.View({
	        	center: [876970.8463461736, 5859807.853963373],
	        	projection: ol.proj.get('EPSG:3857'),
	        	zoom: 6
	        })
	    });

	    // Feature layer
	    var layerFeatureId = $scope.geoLevel.info['cv-geo-ref-layer'];
	    $scope.layerFeature = $scope.mapLayers[layerFeatureId];

	    //$scope.layerFeature.getSource().setState("undefined");
	    var listenerKey = $scope.layerFeature.getSource().on('change', function(e) {
	    	console.debug($scope.layerFeature.getSource().getState());
			if ($scope.layerFeature.getSource().getState() == 'ready') {
				ol.Observable.unByKey(listenerKey);
				$scope.layerFeature.getSource().unByKey(listenerKey); //if you don't use the current master branch of ol3
				$scope.drawData();
			}
    	});

	    // Geo ref attributes
	    var refAttributes = $.grep($scope.geoLevel.attributes, function(e) {
	    	return e.name == $scope.geoLevel.info['cv-geo-ref-model-attribute'];
	    });
	    if (refAttributes.length != 1) {
	    	console.error("Could not find attribute with name '" + $scope.geoLevel.info['cv-geo-ref-model-attribute'] + "' to use as geographic reference key (cv-geo-ref-model-attribute).");
	    	return;
	    }
	    $scope.refModelAttribute = refAttributes[0].ref;
	    $scope.refLayerAttribute = $scope.geoLevel.info['cv-geo-ref-feature-attribute'];

	    //$timeout($scope.drawData, 2000);

	};

	$scope.drawData = function() {

		var view = $scope.view;
		var dataRows = $scope.view.grid.data;
		var columnDefs = view.grid.columnDefs;

	    // Collect values to calculate data range
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
	    	    stroke: new ol.style.Stroke({color: 'white', width: 2.0})
    	  	});
    	};

    	var ag = $.grep(view.cube.aggregates, function(ag) { return ag.ref == view.params.yaxis })[0];
    	var colFormatter = $scope.columnFormatFunction(ag);

    	var numRows = dataRows.length;
    	var colorScale = d3.scale.linear().range(['white', 'red']);
    	// Walk rows to define features
	    $(dataRows).each(function(idx, e) {
	    	for (var i = 1; i < columnDefs.length; i++) {
	    		if (columnDefs[i].field in e) {

	    			var value = e[columnDefs[i].field];
	    			var valueFormatted = colFormatter(value);

	    			var infos = $scope.geoLevel.readCell(e._cell);
	    			var label = infos.label;

	    			if (value !== undefined) {

	    				var found = false;
	    				$($scope.layerFeature.getSource().getFeatures()).each(function(idx, feature) {
	    					if ((feature.getProperties()[$scope.refLayerAttribute] == e._cell[$scope.refModelAttribute])) {
	    						found = true;
	    						var color = colorScale(d3.scale.quantize().domain([d3.min(allValues), d3.max(allValues)]).range([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])(value));
	    						feature.setStyle(
	    							new ol.style.Style({
	    								fill: new ol.style.Fill({color: color, opacity: 0.5}),
	    								stroke: new ol.style.Stroke({color: "#3A9CCD", width: 1.0, opacity: 1.0} ),
	    								text: createTextStyle(feature, label + "\n" + valueFormatted)
	    								/* geometry: function(feature) {
	    							        // Expecting a MultiPolygon here
	    							        var interiorPoints = feature.getGeometry().getInteriorPoints();
	    							        return interiorPoints.getPoint(0);
	    							    }*/
	    							})
	    						);
	    					}
	    				});
	    				if (!found) {
	    					console.debug("Could not found referenced feature in map while drawing map data: " + $scope.refLayerAttribute + " = " + e._cell[$scope.refModelAttribute]);
	    				}
	    			}
	    		}
	    	}
	    });
	};

	defineMapControllerLayerMethods($scope);
	$scope.initialize();

}]);


