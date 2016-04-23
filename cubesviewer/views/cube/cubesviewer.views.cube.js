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

		view.cube = null;

		var jqxhr = cubesviewer.cubesserver.get_cube(view.params.cubename, function(cube) {
			view.cube = cube;

			// Apply parameters if cube metadata contains specific cv-view-params
			if ('cv-view-params' in cube.info) $.extend(view.params, cube.info['cv-view-params']);

		    if (view.state == cubesviewer.views.STATE_INITIALIZED) cubesviewer.views.redrawView(view);
		});
		if (jqxhr) {
			jqxhr.fail(function() {
				view.state = cubesviewer.views.STATE_ERROR;
				cubesviewer.views.redrawView(view);
			});
		}

	};

	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {

		// Check if the model/cube is loaded.
		if (view.cube == null) {
			$(view.container).append("Loading...");
			event.stopImmediatePropagation();
			return;
		}

		/*
		if ($(".cv-view-viewdata", view.container).size() == 0) {
			$(view.container).empty();
		}
		*/

		view._ractive = new Ractive({
			el: view.container,
			template: cvtemplates.views_cube,
			partials: cvtemplates,
			data: { 'view': view }
		});
		$('[data-submenu]', view.container).submenupicker();


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
	this.buildBrowserArgs = function(view, includeXAxis, onlyCuts) {

		// "lang": view.cubesviewer.options.cubesLang

		var args = {};

		if (!onlyCuts) {

			var drilldowns = view.params.drilldown.slice(0);

			// Include X Axis if necessary
			if (includeXAxis) {
				drilldowns.splice(0, 0, view.params.xaxis);
			}

			// Preprocess
			for (var i = 0; i < drilldowns.length; i++) {
				drilldowns[i] = cubes.drilldown_from_string(view.cube, view.cube.cvdim_parts(drilldowns[i]).fullDrilldownValue);
			}

			// Include drilldown array
			if (drilldowns.length > 0)
				args.drilldown = cubes.drilldowns_to_string(drilldowns);
		}

		// Cuts
		var cuts = cubesviewer.views.cube.buildQueryCuts(view);
		if (cuts.length > 0) args.cut = new cubes.Cell(view.cube, cuts);

		return args;

	}

	/*
	 * Builds Query Cuts
	 */
	this.buildQueryCuts = function(view) {

		// Include cuts
		var cuts = [];
		$(view.params.cuts).each(function(idx, e) {
			var invert = e.invert ? "!" : "";
			cuts.push(cubes.cut_from_string (view.cube, invert + e.dimension + ":" + e.value));
		});

		return cuts;
	};

	/**
	 * Accepts an aggregation or a measure and returns the formatter function.
	 */
	this.columnFormatFunction = function(view, agmes) {

		var measure = agmes;
		if ('measure' in agmes) {
			measure = $.grep(view.cube.measures, function(item, idx) { return item.ref == agmes.measure })[0];
		}

		var formatterFunction = null;
		if (measure && ('cv-formatter' in measure.info)) {
			formatterFunction = function(value) {
				return eval(measure.info['cv-formatter']);
			};
		} else {
			formatterFunction = function(value) {
				return Math.formatnumber(value, (agmes.ref=="record_count" ? 0 : 2));
			};
		}

		return formatterFunction;
	};


};

Math.formatnumber = function(value, decimalPlaces, decimalSeparator, thousandsSeparator) {


	if (value === undefined) return "";

	if (decimalPlaces === undefined) decimalPlaces = 2;
	if (decimalSeparator === undefined) decimalSeparator = ".";
	if (thousandsSeparator === undefined) thousandsSeparator = " ";

	var result = "";


	var intString = Math.floor(value).toString();
	for (var i = 0; i < intString.length; i++) {
		result = result + intString[i];
		var invPos = (intString.length - i - 1);
		if (invPos > 0 && invPos % 3 == 0) result = result + thousandsSeparator;
	}
	if (decimalPlaces > 0) {
		result = result + parseFloat(value - Math.floor(value)).toFixed(decimalPlaces).toString().replace(".", decimalSeparator).substring(1);
	}

	return result;
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

