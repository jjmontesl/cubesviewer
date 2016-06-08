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

/*
 * Series chart object. Contains view functions for the 'chart' mode.
 * This is an optional component, part of the cube view.
 */

angular.module('cv.views.cube').controller("CubesViewerViewsCubeChartController", ['$rootScope', '$scope', '$timeout', '$element', 'cvOptions', 'cubesService', 'viewsService', 'seriesOperationsService', 'exportService',
                                                     function ($rootScope, $scope, $timeout, $element, cvOptions, cubesService, viewsService, seriesOperationsService, exportService) {

	var chartCtrl = this;

	this.chart = null;

	this.initialize = function() {
		// Add chart view parameters to view definition
		$scope.view.params = $.extend(
			{},
			{ "charttype" : "bars-vertical", "chartoptions": { showLegend: true } },
			$scope.view.params
		);
		//$scope.refreshView();
	};

	$scope.$watch("view.params.charttype", function() {
		chartCtrl.loadData();
	});
	$scope.$on("ViewRefresh", function(view) {
		chartCtrl.loadData();
	});

	this.loadData = function() {

		var view = $scope.view;

		// Check if we can produce a table
		if (view.params.yaxis == null) return;

		var browser_args = cubesService.buildBrowserArgs($scope.view, $scope.view.params.xaxis != null ? true : false, false);
		var browser = new cubes.Browser(cubesService.cubesserver, $scope.view.cube);
		var viewStateKey = $scope.newViewStateKey();
		var jqxhr = browser.aggregate(browser_args, $scope._loadDataCallback(viewStateKey));

		$scope.view.pendingRequests++;
		jqxhr.always(function() {
			$scope.view.pendingRequests--;
			$rootScope.$apply();
		});
		jqxhr.error($scope.requestErrorHandler);

	};

	$scope._loadDataCallback = function(viewStateKey) {
		return function(data, status) {
			// Only update if view hasn't changed since data was requested.
			if (viewStateKey == $scope._viewStateKey) {
				$scope.validateData(data, status);
				chartCtrl.processData(data);
				$rootScope.$apply();
			}
		};
	};

	this.processData = function(data) {

		if ($scope.view.pendingRequests == 0) {
			$($element).find("svg").empty();
			$($element).find("svg").parent().children().not("svg").remove();
		}

		$scope.rawData = data;

		$scope.resetGrid();
		$scope.view.grid.data = [];
		$scope.view.grid.columnDefs = [];
		$rootScope.$apply();

		var view = $scope.view;
		var rows = $scope.view.grid.data;
		var columnDefs = view.grid.columnDefs;

		// Process data
		//$scope._sortData (data.cells, view.params.xaxis != null ? true : false);
	    this._addRows($scope, data);
	    seriesOperationsService.applyCalculations($scope.view, $scope.view.grid.data, view.grid.columnDefs);

		// Join keys
		if (view.params.drilldown.length > 0) {
			columnDefs.splice (0, view.params.drilldown.length, {
				name: "key"
			});

			$(rows).each(function(idx, e) {
				var jointkey = [];
				for (var i = 0; i < view.params.drilldown.length; i++) jointkey.push(e["key" + i]);
				e["key"] = jointkey.join(" / ");
			});
		}

		$scope.$broadcast("gridDataUpdated");

	};

	/*
	 * Adds rows.
	 */
	this._addRows = cubesviewer._seriesAddRows;

	this.cleanupNvd3 = function() {

		//$($element).find("svg").empty();
		$($element).find("svg").parent().children().not("svg").remove();

		if (chartCtrl.chart) {
			$("#" + chartCtrl.chart.tooltip.id()).remove(); // div.nvtooltip
		}

		//$scope.chart = null;

		/*
		var len = nv.graphs.length;
		while (len--) {
			if (! ($.contains(document.documentElement, nv.graphs[len].container))) {
			    // Element is detached, destroy graph
				nv.graphs.splice (len,1);
			}
		}
		*/
	};

	$scope.$watch('cvOptions.studioTwoColumn', function() {
		if (chartCtrl.chart) {
			$timeout(function() {
				chartCtrl.chart.update();
			}, 100);
		}
	});

	this.resizeChart = function(size) {
		var view = $scope.view;
		$($element).find('svg').height(size);
		$($element).find('svg').resize();

		if (chartCtrl.chart) chartCtrl.chart.update();
	};

	$scope.$on("ViewResize", function(view) {
		if (chartCtrl.chart) chartCtrl.chart.update();
	});

	/**
	 * FIXME: This shouldn't be defined here.
	 * Note that `this` refers to the view in this context.
	 */
	$scope.view.exportChartAsPNG = function() {

		var doctype = '<?xml version="1.0" standalone="no"?>'
			  + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

		// Get page styles
		var styles = exportService.getDocumentStyles();
		styles = (styles === undefined) ? "" : styles;

		// Serialize our SVG XML to a string.
		var svgSel = $($element).find('svg').first();
		svgSel.addClass("cv-bootstrap");
		svgSel.css("font-size", "10px");
		svgSel.css("font-family", "Helvetica, Arial, sans-serif");
		svgSel.css("background-color", "white");
		svgSel.attr("width", svgSel.width());
		svgSel.attr("height", svgSel.height());
		svgSel.attr("version", "1.1")

		var defsEl = document.createElement("defs");
	    svgSel[0].insertBefore(defsEl, svgSel[0].firstChild);
	    //defsEl.setAttribute("class", "cv-bootstrap");
	    var styleEl = document.createElement("style")
	    defsEl.appendChild(styleEl);
	    styleEl.setAttribute("type", "text/css");

		var source = (new XMLSerializer()).serializeToString(svgSel.get(0));
		source = source.replace('</style>', '<![CDATA[' + styles + ']]></style>')

		// Create a file blob of our SVG.
		var blob = new Blob([doctype + source], { type: 'image/svg+xml;charset=utf-8' });

		var url = window.URL.createObjectURL(blob);

		// Put the svg into an image tag so that the Canvas element can read it in.
		var img = d3.select('body').append('img').attr('visibility', 'hidden').attr('width', svgSel.width()).attr('height', svgSel.height()).node();

		img.onload = function() {
		  // Now that the image has loaded, put the image into a canvas element.
		  var canvas = d3.select('body').append('canvas').node();
		  $(canvas).addClass("cv-bootstrap");
		  $(canvas).attr('visibility', 'hidden');
		  canvas.width = svgSel.width();
		  canvas.height = svgSel.height();
		  var ctx = canvas.getContext('2d');
		  ctx.drawImage(img, 0, 0, svgSel.width(), svgSel.height());
		  var canvasUrl = canvas.toDataURL("image/png");

		  $(img).remove();
		  $(canvas).remove();

		  // this is now the base64 encoded version of our PNG! you could optionally
		  // redirect the user to download the PNG by sending them to the url with
		  // `window.location.href= canvasUrl`.
		  /*
		  var img2 = d3.select('body').append('img')
		    .attr('width', svgSel.width())
		    .attr('height', svgSel.height())
		    .node();
		   */
		  //img2.src = canvasUrl;
		  exportService.saveAs(canvasUrl, $scope.view.cube.name + "-" + $scope.view.params.charttype + ".png");
		}
		// start loading the image.
		img.src = url;
	};


	$scope.$on("$destroy", function() {
		chartCtrl.cleanupNvd3();
		$scope.view.grid.data = [];
		$scope.view.grid.columnDefs = [];
	});

	this.initialize();

}]);


