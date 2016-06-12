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
 * This addon adds export to CSV capability to CubesViewer cube view.
 * It offers an "export facts" menu option for all cube view modes,
 * and a "export table" option in Explore and Series mode.
 */

"use strict";

/**
 * Provides methods to export data from "cube" views.
 *
 * @class exportService
 * @memberof cv.views.cube
 */
angular.module('cv.views.cube').service("exportService", ['$rootScope', '$timeout', 'cvOptions', 'cubesService', 'viewsService', 'seriesOperationsService',
                                                         function ($rootScope, $timeout, cvOptions, cubesService, viewsService, seriesOperationsService) {

	/**
	 * Download facts in CSV format from Cubes Server
	 *
	 * @memberof cv.views.cube.exportService
	 */
	this.exportFacts = function(view) {

		var args = cubesService.buildBrowserArgs(view, false, true);

        var http_args = {};
        http_args["format"] = "csv";

        if (args.cut) http_args.cut = args.cut.toString();
        if (args.order) http_args.order = args.order.toString();


		var url = cvOptions.cubesUrl + "/cube/" + view.cube.name + "/facts?" + $.param(http_args);
		window.open(url, '_blank');
		window.focus();

	};

	/**
	 * Export a view (either in "explore" or "series" mode) in CSV format.
	 *
	 * @memberof cv.views.cube.exportService
	 */
	this.exportGridAsCsv = function (view) {

		if (!view.grid) {
			console.debug("View has no grid that can be exported.");
			return;
		}

		var gridOptions = view.grid;
		var dataRows = view.grid.data;

		var content = "";
		var values = [];

		$(view.grid.columnDefs).each(function(idx, e) {
			values.push ('"' + e.name + '"');
		});
		content = content + (values.join(",")) + "\n";

		$(dataRows).each(function(idxr, r) {
			values = [];
			$(view.grid.columnDefs).each(function(idx, e) {
				if (r[e.field] && r[e.field].title) {
					// Explore view uses objects as values, where "title" is the label
					values.push('"' + r[e.field].title + '"');
				} else {
					//
					values.push('"' + r[e.field] + '"');
				}
			});
			content = content + (values.join(",")) + "\n";
		});


		//window.open (url, "_blank");
		this.saveAs(content, "text/csv", view.cube.name + "-summary.csv")
	};

	/**
	 * Delivers a data URI to the client with a given filename.
	 *
	 * @memberof cv.views.cube.exportService
	 */
	this.saveAs = function(content, mime, filename) {

		// Method 1
		//var uri = "data:" + mime + ";charset=utf-8," + encodeURIComponent(content);

		// Method 2
		var csvData = new Blob([content], { type: mime });
		var uri = URL.createObjectURL(csvData);

		var link = document.createElement('a');
	    if (typeof link.download === 'string') {
	        document.body.appendChild(link); // Firefox requires the link to be in the body
	        link.download = filename;
	        link.href = uri;
	        link.click();
        	document.body.removeChild(link); // remove the link when done
	    } else {
	        location.replace(uri);
	    }
	};

	/**
	 * Grab page styles as a string to embed them into the SVG source
	 * From: https://github.com/NYTimes/svg-crowbar/blob/gh-pages/svg-crowbar.js
	 */
	this.getDocumentStyles = function() {

		var doc = window.document;

		var styles = "", styleSheets = doc.styleSheets;

		if (styleSheets) {
			for ( var i = 0; i < styleSheets.length; i++) {
				processStyleSheet(styleSheets[i]);
			}
		}

	    function processStyleSheet(ss) {
	    	try {
		    	if (ss.cssRules) {
		    		console.debug(ss);
					for ( var i = 0; i < ss.cssRules.length; i++) {
						var rule = ss.cssRules[i];
						if (rule.type === 3) {
							// Import Rule
							processStyleSheet(rule.styleSheet);
						} else {
							// hack for illustrator crashing
							// on descendent selectors
							if (rule.selectorText) {
								if (rule.selectorText
										.indexOf(">") === -1) {
									styles += "\n"
											+ rule.cssText;
								}
							}
						}
					}
				}
	    	} catch (err) {
	    		console.debug("Could not access document stylesheet.")
	    	}
		}

		return styles;
	}

}]);

