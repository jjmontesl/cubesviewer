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


/*
 * Google Analytics events tracking service.
 *
 * When enabled, it uses Google Analytics event system to
 * log CubesViewer operations. Model loading, Aggregations, Facts and Dimension queries
 * are registered as non-interactive events (and don't affect bounce rate). Each
 * view refresh is registered as an interactive event.
 *
 */


"use strict";

angular.module('cv.cubes').service("gaService", ['$rootScope', '$http', '$cookies', '$log', 'cvOptions',
                                                  function ($rootScope, $http, $cookies, $log, cvOptions) {

	var gaService = this;

	this.ignorePeriod = 12; // 35

	this.initTime = new Date();

	this.initialize = function() {
		if (cvOptions.gaTrackEvents) $log.debug("Google Analytics events tracking plugin enabled.")
	};

	this.trackRequest = function(path) {

		if (! (cvOptions.gaTrackEvents)) return;
		if ((((new Date()) - this.initTime) / 1000) < this.ignorePeriod) return;

		// Track request, through Google Analytics events API
		var event = null;
		var pathParts = path.split("/");
		var modelPos = pathParts.indexOf("cube");

		if (modelPos >= 0) {
			pathParts = pathParts.slice(modelPos + 1);

			if (pathParts[1] == "model") {
				event = ['model', pathParts[0]];
			} else if (pathParts[1] == "aggregate") {
				event = ['aggregate', pathParts[0]];
			} else if (pathParts[1] == "facts") {
				event = ['facts', pathParts[0]];
			} else if (pathParts[1] == "members") {
				event = ['dimension', pathParts[2]];
			}
		}


		if (event) {
			if (typeof ga !== 'undefined') {
				ga('send', 'event', "CubesViewer", event[0], event[1]);
				$log.debug("Tracking GA event: " + event[0] + "/" + event[1]);
			} else {
				$log.debug("Cannot track CubesViewer events: GA object 'ga' not available.")
			}
		} else {
			$log.warn("Unknown cubes operation, cannot be tracked by GA service: " + path)
		}

	};

	this.initialize();

}]);


