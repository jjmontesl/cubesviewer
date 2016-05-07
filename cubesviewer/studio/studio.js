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


angular.module('cv.studio', ['cv' /*'ui.bootstrap-slider', 'ui.validate', 'ngAnimate', */
                             /*'angularMoment', 'smart-table', 'angular-confirm', 'debounce', 'xeditable',
                             'nvd3' */ ]);

angular.module('cv.studio').service("studioViewsService", ['$rootScope', 'cvOptions', 'cubesService', 'viewsService',
                                                            function ($rootScope, cvOptions, cubesService, viewsService) {

	this.views = [];

	this.studioScope = null;

	viewsService.studioViewsService = this;

	/**
	 * Adds a new clean view for a cube
	 */
	this.addViewCube = function(cubename) {

		// Find cube name
		var cubeinfo = cubesService.cubesserver.cubeinfo(cubename);

		//var container = this.createContainer(viewId);
		//$('.cv-gui-viewcontent', container),

		var name = cubeinfo.label + " (" + (viewsService.lastViewId + 1) + ")";
		var view = viewsService.createView("cube", { "cubename": cubename, "name": name });
		this.views.push(view);

		return view;
	};

	/*
	 * Adds a view given its params descriptor.
	 */
	this.addViewObject = function(data) {

		var view = viewsService.createView("cube", data);
		this.views.push(view);

		return view;
	};

	/**
	 * Closes the panel of the given view.
	 */
	this.closeView = function(view) {
		var viewIndex = this.views.indexOf(view);
		if (viewIndex >= 0) {
			this.views.splice(viewIndex, 1);
		}
	};



	/**
	 * Collapses the panel of the given view.
	 */
	this.toggleCollapseView = function(view) {
		view.collapsed = !view.collapsed;
	};


}]);


/**
 * cvStudioView directive. Shows a Studio panel containing the corresponding view.
 */
angular.module('cv.studio').controller("CubesViewerStudioViewController", ['$rootScope', '$scope', 'cvOptions', 'cubesService', 'studioViewsService',
                                                     function ($rootScope, $scope, cvOptions, cubesService, studioViewsService) {

	$scope.studioViewsService = studioViewsService;

}]).directive("cvStudioView", function() {
	return {
		restrict: 'A',
		templateUrl: 'studio/panel.html',
		scope: {
			view: "="
		}

	};
});



angular.module('cv.studio').controller("CubesViewerStudioController", ['$rootScope', '$scope', '$uibModal', '$element', 'cvOptions', 'cubesService', 'studioViewsService', 'viewsService',
                                                                       function ($rootScope, $scope, $uibModal, $element, cvOptions, cubesService, studioViewsService, viewsService) {

	$scope.cvVersion = cubesviewer.version;
	$scope.cvOptions = cvOptions;
	$scope.cubesService = cubesService;
	$scope.studioViewsService = studioViewsService;

	$scope.studioViewsService.studioScope = $scope;


	$scope.showSerializeAdd = function() {

	    var modalInstance = $uibModal.open({
	    	animation: true,
	    	templateUrl: 'studio/serialize-add.html',
	    	controller: 'CubesViewerSerializeAddController',
	    	appendTo: angular.element($($element).find('.cv-gui-modals')[0]),
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

	$scope.showSerializeView = function(view) {

	    var modalInstance = $uibModal.open({
	    	animation: true,
	    	templateUrl: 'studio/serialize-view.html',
	    	controller: 'CubesViewerSerializeViewController',
	    	appendTo: angular.element($($element).find('.cv-gui-modals')[0]),
		    resolve: {
		        view: function () { return view; },
	    		element: function() { return $($element).find('.cv-gui-modals')[0] },
		    }
	    });

	    modalInstance.result.then(function (selectedItem) {
	    	//$scope.selected = selectedItem;
	    }, function () {
	        //console.debug('Modal dismissed at: ' + new Date());
	    });
	};

	/*
	 * Renames a view (this is the user-defined label that is shown in the GUI header).
	 */
	$scope.showRenameView = function(view) {

		var modalInstance = $uibModal.open({
	    	animation: true,
	    	templateUrl: 'studio/rename.html',
	    	controller: 'CubesViewerRenameController',
	    	appendTo: angular.element($($element).find('.cv-gui-modals')[0]),
	    	size: "sm",
		    resolve: {
		        view: function () { return view; },
	    		element: function() { return $($element).find('.cv-gui-modals')[0] },
		    }
	    });

	    modalInstance.result.then(function (selectedItem) {
	    	//$scope.selected = selectedItem;
	    }, function () {
	        //console.debug('Modal dismissed at: ' + new Date());
	    });

	};

	/*
	 * Clones a view.
	 * This uses the serialization facility.
	 */
	$scope.cloneView = function(view) {

		var viewObject = $.parseJSON(viewsService.serializeView(view));
		viewObject.name = "Clone of " + viewObject.name;

		var view = studioViewsService.addViewObject(viewObject);

		// TODO: These belong to plugins
		view.savedId = 0;
		view.owner = cvOptions.user;
		view.shared = false;
	};

	/**
	 * Toggles two column mode.
	 */
	$scope.toggleTwoColumn = function() {
		cvOptions.studioTwoColumn = ! cvOptions.studioTwoColumn;
	};

	/**
	 * Toggles two column mode.
	 */
	$scope.toggleHideControls = function() {
		cvOptions.studioHideControls = ! cvOptions.studioHideControls;
	};

}]);




angular.module('cv.studio').controller("CubesViewerRenameController", ['$rootScope', '$scope', '$uibModalInstance', 'cvOptions', 'cubesService', 'studioViewsService', 'view',
                                                                       function ($rootScope, $scope, $uibModalInstance, cvOptions, cubesService, studioViewsService, view) {

	$scope.cvVersion = cubesviewer.version;
	$scope.cvOptions = cvOptions;
	$scope.cubesService = cubesService;
	$scope.studioViewsService = studioViewsService;

	$scope.viewName = view.params.name;

	/*
	 * Add a serialized view.
	 */
	$scope.renameView = function(viewName) {

		// TODO: Validate name
		if ((viewName != null) && (viewName != "")) {
			view.params.name = viewName;
		}

		$uibModalInstance.close(view);
	};

	$scope.close = function() {
		$uibModalInstance.dismiss('cancel');
	};

}]);



// Disable Debug Info (for production)
angular.module('cv.studio').config([ '$compileProvider', function($compileProvider) {
	// TODO: Enable debug optionally
	// $compileProvider.debugInfoEnabled(false);
} ]);


angular.module('cv.studio').run(['$rootScope', '$compile', '$controller', '$http', '$templateCache', 'cvOptions',
           function($rootScope, $compile, $controller, $http, $templateCache, cvOptions) {

	console.debug("Bootstrapping CubesViewer Studio.");

    // Add default options
	var defaultOptions = {
        container: null,
        user: null,
        studioTwoColumn: false,
        studioHideControls: false
    };
	$.extend(defaultOptions, cvOptions);
	$.extend(cvOptions, defaultOptions);;

    // Get main template from template cache and compile it
	$http.get( "studio/studio.html", { cache: $templateCache } ).then(function(response) {

		var scope = angular.element(cvOptions.container).scope();

		var templateScope = scope.$new();
		$(cvOptions.container).html(response.data);

		//templateCtrl = $controller("CubesViewerStudioController", { $scope: templateScope } );
		//$(cvOptions.container).children().data('$ngControllerController', templateCtrl);

		$compile($(cvOptions.container).contents())(scope);
	});

}]);


/**
 * CubesViewer Studio entry point.
 */
cubesviewer.studio = {

	_configure: function(options) {
		cubesviewer._configure(options);
	},

	init: function(options) {
		this._configure(options);
   		angular.element(document).ready(function() {
   			angular.bootstrap(options.container, ['cv.studio']);
   		});
	}

};
