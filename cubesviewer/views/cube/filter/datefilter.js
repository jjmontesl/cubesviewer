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
 * Adds support for datefilters.
 *
 * This module requires that the model is configured
 * to declare which dimensions may use a datefilter,
 * and which fields of the dimension correspond to
 * calendar fields (year, quarter, month, day, week...).
 * (see integrator documentation for more information).
 *
 */

"use strict";

angular.module('cv.views.cube').filter("datefilterMode", ['$rootScope', 'cvOptions',
                                                          function ($rootScope, cvOptions) {
	return function(val) {
		var text = "None";
		switch (val) {
			case "custom": text = "Custom"; break;
			case "auto-last1m": text = "Last month"; break;
			case "auto-last3m": text = "Last 3 months"; break;
			case "auto-last6m": text = "Last 6 months"; break;
			case "auto-last12m": text = "Last year"; break;
			case "auto-last24m": text = "Last 2 years"; break;
			case "auto-january1st": text = "From January 1st"; break;
			case "auto-yesterday": text = "Yesterday"; break;
		}
		return text;
	};
}]);

angular.module('cv.views.cube').controller("CubesViewerViewsCubeFilterDateController", ['$rootScope', '$scope', '$filter', 'cvOptions', 'cubesService', 'viewsService',
                                                                                        function ($rootScope, $scope, $filter, cvOptions, cubesService, viewsService) {
	$scope.initialize = function() {
		$scope.dateStart.value = $scope.datefilter.date_from ? new Date($scope.datefilter.date_from) : null;
		$scope.dateEnd.value = $scope.datefilter.date_to ? new Date($scope.datefilter.date_to) : null;
	};

	$scope.dateStart = {
		opened: false,
		value: null,
		options: {
			//dateDisabled: disabled,
	    	formatYear: 'yyyy',
	    	//maxDate: new Date(2020, 12, 31),
	    	//minDate: new Date(1970, 1, 1),
	    	startingDay: cvOptions.datepickerFirstDay,
	    	showWeeks: cvOptions.datepickerShowWeeks
	    }
	};
	$scope.dateEnd = {
		opened: false,
		value: null,
		options: {
			//dateDisabled: disabled,
	    	formatYear: 'yyyy',
	    	//maxDate: new Date(2020, 12, 31),
	    	//minDate: new Date(1970, 1, 1),
	    	startingDay: cvOptions.datepickerFirstDay,
	    	showWeeks: cvOptions.datepickerShowWeeks
	    }
	};

	$scope.dateStartOpen = function() {
		$scope.dateStart.opened = true;
	}
	$scope.dateEndOpen = function() {
		$scope.dateEnd.opened = true;
	}

	$scope.setMode = function(mode) {
		$scope.datefilter.mode = mode;
	};

	$scope.updateDateFilter = function() {
		$scope.datefilter.date_from = $scope.dateStart.value ? $filter('date')($scope.dateStart.value, "yyyy-MM-dd") : null;
		$scope.datefilter.date_to = $scope.dateEnd.value? $filter('date')($scope.dateEnd.value, "yyyy-MM-dd") : null;
		$scope.refreshView();
	}

	$scope.$watch("dateStart.value", $scope.updateDateFilter);
	$scope.$watch("dateEnd.value", $scope.updateDateFilter);
	$scope.$watch("datefilter.mode", $scope.updateDateFilter);

	$scope.initialize();

}]);


