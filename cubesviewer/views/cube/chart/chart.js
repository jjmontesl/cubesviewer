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
	    this._addRows(data);
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
	this._addRows = function(data) {

		console.debug("FIXME: addRows method in charts controller is duplicated (from series controller)!")

		var view = $scope.view;
		var rows = $scope.view.grid.data;

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
				var parts = view.cube.dimensionParts(drilldown[i]);
				var infos = parts.hierarchy.readCell(e, parts.level);

				// Values and Labels
				var drilldownLevelValues = [];
				var drilldownLevelLabels = [];

				$(infos).each(function(idx, info) {
					drilldownLevelValues.push (info.key);
					drilldownLevelLabels.push (info.label);
				});

				key.push (drilldownLevelLabels.join(" / "));

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
				view.grid.columnDefs.push(col);
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
			view.grid.columnDefs.splice(idx, 0, col);
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
			view.grid.columnDefs.splice(0, 0, col);
		}

	};

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


