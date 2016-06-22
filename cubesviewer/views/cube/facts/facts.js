/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Sof	tware, and to permit persons to whom the Software is
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
 * Facts table. Allows users to see the facts associated to current cut.
 */

"use strict";

angular.module('cv.views.cube').controller("CubesViewerViewsCubeFactsController", ['$rootScope', '$scope', '$timeout', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, $timeout, cvOptions, cubesService, viewsService) {

	$scope.view.grid.enableRowSelection = false;
	$scope.view.grid.enableRowHeaderSelection = false;

	$scope.initialize = function() {
		$scope.refreshView();
	};

	$scope.$on("ViewRefresh", function(view) {
		$scope.loadData();
	});

	$scope.loadData = function() {

		var browser_args = cubesService.buildBrowserArgs($scope.view, false, false);
		var browser = new cubes.Browser(cubesService.cubesserver, $scope.view.cube);
		var viewStateKey = $scope.newViewStateKey();
		var jqxhr = browser.facts(browser_args, $scope._loadDataCallback(viewStateKey));

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
				$scope.processData(data);
				$rootScope.$apply();
			}
		};
	};

	$scope.processData = function(data) {

		var view = $scope.view;

		$scope.workaroundSortCacheBug();
		$scope.view.grid.data = [];
		$scope.view.grid.columnDefs = [];
		$rootScope.$apply();

		var dimensions = view.cube.dimensions;
		var measures = view.cube.measures;
        var details = view.cube.details;

	    // Configure grid
	    angular.extend($scope.view.grid, {
    		data: [],
    		//minRowsToShow: 3,
    		rowHeight: 24,
    		onRegisterApi: $scope.onGridRegisterApi,
    		enableColumnResizing: true,
    		showColumnFooter: false,
    		enableGridMenu: true,
    		//showGridFooter: false,
    	    paginationPageSizes: cvOptions.pagingOptions,
    	    paginationPageSize: cvOptions.pagingOptions[0],
    		//enableHorizontalScrollbar: 0,
    		//enableVerticalScrollbar: 0,
    		enableRowSelection: false,
    		enableRowHeaderSelection: false,
    		//enableSelectAll: false,
    		enablePinning: false,
    		multiSelect: false,
    		//selectionRowHeaderWidth: 20,
    		//rowHeight: 50,
    		columnDefs: []
	    });

		view.grid.columnDefs.push({
			name: "id",
			field: "id",
			index: "id",
			enableHiding: false,
			width: 80, //cubesviewer.views.cube.explore.defineColumnWidth(view, "id", 65),
		});

		for (var dimensionIndex in dimensions) {

			var dimension = dimensions[dimensionIndex];

			for (var i = 0; i < dimension.levels.length; i++) {
				var level = dimension.levels[i];
				var col = {
					name: level.label,
					field: level.key().ref,
					index : level.key().ref,
					headerCellClass: "cv-grid-header-dimension",
					//cellClass : "text-right",
					//sorttype : "number",
					cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ row.entity[col.colDef.field] }}</div>',
					//formatter: $scope.columnFormatFunction(ag),
					//footerValue: $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col)
					//formatoptions: {},
					//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
					//footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>'
					visible: ! view.params.columnHide[level.key().ref],
					width : $scope.defineColumnWidth(level.key().ref, 95),
					sort: $scope.defineColumnSort(level.key().ref),
					sortingAlgorithm: $scope.sortDimensionLevel(level)
				};
				view.grid.columnDefs.push(col);

				// Additional dimension attributes
				$(level.attributes).each(function(idx, e) {
					if (e.ref != level.key().ref && e.ref != level.label_attribute().ref) {
						var col = {
							name: e.name,
							field: e.ref,
							index : e.ref,
							headerCellClass: "cv-grid-header-dimensionattribute",
							//cellClass : "text-right",
							//sorttype : "number",
							cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ row.entity[col.colDef.field] }}</div>',
							//formatter: $scope.columnFormatFunction(ag),
							//footerValue: $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col)
							//formatoptions: {},
							//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
							//footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>'
							visible: ! view.params.columnHide[e.ref],
							width : $scope.defineColumnWidth(e.ref, 85),
							sort: $scope.defineColumnSort(e.ref),
							//sortingAlgorithm: $scope.sortDimensionLevel(level)
						};
						view.grid.columnDefs.push(col);
					}
				});

			}
		}

		for (var measureIndex in measures) {
			var measure = measures[measureIndex];

			var col = {
				name: measure.label,
				field: measure.ref,
				index : measure.ref,
				cellClass : "text-right",
				headerCellClass: "cv-grid-header-measure",
				//type : "number",
				cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ col.colDef.formatter(COL_FIELD, row, col) }}</div>',
				formatter: $scope.columnFormatFunction(measure),
				//footerValue: $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col)
				//formatoptions: {},
				//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
				//footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>';
				visible: ! view.params.columnHide[measure.ref],
				width : $scope.defineColumnWidth(measure.ref, 75),
				sort: $scope.defineColumnSort(measure.ref),
			};
			view.grid.columnDefs.push(col);
		}

        for (var detailIndex in details) {
            var detail = details[detailIndex];

            var col = {
				name: detail.name,
				field: detail.ref,
				index : detail.ref,
				//cellClass : "text-right",
				//sorttype : "number",
				//cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ col.colDef.formatter(COL_FIELD, row, col) }}</div>',
				//formatter: $scope.columnFormatFunction(ag),
				//footerValue: $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col)
				//formatoptions: {},
				//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
				//footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>'
				visible: ! view.params.columnHide[detail.ref],
				width: $scope.defineColumnWidth(detail.ref, 95),
				sort: $scope.defineColumnSort(detail.ref),
				sortingAlgorithm: $scope.sortValues
			};
            view.grid.columnDefs.push(col);
        }

		// If there are cells, show them
		$scope._addRows(data);

	};


	/*
	 * Adds rows.
	 */
	$scope._addRows = function(data) {

		var view = $scope.view;
		var rows = view.grid.data;

		var counter = 0;
		var dimensions = view.cube.dimensions;
		var measures = view.cube.measures;
        var details = view.cube.details;

		$(data).each( function(idx, e) {

			var nid = [];
			var row = [];
			var key = [];

			for ( var dimensionIndex in dimensions) {
				// Get dimension
				var dimension = dimensions[dimensionIndex];

				for (var i = 0; i < dimension.levels.length; i++) {

					var level = dimension.levels[i];
					var levelData = level.readCell(e);

					row[level.key().ref] = levelData.label;

					$(level.attributes).each(function(aidx, ae) {
						if (ae.ref != level.key().ref && ae.ref != level.label_attribute().ref) {
							row[ae.ref] = levelData.info[ae.ref];
						}
					});

				}
			}

			for (var measureIndex in measures) {
				var measure = measures[measureIndex];
				row[measure.ref] = e[measure.ref];
			}

            for (var detailIndex in details) {
				var detail = details[detailIndex];
				row[detail.ref] = e[detail.ref];
			}

			// Set key
            row["id"] = counter++;
			if ("id" in e) row["id"] = e["id"];
			row["key"] = row["id"];

			row["_cell"] = e;

			rows.push(row);
		});

	};

	$scope.$on("$destroy", function() {
		$scope.view.grid.data = [];
		$scope.view.grid.columnDefs = [];
	});

	$scope.initialize();

}]);



