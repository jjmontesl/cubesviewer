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
 * View serialization inteface. This is an optional component.
 * Provides visual assistance for serializing views and instancing of views from
 * serialized data. Note that only the view parameters are serialized,
 * but not data. The Cubes Server still needs to be available to serve data.
 * This serialized strings can also be used to initialize different views from code,
 * which is handy when these are going to be instantiated from code later on
 * (ie. when embedding views on a web site).
 */
angular.module('cv.studio').controller("CubesViewerSerializeViewController", ['$rootScope', '$scope', '$timeout', '$uibModalInstance', 'element', 'cvOptions', 'cubesService', 'studioViewsService', 'viewsService', 'view',
                                                                             function ($rootScope, $scope, $timeout, $uibModalInstance, element, cvOptions, cubesService, studioViewsService, viewsService, view) {

	$scope.cvVersion = cubesviewer.version;
	$scope.cvOptions = cvOptions;
	$scope.cubesService = cubesService;
	$scope.studioViewsService = studioViewsService;

	$scope.serializedView = "";

	$scope.initialize = function() {

		$scope.serializedView  = viewsService.serializeView(view);
		console.log("Serialized view: " + $scope.serializedView);

		$timeout(function() {
			window.getSelection().removeAllRanges();
			var range = document.createRange();
			range.selectNodeContents($(element).find(".cv-serialized-view")[0]);
			window.getSelection().addRange(range);
		} , 0);

	};

	$scope.close = function() {
		$uibModalInstance.dismiss('cancel');
	};

	$scope.initialize();

}]);


angular.module('cv.studio').controller("CubesViewerSerializeAddController", ['$rootScope', '$scope', '$uibModalInstance', 'cvOptions', 'cubesService', 'studioViewsService',
                                                                             function ($rootScope, $scope, $uibModalInstance, cvOptions, cubesService, studioViewsService) {

	$scope.cvVersion = cubesviewer.version;
	$scope.cvOptions = cvOptions;
	$scope.cubesService = cubesService;
	$scope.studioViewsService = studioViewsService;

	$scope.serializedView = null;

	/*
	 * Add a serialized view.
	 */
	$scope.addSerializedView = function (serialized) {
		if (serialized != null) {
			var view = studioViewsService.addViewObject(serialized);
		}
		$uibModalInstance.close(serialized);
	};

	$scope.close = function() {
		$uibModalInstance.dismiss('cancel');
	};

}]);



