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
 * CubesViewer namespace.
 *
 * @namespace cv
 */

// Main CubesViewer angular module
angular.module('cv', ['ui.bootstrap', 'bootstrapSubmenu',
                      'ui.grid', 'ui.grid.resizeColumns', 'ui.grid.selection', 'ui.grid.autoResize',
                      'ui.grid.pagination', 'ui.grid.pinning', /*'ui.grid.exporter',*/
                      'ngCookies',
                      'cv.cubes', 'cv.views']);

// Configure moment.js
/*
angular.module('cv').constant('angularMomentConfig', {
	// preprocess: 'unix', // optional
	// timezone: 'Europe/London' // optional
});
*/

/*
 * Configures cv application (cvOptions, log provider...).
 */
angular.module('cv').config([ '$logProvider', 'cvOptions', /* 'editableOptions', 'editableThemes', */
                           function($logProvider, cvOptions /*, editableOptions, editableThemes */) {

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

            seriesOperationsEnabled: false,

        	hideControls: false,

            gaTrackEvents: false,

            geoMapLayers: {
            	"world-osm": { label: "OpenStreetMap", source: "xyz", opacity: 1.0, attribution: "&copy; OpenStreetMap contributors", params: { url: 'http://tile.openstreetmap.org/{z}/{x}/{y}.png' } },
            	"world-continents": { label: "World Continents", source: "geojson", opacity: 0.7, attribution: "&copy; Resolve attribution", params: { url: 'maps/world-continents.geo.json' } },
            	"world-countries": { label: "World Countries", source: "geojson", opacity: 0.7, attribution: "&copy; Resolve attribution", params: { url: 'maps/world-palestine.geo.json' } },
            	"spain-ign-ortho": { label: "Spain IGN Orthophotos", source: "wmts", opacity: 1.0, attribution: "IGN Spain", params: { url: 'http://www.ign.es/wmts/pnoa-ma?service=WMTS', layer: 'OI.OrthoimageCoverage' } }
            },

            debug: false
    };

	$.extend(defaultOptions, cvOptions);
	$.extend(cvOptions, defaultOptions);

	$logProvider.debugEnabled(cvOptions.debug);

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

}]);

/*
 *
 */
angular.module('cv').run([ '$timeout', '$log', 'cvOptions', 'cubesService', 'cubesCacheService', /* 'editableOptions', 'editableThemes', */
	                           function($timeout, $log, cvOptions, cubesService, cubesCacheService /*, editableOptions, editableThemes */) {

	$log.debug("CubesViewer debug mode is enabled.");

	// Initialize cache service
	cubesCacheService.initialize();

	// Initialize Cubes service
	cubesService.connect();

}]);


/**
 * CubesViewer class, used to initialize CubesViewer and
 * create views. Note that the initialization method varies depending
 * on whether your application uses Angular 1.x or not.
 *
 * An instance of this class is available as the global `cubesviewer`
 * variable. This class must not be instantiated.
 *
 * @class
 */
function CubesViewer() {

	// CubesViewer version
	this.version = "2.0.3-devel";

	/**
	 * State of a view that has not yet been fully initialized, and cannot be interacted with.
	 * @const
	 */
	this.VIEW_STATE_INITIALIZING = 1;

	/**
	 * State of a view that has been correctly initialized.
	 * @const
	 */
	this.VIEW_STATE_INITIALIZED = 2;

	/**
	 * State of a view that has failed initialization, and cannot be used.
	 * @const
	 */
	this.VIEW_STATE_ERROR = 3;


	this._configure = function(options) {
		$('.cv-version').html(cubesviewer.version);
		angular.module('cv').constant('cvOptions', options);
	};

	/**
	 * Initializes CubesViewer system.
	 *
	 * If you are using CubesViewer in an Angular application, you don't
	 * need to call this method. Instead, use your application Angular `config`
	 * block to initialize the cvOptions constant with your settings,
	 * and add the 'cv' module as a dependency to your application.
	 */
	this.init = function(options) {

		this._configure(options);
		angular.element(document).ready(function() {
			angular.bootstrap(document, ['cv']);
		});
	};

	/**
	 * Creates a CubesViewer view object and interface, and attaches it
	 * to the specified DOM element.
	 *
	 * If you are embedding CubesViewer in an Angular application, you can
	 * avoid this method and use the {@link viewsService} and the
	 * {@link cvViewCube} directive instead.
	 *
	 * @param container A selector, jQuery object or DOM element where the view will be attached.
	 * @param type View type (currently only "cube" is available).
	 * @param viewData An object or JSON string with the view parameters.
	 * @returns The created view object.
	 */
	this.createView = function(container, type, viewData) {

		//console.debug("Creating view: " + viewData);

		var $compile = angular.element(document).injector().get('$compile');
		var viewsService = angular.element(document).injector().get('viewsService');

		var view = viewsService.createView("cube", viewData);

		var viewDirective = '<div class="cv-bootstrap"><div cv-view-cube view="view"></div></div>';
		$(container).first().html(viewDirective);

		var scope = angular.element(document).scope().$root;
		var templateScope = scope.$new();
		templateScope.view = view;

		//templateCtrl = $controller("CubesViewerStudioController", { $scope: templateScope } );
		//$(cvOptions.container).children().data('$ngControllerController', templateCtrl);

		$compile($(container).first().contents())(templateScope);

		return view;

	};

	/**
	 * Performs changes within CubesViewer scope. If are not using CubesViewer from
	 * Angular, you need to wrap all your CubesViewer client code within this
	 * method in order for changes to be observed.
	 *
	 * @param routine Function that will be executed within CubesViewer Angular context.
	 */
	this.apply = function(routine) {
		if (! angular.element(document).scope()) {
			console.debug("Delaying");
			setTimeout(function() { cubesviewer.apply(routine); }, 1000);
		} else {
			angular.element(document).scope().$apply(routine);
		}
	};

};

/**
 * This is Cubesviewer main entry point. Please see {@link CubesViewer}
 * documentation for further information.
 *
 * @global
 */
var cubesviewer = new CubesViewer();

