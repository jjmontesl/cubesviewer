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

angular.module('cv.cubes').service("cubesCacheService", ['$rootScope', '$log', 'cvOptions', 'cubesService', 'gaService',
                                                         function ($rootScope, $log, cvOptions, cubesService, gaService) {

	var cubesCacheService = this;

	this.cache = {};

	this._cacheOverridedCubesRequest = null;

	this.initialize = function() {
		if (this._cacheOverridedCubesRequest) {
			$log.warn("Error: tried to initialize CubesCacheService but it was already initialized.")
			return;
		}
		if (cvOptions.cacheEnabled) {
			// Replace request function
			$log.debug("Replacing Cubes request method with caching version.")
			cubesCacheService._cacheOverridedCubesRequest = cubesService.cubesRequest;
			cubesService.cubesRequest = cubesCacheService.cachedCubesRequest;
		}
	};

	this.cachedCubesRequest = function(path, params, successCallback, errCallback) {

		cubesCacheService._cacheCleanup();

		var requestHash = path + "?" + $.param(params);
		var jqxhr = null;
		if (requestHash in cubesCacheService.cache && cvOptions.cacheEnabled) {

			// Warn that data comes from cache (QTip can do this?)
			var timediff = Math.round ((new Date().getTime() - cubesCacheService.cache[requestHash].time) / 1000);
			if (timediff > cvOptions.cacheNotice) {
				//cubesviewer.showInfoMessage("Data loaded from cache<br/>(" + timediff + " minutes old)", 1000);
				$log.debug("Data loaded from cache (" + Math.floor(timediff / 60, 2) + " minutes old)");
			}

			jqxhr = $.Deferred();
			jqxhr.error = function() { };

			setTimeout(function() {
				// TODO: What is the correct ordering of success/complete callbacks?
				successCallback(cubesCacheService.cache[requestHash].data);
				jqxhr.resolve(); //.promise();
			}, 0);

			gaService.trackRequest(path);

		} else {
			// Do request
			jqxhr = cubesCacheService._cacheOverridedCubesRequest(path, params, cubesCacheService._cacheCubesRequestSuccess(successCallback, requestHash), errCallback);
		}

		return jqxhr;
	};

	/*
	 * Reviews the cache and removes old elements and oldest if too many
	 */
	this._cacheCleanup = function() {

		var cacheDuration = cvOptions.cacheDuration;
		var cacheSize = cvOptions.cacheSize;

		var oldestTime = new Date().getTime() - (1000 * cacheDuration);

		var elements = [];
		for (var element in cubesCacheService.cache) {
			if (cubesCacheService.cache[element].time < oldestTime) {
				delete cubesCacheService.cache[element];
			} else {
				elements.push (element);
			}
		}

		elements.sort(function(a, b) {
			return (cubesCacheService.cache[a].time - cubesCacheService.cache[b].time);
		});
		if (elements.length >= cacheSize) {
			for (var i = 0; i < elements.length - cacheSize; i++) {
				delete cubesCacheService.cache[elements[i]];
			}
		}

	}

	this._cacheCubesRequestSuccess = function(pCallback, pRequestHash) {
		var requestHash = pRequestHash;
		var callback = pCallback;
		return function(data) {
			// TODO: Check if cache is enabled
			cubesCacheService.cache[pRequestHash] = {
				"time": new Date().getTime(),
				"data": data
			};
			pCallback(data);
		};
	};

}]);

