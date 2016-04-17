/*
 * CubesViewer
 * Copyright (c) 2012-2015 Jose Juan Montes, see AUTHORS for more details
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

/**
 * Adds support for datefilters.
 *
 * This plugin requires that the model is configured
 * to declare which dimensions may use a datefilter,
 * and which fields of the dimension correspond to
 * calendar fields (year, quarter, month, day, week...).
 * (see integrator documentation for more information).
 *
 * This is an optional plugin.
 * Depends on the cube.explore plugin.
 */
function cubesviewerViewCubeDateFilter () {

	this.cubesviewer = cubesviewer;

	this._overridedbuildQueryCuts = null;

	this.onViewCreate = function(event, view) {

		$.extend(view.params, {

			"datefilters" : [],

		});

	}


	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {

		if (view.cube == null) return;
		var cube = view.cube;

		// Draw menu options (depending on mode)
		view.cubesviewer.views.cube.datefilter.drawFilterMenu(view);

		// Update info boxes to include edition
		view.cubesviewer.views.cube.datefilter.drawInfo(view);

	};



	/*
	 * Draw datefilter options in the cut menu.
	 */
	this.drawFilterMenu = function(view) {

		var cube = view.cube;
		var menu = $(".cv-view-menu-cut", $(view.container));

		var dateFilterElements = "";
		$(cube.dimensions).each( function(idx, dimension) {

			if (dimension.isDateDimension()) {

				var disabled = "";
				dateFilterElements = dateFilterElements + '<li><a href="#" class="selectDateFilter '  + disabled +
					'" data-dimension="' + dimension.name + ((dimension.info["cv-datefilter-hierarchy"]) ? "@" + dimension.info["cv-datefilter-hierarchy"] : "") +
				'" data-value="1">' + dimension.label + ((dimension.hierarchy(dimension.info["cv-datefilter-hierarchy"])) ? " / " + dimension.hierarchy(dimension.info["cv-datefilter-hierarchy"]).label : "") +
					'</a></li>';
			}

		});

		if (dateFilterElements == "") {
			dateFilterElements = dateFilterElements + '<li><a href="#" onclick="return false;"><i>No date filters defined</i></a></li>';
		}

		$(".ui-explore-cut-clearsep", menu).before(
				'<li><a href="#" onclick="return false;"><span class="ui-icon ui-icon-zoomin"></span>Date filter</a><ul class="dateFilterList" style="width: 180px;">' +
				dateFilterElements +
				'</ul></li>'
		);

		$(menu).menu("refresh");
		$(menu).addClass("ui-menu-icons");

		$(view.container).find('.selectDateFilter').click( function() {
			cubesviewer.views.cube.datefilter.selectDateFilter(view, $(this).attr('data-dimension'), $(this).attr('data-value'));
			return false;
		});

	};


	// Draw information bubbles
	this.drawInfo = function(view, readonly) {

		$(view.container).find('.cv-view-viewinfo-cut').after(
				'<div class="cv-view-viewinfo-date"></div>'
		);

		$(view.params.datefilters).each( function(idx, e) {
			var dimparts = view.cube.cvdim_parts(e.dimension);
			var piece = cubesviewer.views.cube.explore.drawInfoPiece(
					$(view.container).find('.cv-view-viewinfo-date'), "#ffdddd", null, readonly,
					'<span class="ui-icon ui-icon-zoomin"></span> <b>Filter: </b> ' +
					dimparts.labelNoLevel +
					': <span class="datefilter"></span>')
			var container = $('.datefilter', piece);
			view.cubesviewer.views.cube.datefilter.drawDateFilter(view, e, container);

			piece.find('.cv-view-infopiece-close').click(function() {
				view.cubesviewer.views.cube.datefilter.selectDateFilter(view, e.dimension, "0");
			});
		});

		if (readonly) {
			$(view.container).find('.infopiece').find('.ui-icon-close')
					.parent().remove();
		}

	};


	this.drawDateFilter = function(view, datefilter, container) {

		$(container)
				.append(
						' '
								+ '<select name="date_mode" >'
								+ '<option value="custom">Custom</option>'
								//+ '<option value="linked" disabled="true">Linked to main</option>'
								+ '<optgroup label="Auto">'
								+ '<option value="auto-last1m">Last month</option>'
								+ '<option value="auto-last3m">Last 3 months</option>'
								+ '<option value="auto-last6m">Last 6 months</option>'
								+ '<option value="auto-last12m">Last year</option>'
								+ '<option value="auto-last24m">Last 2 years</option>'
								+ '<option value="auto-january1st">From January 1st</option>'
								+ '<option value="auto-yesterday">Yesterday</option>'
								+ '</optgroup>' + '</select> ' + 'Range: '
								+ '<input name="date_start" /> - '
								+ '<input name="date_end" /> ');

		$("[name='date_start']", container).datepicker({
			changeMonth : true,
			changeYear : true,
			dateFormat : "yy-mm-dd",
			showWeek: cubesviewer.options.datepickerShowWeek,
		    firstDay: cubesviewer.options.datepickerFirstDay
		});
		$("[name='date_end']", container).datepicker({
			changeMonth : true,
			changeYear : true,
			dateFormat : "yy-mm-dd",
			showWeek: cubesviewer.options.datepickerShowWeek,
		    firstDay: cubesviewer.options.datepickerFirstDay
		});

		$("[name='date_start']", container).attr('autocomplete', 'off');
		$("[name='date_end']", container).attr('autocomplete', 'off');

		// Functionality
		$("input,select", container).change(function() {
			datefilter.mode = $("[name='date_mode']", container).val();
			datefilter.date_from = $("[name='date_start']", container).val();
			datefilter.date_to = $("[name='date_end']", container).val();
			view.cubesviewer.views.redrawView (view);
		});

		// Set initial values
		$("[name='date_mode']", container).val(datefilter.mode);
		$("[name='date_start']", container).val(datefilter.date_from);
		$("[name='date_end']", container).val(datefilter.date_to);
		if ($("[name='date_mode']", container).val() != "custom") {
			$("[name='date_start']", container).attr("disabled", "disabled");
			$("[name='date_end']", container).attr("disabled", "disabled");
		}

	};

	// Adds a date filter
	this.selectDateFilter = function(view, dimension, enabled) {

		var cube = view.cube;

		// TODO: Show a notice if the dimension already has a date filter (? and cut filter)

		if (dimension != "") {
			if (enabled == "1") {
				view.params.datefilters.push({
					"dimension" : dimension,
					"mode" : "auto-last3m",
					"date_from" : null,
					"date_to" : null
				});
			} else {
				for ( var i = 0; i < view.params.datefilters.length; i++) {
					if (view.params.datefilters[i].dimension.split(':')[0] == dimension) {
						view.params.datefilters.splice(i, 1);
						break;
					}
				}
			}
		} else {
			view.params.datefilters = [];
		}

		view.cubesviewer.views.redrawView(view);

	};

	/*
	 * Composes a filter with appropriate syntax and time grain from a
	 * datefilter
	 */
	this.datefilterValue = function(view, datefilter) {

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
			} else if (datefilter.mode == "auto-last24m") {
				date_from = new Date();
				date_from.setMonth(date_from.getMonth() - 24);
			} else if (datefilter.mode == "auto-january1st") {
				date_from = new Date();
				date_from.setMonth(0);
				date_from.setDate(1);
			} else if (datefilter.mode == "auto-yesterday") {
				date_from = new Date();
				date_from.setDate(date_from.getDate() - 1);
				date_to = new Date();
                date_to.setDate(date_from.getDate() - 1);
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
						+ this._datefiltercell(view, datefilter, date_from);
			datefiltervalue = datefiltervalue + "-";
			if (date_to != null)
				datefiltervalue = datefiltervalue
						+ this._datefiltercell(view, datefilter, date_to);
			return datefiltervalue;
		} else {
			return null;
		}

	};

	this._datefiltercell = function(view, datefilter, tdate) {

		var values = [];

		var dimensionparts = view.cube.cvdim_parts(datefilter.dimension);
		for (var i = 0; i < dimensionparts.hierarchy.levels.length; i++) {
			var level = dimensionparts.hierarchy.levels[i];

			var field = level.role;
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
				cubesviewer.alert ("Wrong configuration of model: time role of level '" + level.name + "' is invalid.");
			}
		}

		return values.join(',');

		/*return tdate.getFullYear() + ","
				+ (Math.floor(tdate.getMonth() / 3) + 1) + ","
				+ (tdate.getMonth() + 1); */
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
	 * Builds Query Cuts (overrides default cube cut build function).
	 */
	this.buildQueryCuts = function(view) {

		// Include cuts and datefilters
		var cuts = cubesviewer.views.cube.datefilter._overridedbuildQueryCuts(view);

		$(view.params.datefilters).each(function(idx, e) {
			var datefiltervalue = view.cubesviewer.views.cube.datefilter.datefilterValue(view, e);
			if (datefiltervalue != null) {
				cuts.push(cubes.cut_from_string (view.cube, e.dimension + ":" + datefiltervalue));
			}
		});

		return cuts;

	};

}

/*
 * Extend model prototype to support datefilter dimensions.
 */
cubes.Dimension.prototype.isDateDimension = function()  {

	// Inform if a dimension is a date dimension and can be used as a date
	// filter (i.e. with range selection tool).
	return ((this.role == "time") &&
			((! ("cv-datefilter" in this.info)) || (this.info["cv-datefilter"] == true)) );

};

/*
 * Create object.
 */
cubesviewer.views.cube.datefilter = new cubesviewerViewCubeDateFilter();

/*
 * Override original Cut generation function to add support for datefilters
 */
cubesviewer.views.cube.datefilter._overridedbuildQueryCuts = cubesviewer.views.cube.buildQueryCuts;
cubesviewer.views.cube.buildQueryCuts = cubesviewer.views.cube.datefilter.buildQueryCuts;

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.cube.datefilter.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.datefilter.onViewDraw);

