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
 */

"use strict";

angular.module('cv.views.cube').controller("CubesViewerViewsCubeExploreController", ['$rootScope', '$scope', '$timeout', 'cvOptions', 'cubesService', 'viewsService', 'dialogService',
                                                     function ($rootScope, $scope, $timeout, cvOptions, cubesService, viewsService, dialogService) {

	$scope.view.grid.enableRowSelection = true;
	$scope.view.grid.enableRowHeaderSelection = true;

	$scope.initialize = function() {
		$scope.refreshView();
	};

	$scope.$on("ViewRefresh", function(view) {
		$scope.loadData();
	});

	$scope.loadData = function() {

		//$scope.view.cubesviewer.views.blockViewLoading(view);
		var browser_args = cubesService.buildBrowserArgs($scope.view, false, false);
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
				$scope.processData(data);
				$rootScope.$apply();
			}
		};
	};

	$scope.processData = function(data) {

		var view = $scope.view;

	    // Configure grid
	    angular.extend(view.grid, {
    		//data: $scope.view.grid.data,
    		//minRowsToShow: 3,
    		rowHeight: 24,
    		onRegisterApi: $scope.onGridRegisterApi,
    		enableColumnResizing: true,
    		showColumnFooter: true,
    		enableGridMenu: true,
    		//showGridFooter: true,
    	    paginationPageSizes: cvOptions.pagingOptions,
    	    paginationPageSize: cvOptions.pagingOptions[0],
    		//enableHorizontalScrollbar: 0,
    		//enableVerticalScrollbar: 0,
    		enableRowSelection: view.params.drilldown.length > 0,
    		//enableRowHeaderSelection: false,
    		//enableSelectAll: false,
    		enablePinning: false,
    		multiSelect: true,
    		selectionRowHeaderWidth: 20,
    		//rowHeight: 50,
    		columnDefs: []
	    });

		$(view.cube.aggregates).each(function(idx, ag) {
			var col = {
				name: ag.label,
				field: ag.ref,
				index : ag.ref,
				cellClass : "text-right",
				type : "number",
				headerCellClass: "cv-grid-header-measure",
				width : $scope.defineColumnWidth(ag.ref, 115),
				visible: ! view.params.columnHide[ag.ref],
				cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ col.colDef.formatter(COL_FIELD, row, col) }}</div>',
				formatter: $scope.columnFormatFunction(ag),
				footerValue: $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col),
				sort: $scope.defineColumnSort(ag.ref)
				//formatoptions: {},
				//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
			};
			col.footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>';
			view.grid.columnDefs.push(col);

			//if (data.summary) dataTotals[ag.ref] = data.summary[ag.ref];
		});

		// If there are cells, show them
		$scope._sortData(data.cells, false);
		$scope._addRows(data);

		/*
		colNames.sort();
		colModel.sort(function(a, b) {
			return (a.name < b.name ? -1 : (a.name == b.name ? 0 : 1));
		});
		*/

		var label = [];
		$(view.params.drilldown).each(function(idx, e) {
			label.push(view.cube.cvdim_dim(e).label);
		});
		for (var i = 0; i < view.params.drilldown.length; i++) {

			// Get dimension
			var dim = view.cube.cvdim_dim(view.params.drilldown[i]);
			var parts = view.cube.dimensionParts(view.params.drilldown[i]);
			var cutDimension = parts.dimension.name + ( parts.hierarchy.name != "default" ? "@" + parts.hierarchy.name : "" );

			//nid.push(drilldownLevelValues.join("-"));

			var footer = "";
			if (i == 0) footer = (cubesService.buildQueryCuts(view).length == 0) ? "<b>Summary</b>" : "<b>Summary <i>(Filtered)</i></b>";

			view.grid.columnDefs.splice(i, 0, {
				name: label[i],
				field: "key" + i,
				index: "key" + i,
				headerCellClass: "cv-grid-header-dimension",
				enableHiding: false,
				cutDimension: cutDimension,
				width : $scope.defineColumnWidth("key" + i, 190),
				cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP"><a href="" ng-click="grid.appScope.selectCut(col.colDef.cutDimension, COL_FIELD.cutValue, false)">{{ COL_FIELD.title }}</a></div>',
				footerCellTemplate: '<div class="ui-grid-cell-contents">' + footer + '</div>',
				sort: $scope.defineColumnSort("key" + i)
			});
		}

		if (view.params.drilldown.length == 0) {
			view.grid.columnDefs.splice(0, 0, {
				name: view.cube.label,
				field: "key" + 0,
				index: "key" + 0,
				enableHiding: false,
				align: "left",
				width : $scope.defineColumnWidth("key" + 0, 190),
				sort: $scope.defineColumnSort("key" + 0)
			});
		}


	};


	$scope._addRows = function(data) {

		var view = $scope.view;
		var rows = view.grid.data;

		$(data.cells).each( function(idx, e) {

			var nid = [];
			var row = {};
			var key = [];

			// For each drilldown level
			for ( var i = 0; i < view.params.drilldown.length; i++) {

				// Get dimension
				var dim = view.cube.cvdim_dim(view.params.drilldown[i]);

				var parts = view.cube.dimensionParts(view.params.drilldown[i]);
				var infos = parts.hierarchy.readCell(e, parts.level);

				// Values and Labels
				var drilldownLevelValues = [];
				var drilldownLevelLabels = [];

				$(infos).each(function(idx, info) {
					drilldownLevelValues.push (info.key);
					drilldownLevelLabels.push (info.label);
				});

				nid.push(drilldownLevelValues.join("-"));

				var cutDimension = parts.dimension.name + ( parts.hierarchy.name != "default" ? "@" + parts.hierarchy.name : "" );
				key.push({ cutValue: drilldownLevelValues.join(","), title: drilldownLevelLabels.join(" / ")});
			}

			// Set key
			row["key"] = key.join (" / ");
			for (var i = 0; i < key.length; i++) {
				row["key" + i] = key[i];
			}
			//row["key"] = key.join(' / ');

			// Add columns
			$(view.cube.aggregates).each(function(idx, ag) {
				row[ag.ref] = e[ag.ref];
			});

			row["id"] = nid.join('-');
			rows.push(row);
		});

		// Copy summary if there's no data
		// This allows a scrollbar to appear in jqGrid when only the summary row is shown.
		if ((rows.length == 0) && (data.summary)) {
			var row = {};
			var summary = (cubesService.buildQueryCuts(view).length == 0) ? "Summary" : "Summary (Filtered)";
			row["key0"] = summary;

			$(view.cube.aggregates).each(function(idx, ag) {
				row[ag.ref] = data.summary[ag.ref];
			});

			rows.push(row);
		}

	};

	// Sort data according to current view
	$scope._sortData = function(data, includeXAxis) {
		//data.sort(cubesviewer._drilldownSortFunction(view.id, includeXAxis));
	};

	/*
	 * Filters current selection
	 */
	$scope.filterSelected = function() {

		var view = $scope.view;

		if (view.params.drilldown.length != 1) {
			dialogService.show('Can only filter multiple values in a view with one level of drilldown.');
			return;
		}

		if (view.grid.api.selection.getSelectedCount() <= 0) {
			dialogService.show('Cannot filter. No rows are selected.');
			return;
		}

		var filterValues = [];
		var selectedRows = view.grid.api.selection.getSelectedRows();
		$(selectedRows).each( function(idx, gd) {
			filterValues.push(gd["key0"].cutValue);
		});

		var invert = false;
		$scope.selectCut(view.grid.columnDefs[0].cutDimension, filterValues.join(";"), invert);

	};

	$scope.$on('filterSelected', function () {
		$scope.filterSelected();
	});

	$scope.initialize();

}]);




function cubesviewerViewCubeExplore() {


	/*
	 *
	 */
	this._drilldownSortFunction = function(view, includeXAxis) {

		var drilldown = view.params.drilldown.slice(0);

		// Include X Axis if necessary
		if (includeXAxis) {
			drilldown.splice(0, 0, view.params.xaxis);
		}

		return function(a, b) {

			// For the horizontal axis drilldown level, if present
			for ( var i = 0; i < drilldown.length; i++) {

				// Get dimension
				var dimension = view.cube.cvdim_dim(drilldown[i]);

				// row["key"] = ((e[view.params.drilldown_field] != null) &&
				// (e[view.params.drilldown] != "")) ? e[view.params.drilldown] : "Undefined";
				if (dimension.is_flat == true) {
					if (a[dimension.name] < b[dimension.name])
						return -1;
					if (a[dimension.name] > b[dimension.name])
						return 1;
				} else {
					var drilldown_level_value = [];
					for ( var j = 0; j < dimension.levels.length; j++) {
						var fieldname = dimension.name + "."
								+ dimension.levels[j].name;
						if ((fieldname in a) && (fieldname in b)) {
							if (a[fieldname] < b[fieldname])
								return -1;
							if (a[fieldname] > b[fieldname])
								return 1;
						} else {
							break;
						}
					}
				}
			}

			return 0;
		};
	},

	this.columnTooltipAttr = function(column) {
		return function (rowId, val, rawObject) {
			return 'title="' + column + ' = ' + val + '"';
		};
	};



	this._onTableSort = function (view) {
		return function (index, iCol, sortorder) {
			view.cubesviewer.views.cube.explore.onTableSort (view, index, iCol, sortorder);
		}
	}

	this._onTableResize = function (view) {
		return function(width, index) {
			view.cubesviewer.views.cube.explore.onTableResize (view, width, index);
		};
	};

	this.onTableResize = function (view, width, index) {
		// Empty implementation, to be overrided
		//alert("resize column " + index + " to " + width + " pixels");
	};
	this.onTableLoaded = function (view) {
		// Empty implementation, to be overrided
	};
	this.onTableSort = function (view, key, index, iCol, sortorder) {
		// Empty implementation, to be overrided
	};

	this.defineColumnWidth = function (view, column, vdefault) {
		// Simple implementation. Overrided by the columns plugin.
		return vdefault;
	};
	this.defineColumnSort = function (view, vdefault) {
		// Simple implementation. Overrided by the columns plugin.
		return vdefault;
	};


};


