/*
 * CubesViewer
 * Copyright (c) 2012-2015 Jose Juan Montes, see AUTHORS for more details
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

/**
 * CubesViewer view module.
 */
angular.module('cv.views.cube', []);


/**
 * cvViewCube directive and controller.
 */
angular.module('cv.views.cube').controller("CubesViewerViewsCubeController", ['$rootScope', '$scope', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, cvOptions, cubesService, viewsService) {

	/**
	 * Define view mode ('explore', 'series', 'facts', 'chart').
	 */
	$scope.setViewMode = function(mode) {
		$scope.view.params.mode = mode;
	};


	$scope.initCube = function() {

		$scope.view.cube = null;

		// Apply default cube view parameters
		var cubeViewDefaultParams = {
			"mode" : "explore",
			"drilldown" : [],
			"cuts" : []
		};
		$scope.view.params = $.extend(true, {}, cubeViewDefaultParams, $scope.view.params);

		var jqxhr = cubesService.cubesserver.get_cube($scope.view.params.cubename, function(cube) {

			$scope.view.cube = cube;

			// Apply parameters if cube metadata contains specific cv-view-params
			// TODO: Don't do this if this was a saved or pre-initialized view, only for new views
			if ('cv-view-params' in $scope.view.cube.info) $.extend($scope.view.params, $scope.view.cube.info['cv-view-params']);

			$rootScope.$apply();

		});
		if (jqxhr) {
			jqxhr.fail(function() {
				$scope.view.state = cubesviewer.STATE_ERROR;
				$rootScope.$apply();
			});
		}
	};


}]).directive("cvViewCube", function() {
	return {
		restrict: 'A',
		templateUrl: 'views/cube/cube.html',
		scope: {
			view: "="
		},
		controller: "CubesViewerViewsCubeController",
		link: function(scope, iElement, iAttrs) {
			console.debug(scope);
			scope.initCube();
		}
	};
});



function cubesviewerViewCube () {


	/*
	 * Adjusts grids size
	 */
	this._adjustGridSize = function() {

		// TODO: use appropriate container width!
		//var newWidth = $(window).width() - 350;

		$(".cv-view-panel").each(function (idx, e) {

			$(".ui-jqgrid-btable", e).each(function(idx, el) {

				$(el).setGridWidth(cubesviewer.options.tableResizeHackMinWidth);

				var newWidth = $( e ).innerWidth() - 20;
				//var newWidth = $( el ).parents(".ui-jqgrid").first().innerWidth();
				if (newWidth < cubesviewer.options.tableResizeHackMinWidth) newWidth = cubesviewer.options.tableResizeHackMinWidth;

				$(el).setGridWidth(newWidth);

			});

		});

	};

	/**
	 * Accepts an aggregation or a measure and returns the formatter function.
	 */
	this.columnFormatFunction = function(view, agmes) {

		var measure = agmes;
		if ('measure' in agmes) {
			measure = $.grep(view.cube.measures, function(item, idx) { return item.ref == agmes.measure })[0];
		}

		var formatterFunction = null;
		if (measure && ('cv-formatter' in measure.info)) {
			formatterFunction = function(value) {
				return eval(measure.info['cv-formatter']);
			};
		} else {
			formatterFunction = function(value) {
				return Math.formatnumber(value, (agmes.ref=="record_count" ? 0 : 2));
			};
		}

		return formatterFunction;
	};


};

Math.formatnumber = function(value, decimalPlaces, decimalSeparator, thousandsSeparator) {


	if (value === undefined) return "";

	if (decimalPlaces === undefined) decimalPlaces = 2;
	if (decimalSeparator === undefined) decimalSeparator = ".";
	if (thousandsSeparator === undefined) thousandsSeparator = " ";

	var result = "";


	var intString = Math.floor(value).toString();
	for (var i = 0; i < intString.length; i++) {
		result = result + intString[i];
		var invPos = (intString.length - i - 1);
		if (invPos > 0 && invPos % 3 == 0) result = result + thousandsSeparator;
	}
	if (decimalPlaces > 0) {
		result = result + parseFloat(value - Math.floor(value)).toFixed(decimalPlaces).toString().replace(".", decimalSeparator).substring(1);
	}

	return result;
};

/*
 * Bind events.
 */

// Resize grids as appropriate
/*
$(window).bind('resize', function() {
	cubesviewer.views.cube._adjustGridSize();
}).trigger('resize');
*/

