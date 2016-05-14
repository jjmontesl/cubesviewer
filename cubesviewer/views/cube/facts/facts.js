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

	$scope.$parent.gridData = [];

	$scope.pendingRequests = 0;

	// TODO: Move to explore view or grid component as cube view shall be split into directives
    $scope.$parent.onGridRegisterApi = function(gridApi) {
        $scope.gridApi = gridApi;
        gridApi.selection.on.rowSelectionChanged($scope,function(row){
        });
        gridApi.selection.on.rowSelectionChangedBatch($scope,function(rows){
        });
        gridApi.core.on.columnVisibilityChanged($scope, function (column) {
        	if (column.visible) {
        		delete ($scope.view.params.columnHide[column.field]);
        	} else {
        		$scope.view.params.columnHide[column.field] = true;
        		delete ($scope.view.params.columnWidths[column.field]);
        	}
        	$scope.view.updateUndo();
        });
        gridApi.core.on.sortChanged($scope, function(grid, sortColumns){
            // do something
        	$scope.view.params.columnSort[$scope.view.params.mode] = {};
        	$(sortColumns).each(function (idx, col) {
        		$scope.view.params.columnSort[$scope.view.params.mode][col.field] = { direction: col.sort.direction, priority: col.sort.priority };
        	});
        	$scope.view.updateUndo();
        });
        gridApi.colResizable.on.columnSizeChanged($scope, function(colDef, deltaChange) {
        	var colIndex = -1;
        	$(gridApi.grid.columns).each(function(idx, e) {
        		if (e.field == colDef.field) colIndex = idx;
        	});
        	if (colIndex >= 0) {
        		$scope.view.params.columnWidths[colDef.field] = gridApi.grid.columns[colIndex].width;
        	}
        	$scope.view.updateUndo();
        });
    };
	$scope.$parent.gridApi = null;
	$scope.$parent.gridOptions = {
		onRegisterApi: $scope.onGridRegisterApi,
		enableRowSelection: false,
		enableRowHeaderSelection: false,
	};


	$scope.initialize = function() {
		$scope.refreshView();
	};

	$scope.$on("ViewRefresh", function(view) {
		$scope.loadData();
	});

	$scope.loadData = function() {

		var browser_args = cubesService.buildBrowserArgs($scope.view, false, false);
		var browser = new cubes.Browser(cubesService.cubesserver, $scope.view.cube);
		var jqxhr = browser.facts(browser_args, $scope._loadDataCallback);

		$scope.pendingRequests++;
		jqxhr.always(function() {
			$scope.pendingRequests--;
		});
		jqxhr.error($scope.requestErrorHandler);

	};

	$scope._loadDataCallback = function(data, status) {
		$scope.validateData(data, status);
		$scope.processData(data);
		$rootScope.$apply();
		$scope.gridApi.core.refresh();
		$rootScope.$apply();
	};

	$scope.processData = function(data) {

		var view = $scope.view;

		$scope.gridData = [];
		$scope.gridFormatters = {};

		var dimensions = view.cube.dimensions;
		var measures = view.cube.measures;
        var details = view.cube.details;

        $scope.view.grid = $scope.$parent.gridOptions;

	    // Configure grid
	    angular.extend($scope.$parent.gridOptions, {
    		data: $scope.gridData,
    		//minRowsToShow: 3,
    		rowHeight: 24,
    		onRegisterApi: $scope.onGridRegisterApi,
    		enableColumnResizing: true,
    		//showColumnFooter: true,
    		enableGridMenu: true,
    		//showGridFooter: true,
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

		$scope.gridOptions.columnDefs.push({
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
					sort: $scope.defineColumnSort(level.key().ref)

				};
				$scope.gridOptions.columnDefs.push(col);
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
				sorttype : "number",
				cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ col.colDef.formatter(COL_FIELD, row, col) }}</div>',
				formatter: $scope.columnFormatFunction(measure),
				//footerValue: $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col)
				//formatoptions: {},
				//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
				//footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>';
				visible: ! view.params.columnHide[measure.ref],
				width : $scope.defineColumnWidth(measure.ref, 75),
				sort: $scope.defineColumnSort(measure.ref)
			};
			$scope.gridOptions.columnDefs.push(col);
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
				sort: $scope.defineColumnSort(detail.ref)
			};
			$scope.gridOptions.columnDefs.push(col);
        }

		// If there are cells, show them
		$scope._addRows(data);

	};


	/*
	 * Adds rows.
	 */
	$scope._addRows = function(data) {

		var view = $scope.view;
		var rows = $scope.gridData;

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
					var levelData = level.readCell (e);

					row[level.key().ref] = levelData.label;

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

			rows.push(row);
		});


	};

	$scope.initialize();

}]);



