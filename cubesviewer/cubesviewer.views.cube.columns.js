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
 * Add columns control to view cube.
 * This adds support to memorize width and sorting for each view.
 * Also support to hide/show columns in Explorer mode.
 * This plugin can ideally be included before the export plugin.
 * 
 */
function cubesviewerViewCubeColumns () {

	this.cubesviewer = cubesviewer;

	this.onViewCreate = function(event, view) {
		
		$.extend(view.params, {
	
			columnHide: {},
			columnWidths: {},
			columnSort: {},
			
		});
		
	}
	
	
	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {
		
		if (view.cube == null) return;
		
		var menu = $(".cv-view-menu-view", $(view.container));
		var cube = view.cube;
		
		// Draw menu options (depending on mode)
		
		if ((view.params.mode == "explore")) {
			menu.append('<div></div>');
			menu.append('<li><a href="#" class="cv-view-hide-columns"><span class="ui-icon ui-icon-script"></span>Choose columns</a></li>');
		
			$(menu).menu( "refresh" );
			$(menu).addClass("ui-menu-icons");
		} else {
			$(view.container).find('.cv-view-columns-chooser').remove();
		}

		
		// Events
		$(view.container).find('.cv-view-hide-columns').click(function() {
			view.cubesviewer.views.cube.columns.showHideColumns(view);
			return false;
		});
		
	};
	
	this.showHideColumns = function (view) {

		$(view.container).find('.cv-view-columns-chooser').remove();
		
		var grid = $('#summaryTable-' + view.id);
		
		$(view.container).find(".cv-view-viewinfo").append('<div class="cv-view-columns-chooser cv-view-info-panel infopiece ui-widget ui-corner-all" style="background-color: #ddddff;"><h3>Column chooser</h3><div class="cv-view-columns-chooser-cols"></div></div>');
		
		
		// Add columns
		var measuresElements = "";
		var measuresNames = [];
		$(view.cube.measures).each(function(idx, e) {
			
			measuresNames.push(e.name);
			
			var aggregates = $.grep(view.cube.aggregates, function(ia) { return ia.measure == e.name; } );
			if (aggregates.length > 0) {
				$(view.container).find(".cv-view-columns-chooser-cols").append('<span style="float: left; min-width: 180px; margin-right: 20px;"><b>' + e.label + '</b>: </span>');
				$(aggregates).each(function(idx, ea) {
					var checkedon = (! view.cubesviewer.views.cube.columns.isColumnHidden (view, ea.ref)) ? 'checked="on"' : '';
					$(view.container).find(".cv-view-columns-chooser-cols").append (
						'<span style="margin-right: 15px;"><label ><input type="checkbox" ' + checkedon + ' style="vertical-align: middle;" data-col="' + ea.ref + '" class="cv-view-columns-chooser-col" /> ' + ea.label + '</label></span>'
					);
				});
				$(view.container).find(".cv-view-columns-chooser-cols").append('<br/>');
			}
			
		});
		
		var aggregates = $.grep(view.cube.aggregates, function(ia) { return (! ia.measure) || ($.inArray(ia.measure, measuresNames) == -1 ); } );
		if (aggregates.length > 0) {
			$(view.container).find(".cv-view-columns-chooser-cols").append('<span style="float: left; min-width: 180px; margin-right: 20px;"><b><i>Derived</i></b>: </span>'); 
			$(aggregates).each(function(idx, ea) {
				var checkedon = (! view.cubesviewer.views.cube.columns.isColumnHidden (view, ea.ref)) ? 'checked="on"' : '';
				$(view.container).find(".cv-view-columns-chooser-cols").append (
					'<span style="margin-right: 15px;"><label ><input type="checkbox" ' + checkedon + ' style="vertical-align: middle;" data-col="' + ea.ref + '" class="cv-view-columns-chooser-col" /> ' + ea.label + '</label></span>'
				);
			});
			$(view.container).find(".cv-view-columns-chooser-cols").append('<br/>');
		}
		
		
		// Event for checkboxes
		$(view.container).find(".cv-view-columns-chooser-cols").find(".cv-view-columns-chooser-col").click(function () {
			view.cubesviewer.views.cube.columns.toogleColumn (view, $(this).attr('data-col'));
		});
		
		
		$(view.container).find(".cv-view-columns-chooser-cols").append (
				'<div style="margin-top: 10px;">' +
				'<button class="cv-views-columns-chooser-close" style="margin-right: 15px;">Close Column Chooser</button>' +
				'<button class="cv-views-columns-chooser-selectall">Select All</button>' +
				'<button class="cv-views-columns-chooser-selectnone">Select None</button>' +
				'</div>'
		);
		$(view.container).find(".cv-views-columns-chooser-close").button().click(function() {
			$(this).parents('.cv-view-columns-chooser').remove();
		});
		$(view.container).find(".cv-views-columns-chooser-selectall").button().click(function() {
			$(view.container).find(".cv-view-columns-chooser-cols").find(":checkbox").not(":checked").trigger('click');;
		});
		$(view.container).find(".cv-views-columns-chooser-selectnone").button().click(function() {
			$(view.container).find(".cv-view-columns-chooser-cols").find(":checkbox").filter(":checked").trigger('click');
		});		
		
		
	};

	this.isColumnHidden = function (view, col) {
		var grid = $('#summaryTable-' + view.id);
		var colmod = $.grep(grid.jqGrid('getGridParam','colModel'), function(co) { return co.name == col })[0];
		return (colmod.hidden);
	};
	
	this.toogleColumn = function (view, col) {
		var grid = $('#summaryTable-' + view.id);
		var colmod = $.grep(grid.jqGrid('getGridParam','colModel'), function(co) { return co.name == col })[0];
		if (colmod.hidden == true) {
			grid.jqGrid('showCol', col);
		} else {
			grid.jqGrid('hideCol', col);
		}
		
		// Save (value has changed already)
		view.params.columnHide[col] = colmod.hidden;
	};
	
	
};

/*
 * Hooks for tables
 */
cubesviewer.views.cube.explore.onTableResize = function (view, width, index) {
	
	widths = {};
	
	if (view.params.mode == "explore") {
		var grid = $('#summaryTable-' + view.id);
	} else if (view.params.mode == "series") {
		var grid = $('#seriesTable-' + view.id);
	} else if (view.params.mode == "facts") {
		var grid = $('#factsTable-' + view.id);
	} else {
		return;
	}
	
	for (var i = ((view.params.mode == "explore") ? 1 : 0); i < grid.jqGrid('getGridParam','colNames').length; i++) {
		widths[ grid.jqGrid('getGridParam','colModel')[i].name ] = grid.jqGrid('getGridParam','colModel')[i].width;
	}
	
	// Merge arrays
	$.extend (view.params.columnWidths, widths);
	
};

cubesviewer.views.cube.explore.onTableSort = function (view, index, iCol, sortorder) {
	
	// Merge arrays
	data = {}
	data[view.params.mode] = [ index, sortorder ];
	$.extend (view.params.columnSort, data);
	
};

cubesviewer.views.cube.explore.defineColumnWidth = function(view, column, vdefault) {
	if (column in  view.params.columnWidths) {
		return view.params.columnWidths[column];
	} else {
		return vdefault;
	}
};

cubesviewer.views.cube.explore.defineColumnSort = function(view, vdefault) {
	if (view.params.mode in view.params.columnSort) {
		return view.params.columnSort[view.params.mode];
	} else {
		return vdefault;
	}
};

cubesviewer.views.cube.explore.onTableLoaded = function (view, width, index) {
	
	if (view.params.mode == "explore") {
		var grid = $('#summaryTable-' + view.id);
	} else if (view.params.mode == "series") {
		var grid = $('#seriesTable-' + view.id);
	} else if (view.params.mode == "facts") {
		var grid = $('#factsTable-' + view.id);
	} else {
		return;
	}
	
	// Hide columns as needed
	if (view.params.mode == "explore") {
		for (var i = ((view.params.mode == "explore") ? 1 : 0); i < grid.jqGrid('getGridParam','colNames').length; i++) {
			
			// Hide if necessary
			var colname = grid.jqGrid('getGridParam','colModel')[i].name;
	
			if (view.params.columnHide[colname] == true) {
				grid.jqGrid('hideCol', colname);
			}
		}
	}
	
};

/*
 * Create object.
 */
cubesviewer.views.cube.columns = new cubesviewerViewCubeColumns();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.cube.columns.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.columns.onViewDraw);

