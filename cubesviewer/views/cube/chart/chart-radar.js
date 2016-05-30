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
 * Series chart object. Contains view functions for the 'chart' mode.
 * This is an optional component, part of the cube view.
 */

"use strict";

angular.module('cv.views.cube').controller("CubesViewerViewsCubeChartRadarController", ['$rootScope', '$scope', '$element', '$timeout', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, $element, $timeout, cvOptions, cubesService, viewsService) {

	$scope.chart = null;

	$scope.initialize = function() {
	};

	$scope.$on('gridDataUpdated', function() {
		$timeout(function() {
			$scope.drawChartRadar();
		}, 2000);
	});
	$scope.$watch('cvOptions.studioTwoColumn', function() {
		$timeout(function() {
			$scope.drawChartRadar();
		}, 2000);
	});

	$scope.$on("ViewResize", function (){
		$scope.$apply(function(){
			$scope.drawChartRadar();
		});
	});


	/**
	 */
	$scope.drawChartRadar = function () {

		var view = $scope.view;
		var dataRows = $scope.view.grid.data;
		var columnDefs = view.grid.columnDefs;

		var container = $($element).find(".cv-chart-container")[0];
		$(container).empty();
		$(container).height(400);

	    var d = [];

	    var numRows = dataRows.length;
	    $(dataRows).each(function(idx, e) {
	    	var serie = [];
	    	for (var i = 1; i < columnDefs.length; i++) {
	    		var value = e[columnDefs[i].field];
	    		if (value != undefined) {
	    			serie.push( [i-1, value] );
	    		} else {
	    			serie.push( [i-1, 0] );
	    		}
	    	}
	    	d.push({ data: serie, label: e["key"] != "" ? e["key"] : view.params.yaxis });
	    });
	    d.sort(function(a,b) { return a.label < b.label ? -1 : (a.label > b.label ? +1 : 0) });

	    var xticks = [];
	    for (var i = 1; i < columnDefs.length; i++) {
    		xticks.push([ i - 1, columnDefs[i].name ]);
	    }

	    var flotrOptions = {
	    	//HtmlText: ! view.doExport,
	    	HtmlText: false,
	    	shadowSize: 2,
	    	height: 350,
	        radar: {
	            show: true,
	            fill: numRows < 4,
	            fillOpacity: 0.2
	        },
	        mouse: {
	            track: false,
	            relative: true
	        },
	        grid: {
	            circular: true,
	            minorHorizontalLines: true
	        },
	        xaxis: {
	            ticks: xticks
	        },
	        yaxis: {
	        },
	        legend: {
	        	show: (!!view.params.chartoptions.showLegend),
	            position: "se",
	            backgroundColor: "#D2E8FF"
	        }
	    };
	    $scope.flotrDraw = Flotr.draw(container, d, flotrOptions);

	};

	$scope.initialize();

}]);


