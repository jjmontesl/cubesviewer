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



/**
 */
angular.module('cv.views.cube').controller("CubesViewerViewsCubeFilterDimensionController", ['$rootScope', '$scope', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, cvOptions, cubesService, viewsService) {

	$scope.parts = null;
	$scope.dimensionValues = null;
	$scope.loadingDimensionValues = false;

	$scope.initialize = function() {

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
			console.debug("Function");
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

	$scope._processData = function(data) {

		console.debug(data);

		// Get dimension
		var dimension = $scope.view.cube.cvdim_dim($scope.view.dimensionFilter);
		var dimensionValues = [];

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
				'value': drilldown_level_values.join (',')
			});

		});

		$scope.dimensionValues = dimensionValues;
		console.debug($scope.dimensionValues);
	};

	$scope.initialize();

}]);



/**5
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

		$(view.container).find(".cv-views-dimensionfilter-apply").button().click(function() {
			view.cubesviewer.views.cube.dimensionfilter.applyFilter( view, dimension );
		});
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

		$(view.container).find(".cv-views-dimensionfilter-drill").button().click(function() {
			cubesviewer.views.cube.explore.selectDrill(view, parts.fullDrilldownValue, "1");
			return false;
		});

		// Obtain data


	};



	/*
	 * Shows the dimension filter
	 */
	this.drawDimensionValues = function (view, tdimension, data) {

		$(view.container).find(".cv-view-dimensionfilter-list").empty();


		// Update selected
		view.cubesviewer.views.cube.dimensionfilter.updateFromCut(view, tdimension);

	};

	/*
	 * Searches labels by string and filters from view.
	 */
	this.searchDimensionValues = function(view, search) {

		$(view.container).find(".cv-view-dimensionfilter-list").find("input").each (function (idx, e) {
			if ((search == "") || ($(e).parent().text().toLowerCase().indexOf(search.toLowerCase()) >= 0)) {
				$(e).parents('.cv-view-dimensionfilter-item').first().show();
			} else {
				$(e).parents('.cv-view-dimensionfilter-item').first().hide();
			}
		} );

	};

	/*
	 * Updates selection after loading data.
	 */
	this.updateFromCut = function(view, dimensionString) {

		var parts = view.cube.cvdim_parts(dimensionString);
		var cutDimension = parts.dimension.name + ( parts.hierarchy.name != "default" ? "@" + parts.hierarchy.name : "" );

		var invert = false;
		var filterValues = [];
		for (var i = 0; i < view.params.cuts.length ; i++) {
			if (view.params.cuts[i].dimension == cutDimension) {
				invert = view.params.cuts[i].invert;
				filterValues = view.params.cuts[i].value.split(";");
				break;
			}
		}

		if (invert) {
			$(view.container).find(".cv-view-dimensionfilter-cont .invert-cut").attr("checked", "checked");
		}

		if (filterValues.length > 0) {
			$(view.container).find(".cv-view-dimensionfilter-list").find("input").each (function (idx, e) {
				for (var i = 0; i < filterValues.length; i++) {
					if ($(e).attr("value") == filterValues[i]) {
						$(e).attr("checked", "checked");
					}
				}
			} );
		}

	};

	/*
	 * Updates info after loading data.
	 */
	this.applyFilter = function(view, dimensionString) {

		var parts = view.cube.cvdim_parts(dimensionString);

		var checked = $(view.container).find(".cv-view-dimensionfilter-list").find("input:checked");

		// Empty selection would yield no result
		/*
		if (checked.size() == 0) {
			view.cubesviewer.alert('Cannot filter. No values are selected.');
			return;
		}
		*/

		var filterValues = [];
		// If all values are selected, the filter is empty and therefore removed by selectCut
		if (checked.size() < $(view.container).find(".cv-view-dimensionfilter-list").find("input").size()) {
			$(view.container).find(".cv-view-dimensionfilter-list").find("input:checked").each(function (idx, e) {
				filterValues.push( $(e).attr("value") );
			});
		}

		var invert = $(view.container).find(".cv-view-dimensionfilter .invert-cut").is(":checked");

		var cutDimension = parts.dimension.name + ( parts.hierarchy.name != "default" ? "@" + parts.hierarchy.name : "" );
		cubesviewer.views.cube.explore.selectCut(view, cutDimension, filterValues.join(";"), invert);

	};

}

