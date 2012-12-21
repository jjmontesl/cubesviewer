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

function cubesviewerViewCubeExplore() {

	this.cubesviewer = cubesviewer; 

	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {
		
		// Add icon to toolbar
		$(view.container).find('.cv-view-toolbar').prepend(
			'<button class="explorebutton" title="Explore" style="margin-right: 10px;"><span class="ui-icon ui-icon-circle-arrow-s"></span></button>'
		);
			
		// Buttonize
		$(view.container).find('.explorebutton').button();
		$(view.container).find('.explorebutton').click(function() { 
			view.cubesviewer.views.cube.explore.modeExplore(view);
			return false;
		});	
		$(view.container).find('.explorebutton').mouseenter(function() {
			$('.cv-view-menu').hide();
		});
		
		if (view.params.mode != "explore") return;
		
		$(view.container).find('.cv-view-viewdata').append('<h3>Aggregated Data</h3>');
		
		// Draw areas
		view.cubesviewer.views.cube.explore.drawInfo(view);

		// Highlight
		$(view.container).find('.explorebutton').button("option", "disabled", "true").addClass('ui-state-active');
		
		// Explore menu
		view.cubesviewer.views.cube.explore.drawExploreMenu(view);
		
		// Load data
		view.cubesviewer.views.cube.explore.loadData(view);
		
	};

	/*
	 * Builds the explore menu drilldown options.
	 */
	this.drawExploreMenuDrilldown = function(view) {
		
		var menu = $(".cv-view-menu-view", $(view.container));
		var cube = view.cube;
		
		var drillElements = "";

		$(cube.dimensions).each( function(idx, e) {
			
			var dimension = $.grep(cubesviewer.model.dimensions, function(ed) {
				return ed.name == e;
			})[0];

			if (dimension.is_flat) {
				// Don't show drilldown option if dimension is
				// filtered (besides, this query causes a server error)
				// TODO: Handle this for non-flat dimensions too
				var disabled = "";
				if ((($.grep(view.params.drilldown, function(ed) { return ed == dimension.name; })).length > 0)) {
					disabled = "ui-state-disabled";
				}
				drillElements = 
					drillElements + 
					'<li><a href="#" class="selectDrill ' + disabled + '" data-dimension="' + dimension.name + '" data-value="1">' +
					dimension.label + '</a></li>';
			} else {
				drillElements = drillElements + '<li><a href="#">' + dimension.label + 
					'</a><ul class="drillList" style="width: 180px; z-index: 9999;">';
				
				$(dimension.levels).each(function(idx, el) { 
					drillElements = drillElements + '<li><a href="#" class="selectDrill" data-dimension="' + dimension.name + ':'+ 
						el.name + '" data-value="1">' + el.label + '</a></li>';
				});
				drillElements = drillElements + '</ul></li>';
			}

		});
		
		menu.append(
			'<li><a href="#"><span class="ui-icon ui-icon-arrowthick-1-s"></span>Drill down</a><ul class="drillList" style="width: 180px;">' + 
			drillElements + '<div></div>' + '<li><a href="#" class="selectDrill" data-dimension=""><span class="ui-icon ui-icon-arrowthick-1-n" >' +
			'</span><i>None</i></a></li>' + '</ul></li>'
		);
		
	}	
	
	/*
	 * Builds the explore menu drilldown options.
	 */
	this.drawExploreMenuDatefilter = function(view) {
		
		var menu = $(".cv-view-menu-view", $(view.container));
		var cube = view.cube;	
	
		var dateFilterElements = "";
		$(cube.dimensions).each( function(idx, e) {

			var dimension = $.grep(cubesviewer.model.dimensions, function(ed) {
				return ed.name == e;
			})[0];
			
			if (cubesviewer.isDateDimension(dimension)) {

				var disabled = "";
				dateFilterElements = dateFilterElements + '<li><a href="#" class="selectDateFilter '  + disabled + 
					'" data-dimension="' + dimension.name + '" data-value="1">' + dimension.label + '</a></li>';
			}

		});
		
		menu.append(
				'<div></div>' + 
				'<li><a href="#" class="selectCut" data-dimension="" data-value="" ><span class="ui-icon ui-icon-close"></span>Clear all filters</a></li>' +
				'<li><a href="#" class="explore-filterselected" ><span class="ui-icon ui-icon-zoomin"></span>Filter selected</a></li>' + 
				'<li><a href="#"><span class="ui-icon ui-icon-zoomin"></span>Add date filter</a><ul class="dateFilterList" style="width: 180px;">' + 
				dateFilterElements + 
				'</ul></li>'
		);
		
	}
	
	/* 
	 * Draw view options as appropriate.
	 */
	this.drawExploreMenu = function(view) {

		var menu = $(".cv-view-menu-view", $(view.container));
		var cube = view.cube;

		this.drawExploreMenuDrilldown (view);
		this.drawExploreMenuDatefilter (view);

		$(menu).menu("refresh");
		$(menu).addClass("ui-menu-icons");
		
		// Events
		$(view.container).find('.selectDrill').click( function() {
			cubesviewer.views.cube.explore.selectDrill(view, $(this).attr('data-dimension'), $(this).attr('data-value'));
			return false;
		});			
		$(view.container).find('.explore-filterselected').click(function() {
			cubesviewer.views.cube.explore.filterSelected(view);
			return false;
		});
		$(view.container).find('.selectCut').click( function() {
			cubesviewer.views.cube.explore.selectCut(view, $(this).attr('data-dimension'), $(this).attr('data-value'));
			return false;
		});
		$(view.container).find('.selectDateFilter').click( function() {
			cubesviewer.views.cube.explore.selectDateFilter(view, $(this).attr('data-dimension'), $(this).attr('data-value'));
			return false;
		});
		
	};	
	
	/*
	 * Change to explore mode.
	 */ 
	this.modeExplore = function(view) {
		view.params.mode = "explore";
		view.cubesviewer.views.redrawView(view);
	};
	
	/*
	 * Load and draw current data in explore mode.
	 */
	this.loadData = function(view) {

		var params = this.cubesviewer.views.cube.buildQueryParams(view, false, false);

		$(view.container).find('.cv-view-viewdata').empty().append(
				'<h3>Aggregated Data</h3>' +
				'<img style="vertical-align: middle;" src="' + cubesviewer.options.ajaxLoaderUrl + '" title="Loading..." /> <i>Loading</i>'
		);
		
		$.get(this.cubesviewer.options.cubesUrl + "/cube/" + view.cube.name + "/aggregate",
				params, this.cubesviewer.views.cube.explore._loadDataCallback(view), "json");

	};

	/*
	 * Updates info after loading data.
	 */
	this._loadDataCallback = function(view) {
		var view = view;
		return function(data, status) {
			$(view.container).find('.cv-view-viewdata').empty();
			view.cubesviewer.views.cube.explore.drawSummary(view, data);
		}

		this.cubesviewer.view.adjustGridSize();
	};

	// Sort data according to current drilldown ordering
	this._sortData = function(view, data, includeXAxis) {
		//data.sort(cubesviewer._drilldownSortFunction(view.id, includeXAxis));
	};

	/*
	 * 
	 */
	this._drilldownSortFunction = function(view, includeXAxis) {
		
		var drilldown = view.params.drilldown.slice(0);

		// Include X Axis if necessary
		if (includeXAxis) {
			drilldown.splice(0, 0, view.params.xaxis);
		}

		return function(a, b) {

			// For the horizontal axis drilldown level, if present
			for ( var i = 0; i < drilldown.length; i++) {

				// Get dimension
				var dimension = view.cubesviewer.getDimension(drilldown[i]);

				// row["key"] = ((e[view.params.drilldown_field] != null) &&
				// (e[view.params.drilldown] != "")) ? e[view.params.drilldown] : "Undefined";
				if (dimension.is_flat == true) {
					if (a[dimension.name] < b[dimension.name])
						return -1;
					if (a[dimension.name] > b[dimension.name])
						return 1;
				} else {
					var drilldown_level_value = [];
					for ( var j = 0; j < dimension.levels.length; j++) {
						var fieldname = dimension.name + "."
								+ dimension.levels[j].name;
						if ((fieldname in a) && (fieldname in b)) {
							if (a[fieldname] < b[fieldname])
								return -1;
							if (a[fieldname] > b[fieldname])
								return 1;
						} else {
							break;
						}
					}
				}
			}

			return 0;
		};
	},

	this._addRows = function(view, rows, data) {

		$(data.cells).each( function(idx, e) {

			var nid = [];
			var row = [];
			var key = [];

			// For each drilldown level
			for ( var i = 0; i < view.params.drilldown.length; i++) {

				// Get dimension
				var dimension = cubesviewer.getDimension(view.params.drilldown[i]);

				// row["key"] = ((e[view.params.drilldown_field] !=
				// null) && (e[view.params.drilldown] != "")) ?
				// e[view.params.drilldown] : "Undefined";
				if (dimension.is_flat == true) {
					nid.push(e[dimension.name]);
					key
							.push('<a href="#" onclick="'
									+ "cubesviewer.views.cube.explore.selectCut(cubesviewer.views.getParentView(this), $(this).attr('data-dimension'), $(this).attr('data-value')); return false;"
									+ '" class="selectCut" data-dimension="'
									+ dimension.name
									+ '" data-value="'
									+ e[dimension.name] + '">'
									+ e[dimension.name]
									+ '</a>');
				} else {
					var drilldown_level_value = [];
					for ( var j = 0; j < dimension.levels.length; j++) {
						var fieldname = dimension.name + "."
								+ dimension.levels[j].name;
						if (fieldname in e) {
							drilldown_level_value
									.push(e[fieldname]);
						} else {
							break;
						}
					}
					nid.push(drilldown_level_value.join("-"));
					key.push('<a href="#"  onclick="' + "cubesviewer.selectCut(cubesviewer.views.getParentView(this), $(this).attr('data-dimension'), $(this).attr('data-value')); return false;"
							+ '" class="selectCut" data-dimension="'
							+ dimension.name
							+ '" data-value="'
							+ drilldown_level_value
									.join(",")
							+ '">'
							+ drilldown_level_value
									.join(" / ")
							+ '</a>');
				}
			}

			// Set key
			row["key"] = key.join(' / ');

			for ( var column in data.summary) {
				row[column] = e[column];
			}

			row["id"] = nid.join('-');
			rows.push(row);
		});

		// Copy summary if there's no data
		// This allows a scrollbar to appear in jqGrid when only the summary row is shown. 
		if (rows.length == 0) {
			var row = [];
			row["key"] = "Summary";
			for ( var column in data.summary) {
				row[column] = data.summary[column];
			}
			rows.push(row);
		}
		
	},

	/*
	 * Show received summary
	 */ 
	this.drawSummary = function(view, data) {

		var cubesviewer = view.cubesviewer;
		
		$(view.container).find('.cv-view-viewdata').empty();
		$(view.container).find('.cv-view-viewdata').append(
				'<h3>Aggregated Data</h3>' + '<table id="summaryTable-'
						+ view.id + '"></table>' + '<div id="summaryPager-'
						+ view.id + '"></div>');

		var colNames = [];
		var colModel = [];
		var dataRows = [];
		var dataTotals = [];

		for ( var column in data.summary) {
			colNames.push(column);
			colModel.push({
				name : column,
				index : column,
				align : "right",
				sorttype : "number",
				width : 105,
				formatter: 'number',  
				formatoptions: { decimalSeparator:".", thousandsSeparator: " ", decimalPlaces: 2 }
			});
			dataTotals[column] = data.summary[column];
		}

		colNames.sort();
		colModel.sort(function(a, b) {
			return (a.name < b.name ? -1 : (a.name == b.name ? 0 : 1));
		});

		// If there are cells, show them
		cubesviewer.views.cube.explore._sortData(view, data.cells, false);
		cubesviewer.views.cube.explore._addRows(view, dataRows, data);

		var label = [];
		$(view.params.drilldown).each(function(idx, e) {
			label.push(cubesviewer.getDimension(e).label);
		})
		colNames.splice(0, 0, label.join(' / '));

		colModel.splice(0, 0, {
			name : "key",
			index : "key",
			align : "left",
			width: 130 + (80 * view.params.drilldown.length)
		});
		dataTotals["key"] = ((view.params.cuts.length == 0) && (view.params.datefilters.length == 0)) ? "<b>Summary</b>"
				: "<b>Summary <i>(Filtered)</i></b>";

		$('#summaryTable-' + view.id).get(0).updateIdsOfSelectedRows = function(
				id, isSelected) {
			var index = $.inArray(id,
					$('#summaryTable-' + view.id).get(0).idsOfSelectedRows);
			if (!isSelected && index >= 0) {
				$('#summaryTable-' + view.id).get(0).idsOfSelectedRows.splice(
						index, 1); // remove id from the list
			} else if (index < 0) {
				$('#summaryTable-' + view.id).get(0).idsOfSelectedRows.push(id);
			}
		};

		$('#summaryTable-' + view.id).get(0).idsOfSelectedRows = [];
		$('#summaryTable-' + view.id)
				.jqGrid(
						{
							data : dataRows,
							userData : dataTotals,
							datatype : "local",
							height : 'auto',
							rowNum : 15,
							rowList : [ 15, 30, 50, 100 ],
							colNames : colNames,
							colModel : colModel,
							pager : "#summaryPager-" + view.id,
							sortname : 'key',
							viewrecords : true,
							sortorder : "desc",
							footerrow : true,
							userDataOnFooter : true,
							forceFit : false,
							shrinkToFit : false,
							// autowidth: true,
							multiselect : true,
							multiboxonly : true,

							// caption: "Current selection data" ,
							// beforeSelectRow : function () { return false; }

							onSelectRow : $('#summaryTable-' + view.id).get(0).updateIdsOfSelectedRows,
							onSelectAll : function(aRowids, isSelected) {
								var i, count, id;
								for (i = 0, count = aRowids.length; i < count; i++) {
									id = aRowids[i];
									$('#summaryTable-' + view.id).get(0)
											.updateIdsOfSelectedRows(id,
													isSelected);
								}
							},
							loadComplete : function() {
								var i, count;
								for (
										i = 0,
										count = $('#summaryTable-' + view.id)
												.get(0).idsOfSelectedRows.length; i < count; i++) {
									$(this)
											.jqGrid(
													'setSelection',
													$('#summaryTable-' + view.id)
															.get(0).idsOfSelectedRows[i],
													false);
								}
							}

						});

		this.cubesviewer.views.cube._adjustGridSize(); // remember to copy also the window.bind-resize init

	};



	this.drawDateFilter = function(view, datefilter, container) {

		$(container)
				.append(
						'Mode: '
								+ '<select name="date_mode" >'
								+ '<option value="custom">Custom</option>'
								//+ '<option value="linked" disabled="true">Linked to main</option>'
								+ '<optgroup label="Auto">'
								+ '<option value="auto-last1m">Last month</option>'
								+ '<option value="auto-last3m">Last 3 months</option>'
								+ '<option value="auto-last6m">Last 6 months</option>'
								+ '<option value="auto-last12m">Last year</option>'
								+ '<option value="auto-january1st">From Juanary 1st</option>'
								+ '</optgroup>' + '</select> ' + 'Range: '
								+ '<input name="date_start" /> - '
								+ '<input name="date_end" /> ');

		$("[name='date_start']", container).datepicker({
			changeMonth : true,
			changeYear : true,
			dateFormat : "yy-mm-dd"
		});
		$("[name='date_end']", container).datepicker({
			changeMonth : true,
			changeYear : true,
			dateFormat : "yy-mm-dd"
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

	this.drawInfoPiece = function(selector, color, maxwidth, readonly, content) {
		var maxwidthStyle = "";
		if (maxwidth != null) {
			maxwidthStyle = "max-width: " + maxwidth + "px;";
		}
		selector.append(
			'<div class="infopiece" style="background-color: ' + color + '; white-space: nowrap;">' +
			'<div style="white-space: nowrap; overflow: hidden; display: inline-block; vertical-align: middle; ' + maxwidthStyle + '">' +
			content + '</div>' +
			( ! readonly ? ' <button style="display: inline-block;" class="cv-view-infopiece-close"><span class="ui-icon ui-icon-close"></span></button></div>' : '' )
		);
		
		selector.children().last().addClass('ui-widget').css('margin', '2px').css('padding', '4px').css('display', 'inline-block').addClass('ui-corner-all');
		selector.children().last().find('button').button().find('span').css('padding', '0px');
		
		return selector.children().last();
	};
	
	// Draw cuts
	this.drawInfo = function(view, readonly) {

		var drawHeader = ((view.params.cuts.length > 0) || (view.params.drilldown.length > 0)
				|| (view.params.datefilters.length > 0));
		if (drawHeader) {
			$(view.container).find('.cv-view-viewinfo').append('<div><h3>Current slice</h3></div>');
		} 
		
		$(view.container).find('.cv-view-viewinfo').append(
			'<div><div class="cv-view-viewinfo-drill"></div>' +
			'<div class="cv-view-viewinfo-cut"></div>' +
			'<div class="cv-view-viewinfo-date"></div>' +
			'<div class="cv-view-viewinfo-extra"></div></div>' 
		);
		
		var piece = cubesviewer.views.cube.explore.drawInfoPiece(
			$(view.container).find('.cv-view-viewinfo-drill'), "#000000", 200, true,
			'<span class="ui-icon ui-icon-info"></span> <span style="color: white;"><b>Cube:</b> ' + view.params.cubename + '</span>' 
		);
	
		$(view.params.drilldown).each(function(idx, e) {
			
			var piece = cubesviewer.views.cube.explore.drawInfoPiece(
				$(view.container).find('.cv-view-viewinfo-drill'), "#ccffcc", 300, readonly,
				'<span class="ui-icon ui-icon-arrowthick-1-s"></span> <b>Drilldown:</b> ' + e 
			);
			piece.find('.cv-view-infopiece-close').click(function() {
				view.cubesviewer.views.cube.explore.selectDrill(view, e, "");
			});
				
		});
		
		$(view.params.cuts).each(function(idx, e) { 
			var piece = cubesviewer.views.cube.explore.drawInfoPiece(
				$(view.container).find('.cv-view-viewinfo-cut'), "#ffcccc", 450, readonly,
				'<span class="ui-icon ui-icon-zoomin"></span> <b>Cut: </b> ' + e.dimension + ' = ' + 
				'<span title="' + e.value + '">' + e.value + '</span>'
			);
			piece.find('.cv-view-infopiece-close').click(function() {
				view.cubesviewer.views.cube.explore.selectCut(view, e.dimension, "");
			});
		});

		$(view.params.datefilters).each( function(idx, e) {
			var piece = cubesviewer.views.cube.explore.drawInfoPiece(
					$(view.container).find('.cv-view-viewinfo-date'), "#ffdddd", null, readonly,
					'<span class="ui-icon ui-icon-zoomin"></span> <b>Cut: </b> ' + e.dimension + ' = <span class="datefilter"></span>')
			var container = $('.datefilter', piece);
			view.cubesviewer.views.cube.explore.drawDateFilter(view, e, container);
			
			piece.find('.cv-view-infopiece-close').click(function() {
				view.cubesviewer.views.cube.explore.selectDateFilter(view, e.dimension, "0");
			});
		});


		if (readonly) {
			$(view.container).find('.infopiece').find('.ui-icon-close')
					.parent().remove();
		}

	};


	/*
	 * Filters current selection
	 */ 
	this.filterSelected = function(view) {

		if (view.params.drilldown.length != 1) {
			view.cubesviewer.alert('Can only filter multiple values in a view with one level of drilldown.');
			return;
		}
		if ($('#summaryTable-' + view.id).get(0).idsOfSelectedRows.length <= 0) {
			view.cubesviewer.alert('Cannot filter. No rows are selected.');
			return;
		}

		var filterValues = [];
		for (i = 0, count = $('#summaryTable-' + view.id).get(0).idsOfSelectedRows.length; i < count; i++) {
			var data = $('#summaryTable-' + view.id).getRowData(
					$('#summaryTable-' + view.id).get(0).idsOfSelectedRows[i]);
			var dom = $(data["key"]);
			filterValues.push($(dom).attr("data-value"));
		}
		this.selectCut(view, $(dom).attr("data-dimension"), filterValues.join(";"));

	};

	// Select a cut
	this.selectCut = function(view, dimension, value) {

		if (dimension != "") {
			if (value != "") {
				var existing_cut = $.grep(view.params.cuts, function(e) {
					return e.dimension == dimension;
				});
				if (existing_cut.length > 0) {
					view.cubesviewer.alert("Cannot cut dataset. Dimension '" + dimension
							+ "' is already filtered.");
					return;
				} else {
					view.params.cuts.push({
						"dimension" : dimension,
						"value" : value
					});
					// Don't drill cut dimension
					cubesviewer.views.cube.explore.removeDrill(view, dimension);
				}
			} else {
				view.params.cuts = $.grep(view.params.cuts, function(e) {
					return e.dimension == dimension;
				}, true);
			}
		} else {
			view.params.cuts = [];
		}
		
		view.cubesviewer.views.redrawView (view);

	};

	// Select a drilldown
	this.selectDrill = function(view, dimension, value) {

		var cube = view.cube;

		// view.params.drilldown = (drilldown == "" ? null : drilldown);
		if (dimension == "") {
			view.params.drilldown = [];
		} else {
			cubesviewer.views.cube.explore.removeDrill(view, dimension);
			if (value == "1") {
				view.params.drilldown.push(dimension);
			}
		}
		
		view.cubesviewer.views.redrawView (view);
		
	};

	this.removeDrill = function(view, drilldown) {

		var drilldowndim = drilldown.split(':')[0];

		for ( var i = 0; i < view.params.drilldown.length; i++) {
			if (view.params.drilldown[i].split(':')[0] == drilldowndim) {
				view.params.drilldown.splice(i, 1);
				break;
			}
		}
	},

	// Adds a date filter
	this.selectDateFilter = function(view, dimension, enabled) {

		var cube = view.cube;

		// Remove drill if exists
		cubesviewer.views.cube.explore.removeDrill(view, dimension);

		// TODO: Remove cuts if already exist

		if (dimension != "") {
			if (enabled == "1") {
				view.params.datefilters.push({
					"dimension" : dimension,
					"mode" : "auto-last6m",
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


};


/*
 * Create object.
 */
cubesviewer.views.cube.explore = new cubesviewerViewCubeExplore();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.explore.onViewDraw);
