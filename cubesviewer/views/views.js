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


'use strict';


angular.module('cv.views', ['cv.views.cube']);

angular.module('cv.views').service("viewsService", ['$rootScope', 'cvOptions', 'cubesService',
                                                    function ($rootScope, cvOptions, cubesService) {

	this.views = [];

	this.lastViewId = 0;

	this.studioViewsService = null;

	/**
	 * Adds a new clean view for a cube.
	 * This accepts parameters as an object or as a serialized string.
	 */
	this.createView = function(type, data) {

		// Create view

		this.lastViewId++;

		var params = {};

		if (typeof data == "string") {
			try {
				params = $.parseJSON(data);
			} catch (err) {
				console.debug('Error: could not process serialized data (JSON parse error)');
				console.debug(data);
				alert ('Error: could not process serialized data (JSON parse error)');
				params["name"] = "Undefined view";
			}
		} else {
			params = data;
		}

		// TODO: Define a view object
		var view = {
			"id": "view-" + this.lastViewId,
			"type": type,
			"state": cubesviewer.STATE_INITIALIZING,
			"params": {},

			controlsHidden: function() {
				return !!this.params.controlsHidden || !!cvOptions.studioHideControls;
			}

		};

		$.extend(view.params, params);

		if (view.state == cubesviewer.STATE_INITIALIZING) view.state = cubesviewer.STATE_INITIALIZED;

		return view;
	};

	/*
	 * Serialize view data.
	 */
	this.serializeView = function(view) {
		return JSON.stringify(view.params);
	};


}]);


/**
 * cvView directive. This is the core CubesViewer directive, which shows
 * a configured view.
 */
/* */


function cubesviewerViews () {

	/*
	 * Shows an error message on a view container.
	 */
	this.showFatal = function (container, message) {
		container.empty().append (
				'<div class="ui-widget">' +
				'<div class="ui-state-error ui-corner-all" style="padding: 0 .7em;">' +
				'<p><span class="ui-icon ui-icon-alert" style="float: left; margin-right: .3em;"></span>' +
				'<strong>Error</strong><br/><br/>' + message +
				'</p></div></div>'
		);
	}



	/*
	 * Block the view interface.
	 */
	this.blockView = function (view, message) {
		if (message == "undef") message = null;
		$(view.container).block({
			"message": message,
			"fadeOut": 200,
			"onUnblock": function() {
				// Fix conflict with jqBlock which makes menus to not overflow off the view (makes menus innacessible)
				$(view.container).css("position", "inherit");
			}
		});
	}

	/*
	 * Block the view interface with a loading message
	 */
	this.blockViewLoading = function (view) {
		this.blockView (view, '<span class="ajaxloader" title="Loading..." >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Loading</span>');
	}

	/*
	 * Unblock the view interface.
	 */
	this.unblockView = function (view) {

		$(view.container).unblock();

	}


	/*
	 * Triggers redraw for a given view.
	 */
	this.redrawView = function (view) {
		// TODO: Review if if below is needed
		//if (view == null) return;
		$(document).trigger ("cubesviewerViewDraw", [ view ]);
	}

	/*
	 * Updates view when the view is refreshed.
	 */
	this.onViewDraw = function (event, view) {

		if (view.state == cubesviewer.views.STATE_ERROR) {
			cubesviewer.views.showFatal (view.container, 'An error has occurred. Cannot present view.');
			event.stopImmediatePropagation();
			return;
		}

	}

};

