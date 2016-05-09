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
angular.module('cv.views.cube').controller("CubesViewerViewsCubeFilterDimensionController", ['$rootScope', '$scope', '$filter', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, $filter, cvOptions, cubesService, viewsService) {

	$scope.parts = null;
	$scope.dimensionValues = null;
	$scope.loadingDimensionValues = false;

	$scope.searchString = "";
	$scope.selectedValues = null;
	$scope.filterInverted = null;

	$scope.initialize = function() {

		// Check if current filter is inverted
		var view = $scope.view;
		var parts = view.cube.cvdim_parts($scope.view.dimensionFilter);
		var cutDimension = parts.dimension.name + ( parts.hierarchy.name != "default" ? "@" + parts.hierarchy.name : "" );
		for (var i = 0; i < view.params.cuts.length ; i++) {
			if (view.params.cuts[i].dimension == cutDimension) {
				$scope.filterInverted = view.params.cuts[i].invert;
				break;
			}
		}
	};

	$scope.$watch("view.dimensionFilter", function() {
		$scope.parts = $scope.view.cube.cvdim_parts($scope.view.dimensionFilter);
		$scope.loadDimensionValues();
	});

	$scope.closeDimensionFilter = function() {
		$scope.view.dimensionFilter = null;
	};

	/**
	 * Load dimension values.
	 */
	$scope.loadDimensionValues = function() {

		var params = {
				"hierarchy": $scope.parts.hierarchy.name,
				"depth": $scope.parts.depth
		};

		//view.cubesviewer.views.blockViewLoading(view);

		var tdimension = $scope.view.dimensionFilter;
		$scope.loadingDimensionValues = true;
		jqxhr = cubesService.cubesRequest(
                // Doc says it's dimension, not members
				"/cube/" + $scope.view.cube.name + "/members/" + $scope.parts.dimension.name,
				params,
				$scope._loadDimensionValuesCallback(tdimension));
		jqxhr.always(function() {
			//unblockView
			$scope.loadingDimensionValues = false;
			$scope.$apply();
		});

	};

	/**
	 * Updates info after loading data.
	 */
	$scope._loadDimensionValuesCallback = function(dimension) {
		var dimension = dimension;
		return function(data, status) {
			if ($scope.view.dimensionFilter == dimension) $scope._processData(data);
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

	$scope._processData = function(data) {

		// Get dimension
		var view = $scope.view;
		var dimension = $scope.view.cube.cvdim_dim($scope.view.dimensionFilter);
		var dimensionValues = [];

		var parts = view.cube.cvdim_parts($scope.view.dimensionFilter);
		var cutDimension = parts.dimension.name + ( parts.hierarchy.name != "default" ? "@" + parts.hierarchy.name : "" );
		var filterValues = [];
		for (var i = 0; i < view.params.cuts.length ; i++) {
			if (view.params.cuts[i].dimension == cutDimension) {
				$scope.filterInverted = view.params.cuts[i].invert;
				filterValues = view.params.cuts[i].value.split(";");
				break;
			}
		}

		$(data.data).each( function(idx, e) {

			// Get dimension
			var parts = $scope.view.cube.cvdim_parts($scope.view.dimensionFilter);
			var infos = parts.hierarchy.readCell(e, parts.level);

			// Values and Labels
			var drilldown_level_values = [];
			var drilldown_level_labels = [];

			$(infos).each(function(idx, info) {
				drilldown_level_values.push (info.key);
				drilldown_level_labels.push (info.label);
			});

			dimensionValues.push({
				'label': drilldown_level_labels.join(' / '),
				'value': drilldown_level_values.join (','),
				'selected': filterValues.indexOf(drilldown_level_values.join (',')) >= 0
			});

		});

		$scope.dimensionValues = dimensionValues;
		$scope.$apply();
	};

	/*
	 * Updates info after loading data.
	 */
	$scope.applyFilter = function(view, dimensionString) {

		var view = $scope.view;
		var dimensionString = $scope.view.dimensionFilter;

		var filterValues = [];
		$($scope.dimensionValues).each(function(idx, val) {
			if (val.selected) filterValues.push(val.value);
		});

		// If all values are selected, the filter is empty and therefore removed by selectCut
		if (filterValues.length >= $scope.dimensionValues.length) filterValues = [];

		// Cut dimension
		var cutDimension = $scope.parts.dimension.name + ( $scope.parts.hierarchy.name != "default" ? "@" + $scope.parts.hierarchy.name : "" );
		$scope.selectCut(cutDimension, filterValues.join(";"), $scope.filterInverted);

	};


	$scope.initialize();

}]);



/**
 * Adds support for filter dialogs for dimensions. Note that
 * filtering support is available from other plugins. Default filtering
 * features are included in the normal explore view (user
 * can select values after drilling down). This plugin adds
 * more flexibility.
 */
function cubesviewerViewCubeDimensionFilter () {


	/*
	 * Shows the dimension filter
	 */
	this.drawDimensionFilter = function (view, dimension) {

		var parts = view.cube.cvdim_parts(dimension);

		// Draw value container

		$(view.container).find(".cv-views-dimensionfilter-cancel").button().click(function() {
			view.dimensionFilter = null;
			$(view.container).find('.cv-view-dimensionfilter').remove();
		});

		$(view.container).find("#cv-views-dimensionfilter-cols-" + view.id).buttonset();
		$(view.container).find("#cv-views-dimensionfilter-col1-" + view.id).click(function() {
			view.cubesviewer.views.cube.dimensionfilter.drawDimensionValuesCols( view, 1 );
		});
		$(view.container).find("#cv-views-dimensionfilter-col2-" + view.id).click(function() {
			view.cubesviewer.views.cube.dimensionfilter.drawDimensionValuesCols( view, 2 );
		});

		$(view.container).find(".cv-views-dimensionfilter-selectall").button().click(function() {
			// Clear previous selected items before applying new clicks
			$(view.container).find(".cv-view-dimensionfilter-list").find(":checkbox").filter(":checked").trigger('click');
			$(view.container).find(".cv-view-dimensionfilter-list").find(":checkbox:visible").trigger('click');
		});
		$(view.container).find(".cv-views-dimensionfilter-selectnone").button().click(function() {
			$(view.container).find(".cv-view-dimensionfilter-list").find(":checkbox").filter(":checked").trigger('click');
		});


	};


}

