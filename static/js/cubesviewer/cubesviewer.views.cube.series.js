/*
 * CubesViewer
 * Copyright (c) 2012-2015 Jose Juan Montes, see AUTHORS for more details
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
 * SeriesTable object. This is part of the "cube" view. Allows the user to select
 * a dimension to use as horizontal axis of a table. This is later used to generate
 * charts.
 */
function cubesviewerViewCubeSeries() {

	this.cubesviewer = cubesviewer;

	this.onViewCreate = function(event, view) {
		$.extend(view.params, {
			"xaxis" : null,
			"yaxis" : null
		});
	}

	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {

		if (view.cube == null) return;

		// Series Mode button
		$(view.container).find('.cv-view-toolbar').find(".explorebutton").after(
			'<button class="cv-view-button-series" title="Series Table" style="margin-right: 5px;"><span class="ui-icon ui-icon-clock"></span></button>'
		);

		// Buttonize and event
		$(view.container).find('.cv-view-button-series').button();
		$(view.container).find('.cv-view-button-series').click(function() {
			view.cubesviewer.views.cube.series.modeSeries(view);
			return false;
		});
		$(view.container).find('.cv-view-button-series').mouseenter(function() {
			$('.cv-view-menu').hide();
		});

		if (view.params.mode != "series") return;

		// Draw areas
		view.cubesviewer.views.cube.series.drawInfo(view);

		// Highlight
		$(view.container).find('.cv-view-button-series').button("option", "disabled", "true").addClass('ui-state-active');

		// Explore menu
		view.cubesviewer.views.cube.series.drawSeriesMenu(view);

		// Only if data is empty
		if ($(view.container).find('.cv-view-viewdata').children().size() == 0) {
			$(view.container).find('.cv-view-viewdata').empty().append('<h3>Series Table</h3>');
		}

		// Load data
		view.cubesviewer.views.cube.series.loadData(view);

	};

	/*
	 * Updates view options menus.
	 */
	this.drawSeriesMenu = function (view) {

		var menu = $(".cv-view-menu-view", $(view.container));
		var cube = view.cube;

		// Add drill menu

		var drillElements = cubesviewer.views.cube.explore.getDrillElementsList(view, "cv-view-series-setxaxis", true);

		// Add measures menu
		var measuresElements = "";
		var measuresNames = [];
		$(view.cube.measures).each(function(idx, e) {

			measuresNames.push(e.name);

			var aggregates = $.grep(view.cube.aggregates, function(ia) { return ia.measure == e.name; } );
			if (aggregates.length > 0) {
				measuresElements = measuresElements + '<li><a href="#" onclick="return false;">' + e.label + '</a><ul style="width: 220px; z-index: 9999;">';
				$(aggregates).each(function(idx, ea) {
					measuresElements = measuresElements + '<li><a href="#" class="cv-view-series-setyaxis" data-measure="' + ea.ref + '">' + ea.label + '</a></li>';
				});
                measuresElements = measuresElements + '</ul></li>';
			}

		});

		var aggregates = $.grep(view.cube.aggregates, function(ia) { return (! ia.measure) || ($.inArray(ia.measure, measuresNames) == -1 ); } );
		if (aggregates.length > 0) {
			measuresElements = measuresElements + '<div class="ui-series-measures-sep"></div>';
			$(aggregates).each(function(idx, ea) {
				measuresElements = measuresElements + '<li><a href="#" class="cv-view-series-setyaxis" data-measure="' + ea.ref + '">' + ea.label + '</a></li>';
			});
		}


		/*
		$(view.cube.aggregates).each(function(idx, e) {
            measuresElements = measuresElements + '<li><a href="#" class="cv-view-series-setyaxis" data-measure="' + e.name + '">' + e.label||e.name + '</a></li>';
		});
		*/

		menu.append(
		  '<li><a href="#" onclick="return false;"><span class="ui-icon ui-icon-arrowthick-1-s"></span>Horizontal Dimension</a><ul style="width: 180px;">' +
		  		drillElements +
		  		'<div></div>' +
		  		'<li><a href="#" class="cv-view-series-setxaxis" data-dimension="">None</a></li>' +
		  '</ul><li><a href="#" onclick="return false;"><span class="ui-icon ui-icon-zoomin"></span>Measure</a><ul style="min-width: 180px;">' +
	  	  		measuresElements +
	  	  '</ul></li>'
		);

		$(menu).menu( "refresh" );
		$(menu).addClass("ui-menu-icons");

		// Events
		$(view.container).find('.cv-view-series-setyaxis').click(function() {
			view.cubesviewer.views.cube.series.selectYAxis(view, $(this).attr('data-measure'));
			return false;
		});
		$(view.container).find('.cv-view-series-setxaxis').click(function() {
			view.cubesviewer.views.cube.series.selectXAxis(view, $(this).attr('data-dimension'));
			return false;
		});

	};

	/*
	 * Change to series mode.
	 */
	this.modeSeries = function(view) {
		view.params.mode = "series";
		view.cubesviewer.views.redrawView(view);
	};

	/*
	 * Selects measure axis
	 */
	this.selectYAxis = function(view, measure) {
		view.params.yaxis = measure;
		view.cubesviewer.views.redrawView(view);
	}

	/*
	 * Selects horizontal axis
	 */
	this.selectXAxis = function(view, dimension) {
		view.params.xaxis = (dimension == "" ? null : dimension);
		view.cubesviewer.views.redrawView(view);
	}

	/*
	 * Load and draw current data
	 */
	this.loadData = function(view) {

		// Check if we can produce a table
		if (view.params.yaxis == null) {
			$(view.container).find('.cv-view-viewdata').empty().append(
					'<h3>Series Table</h3><div><i>Cannot present series table: no <b>measure</b> has been selected.</i></div>'
			);
			return;
		}

		// Build params and include xaxis if present
		view.cubesviewer.views.blockViewLoading(view);

		var browser_args = this.cubesviewer.views.cube.buildBrowserArgs(view, view.params.xaxis != null ? true : false, false);
		var browser = new cubes.Browser(view.cubesviewer.cubesserver, view.cube);
		var jqxhr = browser.aggregate(browser_args, view.cubesviewer.views.cube.series._loadDataCallback(view));
		jqxhr.always(function() {
			view.cubesviewer.views.unblockView(view);
		});

	};

	this._loadDataCallback = function(view) {

		var view = view;

		return function (data, status) {
			$(view.container).find('.cv-view-viewdata').empty();
			view.cubesviewer.views.cube.series.drawTable(view, data);
		};

	};

	/*
	 * Draws series table information (axis).
	 * First calls drawInfo in explore table in order to draw slice info and container.
	 */
	this.drawInfo = function(view) {

		cubesviewer.views.cube.explore.drawInfoPiece(
			$(view.container).find('.cv-view-viewinfo-extra'), "#ccccff", 350, true,
			'<span class="ui-icon ui-icon-zoomin"></span> <b>Measure:</b> ' + ( (view.params.yaxis != null) ? view.params.yaxis : "<i>None</i>")
		);

		if (view.params.xaxis != null) {
			cubesviewer.views.cube.explore.drawInfoPiece(
				$(view.container).find('.cv-view-viewinfo-extra'), "#ccddff", 350, true,
				'<span class="ui-icon ui-icon-arrowthick-1-s"></span> <b>Horizontal dimension:</b> ' + ( (view.params.xaxis != null) ? view.cube.cvdim_parts(view.params.xaxis).label : "<i>None</i>")
			);
		}

	};

	/*
	 * Draws series table.
	 */
	this.drawTable = function(view, data) {

		$(view.container).find('.cv-view-viewdata').empty();

		if (data.cells.length == 0) {
			$(view.container).find('.cv-view-viewdata').append(
				'<h3>Series Table</h3>' +
				'<div>Cannot present series table as no rows are returned by the current filtering, horizontal dimension, and drilldown combination.</div>'
			);
			return;
		}

		$(view.container).find('.cv-view-viewdata').append(
			'<h3>Series Table</h3>' +
			'<table id="seriesTable-' + view.id + '"></table>' +
			'<div id="seriesPager-' + view.id + '"></div>'
		);

		var colNames = [];
        var colLabels = [];
		var colModel = [];
		var dataRows = [];
		var dataTotals = [];

		// Process cells
		view.cubesviewer.views.cube.explore._sortData (view, data.cells, view.params.xaxis != null ? true : false);
		view.cubesviewer.views.cube.series._addRows (view, dataRows, dataTotals, colNames, colModel, data);

        colNames.forEach(function (e) {
            var colLabel = null;
            $(view.cube.aggregates).each(function (idx, ag) {
                if (ag.name == e) {
                    colLabel = ag.label||ag.name;
                    return false;
                }
            });
            if (!colLabel) {
                $(view.cube.measures).each(function (idx, me) {
                    if (me.name == e) {
                        colLabel = me.label||ag.name;
                        return false;
                    }
                });
            }
            //colLabel = view.cube.getDimension(e).label
            colLabels.push(colLabel||e);
        });

		$('#seriesTable-' + view.id).jqGrid({
			data: dataRows,
			//userData: dataTotals,
			datatype: "local",
			height: 'auto',
			rowNum: cubesviewer.options.pagingOptions[0],
			rowList: cubesviewer.options.pagingOptions,
			colNames: colLabels,
			colModel: colModel,
	        pager: "#seriesPager-" + view.id,
	        sortname: cubesviewer.views.cube.explore.defineColumnSort(view, ["key", "desc"])[0],
	        viewrecords: true,
	        sortorder: cubesviewer.views.cube.explore.defineColumnSort(view, ["key", "desc"])[1],
	        //footerrow: true,
	        userDataOnFooter: true,
	        forceFit: false,
	        shrinkToFit: false,
	        width: cubesviewer.options.tableResizeHackMinWidth,
	        //multiselect: true,
	        //multiboxonly: true,

	        //caption: "Current selection data" ,
	        beforeSelectRow : function () { return false; },

			loadComplete : function() {
				// Call hook
				view.cubesviewer.views.cube.explore.onTableLoaded (view);
			},

	        resizeStop: view.cubesviewer.views.cube.explore._onTableResize (view),
			onSortCol: view.cubesviewer.views.cube.explore._onTableSort (view),

	    } );

		this.cubesviewer.views.cube._adjustGridSize();

	};

	/*
	 * Adds rows. This case is particular because the first level of drilldown may be the
	 * horizontal dimension.
	 */
	this._addRows = function (view, rows, dataTotals, colNames, colModel, data) {

		// Copy drilldown as we'll modify it
		var drilldown = view.params.drilldown.slice(0);

		// Include X Axis if necessary
		if (view.params.xaxis != null) {
			drilldown.splice(0,0, view.params.xaxis);
		}
		var baseidx = ((view.params.xaxis == null) ? 0 : 1);

		$(data.cells).each(function (idx, e) {

			var row = [];
			var key = [];

			// For the drilldown level, if present
			for (var i = 0; i < drilldown.length; i++) {

				// Get dimension
				var parts = view.cube.cvdim_parts(drilldown[i]);
				var infos = parts.hierarchy.readCell(e, parts.level);

				// Values and Labels
				var drilldown_level_values = [];
				var drilldown_level_labels = [];

				$(infos).each(function(idx, info) {
					drilldown_level_values.push (info.key);
					drilldown_level_labels.push (info.label);
				});

				key.push (drilldown_level_labels.join(" / "));

			}

			// Set key
			var colKey = (view.params.xaxis == null) ? view.params.yaxis : key[0];
			var value = (e[view.params.yaxis]);
			var rowKey = (view.params.xaxis == null) ? key.join (' / ') : key.slice(1).join (' / ');

			// Search or introduce
			var row = $.grep(rows, function(ed) { return ed["key"] == rowKey; });
			if (row.length > 0) {
				row[0][colKey] = value;
			} else {
				var newrow = {};
				newrow["key"] = rowKey;
				newrow[colKey] = value;

				for (var i = baseidx ; i < key.length; i++) {
					newrow["key" + (i - baseidx)] = key[i];
				}

				rows.push ( newrow );
			}

			if (colNames.indexOf(colKey) < 0) {
				colNames.push (colKey);
				colModel.push ({
					name: colKey, index: colKey, align: "right", sorttype: "number", width: cubesviewer.views.cube.explore.defineColumnWidth(view, colKey, 75),
			        formatter: 'number',
			        formatoptions: { decimalSeparator:".", thousandsSeparator: " ", decimalPlaces: 2 }
				});
			}


		});

		//var label = [];
		$(view.params.drilldown).each (function (idx, e) {
			//label.push (view.cube.cvdim_dim(e).label);
			colNames.splice(idx, 0, view.cube.cvdim_dim(e).label);
			colModel.splice(idx, 0, { name: "key" + idx , index: "key" + idx , align: "left", width: cubesviewer.views.cube.explore.defineColumnWidth(view, "key" + idx, 190) });
		});

		dataTotals["key0"] = "<b>Summary</b>";

		if (view.params.drilldown.length == 0) {
			rows[0]["key0"] = view.params.yaxis;
			colNames.splice(0, 0, "Measure");
			colModel.splice(0, 0, { name: "key0", index: "key0", align: "left", width: cubesviewer.views.cube.explore.defineColumnWidth(view, "key0", 190) });
		}

	};

};

/*
 * Create object.
 */
cubesviewer.views.cube.series = new cubesviewerViewCubeSeries();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.cube.series.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.series.onViewDraw);
