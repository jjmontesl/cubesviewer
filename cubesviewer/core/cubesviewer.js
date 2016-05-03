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


"use strict";

/*
 * Main cubesviewer object. It is created by the library and made
 * available as the global "cubesviewer" variable.
 */
function cubesviewerOLD() {

	// Alerts component
	this._alerts = null;

	// Current alerts
	this.alerts = [];


	/*
	 * Show a global alert
	 */
	this.alert = function (message) {
		alert ("CubesViewer " + this.version + "\n\n" + message);
	}

	/*
	 * Refresh
	 */
	this.refresh = function() {
		$(document).trigger("cubesviewerRefresh");
	}

  /*
   * Save typing while debugging - get a view object with: cubesviewer.getView(1)
   */

  this.getView = function(id) {
    var viewid = id.toString();
    viewid = viewid.indexOf('view') === 0 ? viewid : 'view' + viewid;
    viewid = viewid[0] === '#' ? viewid : '#' + viewid;

    return $(viewid + ' .cv-gui-viewcontent').data('cubesviewer-view');
  };


	/*
	 * Change language for Cubes operations
	 * (locale must be one of the possible languages for the model).
	 */
	this.changeCubesLang = function(lang) {

		this.options.cubesLang = (lang == "" ? null : lang);

		// Reinitialize system
		this.refresh();

	};

	/*
	 * Show quick tip message.
	 */
	this.showInfoMessage = function(message, delay) {

		if (this._alerts == null) {

			this._alerts = new Ractive({
				el: $("body")[0],
				append: true,
				template: cvtemplates.alerts,
				partials: cvtemplates,
				data: { 'cv': this }
			});
		}

		if (delay == undefined) delay = 5000;

		this.alerts.push({ 'text': message });
		this._alerts.reset({ 'cv': this });

	};

};

// Main CubesViewer angular module
angular.module('cv', ['bootstrapSubmenu',
                      'ui.grid', 'ui.grid.resizeColumns', 'ui.grid.selection', 'ui.grid.autoResize',
                      'ui.grid.pagination', 'ui.grid.pinning',
                      'cv.cubes', 'cv.views']);

// Configure moment.js
angular.module('cv').constant('angularMomentConfig', {
	// preprocess: 'unix', // optional
	// timezone: 'Europe/London' // optional
});

angular.module('cv').run([ '$timeout', 'cvOptions', 'cubesService', /* 'editableOptions', 'editableThemes', */
                           function($timeout, cvOptions, cubesService /*, editableOptions, editableThemes */) {

	//console.debug("Bootstrapping CubesViewer.");

    var defaultOptions = {
            cubesUrl : null,
            cubesLang : null,
            pagingOptions: [15, 30, 100, 250],
            datepickerShowWeek: true,
            datepickerFirstDay: 1,
            tableResizeHackMinWidth: 350 ,
            jsonRequestType: "json" // "json | jsonp"
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

	// Initialize Cubes service
	cubesService.connect();

}]);


// Cubesviewer Javascript entry point
var cubesviewer = {

	// CubesViewer version
	version: "2.0.1-devel",

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
	}

};



