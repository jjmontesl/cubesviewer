/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Sof	tware, and to permit persons to whom the Software is
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



/**
 * Manipulates series.
 */

"use strict";

angular.module('cv.views').service("seriesOperationsService", ['$rootScope', 'cvOptions', 'cubesService',
                                                               function ($rootScope, cvOptions, cubesService) {

	this.calculateDifferentials = function(view, rows, columnDefs) {

		console.debug("FIXME: Differentials are ignoring drilldown.length columns, but fails in some cases.");

		$(rows).each(function(idx, e) {
			var lastValue = null;
			for (var i = view.params.drilldown.length; i < columnDefs.length; i++) {
	    		var value = e[columnDefs[i].field];
	    		var diff = null;
	    		if ((lastValue != null) && (value != null)) {
	    			var diff = value - lastValue;
	    			e[columnDefs[i].field] = diff;
	    		} else {
	    			delete e[columnDefs[i].field];
	    			//e[columnDefs[i].field] = null;
	    		}
	    		lastValue = value;
	    	}
		});

	};

	this.calculateDifferentialsPercent = function(view, rows, columnDefs) {

		console.debug("FIXME: Differentials are ignoring drilldown.length columns, but fails in some cases.");

		$(rows).each(function(idx, e) {
			var lastValue = null;
			for (var i = view.params.drilldown.length; i < columnDefs.length; i++) {
	    		var value = e[columnDefs[i].field];
	    		var diff = null;
	    		if ((lastValue != null) && (value != null)) {
	    			var diff = (value - lastValue) / lastValue;
	    			e[columnDefs[i].field] = diff;
	    		} else {
	    			delete e[columnDefs[i].field];
	    			//e[columnDefs[i].field] = null;
	    		}
	    		lastValue = value;
	    	}
		});

	};

	this.calculateAccum = function(view, rows, columnDefs) {

	};

	this.applyCalculations = function(view, rows, columnDefs) {
		if (view.params.calculation == "difference") {
			this.calculateDifferentials(view, rows, columnDefs);
		}
		if (view.params.calculation == "percentage") {
			this.calculateDifferentialsPercent(view, rows, columnDefs);
		}
	};


}]);


