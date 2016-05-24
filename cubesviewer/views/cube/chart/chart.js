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

/*
 * Series chart object. Contains view functions for the 'chart' mode.
 * This is an optional component, part of the cube view.
 */

angular.module('cv.views.cube').controller("CubesViewerViewsCubeChartController", ['$rootScope', '$scope', '$timeout', '$element', 'cvOptions', 'cubesService', 'viewsService', 'seriesOperationsService',
                                                     function ($rootScope, $scope, $timeout, $element, cvOptions, cubesService, viewsService, seriesOperationsService) {

	var chartCtrl = this;

	this.chart = null;

	this.initialize = function() {
		// Add chart view parameters to view definition
		$scope.view.params = $.extend(
			{},
			{ "charttype" : "bars-vertical", "chartoptions": { showLegend: true } },
			$scope.view.params
		);
		$scope.refreshView();
	};

	$scope.$on("ViewRefresh", function(view) {
		chartCtrl.loadData();
	});

	this.loadData = function() {

		var view = $scope.view;

		// Check if we can produce a table
		if (view.params.yaxis == null) return;

		var browser_args = cubesService.buildBrowserArgs($scope.view, $scope.view.params.xaxis != null ? true : false, false);
		var browser = new cubes.Browser(cubesService.cubesserver, $scope.view.cube);
		var viewStateKey = $scope.newViewStateKey();
		var jqxhr = browser.aggregate(browser_args, $scope._loadDataCallback(viewStateKey));

		$scope.view.pendingRequests++;
		jqxhr.always(function() {
			$scope.view.pendingRequests--;
			$rootScope.$apply();
		});
		jqxhr.error($scope.requestErrorHandler);

	};

	$scope._loadDataCallback = function(viewStateKey) {
		return function(data, status) {
			// Only update if view hasn't changed since data was requested.
			if (viewStateKey == $scope._viewStateKey) {
				$scope.validateData(data, status);
				chartCtrl.processData(data);
				$rootScope.$apply();
			}
		};
	};

	this.processData = function(data) {

		if ($scope.view.pendingRequests == 0) {
			$($element).find("svg").empty();
			$($element).find("svg").parent().children().not("svg").remove();
		}

		$scope.rawData = data;

		$scope.view.grid.data = [];
		$scope.view.grid.columnDefs = [];
		$rootScope.$apply();

		var view = $scope.view;
		var rows = $scope.view.grid.data;
		var columnDefs = view.grid.columnDefs;

		// Process data
		//$scope._sortData (data.cells, view.params.xaxis != null ? true : false);
	    this._addRows($scope, data);
	    seriesOperationsService.applyCalculations($scope.view, $scope.view.grid.data, view.grid.columnDefs);

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

		$scope.$broadcast("gridDataUpdated");

	};

	/*
	 * Adds rows.
	 */
	this._addRows = cubesviewer._seriesAddRows;

	this.cleanupNvd3 = function() {

		//$($element).find("svg").empty();
		$($element).find("svg").parent().children().not("svg").remove();

		if (chartCtrl.chart) {
			$("#" + chartCtrl.chart.tooltip.id()).remove(); // div.nvtooltip
		}

		//$scope.chart = null;

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

	$scope.$watch('cvOptions.studioTwoColumn', function() {
		if (chartCtrl.chart) {
			$timeout(function() {
				chartCtrl.chart.update();
			}, 100);
		}
	});

	this.resizeChart = function(size) {
		var view = $scope.view;
		$($element).find('svg').height(size);
		$($element).find('svg').resize();

		if (chartCtrl.chart) chartCtrl.chart.update();
	};

	$scope.$on("$destroy", function() {
		chartCtrl.cleanupNvd3();
		$scope.view.grid.data = [];
		$scope.view.grid.columnDefs = [];
	});

	this.initialize();

}]);


