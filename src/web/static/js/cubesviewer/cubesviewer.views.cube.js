/*
 * CubesViewer
 * Copyright (c) 2012-2013 Jose Juan Montes, see AUTHORS for more details
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
 * If your version of the Software supports interaction with it remotely through
 * a computer network, the above copyright notice and this permission notice
 * shall be accessible to all users.
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
 * Cube view. 
 */
function cubesviewerViewCube () {

	this.cubesviewer = cubesviewer;

	this.onViewCreate = function(event, view) {
		
		$.extend(view.params, {
	
			"mode" : "explore",
			
			"drilldown" : [],
			"cuts" : []
			
		});
		
		// Get a reference to the cube
		view.cube = cubesviewer.model.getCube(view.params.cubename);
		
	}
	
	
	/*
	 * Draw cube view menu
	 */
	this.drawMenu = function(view) {
		
		// Add view menu options button
		$(view.container).find('.cv-view-toolbar').append(
			'<button class="viewbutton" title="View" style="margin-right: 5px;">View</button>'
		);
		
		$(view.container).find('.cv-view-viewmenu').append(
			'<ul class="cv-view-menu cv-view-menu-view" style="float: right; width: 180px;">' + 
			//'<li><a href="#" class="aboutBox">About CubesViewer...</a></li>' +
			//'<div></div>' +
			'</ul>'
		);
		
		// Buttonize
		$(view.container).find('.viewbutton').button();
		
		// Menu functionality
		view.cubesviewer.views.cube._initMenu(view, '.viewbutton', '.cv-view-menu-view');

	}
	
	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {
		
		if ($(".cv-view-viewdata", view.container).size() == 0) {

			$(view.container).empty();
			$(view.container).append(
					'<div class="cv-view-panel">' + 
					'<div class="cv-view-viewmenu"></div>' +
					'<div class="cv-view-viewinfo"></div>' +
					'<div class="cv-view-viewdata" style="clear: both;"></div>' +
					'<div class="cv-view-viewfooter" style="clear: both;"></div>' +
					'</div>'
			);
			
		}
		
		// Check if the model/cube is loaded.
		if (view.cube == null) {
			cubesviewer.views.showFatal (view.container, 'Cannot present cube view: could not load model or cube <b>' + view.params.cubename + '</b>.');
			return;
		}
		
		// Menu toolbar
		$(view.container).find('.cv-view-viewmenu').empty().append(
			'<div style="float: right; z-index: 9990; margin-bottom: 5px;"><div class="cv-view-toolbar ui-widget-header ui-corner-all" style="display: inline-block;">' +
			'</div></div>'
		);
		
		// Draw menu
		view.cubesviewer.views.cube.drawMenu(view);

	};

	/*
	 * Helper to configure a context menu opening reaction.
	 */
	this._initMenu = function (view, buttonSelector, menuSelector) {
		//view.cubesviewer.views.initMenu('.panelbutton', '.cv-view-menu-panel');
		$('.cv-view-toolbar', $(view.container)).find(buttonSelector).on("click mouseenter", function(ev) {

			if (ev.type == "mouseenter") {
				if (! $('.cv-view-menu', view.container).is(":visible")) {
					// Only if a menu was open we allow mouseenter to open a menu
					return;
				}
			}
			
			if (ev.type == "click") {
				if ($('.cv-view-menu', view.container).is(":visible")) {
					// Hide the menu and return
					$('.cv-view-menu', view.container).hide();
					return;
				}
			}
			
			// Hide all menus (only one context menu open at once)
			$('.cv-view-menu').hide();

			var menu = $(menuSelector, $(view.container));

			menu.css("position", "absolute");
			menu.css("z-index", "9990");
			menu.show();

			menu.fadeIn().position({
				my : "right top",
				at : "right bottom",
				of : this
			});
			$(document).one("click", cubesviewer.views.cube._hideMenu(menu));

			return false;
		});

		$(menuSelector, $(view.container)).menu({}).hide();
		
	};
	
	/**
	 * Hide menus when mouse clicks outside them, but not when inside.
	 */
	this._hideMenu = function (menu) {
		return function(evt) {
			if ($(menu).find(evt.target).size() == 0) {
				menu.fadeOut();
			} else {
				$(document).one("click", cubesviewer.views.cube._hideMenu(menu));
			}
		}
	};
	
	/*
	 * Adjusts grids size
	 */
	this._adjustGridSize = function() {

		// TODO: use appropriate container width!
		//var newWidth = $(window).width() - 350;
		
		$(".cv-view-panel").each(function (idx, e) {
		
			$(".ui-jqgrid-btable", e).each(function(idx, el) {
				
				$(el).setGridWidth(cubesviewer.options.tableResizeHackMinWidth);
				
				var newWidth = $( e ).innerWidth() - 20;
				//var newWidth = $( el ).parents(".ui-jqgrid").first().innerWidth();
				if (newWidth < cubesviewer.options.tableResizeHackMinWidth) newWidth = cubesviewer.options.tableResizeHackMinWidth;

				$(el).setGridWidth(newWidth);
				
			});
			
		});
		
	};
	
	/*
	 * Builds Cubes Server query parameters based on current view values.
	 */
	this.buildQueryParams = function(view, includeXAxis, onlyCuts) {

		var params = {
			"lang": view.cubesviewer.options.cubesLang
		};

		if (!onlyCuts) {
			var drilldown = view.params.drilldown.slice(0);

			// Include X Axis if necessary
			if (includeXAxis) {
				drilldown.splice(0, 0, view.params.xaxis);
			}

			// Preprocess
			for (var i = 0; i < drilldown.length; i++) {
				var parts  = cubesviewer.model.getDimensionParts(drilldown[i]);
				drilldown[i] = parts.fullDrilldownValue;
			}
			
			// Include drilldown array
			if (drilldown.length > 0)
				params["drilldown"] = drilldown;
		}

		var cuts = cubesviewer.views.cube.buildQueryCuts(view);
		
		// Join different cut conditions
		if (cuts.length > 0)
			params["cut"] = cuts.join("|");

		return params;
	};
	
	/*
	 * Builds Query Cuts
	 */
	this.buildQueryCuts = function(view) {
		
		// Include cuts
		var cuts = [];
		$(view.params.cuts).each(function(idx, e) {
			cuts.push(e.dimension + ":" + e.value);
		});
		
		return cuts;
		
	};

};

/*
 * Create object.
 */
cubesviewer.views.cube = new cubesviewerViewCube();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.cube.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.onViewDraw);

// Resize grids as appropriate
$(window).bind('resize', function() {
	cubesviewer.views.cube._adjustGridSize();
}).trigger('resize');

