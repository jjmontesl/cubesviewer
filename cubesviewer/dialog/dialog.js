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

angular.module('cv.views').service("dialogService", ['$rootScope', '$uibModal', 'cvOptions', 'cubesService',
                                                    function ($rootScope, $uibModal, cvOptions, cubesService) {

	var dialogService = this;

	this.initialize = function() {
		$("body").append('<div class="cv-modals cv-bootstrap"></div>');
	};

	this.show = function(text) {

	    var modalInstance = $uibModal.open({
	    	animation: true,
	    	templateUrl: 'dialog/dialog.html',
	    	controller: 'CubesViewerViewsDialogController',
	    	appendTo: angular.element($("body").find('.cv-modals')[0]),
		    resolve: {
	    		dialog: function() { return { 'text': text }; }
		    },
	    	/*
		    size: size,
	    	 */
	    });

	    modalInstance.result.then(function (selectedItem) {
	    	//$scope.selected = selectedItem;
	    }, function () {
	        //console.debug('Modal dismissed at: ' + new Date());
	    });

	};

	this.initialize();

}]);


/**
 */
angular.module('cv.views').controller("CubesViewerViewsDialogController", ['$rootScope', '$scope', '$timeout', '$uibModalInstance', 'cvOptions', 'cubesService', 'viewsService', 'dialog',
                                                                           function ($rootScope, $scope, $timeout, $uibModalInstance, cvOptions, cubesService, viewsService, dialog) {

	$scope.$rootScope = $rootScope;

	$scope.dialog = dialog;

	$scope.close = function() {
		$uibModalInstance.dismiss('cancel');
	};


}]);

