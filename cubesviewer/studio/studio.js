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
 * CubesViewer Studio module. CubesViewer Studio is the (optional) interface that
 * provides a full visualization environment allowing users to create and
 * interact with cubes and views.
 *
 * See the CubesViewer Studio demo at `html/studio.html` in the package.
 *
 * @namespace cv.studio
 */
angular.module('cv.studio', ['cv' /*'ui.bootstrap-slider', 'ui.validate', 'ngAnimate', */
                             /*'angularMoment', 'smart-table', 'angular-confirm', 'debounce', 'xeditable',
                             'nvd3' */ ]);

/**
 * This service manages the panels and views of the CubesViewer Studio interface.
 * Provides methods to create, remove and collapse view panels which are rendered
 * within the CubesViewer Studio user interface.
 *
 * @class studioViewsService
 * @memberof cv.studio
 */
angular.module('cv.studio').service("studioViewsService", ['$rootScope', '$anchorScroll', '$timeout', 'cvOptions', 'cubesService', 'viewsService', 'dialogService',
                                                            function ($rootScope, $anchorScroll, $timeout, cvOptions, cubesService, viewsService, dialogService) {

	this.views = [];

	this.studioScope = null;

	viewsService.studioViewsService = this;
	cubesviewerStudio.studioViewsService = this;

	/**
	 * Adds a new clean view of type "cube" given a cube name.
	 *
	 * @memberof cv.studio.studioViewsService
	 * @returns The created view object.
	 */
	this.addViewCube = function(cubename) {

		// Find cube name
		var cubeinfo = cubesService.cubesserver.cubeinfo(cubename);

		//var container = this.createContainer(viewId);
		//$('.cv-gui-viewcontent', container),

		var name = cubeinfo.label + " (" + (viewsService.lastViewId + 1) + ")";
		var view = viewsService.createView("cube", { "cubename": cubename, "name": name });
		this.views.push(view);

		$timeout(function() {
			$('.cv-views-container').masonry('appended', $('.cv-views-container').find(".sv" + view.id).show());
			//$('.cv-views-container').masonry('reloadItems');
			//$('.cv-views-container').masonry('layout');
			$timeout(function() { $anchorScroll("cvView" + view.id); }, 500);
		}, 0);

		return view;
	};

	/**
	 * Adds a view given its parameters descriptor either as an object or as
	 * a JSON string.
	 *
	 * @memberof cv.studio.studioViewsService
	 * @returns The created view object.
	 */
	this.addViewObject = function(data) {

		// Check at least JSON is valid to avoid creating an unusable view from Studio
		if (typeof data == "string") {
			try {
				$.parseJSON(data);
			} catch (err) {
				dialogService.show('Could not process serialized data: JSON parse error.')
				return;
			}
		}

		var view = viewsService.createView("cube", data);
		this.views.push(view);

		$timeout(function() {
			$('.cv-views-container').masonry('appended', $('.cv-views-container').find(".sv" + view.id).show());
			//$('.cv-views-container').masonry('reloadItems');
			//$('.cv-views-container').masonry('layout');
			$timeout(function() { $anchorScroll("cvView" + view.id); }, 500);
		}, 0);

		return view;
	};

	/**
	 * Closes the panel of the given view.
	 *
	 * @memberof cv.studio.studioViewsService
	 */
	this.closeView = function(view) {
		var viewIndex = this.views.indexOf(view);
		if (viewIndex >= 0) {
			$('.cv-views-container').masonry('remove', $('.cv-views-container').find(".sv" + view.id));
			this.views.splice(viewIndex, 1);
			//$('.cv-views-container').masonry('reloadItems');
			$('.cv-views-container').masonry('layout');
		}

	};

	/**
	 * Collapses the panel of the given view.
	 *
	 * @memberof cv.studio.studioViewsService
	 */
	this.toggleCollapseView = function(view) {
		view.collapsed = !view.collapsed;
		$timeout(function() {
			$('.cv-views-container').masonry('layout');
		}, 100);
	};


}]);


/**
 * cvStudioView directive. Shows a Studio panel containing the corresponding view.
 */
angular.module('cv.studio').controller("CubesViewerStudioViewController", ['$rootScope', '$scope', 'cvOptions', 'cubesService', 'studioViewsService', 'reststoreService',
                                                     function ($rootScope, $scope, cvOptions, cubesService, studioViewsService, reststoreService) {

	$scope.cubesService = cubesService;
	$scope.studioViewsService = studioViewsService;
	$scope.cvOptions = cvOptions;
	$scope.reststoreService = reststoreService;

	$scope.$watch('__height', function() {
		$('.cv-views-container').masonry('layout');
	});

}]).directive("cvStudioView", function() {
	return {
		restrict: 'A',
		templateUrl: 'studio/panel.html',
		scope: {
			view: "="
		},
        link: function( scope, elem, attrs ) {

            scope.$watch( function() {
                scope.__height = elem.height();
            } );

        }

	};
});



angular.module('cv.studio').controller("CubesViewerStudioController", ['$rootScope', '$scope', '$uibModal', '$element', '$timeout', 'cvOptions', 'cubesService', 'studioViewsService', 'viewsService', 'reststoreService',
                                                                       function ($rootScope, $scope, $uibModal, $element, $timeout, cvOptions, cubesService, studioViewsService, viewsService, reststoreService) {

	$scope.cvVersion = cubesviewer.version;
	$scope.cvOptions = cvOptions;
	$scope.cubesService = cubesService;
	$scope.studioViewsService = studioViewsService;
	$scope.reststoreService = reststoreService;

	$scope.studioViewsService.studioScope = $scope;

	$scope.initialize = function() {
	};

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
	    	size: "md",
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
		$timeout(function() {
			$('.cv-views-container').masonry('layout');
		}, 100);
	};

	/**
	 * Toggles two column mode.
	 */
	$scope.toggleHideControls = function() {
		cvOptions.hideControls = ! cvOptions.hideControls;
		$timeout(function() {
			$('.cv-views-container').masonry('layout');
		}, 100);
	};

	$scope.initialize();

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
        hideControls: false,

        backendUrl: null
    };
	$.extend(defaultOptions, cvOptions);
	$.extend(cvOptions, defaultOptions);;

    // Get main template from template cache and compile it
	$http.get("studio/studio.html", { cache: $templateCache } ).then(function(response) {

		//var scope = angular.element(document).scope();
		var templateScope = $rootScope.$new();
		$(cvOptions.container).html(response.data);

		//templateCtrl = $controller("CubesViewerStudioController", { $scope: templateScope } );
		//$(cvOptions.container).children().data('$ngControllerController', templateCtrl);

		$compile($(cvOptions.container).contents())(templateScope);
	});

}]);


/**
 * CubesViewer Studio global instance and entry point. Used to initialize
 * CubesViewer Studio.
 *
 * This class is available through the global cubesviewerStudio variable,
 * and must not be instantiated.
 *
 * If you are embedding views in a 3rd party site and you do not need
 * Studio features, use {@link CubesViewer} initialization method instead.
 *
 * Note that the initialization method varies depending
 * on whether your application uses Angular 1.x or not.
 *
 * @class
 */
function CubesViewerStudio() {

	this._configure = function(options) {
		cubesviewer._configure(options);
	};

	/**
	 * Initializes CubesViewer Studio.
	 *
	 * If you wish to embed CubesViewer Studio within an Angular application, you don't
	 * need to call this method. Instead, use your application Angular `config`
	 * block to initialize the cvOptions constant with your settings,
	 * and add the 'cv.studio' module as a dependency to your application.
	 *
	 * See the `cv-angular.html` example for further information.
	 */
	this.init = function(options) {
		this._configure(options);
   		angular.element(document).ready(function() {
   			angular.bootstrap(document, ['cv.studio']);
   		});
	};

}

/**
 * This is Cubesviewer Studio main entry point. Please see {@link CubesViewerStudio}
 * documentation for further information.
 *
 * @global
 */
var cubesviewerStudio = new CubesViewerStudio();

