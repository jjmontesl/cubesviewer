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

/**
 * The CubeView class represents a view of type `cube`.
 *
 * @param cvOptions The cv options object.
 * @param id The numeric id of the view to be created.
 * @param type The view type (ie. 'cube').
 * @returns The new view object.
 *
 * @namespace cubesviewer
 */
cubesviewer.CubeView = function(cvOptions, id, type) {

	var view = cubesviewer.View(cvOptions, id, type);

	view.resultLimitHit = false;
	view.requestFailed = false;
	view.pendingRequests = 0;
	view.dimensionFilter = null;

	view._invalidatedData = true;
	view._invalidatedDefs = true;

	view.grid = {
		api: null,
		data: [],
		columnDefs: []
	};

	view.invalidateData = function() {
		view._invalidatedData = true;
	};

	view.invalidateDefs = function() {
		view._invalidatedData = true;
		view._invalidatedDefs = true;
	};

	view.setViewMode = function(mode) {
		view.params.mode = mode;
		view.invalidateDefs();
	};

	return view;

};


/**
 * CubesViewer view module.
 *
 * @namespace cv.views.cube
 */
angular.module('cv.views.cube', []);


/**
 * cvViewCube directive and controller.
 *
 * FIXME: Some of this code shall be on a parent generic "view" directive.
 */
angular.module('cv.views.cube').controller("CubesViewerViewsCubeController", ['$rootScope', '$log', '$window','$injector', '$scope', '$timeout', 'cvOptions', 'cubesService', 'viewsService', 'exportService', 'rowSorter', 'dialogService',
                                                                               function ($rootScope, $log, $window, $injector, $scope, $timeout, cvOptions, cubesService, viewsService, exportService, rowSorter, dialogService) {

	// TODO: Functions shall be here?
	$scope.viewController = {};

	$scope.$rootScope = $rootScope;
	$scope.viewsService = viewsService;
	$scope.cvOptions = cvOptions;
	$scope.cubesService = cubesService;
	$scope.exportService = exportService;

	$scope.reststoreService = null;

    if ($injector.has('reststoreService')) {
        $scope.reststoreService = $injector.get('reststoreService');
    }


    $scope.refreshView = function() {
    	if ($scope.view && $scope.view.cube) {
			//$scope.view.grid.data = [];
			//$scope.view.grid.columnDefs = [];
			$scope.$broadcast("ViewRefresh", $scope.view);
		}
	};

	$scope.setViewMode = function(mode) {
		console.debug("Remove setViewMode call on the controller?")
		$scope.view.setViewMode(mode);
	};


	$scope.initCube = function() {

		$scope.view.cube = null;

		// Apply default cube view parameters
		var cubeViewDefaultParams = {
			"mode" : "explore",
			"drilldown" : [],
			"cuts" : [],

			"datefilters": [],

			"columnHide": {},
			"columnWidths": {},
			"columnSort": {},
		};

		var jqxhr = cubesService.cubesserver.get_cube($scope.view.params.cubename, function(cube) {

			$scope.view.cube = cube;

			$log.debug($scope.view.cube);

			// Apply parameters if cube metadata contains specific cv-view-params
			// TODO: Don't do this if this was a saved or pre-initialized view, only for new views
			if ('cv-view-params' in $scope.view.cube.info) {
				$scope.view.params = $.extend({}, cubeViewDefaultParams, $scope.view.cube.info['cv-view-params'], $scope.view.params);
			} else {
				$scope.view.params = $.extend({}, cubeViewDefaultParams, $scope.view.params);
			}

			$scope.view.state = cubesviewer.VIEW_STATE_INITIALIZED;
			$scope.view.error = "";

			$rootScope.$apply();

		});
		jqxhr.fail(function(req) {
			var data = req.responseJSON;
			$scope.view.state = cubesviewer.VIEW_STATE_ERROR;
			$scope.view.error = "Error loading model: " + data.message + " (" + data.error + ")";
			console.debug(data);
			$rootScope.$apply();
		});
	};

	$scope.requestErrorHandler = function() {
		$scope.view.requestFailed = true;
	};


	$scope.workaroundSortCacheBug = function() {
		rowSorter.colSortFnCache = {};
		//$scope.view.grid.api.core.notifyDataChange(uiGridConstants.dataChange.ALL);
	};


	// TODO: Move to explore view or grid component as cube view shall be split into directives
    $scope.onGridRegisterApi = function(gridApi) {
    	//console.debug("Grid Register Api: Explore");
        $scope.view.grid.api = gridApi;
        gridApi.selection.on.rowSelectionChanged($scope, function(row){
          //console.debug(row.entity);
        });
        gridApi.selection.on.rowSelectionChangedBatch($scope, function(rows){
          //console.debug(rows);
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
        	$scope.workaroundSortCacheBug();
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

	$scope.view.grid.onRegisterApi = $scope.onGridRegisterApi;

	$scope.validateData = function(data, status) {
		//console.debug(data);
		$scope.view.requestFailed = false;
		$scope.view.resultLimitHit = false;
		if ( ("cells" in data && data.cells.length >= cubesService.cubesserver.info.json_record_limit) ||
		     (data.length && data.length >= cubesService.cubesserver.info.json_record_limit) ) {
			$scope.view.resultLimitHit = true;
		}
	};

	$scope.newViewStateKey = function() {
		$scope._viewStateKey = Math.floor(Math.random() * 999999999999);
		return $scope._viewStateKey;
	};

	/**
	 * Adds a drilldown level.
	 * Dimension is encoded using Cubes notation: dimension[@hierarchy][:level]
	 */
	$scope.selectDrill = function(dimension, value) {

		var cube = $scope.view.cube;

		// view.params.drilldown = (drilldown == "" ? null : drilldown);
		if (! dimension) {
			$scope.view.params.drilldown = [];
		} else {
			$scope.removeDrill(dimension);
			if (value == true) {
				$scope.view.params.drilldown.push(dimension);
			}
		}

		$scope.refreshView();
	};

	/**
	 * Removes a level from the view.
	 */
	$scope.removeDrill = function(drilldown) {

		$scope.view.params.drilldown = $.grep($scope.view.params.drilldown, function(e) {
			return $scope.view.cube.dimensionParts(e).dimension.name == $scope.view.cube.dimensionParts(drilldown).dimension.name;
		}, true);

		$scope.refreshView();
	};


	/**
	 * Accepts an aggregation or a measure and returns the formatter function.
	 *
	 * @param agmes Aggregation or measure object.
	 * @returns A formatter function that takes an argument with the metric value to be formatted.
	 */
	$scope.columnFormatFunction = function(agmes) {

		var view = $scope.view;

		var measure = agmes;

		if (!measure) {
			return function(value) {
				return value;
			};
		}

		if ('measure' in agmes) {
			measure = $.grep(view.cube.measures, function(item, idx) { return item.ref == agmes.measure; })[0];
		}

		var formatterFunction = null;
		if (measure && ('cv-formatter' in measure.info)) {
			formatterFunction = function(value, row) {
				return eval(measure.info['cv-formatter']);
			};
		} else {
			formatterFunction = function(value) {
				return Math.formatnumber(value, (agmes.ref=="record_count" ? 0 : 2));
			};
		}

		return formatterFunction;
	};

	// Select a cut
	$scope.selectCut = function(dimension, value, invert) {

		var view = $scope.view;

		if (dimension) {
			if (value) {
				/*
				var existing_cut = $.grep(view.params.cuts, function(e) {
					return e.dimension == dimension;
				});
				if (existing_cut.length > 0) {
					//dialogService.show("Cannot cut dataset. Dimension '" + dimension + "' is already filtered.");
					//return;
				} else {*/
					view.params.cuts = $.grep(view.params.cuts, function(e) {
						return view.cube.dimensionParts(e.dimension).cutDimension == view.cube.dimensionParts(dimension).cutDimension;
					}, true);
					view.params.cuts.push({
						"dimension" : view.cube.dimensionParts(dimension).cutDimension,
						"value" : value,
						"invert" : invert
					});
				/*}*/
			} else {
				view.params.cuts = $.grep(view.params.cuts, function(e) {
					return view.cube.dimensionParts(e.dimension).cutDimension == view.cube.dimensionParts(dimension).cutDimension;
				}, true);
			}
		} else {
			view.params.cuts = [];
		}

		$scope.refreshView();

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


	$scope.showDimensionFilter = function(dimension) {
		var parts = $scope.view.cube.dimensionParts(dimension);
		if ($scope.view.dimensionFilter && $scope.view.dimensionFilter == parts.drilldownDimension) {
			$scope.view.dimensionFilter = null;
		} else {
			$scope.view.dimensionFilter = parts.drilldownDimension;
		}
	};

	/*
	 * Selects measure axis
	 */
	$scope.selectMeasure = function(measure) {
		$scope.view.params.yaxis = measure;
		$scope.refreshView();
	};

	/*
	 * Selects horizontal axis
	 */
	$scope.selectXAxis = function(dimension) {
		$scope.view.params.xaxis = (dimension == "" ? null : dimension);
		$scope.refreshView();
	};

	/*
	 * Selects chart type
	 */
	$scope.selectChartType = function(charttype) {
		$scope.view.params.charttype = charttype;
		$scope.refreshView();
	};

	/*
	 * Selects chart type
	 */
	$scope.selectCalculation = function(calculation) {
		$scope.view.params.calculation = calculation;
		$scope.refreshView();  // TODO: This depends on the calculation
	};


	/*
	 * Serialize view dialog
	 */
	$scope.showSerializeView = function(view) {
		studioViewsService.studioScope.showSerializeView(view);
	};

	/**
	 * Adds a date filter.
	 */
	$scope.selectDateFilter = function(dimension, enabled) {

		var view = $scope.view;
		var cube = view.cube;

		// TODO: Show a notice if the dimension already has a date filter (? and cut filter)

		if (dimension != "") {
			if (enabled == "1") {
				view.params.datefilters.push({
					"dimension" : dimension,
					"mode" : "auto-last3m",
					"date_from" : null,
					"date_to" : null
				});
			} else {
				for ( var i = 0; i < view.params.datefilters.length; i++) {
					if (view.params.datefilters[i].dimension.split(':')[0] == dimension) {
						view.params.datefilters.splice(i, 1);
						break;
					}
				}
			}
		} else {
			view.params.datefilters = [];
		}

		$scope.refreshView();

	};

	$scope.clearFilters = function() {
		$scope.view.params.cuts = [];
		$scope.view.params.datefilters = [];
		$scope.refreshView();
	};

	$scope.defineColumnWidth = function(column, vdefault) {
		if (column in $scope.view.params.columnWidths) {
			return $scope.view.params.columnWidths[column];
		} else {
			return vdefault;
		}
	};

	$scope.defineColumnSort = function(column) {
		var columnSort = null;
		if ($scope.view.params.columnSort[$scope.view.params.mode] && $scope.view.params.columnSort[$scope.view.params.mode][column]) {
			columnSort = {
				"direction": $scope.view.params.columnSort[$scope.view.params.mode][column].direction,
				"priority": $scope.view.params.columnSort[$scope.view.params.mode][column].priority
			};
		}
		return columnSort;
	};

	/**
	 * Function to compare two values by guessing the
	 * data type.
	 *
	 * @return An integer, negative or positive depending on relative inputs ordering.
	 */
	$scope.sortValues = function(a, b) {
		if (typeof a == "number" && typeof b == "number") {
			return a - b;
		} else if (typeof a == "string" && typeof b == "string") {
			if ($.isNumeric(a) && $.isNumeric(b)) {
				return parseFloat(a) - parseFloat(b);
			} else {
				return a.localeCompare(b);
			}
		} else if (a == null && b == null) {
			return 0;
		} else if (a == null) {
			return 1;
		} else if (b == null) {
			return -1;
		} else {
			return a - b;
		}
	};

	/**
	 * Called to sort a column which is a dimension drilled down to a particular level.
	 * This is called by UIGrid, since this method is used as `compareAlgorithm` for it.
	 *
	 * @returns A compare function.
	 */
	$scope.sortDimensionParts = function(tdimparts) {

		var dimparts = tdimparts;

		var cmpFunction = function(a, b, rowA, rowB, direction) {
			var result = 0;

			for (var j = 0; result == 0 && j < dimparts.hierarchy.levels.length; j++) {
				var level = dimparts.hierarchy.levels[j];
				var order_attribute = level.order_attribute();
				var fieldname = order_attribute.ref;
				if ((fieldname in rowA.entity._cell) && (fieldname in rowB.entity._cell)) {
					result = $scope.sortValues(rowA.entity._cell[fieldname], rowB.entity._cell[fieldname]);
				} else {
					break;
				}
			}

			return result;
		};

		return cmpFunction;
	};

	/**
	 * Called to sort a column which is a level of a dimension, without a hierarchy
	 * context. This is ie. used from the Facts view (where levels are sorted independently).
	 *
	 * This is called by UIGrid, since this method is used as `compareAlgorithm` for it.
	 *
	 * @returns A compare function.
	 */
	$scope.sortDimensionLevel = function(level) {
		var cmpFunction = function(a, b, rowA, rowB, direction) {
			var result = 0;
			var order_attribute = level.order_attribute();
			var fieldname = order_attribute.ref;
			if ((fieldname in rowA.entity._cell) && (fieldname in rowB.entity._cell)) {
				result = $scope.sortValues(rowA.entity._cell[fieldname], rowB.entity._cell[fieldname]);
			}
			return result;
		};
		return cmpFunction;
	};

	$scope.onResize = function() {
		$rootScope.$broadcast('ViewResize');
	};

	angular.element($window).on('resize', $scope.onResize);

	$scope.$on("$destroy", function() {
		angular.element($window).off('resize', $scope.onResize);
	});


}]).directive("cvViewCube", function() {
	return {
		restrict: 'A',
		templateUrl: 'views/cube/cube.html',
		scope: {
			view: "="
		},
		controller: "CubesViewerViewsCubeController",
		link: function(scope, iElement, iAttrs) {
			//console.debug(scope);
			scope.initCube();
		}
	};
});


Math.formatnumber = function(value, decimalPlaces, decimalSeparator, thousandsSeparator) {

	if (value === undefined) return "";

	if (decimalPlaces === undefined) decimalPlaces = 2;
	if (decimalSeparator === undefined) decimalSeparator = ".";
	if (thousandsSeparator === undefined) thousandsSeparator = " ";

	var result = "";


	var avalue = Math.abs(value);

	var intString = Math.floor(avalue).toString();
	for (var i = 0; i < intString.length; i++) {
		result = result + intString[i];
		var invPos = (intString.length - i - 1);
		if (invPos > 0 && invPos % 3 == 0) result = result + thousandsSeparator;
	}
	if (decimalPlaces > 0) {
		result = result + parseFloat(avalue - Math.floor(avalue)).toFixed(decimalPlaces).toString().replace(".", decimalSeparator).substring(1);
	}

	if (value < 0) result = "-" + result;

	return result;
};

