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
 * Adds support for rangefilters.
 *
 * This plugin requires that the model is configured
 * to declare which dimensions may use a rangefilter
 * (see integrator documentation for more information).
 *
 * This is an optional plugin.
 * Depends on the cube.explore plugin.
 */
function cubesviewerViewCubeRangeFilter () {

	this.cubesviewer = cubesviewer;

	this._overridedbuildQueryCuts = null;

	this.onViewCreate = function(event, view) {

		$.extend(view.params, {

			"rangefilters" : [],

		});

	}


	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {

		if (view.cube == null) return;
		var cube = view.cube;

		// Draw menu options (depending on mode)
		view.cubesviewer.views.cube.rangefilter.drawFilterMenu(view);

		// Draw info boxes
		view.cubesviewer.views.cube.rangefilter.drawInfo(view);

	};



	/*
	 * Draw rangefilter options in the cut menu.
	 */
	this.drawFilterMenu = function(view) {

		var cube = view.cube;
		var menu = $(".cv-view-menu-cut", $(view.container));

		var rangeFilterElements = "";
		$(cube.dimensions).each( function(idx, dimension) {

			if (dimension.isRangeDimension()) {

				var disabled = "";
				rangeFilterElements = rangeFilterElements + '<li><a href="#" class="selectRangeFilter '  + disabled +
					'" data-dimension="' + dimension.name + '" data-value="1">' + dimension.label +
					'</a></li>';
			}

		});
		if (rangeFilterElements == "") {
			rangeFilterElements = rangeFilterElements + '<li><a href="#" onclick="return false;"><i>No range filters defined</i></a></li>';
		}

		$(".ui-explore-cut-clearsep", menu).before(
				'<li><a href="#" onclick="return false;"><span class="ui-icon ui-icon-zoomin"></span>Range filter</a><ul class="rangeFilterList" style="width: 180px;">' +
				rangeFilterElements +
				'</ul></li>'
		);

		$(menu).menu("refresh");
		$(menu).addClass("ui-menu-icons");

		$(view.container).find('.selectRangeFilter').click( function() {
			cubesviewer.views.cube.rangefilter.selectRangeFilter(view, $(this).attr('data-dimension'), $(this).attr('data-value'));
			return false;
		});

	};


	// Draw information bubbles
	this.drawInfo = function(view, readonly) {

		$(view.container).find('.cv-view-viewinfo-cut').after(
				'<div class="cv-view-viewinfo-range"></div>'
		);

		$(view.params.rangefilters).each( function(idx, e) {
			var dimparts = view.cube.dimensionParts(e.dimension);
			var piece = cubesviewer.views.cube.explore.drawInfoPiece(
					$(view.container).find('.cv-view-viewinfo-range'), "#ffe8dd", null, readonly,
					'<span class="ui-icon ui-icon-zoomin"></span> <span><b>Filter: </b> ' +
					dimparts.labelNoLevel +
					': </span><span class="rangefilter"></span>')
			var container = $('.rangefilter', piece);
			view.cubesviewer.views.cube.rangefilter.drawRangeFilter(view, e, container);

			piece.find('.cv-view-infopiece-close').click(function() {
				view.cubesviewer.views.cube.rangefilter.selectRangeFilter(view, e.dimension, "0");
			});
		});

		if (readonly) {
			$(view.container).find('.infopiece').find('.ui-icon-close')
					.parent().remove();
		}

	};


	this.drawRangeFilter = function(view, rangefilter, container) {

		var dimparts = view.cube.dimensionParts(rangefilter.dimension);

		$(container).append(
			'<input name="range_start" /> - '
			+ '<input name="range_end" /> '
		);

		var slider = dimparts.dimension.info["cv-rangefilter-slider"];
		if (slider != null) {
			$(container).append(
				'<div style="display: inline-block; margin-left: 8px; margin-right: 8px; vertical-align: middle;">' +
				'<span style="font-size: 70%;">' + slider.min + '</span>' +
				'<span class="slider-range" style="width: 180px; display: inline-block; margin-left: 6px; margin-right: 6px; vertical-align: middle;"></span>' +
				'<span style="font-size: 70%;">' + slider.max + '</span></div>'
			);
		}

		//$("[name='range_start']", container).attr('autocomplete', 'off');
		//$("[name='range_end']", container).attr('autocomplete', 'off');

		// Functionality
		$("input", container).change(function() {
			view.cubesviewer.views.cube.rangefilter._updateRangeFilter(view, rangefilter);
		});

		// Set initial values
		$("[name='range_start']", container).val(rangefilter.range_from);
		$("[name='range_end']", container).val(rangefilter.range_to);

		// Slider
		if (slider) {
			$(".slider-range", container).slider({
				range: true,
				min: slider.min ,
				max: slider.max ,
				step: slider.step ? slider.step : 1,
				values: [ rangefilter.range_from ? rangefilter.range_from : slider.min, rangefilter.range_to ? rangefilter.range_to : slider.max ],
				slide: function( event, ui ) {
					$("[name='range_start']", container).val(ui.values[ 0 ]);
					$("[name='range_end']", container).val(ui.values[ 1 ]);
				},
				stop: function(event, ui) {
					view.cubesviewer.views.cube.rangefilter._updateRangeFilter(view, rangefilter);
				}
			});
		}

	};

	this._updateRangeFilter = function (view, rangefilter) {
		var changed = false;
		var container = view.container;
		if (rangefilter.range_from != $("[name='range_start']", container).val()) {
			rangefilter.range_from = $("[name='range_start']", container).val();
			changed = true;
		}
		if (rangefilter.range_to != $("[name='range_end']", container).val()) {
			rangefilter.range_to = $("[name='range_end']", container).val();
			changed = true;
		}
		if (changed) view.cubesviewer.views.redrawView (view);
	};

	// Adds a date filter
	this.selectRangeFilter = function(view, dimension, enabled) {

		var cube = view.cube;

		// TODO: Show a notice if the dimension already has a date filter (? and cut filter)

		if (dimension != "") {
			if (enabled == "1") {
				view.params.rangefilters.push({
					"dimension" : dimension,
					"range_from" : null,
					"range_to" : null
				});
			} else {
				for ( var i = 0; i < view.params.rangefilters.length; i++) {
					if (view.params.rangefilters[i].dimension.split(':')[0] == dimension) {
						view.params.rangefilters.splice(i, 1);
						break;
					}
				}
			}
		} else {
			view.params.rangefilters = [];
		}

		view.cubesviewer.views.redrawView(view);

	};

	/*
	 * Composes a filter with appropriate syntax and time grain from a
	 * rangefilter
	 */
	this.rangefilterValue = function(rangefilter) {

		var range_from = rangefilter.range_from;
		var range_to = rangefilter.range_to;

		if ((range_from != null) || (range_to != null)) {
			var rangefiltervalue = "";
			if (range_from != null)
				rangefiltervalue = rangefiltervalue + range_from;
			rangefiltervalue = rangefiltervalue + "-";
			if (range_to != null)
				rangefiltervalue = rangefiltervalue + range_to;
			return rangefiltervalue;
		} else {
			return null;
		}

	};


	/*
	 * Builds Query Cuts (overrides default cube cut build function).
	 */
	this.buildQueryCuts = function(view) {

		// Include cuts and rangefilters
		var cuts = cubesviewer.views.cube.rangefilter._overridedbuildQueryCuts(view);

		$(view.params.rangefilters).each(function(idx, e) {
			var rangefiltervalue = view.cubesviewer.views.cube.rangefilter.rangefilterValue(e);
			if (rangefiltervalue != null) {
				cuts.push(e.dimension + ":" + rangefiltervalue);
			}
		});

		return cuts;

	};

}

/*
 * Extend model prototype to support rangefilter dimensions.
 */
cubes.Dimension.prototype.isRangeDimension = function() {

	return ("cv-rangefilter" in this.info && this.info["cv-rangefilter"] == true);

};

/*
 * Create object.
 */
cubesviewer.views.cube.rangefilter = new cubesviewerViewCubeRangeFilter();

/*
 * Override original Cut generation function to add support for rangefilters
 */
cubesviewer.views.cube.rangefilter._overridedbuildQueryCuts = cubesviewer.views.cube.buildQueryCuts;
cubesviewer.views.cube.buildQueryCuts = cubesviewer.views.cube.rangefilter.buildQueryCuts;

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.cube.rangefilter.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.rangefilter.onViewDraw);

