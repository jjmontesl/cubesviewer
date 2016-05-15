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


// Main CubesViewer angular module
angular.module('cv', ['ui.bootstrap', 'bootstrapSubmenu',
                      'ui.grid', 'ui.grid.resizeColumns', 'ui.grid.selection', 'ui.grid.autoResize',
                      'ui.grid.pagination', 'ui.grid.pinning', /*'ui.grid.exporter',*/
                      'ngCookies',
                      'cv.cubes', 'cv.views', 'cv.studio']);

// Configure moment.js
/*
angular.module('cv').constant('angularMomentConfig', {
	// preprocess: 'unix', // optional
	// timezone: 'Europe/London' // optional
});
*/

angular.module('cv').run([ '$timeout', 'cvOptions', 'cubesService', 'cubesCacheService', /* 'editableOptions', 'editableThemes', */
                           function($timeout, cvOptions, cubesService, cubesCacheService /*, editableOptions, editableThemes */) {

	//console.debug("Bootstrapping CubesViewer.");

    var defaultOptions = {

    		cubesUrl : null,
            //cubesLang : null,
    		jsonRequestType: "json", // "json | jsonp"

    		pagingOptions: [15, 30, 100, 250],

            cacheEnabled: true,
            cacheDuration: 30 * 60,
            cacheNotice: 10 * 60,
            cacheSize: 32,

			datepickerShowWeeks: true,
		    datepickerFirstDay: 1,  // Starting day of the week from 0-6 (0=Sunday, ..., 6=Saturday).

            undoEnabled: true,
            undoSize: 32,

            hideControls: false,

            gaTrackEvents: false
    };

	$.extend(defaultOptions, cvOptions);
	$.extend(cvOptions, defaultOptions);

	// Avoid square brackets in serialized array params
	// TODO: Shall be done for $http instead?
	/*
	$.ajaxSetup({
		traditional : true
	});
	*/

	// XEditable bootstrap3 theme. Can be also 'bs2', 'default'
	/*
	editableThemes.bs3.inputClass = 'input-sm';
	editableThemes.bs3.buttonsClass = 'btn-sm';
	editableOptions.theme = 'bs3';
	*/

	// Initialize cache service
	cubesCacheService.initialize();

	// Initialize Cubes service
	cubesService.connect();

}]);


// Cubesviewer Javascript entry point
var cubesviewer = {

	// CubesViewer version
	version: "2.0.1-devel",

	// View states, also used for cubesserver service state.
	VIEW_STATE_INITIALIZING: 1,
	VIEW_STATE_INITIALIZED: 2,
	VIEW_STATE_ERROR: 3,

	_configure: function(options) {
		$('.cv-version').html(cubesviewer.version);
		angular.module('cv').constant('cvOptions', options);
	},

	init: function(options) {

		this._configure(options);
		angular.element(document).ready(function() {
			angular.bootstrap(document, ['cv']);
		});
	},

	createView: function(container, type, viewData) {

		console.debug("Creating view: " + viewData);

		var $compile = angular.element(document).injector().get('$compile');
		var viewsService = angular.element(document).injector().get('viewsService');

		var view = viewsService.createView("cube", viewData);

		var viewDirective = '<div class="cv-bootstrap"><div cv-view-cube view="view"></div></div>';
		$(container).first().html(viewDirective);

		var scope = angular.element(document).scope();
		var templateScope = scope.$new();
		templateScope.view = view;

		//templateCtrl = $controller("CubesViewerStudioController", { $scope: templateScope } );
		//$(cvOptions.container).children().data('$ngControllerController', templateCtrl);

		$compile($(container).first().contents())(templateScope);

		return view;

	},

	apply: function(routine) {
		angular.element(document).scope().$apply(routine);
	}

	/*
	this.getView = function(id) {
	    var viewid = id.toString();
	    viewid = viewid.indexOf('view') === 0 ? viewid : 'view' + viewid;
	    viewid = viewid[0] === '#' ? viewid : '#' + viewid;

	    return $(viewid + ' .cv-gui-viewcontent').data('cubesviewer-view');
	  };
	*/

};



