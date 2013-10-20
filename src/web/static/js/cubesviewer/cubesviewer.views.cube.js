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
			"cuts" : [],
			"datefilters" : [],
			
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
			$(view.container).find('.cv-view-viewdata').empty().append(
					'<h3>Cube View</h3><div><i>Cannot present cube view: could not load model or cube <b>' + view.params.cubename + '</b>.</i></div>'
			);
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
		$('.cv-view-toolbar', $(view.container)).find(buttonSelector).click(function() {

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
	 * Composes a filter with appropriate syntax and time grain from a
	 * datefilter
	 */ 
	this.datefilterValue = function(datefilter) {

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
			} else if (datefilter.mode == "auto-january1st") {
				date_from = new Date();
				date_from.setMonth(0);
				date_from.setDate(1);
			} else if (datefilter.mode == "auto-yesterday") {
				date_from = new Date();
				date_from.setDate(date_from.getDate() - 1);
				date_to = new Date();
                date_to.setDate(date_from.getDate());
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
				datefiltervalue = datefiltervalue
						+ this._datefiltercell(datefilter, date_from);
			datefiltervalue = datefiltervalue + "-";
			if (date_to != null)
				datefiltervalue = datefiltervalue
						+ this._datefiltercell(datefilter, date_to);
			return datefiltervalue;
		} else {
			return null;
		}

	};

	this._datefiltercell = function(datefilter, tdate) {

		var values = [];
		
		var dimensionparts = cubesviewer.model.getDimensionParts(datefilter.dimension);
		for (var i = 0; i < dimensionparts.hierarchy.levels.length; i++) {
			var levelname = dimensionparts.hierarchy.levels[i];
			var level = dimensionparts.dimension.getLevel(levelname);
			
			var field = level.getInfo("cv-datefilter-field");
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
				cubesviewer.alert ("Wrong configuration of model: datefilter field '" + field + "' is invalid.");
			}
		}
		
		return values.join(',');
		
		return tdate.getFullYear() + ","
				+ (Math.floor(tdate.getMonth() / 3) + 1) + ","
				+ (tdate.getMonth() + 1);
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

			// Include drilldown array
			if (drilldown.length > 0)
				params["drilldown"] = drilldown;
		}

		// Include cuts and datefilters
		var cuts = [];
		$(view.params.cuts).each(function(idx, e) {
			cuts.push(e.dimension + ":" + e.value);
		});
		$(view.params.datefilters).each(function(idx, e) {
			var datefiltervalue = view.cubesviewer.views.cube.datefilterValue(e);
			if (datefiltervalue != null) {
				cuts.push(e.dimension + ":" + datefiltervalue);
			}
		});
		// Join different cut conditions
		if (cuts.length > 0)
			params["cut"] = cuts.join("|");

		return params;
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

