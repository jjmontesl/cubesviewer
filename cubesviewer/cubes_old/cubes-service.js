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
 * CubesViewer Cubes module. Provides an interface to the Cubes client.
 *
 * @namespace cv.cubes
 */
angular.module('cv.cubes', []);

/**
 * This service manages the Cubes client instance and provides methods to
 * connect to and query the Cubes server.
 *
 * @class cubesService
 * @memberof cv.cubes
 */
angular.module('cv.cubes').service("cubesService", ['$rootScope', '$log', 'cvOptions', 'gaService',
                                                    function ($rootScope, $log, cvOptions, gaService) {

	var cubesService = this;

	this.cubesserver = null;

	this.state = cubesviewer.VIEW_STATE_INITIALIZING;

	this.stateText = "";


	this.initialize = function() {
	};

	/**
	 * Connects this service to the Cubes server, using the parameters
	 * defined by the configured {@link cvOptions}.
	 *
	 * @memberOf cv.cubes.cubesService
	 */
	this.connect = function() {
		// Initialize Cubes client library
		this.cubesserver = new cubes.Server(cubesService._cubesAjaxHandler);
		console.debug("Cubes client connecting to: " + cvOptions.cubesUrl);
		this.cubesserver.connect (cvOptions.cubesUrl, function() {
			$log.debug('Cubes client initialized (server version: ' + cubesService.cubesserver.server_version + ')');
			cubesService.state = cubesviewer.VIEW_STATE_INITIALIZED;
			$rootScope.$apply();
		}, function(xhr) {

			console.debug(xhr);
			console.debug('Could not connect to Cubes server [code=' + xhr.status + "]");
			cubesService.state = cubesviewer.VIEW_STATE_ERROR;

			if (xhr.status == 401) {
				cubesService.stateText = "Unauthorized.";
			} else if (xhr.status == 403) {
				cubesService.stateText = "Forbidden.";
			} else if (xhr.status == 400) {
				cubesService.stateText = "Bad request: " + ($.parseJSON(xhr.responseText).message);
			} else {
				cubesService.stateText = "Unknown error.";
			}


			$rootScope.$apply();
		} );
	};


	/*
	 * Ajax handler for cubes library
	 */
	this._cubesAjaxHandler = function (settings) {
		return cubesService.cubesRequest(settings.url, settings.data || [], settings.success, settings.error);
	};


	/**
	 * Sends a request to the Cubes server.
	 *
	 * @memberOf cv.cubes.cubesService
	 * @returns The jQuery XHR object.
	 */
	this.cubesRequest = function(path, params, successCallback, errCallback) {


		// TODO: normalize how URLs are used (full URL shall come from client code)
		if (path.charAt(0) == '/') path = cvOptions.cubesUrl + path;

		if (cvOptions.debug) {
			$log.debug("Cubes request: " + path + " (" + JSON.stringify(params) + ")");
		}

		var jqxhr = $.get(path, params, cubesService._cubesRequestCallback(successCallback), cvOptions.jsonRequestType);

		jqxhr.fail(errCallback || cubesService.defaultRequestErrorHandler);

		try {
			gaService.trackRequest(path);
		} catch(e) {
			$log.error("An error happened during CubesViewer event tracking: " + e)
		}

		return jqxhr;

	}

	this._cubesRequestCallback = function(pCallback) {
		var callback = pCallback;
		return function(data, status) {
			pCallback(data);
		}
	};

	/*
	 * Default XHR error handler for CubesRequests
	 */
	this.defaultRequestErrorHandler = function(xhr, textStatus, errorThrown) {
		$log.error("Cubes request error: " + xhr)
	};

	/*
	 * Builds Cubes Server query parameters based on current view values.
	 */
	this.buildBrowserArgs = function(view, includeXAxis, onlyCuts) {

		// "lang": view.cubesviewer.options.cubesLang

		//console.debug(view);

		var args = {};

		if (!onlyCuts) {

			var drilldowns = view.params.drilldown.slice(0);

			// Include X Axis if necessary
			if (includeXAxis) {
				drilldowns.splice(0, 0, view.params.xaxis);
			}

			// Preprocess
			for (var i = 0; i < drilldowns.length; i++) {
				drilldowns[i] = cubes.drilldown_from_string(view.cube, view.cube.dimensionParts(drilldowns[i]).fullDrilldownValue);
			}

			// Include drilldown array
			if (drilldowns.length > 0)
				args.drilldown = cubes.drilldowns_to_string(drilldowns);
		}

		// Cuts
		var cuts = this.buildQueryCuts(view);
		if (cuts.length > 0) args.cut = new cubes.Cell(view.cube, cuts);

		return args;

	};

	/*
	 * Builds Query Cuts
	 */
	this.buildQueryCutsStrings = function(view) {

		var cuts = [];

		// Cuts
		$(view.params.cuts).each(function(idx, e) {
			var invert = e.invert ? "!" : "";
			var dimParts = view.cube.dimensionParts(e.dimension);
			var cutDim = dimParts.dimension.name + ( dimParts.hierarchy.name != "default" ? "@" + dimParts.hierarchy.name : "" );

			cuts.push(invert + cutDim + ":" + e.value.replace("-", "\\-"));
		});

		// Date filters
		$(view.params.datefilters).each(function(idx, e) {
			var datefilterval = cubesService.datefilterValue(view, e);
			if (datefilterval != null) {
				cuts.push(e.dimension + ":" + datefilterval);
			}
		});

		return cuts;
	};

	this.buildQueryCuts = function(view) {
		var cuts = [];
		var cutsStrings = cubesService.buildQueryCutsStrings(view);
		$(cutsStrings).each(function(idx, e) {
			cuts.push(cubes.cut_from_string(view.cube, e));
		});
		return cuts;
	};

	/*
	 * Composes a filter with appropriate syntax and time grain from a
	 * datefilter
	 */
	this.datefilterValue = function(view, datefilter) {

		var date_from = null;
		var date_to = null;

		if (datefilter.mode.indexOf("auto-") == 0) {
			if (datefilter.mode == "auto-last1m") {
				date_from = new Date();
				date_from.setMonth(date_from.getMonth() - 1);
			} else if (datefilter.mode == "auto-last3m") {
				date_from = new Date();
				date_from.setMonth(date_from.getMonth() - 3);
			} else if (datefilter.mode == "auto-last6m") {
				date_from = new Date();
				date_from.setMonth(date_from.getMonth() - 6);
			} else if (datefilter.mode == "auto-last12m") {
				date_from = new Date();
				date_from.setMonth(date_from.getMonth() - 12);
			} else if (datefilter.mode == "auto-last24m") {
				date_from = new Date();
				date_from.setMonth(date_from.getMonth() - 24);
			} else if (datefilter.mode == "auto-january1st") {
				date_from = new Date();
				date_from.setMonth(0);
				date_from.setDate(1);
			} else if (datefilter.mode == "auto-yesterday") {
				date_from = new Date();
				date_from.setDate(date_from.getDate() - 1);
				date_to = new Date();
                date_to.setDate(date_from.getDate() - 1);
			}

		} else if (datefilter.mode == "custom") {
			if ((datefilter.date_from != null) && (datefilter.date_from != "")) {
				date_from = new Date(datefilter.date_from);
			}
			if ((datefilter.date_to != null) && (datefilter.date_to != "")) {
				date_to = new Date(datefilter.date_to);
			}
		}

		if ((date_from != null) || (date_to != null)) {
			var datefiltervalue = "";
			if (date_from != null)
				datefiltervalue = datefiltervalue + cubesService._datefiltercell(view, datefilter, date_from);
			datefiltervalue = datefiltervalue + "-";
			if (date_to != null)
				datefiltervalue = datefiltervalue + cubesService._datefiltercell(view, datefilter, date_to);
			return datefiltervalue;
		} else {
			return null;
		}

	};

	this._datefiltercell = function(view, datefilter, tdate) {

		var values = [];

		var dimensionparts = view.cube.dimensionParts(datefilter.dimension);
		for (var i = 0; i < dimensionparts.hierarchy.levels.length; i++) {
			var level = dimensionparts.hierarchy.levels[i];

			var field = level.role;
			if (field == "year") {
				values.push(tdate.getFullYear());
			} else if (field == "month") {
				values.push(tdate.getMonth() + 1);
			} else if (field == "quarter") {
				values.push((Math.floor(tdate.getMonth() / 3) + 1));
			} else if (field == "week") {
				values.push(this._weekNumber(tdate));
			} else if (field == "day") {
				values.push(tdate.getDate());
			} else {
				dialogService.show("Wrong configuration of model: time role of level '" + level.name + "' is invalid.");
			}
		}

		return values.join(',');

		/*return tdate.getFullYear() + ","
				+ (Math.floor(tdate.getMonth() / 3) + 1) + ","
				+ (tdate.getMonth() + 1); */
	};

	this._weekNumber = function(d) {
	    // Copy date so don't modify original
	    d = new Date(d);
	    d.setHours(0,0,0);
	    // Get first day of year
	    var yearStart = new Date(d.getFullYear(),0,1);
	    // Calculate full weeks to nearest Thursday
	    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7)
	    // Return array of year and week number
	    return weekNo;
	};


	this.initialize();

}]);


