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
 * Adds support for filter dialogs for dimensions. Note that
 * filtering support is available from other plugins. Default filtering
 * features are included in the normal explore view (user
 * can select values after drilling down). This plugin adds
 * more flexibility.
 */
function cubesviewerViewCubeDimensionFilter () {

	this.cubesviewer = cubesviewer;

	this.onViewCreate = function(event, view) {

		/*
		$.extend(view.params, {

		});
		*/

		view.dimensionFilter = null;

	}


	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {

		if (view.cube == null) return;
		var cube = view.cube;

		// Draw menu options (depending on mode)
		view.cubesviewer.views.cube.dimensionfilter.drawFilterMenu(view);

		// Update info boxes to include edition
		view.cubesviewer.views.cube.dimensionfilter.addFilterLinksToInfo(view);

		if (view.dimensionFilter != null) {
			view.cubesviewer.views.cube.dimensionfilter.drawDimensionFilter(view, view.dimensionFilter);
		}

	};


	/*
	 * Draw view options as appropriate.
	 */
	this.drawFilterMenu = function(view) {

		var cube = view.cube;
		var menu = $(".cv-view-menu-cut", $(view.container));

		var dimensionFilterElements = cubesviewer.views.cube.explore.getDrillElementsList(view, "cv-view-show-dimensionfilter", false);

		$(".ui-explore-cut-clearsep", menu).before(
				'<li><a href="#" onclick="return false;"><span class="ui-icon ui-icon-zoomin"></span>Dimension filter</a><ul class="dimensionFilterList" style="width: 180px;">' +
				dimensionFilterElements +
				'</ul></li>'
		);

		$(menu).menu("refresh");
		$(menu).addClass("ui-menu-icons");

		// Events
		$(view.container).find('.cv-view-show-dimensionfilter').click( function() {
			cubesviewer.views.cube.dimensionfilter.drawDimensionFilter(view, $(this).attr('data-dimension'));
			return false;
		});

	};

	/**
	 * Adds edit icons to info boxes so filtering can be accessed quickly for existing filters.
	 */
	this.addFilterLinksToInfo = function (view) {

		// Cut pieces

		$(view.container).find('.cv-view-infopiece-cut').each (function (idx, e) {
			$(e).find('button').last().before(
				'<button style="display: inline-block;" class="cv-view-infopiece-cut-editcut"><span class="ui-icon ui-icon-zoomin"></span></button></div>'
			);
		});
		$(view.container).find('.cv-view-viewinfo-cut').find('button.cv-view-infopiece-cut-editcut').button().find('span').css('padding', '0px');
		$(view.container).find('.cv-view-viewinfo-cut').find('button.cv-view-infopiece-cut-editcut').click(function () {
			var dimensionString = $(this).parents('.cv-view-infopiece-cut').first().attr('data-dimension');
			var parts = view.cube.cvdim_parts(dimensionString);
			var depth = $(this).parents('.cv-view-infopiece-cut').first().attr('data-value').split(';')[0].split(",").length;
			cubesviewer.views.cube.dimensionfilter.drawDimensionFilter(view, dimensionString + ":" + parts.hierarchy.levels[depth - 1] );
		});

		// Drilldown pieces

		$(view.container).find('.cv-view-infopiece-drilldown').each (function (idx, e) {
			$(e).find('button').last().before(
				'<button style="display: inline-block;" class="cv-view-infopiece-drilldown-editcut"><span class="ui-icon ui-icon-zoomin"></span></button></div>'
			);
		});
		$(view.container).find('.cv-view-viewinfo-drill').find('button.cv-view-infopiece-drilldown-editcut').button().find('span').css('padding', '0px');
		$(view.container).find('.cv-view-viewinfo-drill').find('button.cv-view-infopiece-drilldown-editcut').click(function () {
			var dimensionString = $(this).parents('.cv-view-infopiece-drilldown').first().attr('data-dimension');
			cubesviewer.views.cube.dimensionfilter.drawDimensionFilter(view, dimensionString );
		});

	};

	/*
	 * Shows the dimension filter
	 */
	this.drawDimensionFilter = function (view, dimension) {

		var parts = view.cube.cvdim_parts(dimension);

		// Clean interface if a filter was already open
		$(view.container).find('.cv-view-dimensionfilter').remove();

		$(view.container).find(".cv-view-viewinfo").append('<div class="cv-view-dimensionfilter cv-view-info-panel infopiece ui-widget ui-corner-all" style="background-color: #ffcccc;"><h3>Dimension filter: ' + parts.label + '</h3><div class="cv-view-dimensionfilter-cont"></div></div>');

		// Draw value container

		$(view.container).find('.cv-view-dimensionfilter-cont').append (
				'<div style="margin-top: 5px; margin-bottom: 5px;">' +
				' Search: <input style="width: 270px;" name="dimensionfilter-list-search" />' +
				'</div>' +
				'<div class="cv-view-dimensionfilter-list" style="max-height: 300px; overflow-x: hidden; overflow-y: auto; max-width: 580px; "><i>Loading...</i></div>'
		);
		$(view.container).find("[name=dimensionfilter-list-search]").on ("input", function() {
				view.cubesviewer.views.cube.dimensionfilter.searchDimensionValues( view, $(view.container).find("[name=dimensionfilter-list-search]").val() );
			}
		);

		$(view.container).find(".cv-view-dimensionfilter-cont").append (
				'<div style="margin-top: 10px;">' +
				'<button class="cv-views-dimensionfilter-apply">Apply</button>' +
				'<button class="cv-views-dimensionfilter-cancel">Close</button>' +
				'<div id="cv-views-dimensionfilter-cols-' + view.id + '" class="cv-views-dimensionfilter-cols" style="display: inline-block; margin-left: 15px; margin-right: 15px; padding: 0px;">' +
			    '<input type="radio" name="cv-views-dimensionfilter-col" id="cv-views-dimensionfilter-col1-' + view.id + '" /><label for="cv-views-dimensionfilter-col1-' + view.id + '">1 col</label>' +
			    '<input type="radio" name="cv-views-dimensionfilter-col" id="cv-views-dimensionfilter-col2-' + view.id + '" checked="checked" /><label for="cv-views-dimensionfilter-col2-' + view.id + '">2 cols</label>' +
			    '</div>' +
				'<button class="cv-views-dimensionfilter-selectall">Select All</button>' +
				'<button style="margin-right: 15px;" class="cv-views-dimensionfilter-selectnone">Select None</button>' +
				'<button class="cv-views-dimensionfilter-drill">Drilldown this</button>' +
				'</div>'
		);
		$(view.container).find(".cv-views-dimensionfilter-apply").button().click(function() {
			view.cubesviewer.views.cube.dimensionfilter.applyFilter( view, dimension );
		});
		$(view.container).find(".cv-views-dimensionfilter-cancel").button().click(function() {
			view.dimensionFilter = null;
			$(view.container).find('.cv-view-dimensionfilter').remove();
		});

		$(view.container).find("#cv-views-dimensionfilter-cols-" + view.id).buttonset();
		$(view.container).find("#cv-views-dimensionfilter-col1-" + view.id).click(function() {
			view.cubesviewer.views.cube.dimensionfilter.drawDimensionValuesCols( view, 1 );
		});
		$(view.container).find("#cv-views-dimensionfilter-col2-" + view.id).click(function() {
			view.cubesviewer.views.cube.dimensionfilter.drawDimensionValuesCols( view, 2 );
		});

		$(view.container).find(".cv-views-dimensionfilter-selectall").button().click(function() {
			// Clear previous selected items before applying new clicks
			$(view.container).find(".cv-view-dimensionfilter-list").find(":checkbox").filter(":checked").trigger('click');
			$(view.container).find(".cv-view-dimensionfilter-list").find(":checkbox:visible").trigger('click');
		});
		$(view.container).find(".cv-views-dimensionfilter-selectnone").button().click(function() {
			$(view.container).find(".cv-view-dimensionfilter-list").find(":checkbox").filter(":checked").trigger('click');
		});

		$(view.container).find(".cv-views-dimensionfilter-drill").button().click(function() {
			cubesviewer.views.cube.explore.selectDrill(view, parts.fullDrilldownValue, "1");
			return false;
		});

		// Obtain data
		view.cubesviewer.views.cube.dimensionfilter.loadDimensionValues(view, dimension);

	};


	/*
	 * Load and draw dimension values.
	 */
	this.loadDimensionValues = function(view, tdimension) {

		view.dimensionFilter = tdimension;

		var parts = view.cube.cvdim_parts(tdimension);

		var params = {
				"hierarchy": parts.hierarchy.name,
				"depth": parts.depth
		};

		//view.cubesviewer.views.blockViewLoading(view);

		view.cubesviewer.cubesRequest(
                // Doc says it's dimension, not members
				"/cube/" + view.cube.name + "/members/" + parts.dimension.name,
				params,
				view.cubesviewer.views.cube.dimensionfilter._loadDimensionValuesCallback(view, tdimension),
				function() {
					//view.cubesviewer.views.unblockView(view);
				}
		);

	};

	/*
	 * Updates info after loading data.
	 */
	this._loadDimensionValuesCallback = function(view, dimension) {

		var view = view;
		var dimension = dimension;

		return function(data, status) {
			// Draw dimension values for the filter
			view.cubesviewer.views.cube.dimensionfilter.drawDimensionValues(view, dimension, data);
		};

	};

	/*
	 * Shows the dimension filter
	 */
	this.drawDimensionValuesCols = function (view, cols) {

		$(view.container).find(".cv-view-dimensionfilter-list").find("input").each (function (idx, e) {
			if (cols == 1) {
				$(e).parents('.cv-view-dimensionfilter-item').first().css("display", "inline-block");
				$(e).parents('.cv-view-dimensionfilter-item').first().css("width", "98%");
			} else {
				$(e).parents('.cv-view-dimensionfilter-item').first().css("display", "inline-block");
				$(e).parents('.cv-view-dimensionfilter-item').first().css("width", "48%");
			}
		} );

		var search = $(view.container).find("[name=dimensionfilter-list-search]").val();
		view.cubesviewer.views.cube.dimensionfilter.searchDimensionValues(view, search);

	};

	/*
	 * Shows the dimension filter
	 */
	this.drawDimensionValues = function (view, tdimension, data) {

		$(view.container).find(".cv-view-dimensionfilter-list").empty();

		// Get dimension
		var dimension = view.cube.cvdim_dim(tdimension);

		$(data.data).each( function(idx, e) {

			// Get dimension
			var parts = view.cube.cvdim_parts(tdimension);
			var infos = parts.hierarchy.readCell(e, parts.level);

			// Values and Labels
			var drilldown_level_values = [];
			var drilldown_level_labels = [];

			$(infos).each(function(idx, info) {
				drilldown_level_values.push (info.key);
				drilldown_level_labels.push (info.label);
			});

			$(view.container).find(".cv-view-dimensionfilter-list").append(
				'<div class="cv-view-dimensionfilter-item"><label><input type="checkbox" style="vertical-align: middle;" value="' + drilldown_level_values.join (',') + '" /> ' +
				drilldown_level_labels.join(' / ') +
				'</label></div>'
			);

		});

		// Update selected
		view.cubesviewer.views.cube.dimensionfilter.updateFromCut(view, tdimension);

	};

	/*
	 * Searches labels by string and filters from view.
	 */
	this.searchDimensionValues = function(view, search) {

		$(view.container).find(".cv-view-dimensionfilter-list").find("input").each (function (idx, e) {
			if ((search == "") || ($(e).parent().text().toLowerCase().indexOf(search.toLowerCase()) >= 0)) {
				$(e).parents('.cv-view-dimensionfilter-item').first().show();
			} else {
				$(e).parents('.cv-view-dimensionfilter-item').first().hide();
			}
		} );

	};

	/*
	 * Updates selection after loading data.
	 */
	this.updateFromCut = function(view, dimensionString) {

		var parts = view.cube.cvdim_parts(dimensionString);
		var cutDimension = parts.dimension.name + ( parts.hierarchy.name != "default" ? "@" + parts.hierarchy.name : "" );

		var filterValues = [];
		for (var i = 0; i < view.params.cuts.length ; i++) {
			if (view.params.cuts[i].dimension == cutDimension) {
				filterValues = view.params.cuts[i].value.split(";");
				break;
			}
		}

		if (filterValues.length > 0) {
			$(view.container).find(".cv-view-dimensionfilter-list").find("input").each (function (idx, e) {
				for (var i = 0; i < filterValues.length; i++) {
					if ($(e).attr("value") == filterValues[i]) {
						$(e).attr("checked", "checked");
					}
				}
			} );
		}

	};

	/*
	 * Updates info after loading data.
	 */
	this.applyFilter = function(view, dimensionString) {

		var parts = view.cube.cvdim_parts(dimensionString);

		checked = $(view.container).find(".cv-view-dimensionfilter-list").find("input:checked");

		// Empty selection would yield no result
		/*
		if (checked.size() == 0) {
			view.cubesviewer.alert('Cannot filter. No values are selected.');
			return;
		}
		*/

		var filterValues = [];
		// If all values are selected, the filter is empty and therefore removed by selectCut
		if (checked.size() < $(view.container).find(".cv-view-dimensionfilter-list").find("input").size()) {
			$(view.container).find(".cv-view-dimensionfilter-list").find("input:checked").each(function (idx, e) {
				filterValues.push( $(e).attr("value") );
			});
		}

		var cutDimension = parts.dimension.name + ( parts.hierarchy.name != "default" ? "@" + parts.hierarchy.name : "" );
		cubesviewer.views.cube.explore.selectCut(view, cutDimension, filterValues.join(";"));

	};

}


/*
 * Create object.
 */
cubesviewer.views.cube.dimensionfilter = new cubesviewerViewCubeDimensionFilter();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.cube.dimensionfilter.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.dimensionfilter.onViewDraw);

