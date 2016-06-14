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

angular.module('cv.views.cube').controller("CubesViewerViewsCubeFilterDimensionController", ['$rootScope', '$scope', '$filter', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, $filter, cvOptions, cubesService, viewsService) {

	$scope.parts = null;
	$scope.dimensionValues = null;
	$scope.loadingDimensionValues = false;

	$scope.searchString = "";
	$scope.selectedValues = null;
	$scope.filterInverted = null;
	$scope.filterShowAll = true;

	$scope.currentDataId = null;

	$scope.initialize = function() {

		// Check if current filter is inverted
		var view = $scope.view;
		var parts = view.cube.dimensionParts($scope.view.dimensionFilter);
		for (var i = 0; i < view.params.cuts.length ; i++) {
			if (view.params.cuts[i].dimension == parts.cutDimension) {
				$scope.filterInverted = view.params.cuts[i].invert;
				break;
			}
		}
	};

	$scope.$watch("view.dimensionFilter", function() {
		$scope.parts = $scope.view.cube.dimensionParts($scope.view.dimensionFilter);
		$scope.loadDimensionValues();
	});

	$scope.$on("ViewRefresh", function(view) {
		// FIXME: Update checkboxes, but do not reload.
		$scope.loadDimensionValues();
	});
	$scope.$watch("filterShowAll", function(view) {
		$scope.loadDimensionValues();
	});


	$scope.closeDimensionFilter = function() {
		$scope.view.dimensionFilter = null;
	};

	/*
	 * Load dimension values.
	 */
	$scope.loadDimensionValues = function() {

		var params = {
			"hierarchy": $scope.parts.hierarchy.name,
			"depth": $scope.parts.depth
		};

		//view.cubesviewer.views.blockViewLoading(view);

		if (! $scope.filterShowAll) {

			var parts = $scope.view.cube.dimensionParts($scope.view.dimensionFilter);
			var buildQueryCutsStrings = cubesService.buildQueryCutsStrings($scope.view);

			if (buildQueryCutsStrings.length > 0) {
				// Remove current dimension
				buildQueryCutsStrings = $.grep(buildQueryCutsStrings, function(cs) {
					return ((cs.indexOf(parts.dimension.name) != 0) && (cs.indexOf("!" + parts.dimension.name) != 0));
				});

				params["cut"] = buildQueryCutsStrings.join(cubes.CUT_STRING_SEPARATOR_CHAR);
			}

		};

		var path = "/cube/" + $scope.view.cube.name + "/members/" + $scope.parts.dimension.name;
		var dataId = path + "?" + $.param(params);
		if ($scope.currentDataId == dataId) { return; }
		$scope.currentDataId = dataId;

		var tdimension = $scope.view.dimensionFilter;
		$scope.loadingDimensionValues = true;
		var jqxhr = cubesService.cubesRequest(
                // Doc says it's dimension, not members
				path,
				params,
				$scope._loadDimensionValuesCallback(tdimension));
		jqxhr.always(function() {
			//unblockView
			$scope.loadingDimensionValues = false;
			$scope.$apply();
		});

	};

	/*
	 * Updates info after loading data.
	 */
	$scope._loadDimensionValuesCallback = function(dimension) {
		var dimension = dimension;
		return function(data, status) {
			if ($scope.view.dimensionFilter == dimension) $scope._processDimensionValuesData(data);
		};
	};

	$scope.filterDimensionValue = function(searchString) {
		return function(item) {
			var lowerCaseSearch = searchString.toLowerCase();
			return ((searchString == "") || (item.label.toLowerCase().indexOf(lowerCaseSearch) >= 0));
		};
	};

	$scope.selectAll = function() {
		var filter = $scope.filterDimensionValue($scope.searchString);
		$($scope.dimensionValues).each(function(idx, val) {
			if (filter(val)) val.selected = true;
		});
	};

	$scope.selectNone = function() {
		var filter = $scope.filterDimensionValue($scope.searchString);
		$($scope.dimensionValues).each(function(idx, val) {
			if (filter(val)) val.selected = false;
		});
	};

	$scope._processDimensionValuesData = function(data) {

		// Get dimension
		var view = $scope.view;
		var dimension = $scope.view.cube.cvdim_dim($scope.view.dimensionFilter);
		var dimensionValues = [];

		var parts = view.cube.dimensionParts($scope.view.dimensionFilter);
		//var cutDimension = parts.dimension.name + ( parts.hierarchy.name != "default" ? "@" + parts.hierarchy.name : "" );

		var filterValues = [];
		for (var i = 0; i < view.params.cuts.length ; i++) {
			if (view.params.cuts[i].dimension == view.cube.dimensionParts($scope.view.dimensionFilter).cutDimension) {
				$scope.filterInverted = view.params.cuts[i].invert;
				filterValues = view.params.cuts[i].value.split(";");
				break;
			}
		}

		$(data.data).each( function(idx, e) {

			// Get dimension
			var parts = $scope.view.cube.dimensionParts($scope.view.dimensionFilter);
			var infos = parts.hierarchy.readCell(e, parts.level);

			// Values and Labels
			var drilldownLevelValues = [];
			var drilldownLevelLabels = [];

			$(infos).each(function(idx, info) {
				drilldownLevelValues.push(info.key);
				drilldownLevelLabels.push(info.label);
			});

			dimensionValues.push({
				'label': drilldownLevelLabels.join(' / '),
				'value': drilldownLevelValues.join (','),
				'selected': filterValues.indexOf(drilldownLevelValues.join (',')) >= 0
			});

		});

		$scope.dimensionValues = dimensionValues;
		$scope.$apply();
	};

	/*
	 * Updates info after loading data.
	 */
	$scope.applyFilter = function() {

		var view = $scope.view;

		var filterValues = [];
		$($scope.dimensionValues).each(function(idx, val) {
			if (val.selected) filterValues.push(val.value);
		});

		// If all values are selected, the filter is empty and therefore removed by selectCut
		if (filterValues.length >= $scope.dimensionValues.length) filterValues = [];

		// Cut dimension
		var cutDimension = $scope.parts.dimension.name + ( $scope.parts.hierarchy.name != "default" ? "@" + $scope.parts.hierarchy.name : "" ) + ':' + $scope.parts.level.name;
		$scope.selectCut(cutDimension, filterValues.join(";"), $scope.filterInverted);

	};


	$scope.initialize();

}]);

