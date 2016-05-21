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
 * The views module manages different views in CubesViewer.
 */
angular.module('cv.views', ['cv.views.cube']);

/**
 *
 */
angular.module('cv.views').service("viewsService", ['$rootScope', 'cvOptions', 'cubesService', 'dialogService',
                                                    function ($rootScope, cvOptions, cubesService, dialogService) {

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
				dialogService.show('Error: could not process serialized data (JSON parse error).')
				params["name"] = "Undefined view";
			}
		} else {
			params = data;
		}

		// TODO: Define a view object
		var view = {

			id: "view-" + this.lastViewId,
			type: type,
			state: cubesviewer.STATE_INITIALIZING,
			error: "",
			params: {},

	        savedId: 0,
	        owner: cvOptions.user,
	        shared: false,

			resultLimitHit: false,
			requestFailed: false,
			pendingRequests: 0,
			dimensionFilter: null,

	    	grid: {
	    		api: null,
	    		data: [],
	    		columnDefs: []
			},

			controlsHidden: function() {
				return !!this.params.controlsHidden || !!cvOptions.hideControls;
			},

			setControlsHidden: function(controlsHidden) {
				this.params.controlsHidden = controlsHidden;
			},

			setViewMode: function(mode) {
				this.params.mode = mode;
				//$scope.refreshView();
			}

		};

		$.extend(view.params, params);

		return view;
	};

	/*
	 * Serialize view data.
	 */
	this.serializeView = function(view) {
		//return JSON.stringify(view.params);
		return angular.toJson(view.params);  // Ignores $$ attributes
	};


}]);


