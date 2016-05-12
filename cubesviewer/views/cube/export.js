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

angular.module('cv.views.cube').service("exportService", ['$rootScope', '$timeout', 'cvOptions', 'cubesService', 'viewsService', 'seriesService',
                                                              function ($rootScope, $timeout, cvOptions, cubesService, viewsService, seriesService) {

	/**
	 * Download facts in CSV format from Cubes Server
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

		$(gridOptions.columnDefs).each(function(idx, e) {
			values.push ('"' + e.name + '"');
		});
		content = content + (values.join(",")) + "\n";

		$(dataRows).each(function(idxr, r) {
			values = [];
			$(gridOptions.columnDefs).each(function(idx, e) {
				values.push ('"' + r[e.field] + '"');
			});
			content = content + (values.join(",")) + "\n";
		});

		var uri = "data:text/csv;charset=utf-8," + encodeURIComponent(content);
		//window.open (url, "_blank");
		this.saveAs(uri, view.cube.name + "-summary.csv")
	};

	this.saveAs = function(uri, filename) {
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

}]);

