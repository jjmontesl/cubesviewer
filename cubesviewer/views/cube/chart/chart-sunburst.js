/*
 * CubesViewer
 * Copyright (c) 2012-2013 Jose Juan Montes, see AUTHORS for more details
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

/*
 * Series Sunburst object. Contains view functions for the 'sunburst' mode.
 * This is an optional component, part of the cube view. Depends on the series mode.
 */

"use strict";

angular.module('cv.views.cube').controller("CubesViewerViewsCubeChartSunburstController", ['$rootScope', '$scope', '$element', '$timeout', 'cvOptions', 'cubesService', 'viewsService',
                                                                                           function ($rootScope, $scope, $element, $timeout, cvOptions, cubesService, viewsService) {

	$scope.chart = null;

	$scope.initialize = function() {
	};

	$scope.$on('gridDataUpdated', function() {
		$timeout(function() {
			$scope.drawChartSunburst();
		}, 2000);
	});

	/**
	 * Draws Series Chart.
	 */
	$scope.drawChartSunburst = function() {

		var view = $scope.view;
		var data = $scope.rawData;
		var dataRows = $scope.view.grid.data;
		var columnDefs = view.grid.columnDefs;

		/*
		$(view.container).find('.cv-view-viewdata').empty();

		if (data.cells.length == 0) {
			$(view.container).find('.cv-view-viewdata').empty().append(
				'<h3>Dynamic Chart</h3>' +
				'<div>Cannot present chart as no data is returned by the current filtering and drilldown combination.</div>'
			);
			return;
		}

		$(view.container).find('.cv-view-viewdata').css("width", "95%");
		$(view.container).find('.cv-view-viewdata').append(
			'<div><h3>Dynamic Chart</h3>' +
			'<div id="dynamicChart-' + view.id + '" style="height: 480px; width: 480px; float: left; "></div></div>' +
			'<div id="dynamicChart-details-' + view.id + '" style="width: 95%; margin-left: 10px;" >' +
			'<h3>Selected Segment</h3>' +
			'<h3>Drilldowns</h3>' +
			'</div>'
		);
		*/

		// Process and draw cells
		//$scope._sortData (data.cells, view.params.xaxis != null ? true : false);
		var json = $scope.prepareDrilldownTree (data);
		$scope.draw3DJSSunburst (json);

	};

	/*
	 * Prepares drilldowndata
	 */
	$scope.prepareDrilldownTree = function (data) {

		// FIXME: This representation is using cells directly, instead of data from series.

		var view = $scope.view;

		var json =  [{
			children: [],
			name: "Current Slice",
		}];

		var current = null;

		$(data.cells).each(function (idx, e) {

			current = json[0];

			// For the horizontal axis drilldown level, if present
			for (var i = 0; i < view.params.drilldown.length; i++) {

				// Get dimension
				var parts = view.cube.dimensionParts(view.params.drilldown[i]);
				var infos = parts.hierarchy.readCell(e);

				$(infos).each(function(idx, info) {
					var child = $.grep(current.children, function(ed) { return ed.name == info.key; });
					if (child.length > 0) {
						current = child[0];
					} else {
						child = {
							children: [],
							name: String(info.key),
							label: info.label,
							//color: "#aabbcc" ,
						};
						current.children.push(child);
						current = child;
					}
				});

			}

			current.measure = (e[view.params.yaxis]);

		});


		return json[0].children;

	};

	String.prototype.hashCode = function() {
		  var hash = 0, i, chr, len;
		  if (this.length === 0) return hash;
		  for (i = 0, len = this.length; i < len; i++) {
		    chr   = this.charCodeAt(i);
		    hash  = ((hash << 5) - hash) + chr;
		    hash |= 0; // Convert to 32bit integer
		  }
		  return hash;
	};

	$scope.draw3DJSSunburst = function(json) {



		var view = $scope.view;
		var json = json;

		var data = $scope.rawData;
		var columnDefs = view.grid.columnDefs;

		var container = $($element).find("svg").parent().empty().get(0);
		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.dimensionParts(view.params.xaxis).label : "None");


		var width = 470;
		var height = width;
		var radius = width / 2;
		var varx = d3.scale.linear().range([ 0.0 * Math.PI, 2.0 * Math.PI ]);
		//var vary = d3.scale.pow().exponent(1).domain([ 0, 1 ]).range([ 5, radius]);
		var vary = d3.scale.linear().domain([ 0, 1 ]).range([ 20, radius]);
		var varp = 5;
		var duration = 1000;

		var colorScale = d3.scale.category20b().domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);

		var lastD = null;

		function isParentOf(p, c) {
	        if (p === c)
	            return true;
	        if ((p.children) && (p.children.length > 0)) {
	            return p.children.some(function(d) {
	                return isParentOf(d, c);
	            });
	        }
	        return false;
	    }

	    function colour(d) {

	    	// TODO: Color shall be different and consistent for each drilldown dimension, but shades
	    	// of same palette for levels within same dimension. Use the various colourscales.


	    	if (!d) return "#ffaaaa";

	    	if (d.color != undefined) {
	    		return d.color;
	    	} else if ((d.parent != null) && (d.parent.parent != null)) {
	    		d.color = colour(d.parent);
	    		var color2 = colorScale(Math.abs(String(d.name).hashCode()) % 20);
	    		d.color = d3.scale.linear().domain([0,100]).interpolate(d3.interpolateRgb).range([d.color, color2])(30);
	    		d.color = color2;
	    	} else {
	    		if (! ("name" in d)) {
	    			d.color = "#ffffff"; // center
	    		} else {
	    			d.color = colorScale(Math.abs(String(d.name).hashCode()) % 20);
	    		}
    			//console.debug (d.name + "  hash: " + (Math.abs(String(d.name).hashCode()) % 20) + " color: " + d.color);
	    	}
	    	return d.color;

	    }

	    // Interpolate the scales!
	    function arcTween(d) {
	        var my = maxY(d),
	            xd = d3.interpolate(varx.domain(), [ d.x, d.x + d.dx ]),
	            yd = d3.interpolate(vary.domain(), [ d.y, my ]),
	            //yr = d3.interpolate(vary.range(), [ d.y ? 20 : 0, radius]);
	            yr = d3.interpolate(vary.range(), [ 20, radius]);
	        return function(d) {
	            return function(t) {
	                varx.domain(xd(t));
	                vary.domain(yd(t)).range(yr(t));
	                return arc(d);
	            };
	        };

	    }

	    function maxY(d) {
	    	return 1;
	    	//return d.children ? Math.max.apply(Math, d.children.map(maxY)) : d.y + d.dy;
	    }

	    //http://www.w3.org/WAI/ER/WD-AERT/#color-contrast
	    function brightness(rgb) {
	        return rgb.r * .299 + rgb.g * .587 + rgb.b * .114;
	    }

	    function textPart(text, part) {
	    	var parts = text.split(" ");
	    	var overflow = (parts.length > 8);

	    	if (parts.length <= 2) {
	    		return (part == 0) ? text : "";
	    	}

	    	parts = parts.slice(0, 8);
	    	if (part == 0) {
	    		parts = parts.slice(0, Math.floor(parts.length / 2));
	    	} else {
	    		parts = parts.slice(Math.floor(parts.length / 2));
	    	}
	    	return parts.join(" ") + (overflow && part == 1 ? "..." : "");
	    }

	    var div = d3.select(container);

	    var vis = div.append("svg").attr("width", width + varp * 2).attr("height",
	            height + varp * 2).append("g").attr("transform",
	            "translate(" + (radius + varp) + "," + (radius + varp) + ")");

	    var partition = d3.layout.partition().sort(null).value(function(d) {
	        return d.measure;
	    });

	    var arc = d3.svg.arc().startAngle(function(d) {
	        return Math.max(0, Math.min(2 * Math.PI, varx(d.x)));
	    }).endAngle(function(d) {
	        return Math.max(0, Math.min(2 * Math.PI, varx(d.x + d.dx)));
	    }).innerRadius(function(d) {
	        return Math.max(0, d.y ? vary(d.y) : d.y);
	    }).outerRadius(function(d) {
	        return Math.max(0, vary(d.y + d.dy));
	    });

       var nodes = partition.nodes({
           children : json
       });

       var path = vis.selectAll("path").data(nodes);

       path.enter().append("path").attr("id", function(d, i) {
           return "path-" + i;
       }).attr("d", arc).attr("fill-rule", "evenodd").style(
               "fill", colour).on("click", click)
       .each(function(d, i) {
    	   var el = this;
    	   $(el).hover(function() {
    		   d3.select(el)
    		      //.style("fill", "#ccccff")
    		      .style('stroke', '#ffffff')
    		      .style('stroke-width', '2')
    		      .style('stroke-opacity', '1');
    		   $(el).insertBefore($('text').first());
    	   }, function() {
    		   d3.select(el)
	    		   .style('stroke', '#000000')
	               .style('stroke-width', '0')
	               .style('stroke-opacity', '0');
    	   });
       });


       lastD = nodes[0];

       var text = vis.selectAll("text").data(nodes);
       var textEnter = text
               .enter()
               .append("text")
               .style("fill-opacity", 1)
               .style(
                       "fill",
                       function(d) {
                           return brightness(d3.rgb(colour(d))) < 125 ? "#eee"
                                   : "#000";
                       })
               .style("font-size", 9)
               .style("-webkit-touch-callout", "none")
               .style("-webkit-user-select", "none")
    		   .style("-khtml-user-select", "none")
			   .style("-moz-user-select", "none")
			   .style("-ms-user-select", "none")
			   .style("user-select", "none")
			   .style("pointer-events", "none")
               .style(
	               "visibility",
	               function(e) {
	                   var show = ( Math.abs(varx(e.x + e.dx ) - varx(e.x) ) > Math.PI / 48 );
	                   show = true;
	                   return show ? null  : "hidden";
	                   //return isParentOf(d, e) ? null  : d3.select(this).style("visibility");
	               })
               .attr(
                       "text-anchor",
                       function(d) {
                           return varx(d.x + d.dx / 2) > Math.PI ? "end"
                                   : "start";
                       })
               .attr("dy", ".2em")
               .attr(
                       "transform",
                       function(d) {
                           var multiline = (('label' in d ? String(d.label) : "") || "").split(" ").length > 1
                           var angle = varx(d.x + d.dx / 2)* 180 / Math.PI - 90
                           var rotate = angle + (multiline ? -.5 : 0);
                           return "rotate(" + rotate + ")translate("
                                   + (vary(d.y) + varp) + ")rotate("
                                   + (angle > 90 ? -180 : 0)
                                   + ")";
                       }).on("click", click);
       textEnter.append("tspan").attr("x", 0).text(
               function(d) {
                   return d.depth ? (textPart(d.label, 0)) : "";
               });
       textEnter
               .append("tspan")
               .attr("x", 0)
               .attr("dy", "1em")
               .text(function(d) { return d.depth ? textPart(d.label, 1) || "" : ""; });

       /*
       d3.select("#graphBlocks").on("click", function() {
           graphBlocks();
           return false;
       });
       d3.select("#graphSize").on("click", function() {
           graphSize();
           return false;
       });
       */

       function updateText(d) {
    	   // Note the example hacked this as they rely on arcTween updating the scales.
           text
                   .style(
                           "visibility",
                           function(e) {
                               var show = ( Math.abs(varx(e.x + e.dx ) - varx(e.x) ) > Math.PI / 48 );
                               return show ? null  : "hidden";
                               //return isParentOf(d, e) ? null  : d3.select(this).style("visibility");
                           })
                   .transition()
                   .duration(duration)
                   .attrTween(
                           "text-anchor",
                           function(d) {
                               return function() {
                                   return varx(d.x + d.dx / 2) > Math.PI ? "end"
                                           : "start";
                               };
                           })
                   .attrTween(
                           "transform",
                           function(d) {
                               var multiline = (d.name || "").split(" ").length > 1;
                               return function() {
                                   var angle = varx(d.x + d.dx
                                           / 2)
                                           * 180
                                           / Math.PI
                                           - 90, rotate = angle
                                           + (multiline ? -.5
                                                   : 0);
                                   return "rotate(" + rotate + ")translate(" + (vary(d.y) + varp)
                                           + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
                               };
                           }).style(
                           "fill-opacity",
                           function(e) {
                               return isParentOf(d, e) ? 1
                                       : 1e-6;
                           }).each(
                           "end",
                           function(e) {

                        	   var show = ( Math.abs(varx(e.x + e.dx ) - varx(e.x) ) > Math.PI / 48 );
                        	   d3.select(this).style("visibility", show ? null  : "hidden");
                        	   //d3.select(this).style("visibility", && isParentOf(d, e)  ? null  : "hidden");
                           });
           }

       function click(d) {

    	   lastD = d;

           path.transition().duration(duration).attrTween("d", arcTween(d));

           updateText(d);
       }

	};



}]);

function cubesviewerViewCubeDynamicChart() {

	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {
		// Remove horizontal dimension menu
		$(".cv-view-series-horizontal-menu", $(view.container)).remove();
		// Remove horizontal dimension info
		$(".cv-view-series-horizontal-info", $(view.container)).parents('.infopiece').remove();
	};


	/*
	 * Load and draw current data
	 */
	this.loadData = function(view) {

		// Build params (do not include xaxis)
		var params = this.cubesviewer.views.cube.buildQueryParams(view, false, false);

		$('#' + view.id).find('.cv-view-viewdata').empty().append('<h3>Dynamic Chart</h3><span class="ajaxloader" title="Loading...">  Loading</span>');

		$.get(view.cubesviewer.options.cubesUrl + "/cube/" + view.cube.name + "/aggregate", params,
				view.cubesviewer.views.cube.dynamicchart._loadDataCallback(view), "json");

	};

};
