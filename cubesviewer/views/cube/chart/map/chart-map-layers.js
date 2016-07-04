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

"use strict";


var defineMapControllerLayerMethods = function($scope) {

	/**
	 * Creates a Tile XYZ layer.
	 * @param mapLayer
	 * @returns The created layer.
	 */
	$scope.createLayerXYZ = function(mapLayer) {

		var sourceParams = {};
		angular.extend(sourceParams, mapLayer.params);
		if (mapLayer.attribution) sourceParams['attributions'] = [ new ol.Attribution({ 'html': "" + mapLayer.attribution }) ];

		var layer = new ol.layer.Tile({
			source: new ol.source.XYZ(sourceParams),
			opacity: mapLayer.opacity ? mapLayer.opacity : 1.0,
	        visible: true
	    });

		return layer;
	};


	/**
	 * Creates a GeoJSON layer.
	 * @returns The created layer.
	 */
	$scope.createLayerVector = function(mapLayer) {

		var sourceParams = {};
		angular.extend(sourceParams, mapLayer.params);

		if (mapLayer.attribution) sourceParams['attributions'] = [ new ol.Attribution({ 'html': "" + mapLayer.attribution }) ];
		if (sourceParams['format'] == "geojson") sourceParams['format'] = new ol.format.GeoJSON();
		if (sourceParams['format'] == "kml") sourceParams['format'] = new ol.format.KML();

		/*
		var style = function(feature, resolution) {
        	var fontSize = 1.5 - 0.5 * feature.get("scalerank") / 10;
        	return [ new ol.style.Style({
        		text: new ol.style.Text({
                    text: resolution < 3600 || (resolution < 14400 && feature.get("scalerank") < 4) ? feature.get("name") : "",
                    font: 'bold ' + (fontSize * 10) + 'px Calibri,sans-serif',
                    fill: new ol.style.Fill({color: "#ffffff"}),
                    stroke: new ol.style.Stroke({color: "#000000", width: 3}),
                })
    		}) ]
        };
		*/

		// Populated places GeoJSON
		var layer = new ol.layer.Vector({
	        title: mapLayer.label,
	        source: new ol.source.Vector(sourceParams),
	        visible: true,

	        // TODO: Layer styles shall be optional and chosen from several possibilities (if applied)
	        //style: style
	    });

		return layer;
	};


	/**
	 * Creates various types of map layers based on settings.
	 * @returns A hash of OpenLayers map layers, along with an '_order' key with an ordered array.
	 */
	$scope.createLayers = function(mapLayers) {

		var layers = {};
		layers['_order'] = [];
		angular.forEach(mapLayers, function(mapLayer) {

			var layer = null;

			if (mapLayer.params.url && (mapLayer.params.url.search('{}') >= 0)) {
				mapLayer.params.url = mapLayer.params.url.replace('{}', $location.host());
			}

			if (mapLayer.type == 'wmts') {
				layer = $scope.createLayerWMTS(mapLayer);
			} else if (mapLayer.type == 'xyz') {
				layer = $scope.createLayerXYZ(mapLayer);
			} else if (mapLayer.type == 'vector') {
				layer = $scope.createLayerVector(mapLayer);
			} /*else if (mapLayer.type == 'kml') {
				layer = $scope.createLayerKML(mapLayer);
			} */ else {
				console.error('Wrong map settings. Could not create map layer of source type: ' + mapLayer.type);
				return;
			}

			layers[mapLayer.name] = layer;
			layers['_order'].push(layer);

		});

		return layers;
	};

};




