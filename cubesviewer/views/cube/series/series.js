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
 * Manipulates series.
 */

"use strict";

angular.module('cv.views').service("seriesService", ['$rootScope', 'cvOptions', 'cubesService',
                                                    function ($rootScope, cvOptions, cubesService) {

	this.calculateDifferentials = function(view, rows, columnDefs) {

		console.debug("FIXME: Differentials are ignoring drilldown.length columns, but fails in some cases.");

		$(rows).each(function(idx, e) {
			var lastValue = null;
			for (var i = view.params.drilldown.length; i < columnDefs.length; i++) {
	    		var value = e[columnDefs[i].field];
	    		var diff = null;
	    		if ((lastValue != null) && (value != null)) {
	    			var diff = value - lastValue;
	    			e[columnDefs[i].field] = diff;
	    		} else {
	    			delete e[columnDefs[i].field];
	    			//e[columnDefs[i].field] = null;
	    		}
	    		lastValue = value;
	    	}
		});

	};

	this.calculateDifferentialsPercent = function(view, rows, columnDefs) {

		console.debug("FIXME: Differentials are ignoring drilldown.length columns, but fails in some cases.");

		$(rows).each(function(idx, e) {
			var lastValue = null;
			for (var i = view.params.drilldown.length; i < columnDefs.length; i++) {
	    		var value = e[columnDefs[i].field];
	    		var diff = null;
	    		if ((lastValue != null) && (value != null)) {
	    			var diff = (value - lastValue) / lastValue;
	    			e[columnDefs[i].field] = diff;
	    		} else {
	    			delete e[columnDefs[i].field];
	    			//e[columnDefs[i].field] = null;
	    		}
	    		lastValue = value;
	    	}
		});

	};

	this.calculateAccum = function(view, rows, columnDefs) {

	};

	this.applyCalculations = function(view, rows, columnDefs) {
		if (view.params.calculation == "difference") {
			this.calculateDifferentials(view, rows, columnDefs);
		}
		if (view.params.calculation == "percentage") {
			this.calculateDifferentialsPercent(view, rows, columnDefs);
		}
	};


}]);



/**
 * SeriesTable object. This is part of the "cube" view. Allows the user to select
 * a dimension to use as horizontal axis of a table. This is later used to generate
 * charts.
 */
angular.module('cv.views.cube').controller("CubesViewerViewsCubeSeriesController", ['$rootScope', '$scope', '$timeout', 'cvOptions', 'cubesService', 'viewsService', 'seriesService',
                                                     function ($rootScope, $scope, $timeout, cvOptions, cubesService, viewsService, seriesService) {

	$scope.$parent.gridData = [];

	$scope.pendingRequests = 0;

	// TODO: Move to explore view or grid component as cube view shall be split into directives
    $scope.$parent.onGridRegisterApi = function(gridApi) {
    	//console.debug("Grid Register Api: Series");
        $scope.gridApi = gridApi;
        gridApi.selection.on.rowSelectionChanged($scope,function(row){
        });
        gridApi.selection.on.rowSelectionChangedBatch($scope,function(rows){
        });

    };
	$scope.$parent.gridApi = null;
	$scope.$parent.gridOptions = {
		onRegisterApi: $scope.onGridRegisterApi,
		enableRowSelection: false,
		enableRowHeaderSelection: false,
	};


	$scope.initialize = function() {
		$scope.view.params = $.extend(
			{},
			{ "xaxis" : null, "yaxis" : null },
			$scope.view.params
		);
		$scope.refreshView();
	};

	$scope.$on("ViewRefresh", function(view) {
		$scope.loadData();
	});

	$scope.loadData = function() {

		var view = $scope.view;

		// Check if we can produce a table
		if (view.params.yaxis == null) return;

		var browser_args = cubesService.buildBrowserArgs($scope.view, $scope.view.params.xaxis != null ? true : false, false);
		var browser = new cubes.Browser(cubesService.cubesserver, $scope.view.cube);
		var jqxhr = browser.aggregate(browser_args, $scope._loadDataCallback);
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
		if ($scope.gridApi) {
			$scope.gridApi.core.refresh();
			$rootScope.$apply();
		}
	};

	$scope.processData = function(data) {

		var view = $scope.view;

		$scope.gridData = [];

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
    		selectionRowHeaderWidth: 20,
    		//rowHeight: 50,
    		columnDefs: []
	    });


		// Process data
		//$scope._sortData (data.cells, view.params.xaxis != null ? true : false);
	    $scope._addRows(data);
	    seriesService.applyCalculations($scope.view, $scope.gridData, $scope.gridOptions.columnDefs);

	    /*
	    // TODO: Is this needed?

		colNames.forEach(function (e) {
			var colLabel = null;
			$(view.cube.aggregates).each(function (idx, ag) {
				if (ag.name == e) {
					colLabel = ag.label||ag.name;
					return false;
				}
			});
			if (!colLabel) {
				$(view.cube.measures).each(function (idx, me) {
					if (me.name == e) {
						colLabel = me.label||ag.name;
						return false;
					}
				});
			}
			//colLabel = view.cube.getDimension(e).label
			colLabels.push(colLabel||e);
		});
		*/

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
				var parts = view.cube.cvdim_parts(drilldown[i]);
				var infos = parts.hierarchy.readCell(e, parts.level);

				// Values and Labels
				var drilldown_level_values = [];
				var drilldown_level_labels = [];

				$(infos).each(function(idx, info) {
					drilldown_level_values.push (info.key);
					drilldown_level_labels.push (info.label);
				});

				key.push (drilldown_level_labels.join(" / "));

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
					width : 90, //cubesviewer.views.cube.explore.defineColumnWidth(view, colKey, 75),
					cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ col.colDef.formatter(COL_FIELD, row, col) }}</div>',
					formatter: $scope.columnFormatFunction(ag),
					//footerValue: $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col)
					//formatoptions: {},
					//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
					//footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>';
				};
				$scope.gridOptions.columnDefs.push(col);
			}
		});

		//var label = [];
		$(view.params.drilldown).each (function (idx, e) {
			var col = {
				name: view.cube.cvdim_dim(e).label,
				field: "key" + idx,
				index : "key" + idx,
				headerCellClass: "cv-grid-header-dimension",
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
			$scope.gridOptions.columnDefs.splice(idx, 0, col);
		});

		if (view.params.drilldown.length == 0 && rows.length > 0) {
			rows[0]["key0"] = view.params.yaxis;

			var col = {
				name: "Measure",
				field: "key0",
				index : "key0",
				headerCellClass: "cv-grid-header-measure",
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
			$scope.gridOptions.columnDefs.splice(0, 0, col);
		}

	};

	$scope.initialize();

}]);

