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


angular.module('cv.studio', ['ui.bootstrap', 'cv', 'cv.studio' /*'ui.bootstrap-slider', 'ui.validate', 'ngAnimate', */
                             /*'angularMoment', 'smart-table', 'angular-confirm', 'debounce', 'xeditable',
                             'nvd3' */ ]);


angular.module('cv.studio').controller("CubesViewerStudioController", ['$rootScope', '$scope', 'cvOptions', 'cubesService',
                                                                       function ($rootScope, $scope, cvOptions, cubesService) {

	$scope.cvVersion = cubesviewer.version;
	$scope.cvOptions = cvOptions;
	$scope.cubesService = cubesService;

	// Current views array
	this.views = [];

	// View counter (used to assign different ids to each spawned view)
	this.lastViewId = 0;


	/**
	 * Closes a view.
	 */
	$scope.closeView = function(view) {
		for ( var i = 0; (i < this.views.length) && (this.views[i].id != view.id); i++) ;

		$('#' + view.id).remove();
		this.views.splice(i, 1);

		cubesviewer.views.destroyView (view);
	};

	/**
	 * Adds a new clean view for a cube
	 */
	$scope.addViewCube = function(cubename) {

		this.lastViewId++;
		var viewId = "view" + this.lastViewId;

		var container = this.createContainer(viewId);

		// Find cube name
		var cubeinfo = cubesviewer.cubesserver.cubeinfo (cubename);

		var view = this.cubesviewer.views.createView(viewId, $('.cv-gui-viewcontent', container), "cube", { "cubename": cubename, "name": "Cube " + cubeinfo.label });
		this.views.push (view);

		// Bind close button
		$(container).find('.cv-gui-closeview').click(function() {
			cubesviewer.gui.closeView(view);
			return false;
		});

		return view;

	};

	/*
	 * Adds a view given its params descriptor.
	 */
	$scope.addViewObject = function(data) {

		this.lastViewId++;
		var viewId = "view" + this.lastViewId;

		var container = this.createContainer(viewId);
		var view = this.cubesviewer.views.createView(viewId, $('.cv-gui-viewcontent', container), "cube", data);
		this.views.push (view);

		// Bind close button
		$(container).find('.cv-gui-closeview').click(function() {
			cubesviewer.gui.closeView(view);
			return false;
		});

		return view;

	};

	/*
	 * Creates a container for a view.
	 */
	this.createContainer = function(viewId) {

		// Configure collapsible
		/*
		$('#' + viewId + " .cv-gui-cubesview").accordion({
			collapsible : true,
			autoHeight : false
		});
		$('#' + viewId + " .cv-gui-viewcontent").css({
			"height": ""
		});
		$('#' + viewId + " .cv-gui-cubesview").on("accordionbeforeactivate", function (evt, ui) {
			if (cubesviewer.gui._sorting == true) {
				evt.preventDefault();
				evt.stopImmediatePropagation();
			}
		});
		*/

		return $('#' + viewId);
	};

	/*
	 * Updates view information in the container when a view is refreshed
	 */
	this.onViewDraw = function (event, view) {

		var container = $(view.container).parents('.cv-gui-cubesview');
		$('.cv-gui-container-name', container).empty().text(view.params.name);

		view.cubesviewer.gui.drawMenu(view);
	}

	/*
	 * Draw cube view menu
	 */
	this.drawMenu = function(view) {

		// Add panel menu options button
		$(view.container).find('.cv-view-toolbar').append(
			'<button class="panelbutton" title="Panel">Panel</button>'
		);

		$(view.container).find('.cv-view-viewmenu').append(
			'<ul class="cv-view-menu cv-view-menu-panel" style="float: right; width: 180px;"></ul>'
		);

		// Buttonize
		$(view.container).find('.panelbutton').button();


		var menu = $(".cv-view-menu-panel", $(view.container));
		menu.append(
			'<li><a class="cv-gui-cloneview" href="#"><span class="ui-icon ui-icon-copy"></span>Clone</a></li>' +
			'<li><a class="cv-gui-renameview" href="#"><span class="ui-icon ui-icon-pencil"></span>Rename...</a></li>' +
			'<div></div>' +
			'<li><a class="cv-gui-closeview" href="#"><span class="ui-icon ui-icon-close"></span>Close</a></li>'
		);

		// Menu functionality
		view.cubesviewer.views.cube._initMenu(view, '.panelbutton', '.cv-view-menu-panel');

		$(view.container).find('.cv-gui-closeview').unbind("click").click(function() {
			cubesviewer.gui.closeView(view);
			return false;
		});
		$(view.container).find('.cv-gui-renameview').unbind("click").click(function() {
			cubesviewer.gui.renameView(view);
			return false;
		});
		$('#' + view.id).find('.cv-gui-container-name').unbind("dblclick").dblclick(function() {
			cubesviewer.gui.renameView(view);
			return false;
		});
		$(view.container).find('.cv-gui-cloneview').unbind("click").click(function() {
			cubesviewer.gui.cloneView(view);
			return false;
		});


	}

	/*
	 * Renames a view (this is the user-defined label that is shown in the GUI header).
	 */
	this.renameView = function(view) {

		var newname = prompt("Enter new view name:", view.params.name);

		// TODO: Validate name

		if ((newname != null) && (newname != "")) {
			view.params.name = newname;
			cubesviewer.views.redrawView(view);
		}

	};

	/*
	 * Clones a view.
	 * This uses the serialization facility.
	 */
	this.cloneView = function(view) {

		viewobject = $.parseJSON(view.cubesviewer.views.serialize(view));
		viewobject.name = "Clone of " + viewobject.name;

		var view = this.addViewObject(viewobject);

		// TODO: These belong to plugins
		view.savedId = 0;
		view.owner = this.options.user;
		view.shared = false;

		this.cubesviewer.views.redrawView (view);
	};

	// Model Loaded Event (redraws cubes list)
	this.onCubesViewerInitialized = function() {
		cubesviewer.gui.drawCubesList();
	};


	this.drawCubesList = function() {

		// Add handlers for clicks
		$('.cv-gui-cubeslist-menu', $(cubesviewer.gui.options.container)).find('.cv-gui-addviewcube').click(function() {
			var view = cubesviewer.gui.addViewCube(  $(this).attr('data-cubename') );
			//view.cubesviewer.showAboutviews.redrawView (view);
			return false;
		});

		// Redraw views
		$(cubesviewer.gui.views).each(function(idx, view) {
			view.cubesviewer.views.redrawView(view);
		});

	};

	/*
	 * Render initial (constant) elements for the GUI
	 */
	this.onGuiDraw = function(event, gui) {

		$('[data-submenu]', gui.options.container).submenupicker();


		// Configure sortable panel
		/*
		$(gui.options.container).children('.cv-gui-workspace').sortable({
			placeholder : "ui-state-highlight",
			// containment: "parent",
			distance : 15,
			delay : 300,
			handle : ".sorthandle",

			start : function(evt, ui) {
				cubesviewer.gui._sorting = true;
			},
			stop : function(evt, ui) {
				setTimeout(function() {
					cubesviewer.gui._sorting = false;
				}, 200);

			}
		// forcePlaceholderSize: true,
		// forceHlperSize: true,
		});
		*/

	}

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
        showAbout: true
    };
	$.extend(defaultOptions, cvOptions);
	$.extend(cvOptions, defaultOptions);;

    // Get main template from template cache and compile it
	$http.get( "studio/main.html", { cache: $templateCache } ).then(function(response) {

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
