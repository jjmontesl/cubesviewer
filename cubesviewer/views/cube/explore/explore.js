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
 * cvViewCube directive and controller.
 */
angular.module('cv.views.cube').controller("CubesViewerViewsCubeExploreController", ['$rootScope', '$scope', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, cvOptions, cubesService, viewsService) {

	$scope.data = null;

	$scope.initialize = function() {
		//$scope.loadData();
	};

	$scope.loadData = function() {

		//$scope.view.cubesviewer.views.blockViewLoading(view);

		var browser_args = cubesService.buildBrowserArgs($scope.view, false, false);
		var browser = new cubes.Browser(cubesService.cubesserver, view.cube);
		var jqxhr = browser.aggregate(browser_args, $scope._loadDataCallback(view));
		jqxhr.always(function() {
			//view.cubesviewer.views.unblockView(view);
		});

	};

	$scope._loadDataCallback = function(data, status) {
		$scope.data = data;
	};

	$scope.initialize();

}]);




function cubesviewerViewCubeExplore() {


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
				var dimension = view.cube.cvdim_dim(drilldown[i]);

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
				var dim = view.cube.cvdim_dim(view.params.drilldown[i]);

				var parts = view.cube.cvdim_parts(view.params.drilldown[i]);
				var infos = parts.hierarchy.readCell(e, parts.level);

				// Values and Labels
				var drilldown_level_values = [];
				var drilldown_level_labels = [];

				$(infos).each(function(idx, info) {
					drilldown_level_values.push (info.key);
					drilldown_level_labels.push (info.label);
				});

				nid.push(drilldown_level_values.join("-"));

				var cutDimension = parts.dimension.name + ( parts.hierarchy.name != "default" ? "@" + parts.hierarchy.name : "" );
				key.push('<a href="#" class="cv-grid-link" onclick="' + "cubesviewer.views.cube.explore.selectCut(cubesviewer.views.getParentView(this), $(this).attr('data-dimension'), $(this).attr('data-value'), $(this).attr('data-invert')); return false;" +
						 '" class="selectCut" data-dimension="' + cutDimension + '" ' +
						 'data-value="' + drilldown_level_values.join(",") + '">' +
						 drilldown_level_labels.join(" / ") + '</a>');
			}

			// Set key
			row["key"] = key.join (" / ");
			for (var i = 0; i < key.length; i++) {
				row["key" + i] = key[i];
			}
			//row["key"] = key.join(' / ');

			// Add columns
			$(view.cube.aggregates).each(function(idx, ag) {
				row[ag.ref] = e[ag.ref];
			});

			row["id"] = nid.join('-');
			rows.push(row);
		});

		// Copy summary if there's no data
		// This allows a scrollbar to appear in jqGrid when only the summary row is shown.
		if ((rows.length == 0) && (data.summary)) {
			var row = [];
			row["key0"] = "Summary";

			$(view.cube.aggregates).each(function(idx, ag) {
				row[ag.ref] = data.summary[ag.ref];
			});

			rows.push(row);
		}

	};

	this.columnTooltipAttr = function(column) {
		return function (rowId, val, rawObject) {
			return 'title="' + column + ' = ' + val + '"';
		};
	};

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

		$(view.cube.aggregates).each(function(idx, ag) {
			colNames.push(ag.label);

			var colFormatter = cubesviewer.views.cube.columnFormatFunction(view, ag);
			var col = {
				name : ag.ref,
				index : ag.ref,
				align : "right",
				sorttype : "number",
				width : cubesviewer.views.cube.explore.defineColumnWidth(view, ag.ref, 95),
				formatter: function(cellValue, options, rowObject) {
					return colFormatter(cellValue);
				},
				//formatoptions: {},
				cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
			};
			colModel.push(col);

			if (data.summary) dataTotals[ag.ref] = data.summary[ag.ref];
		});

		/*
		colNames.sort();
		colModel.sort(function(a, b) {
			return (a.name < b.name ? -1 : (a.name == b.name ? 0 : 1));
		});
		*/

		// If there are cells, show them
		cubesviewer.views.cube.explore._sortData(view, data.cells, false);
		cubesviewer.views.cube.explore._addRows(view, dataRows, data);

		var label = [];
		$(view.params.drilldown).each(function(idx, e) {
			label.push(view.cube.cvdim_dim(e).label);
		})
		for (var i = 0; i < view.params.drilldown.length; i++) {

			colNames.splice(i, 0, label[i]);

			colModel.splice(i, 0, {
				name : "key" + i,
				index : "key" + i,
				align : "left",
				width: cubesviewer.views.cube.explore.defineColumnWidth(view, "key" + i, 130)
			});
		}
		if (view.params.drilldown.length == 0) {
			colNames.splice(0, 0, "");
			colModel.splice(0, 0, {
				name : "key" + 0,
				index : "key" + 0,
				align : "left",
				width: cubesviewer.views.cube.explore.defineColumnWidth(view, "key" + 0, 110)
			});
		}

		dataTotals["key0"] = (cubesviewer.views.cube.buildQueryCuts(view).length == 0) ? "<b>Summary</b>"
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
							userData : (data.summary ? dataTotals : null),
							datatype : "local",
							height : 'auto',
							rowNum : cubesviewer.options.pagingOptions[0],
							rowList : cubesviewer.options.pagingOptions,
							colNames : colNames,
							colModel : colModel,
							pager : "#summaryPager-" + view.id,
							sortname : cubesviewer.views.cube.explore.defineColumnSort(view, ["key", "desc"])[0],
							viewrecords : true,
							sortorder : cubesviewer.views.cube.explore.defineColumnSort(view, ["key", "desc"])[1],
							footerrow : true,
							userDataOnFooter : true,
							forceFit : false,
							shrinkToFit : false,
							width: cubesviewer.options.tableResizeHackMinWidth,
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
								// Call hook
								view.cubesviewer.views.cube.explore.onTableLoaded (view);
							},
							resizeStop: view.cubesviewer.views.cube.explore._onTableResize (view),
							onSortCol: view.cubesviewer.views.cube.explore._onTableSort (view),

						});

		this.cubesviewer.views.cube._adjustGridSize(); // remember to copy also the window.bind-resize init


	};

	this._onTableSort = function (view) {
		return function (index, iCol, sortorder) {
			view.cubesviewer.views.cube.explore.onTableSort (view, index, iCol, sortorder);
		}
	}

	this._onTableResize = function (view) {
		return function(width, index) {
			view.cubesviewer.views.cube.explore.onTableResize (view, width, index);
		};
	};

	this.onTableResize = function (view, width, index) {
		// Empty implementation, to be overrided
		//alert("resize column " + index + " to " + width + " pixels");
	};
	this.onTableLoaded = function (view) {
		// Empty implementation, to be overrided
	};
	this.onTableSort = function (view, key, index, iCol, sortorder) {
		// Empty implementation, to be overrided
	};

	this.defineColumnWidth = function (view, column, vdefault) {
		// Simple implementation. Overrided by the columns plugin.
		return vdefault;
	};
	this.defineColumnSort = function (view, vdefault) {
		// Simple implementation. Overrided by the columns plugin.
		return vdefault;
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
			( ! readonly ? ' <button style="display: inline-block; vertical-align: middle;" class="cv-view-infopiece-close"><span class="ui-icon ui-icon-close"></span></button></div>' : '' )
		);

		selector.children().last().addClass('ui-widget').css('margin', '2px').css('padding', '3px').css('display', 'inline-block').addClass('ui-corner-all');
		selector.children().last().find('button').button().find('span').css('padding', '0px');

		return selector.children().last();
	};

	// Draw information bubbles
	this.drawInfo = function(view, readonly) {

		$(view.container).find('.cv-view-viewinfo').empty();

		$(view.container).find('.cv-view-viewinfo').append(
			'<div><div class="cv-view-viewinfo-drill"></div>' +
			'<div class="cv-view-viewinfo-cut"></div>' +
			'<div class="cv-view-viewinfo-extra"></div></div>'
		);

		var piece = view.cubesviewer.views.cube.explore.drawInfoPiece(
			$(view.container).find('.cv-view-viewinfo-drill'), "#000000", 200, true,
			'<span class="ui-icon ui-icon-info"></span> <span style="color: white;" class="cv-view-viewinfo-cubename"><b>Cube:</b> ' + view.cube.label + '</span>'
		);

		$(view.params.drilldown).each(function(idx, e) {

			var dimparts = view.cube.cvdim_parts(e);
			var piece = cubesviewer.views.cube.explore.drawInfoPiece(
				$(view.container).find('.cv-view-viewinfo-drill'), "#ccffcc", 360, readonly,
				'<span class="ui-icon ui-icon-arrowthick-1-s"></span> <b>Drilldown:</b> ' + dimparts.label
			);
			piece.addClass("cv-view-infopiece-drilldown");
			piece.attr("data-dimension", e);
			piece.find('.cv-view-infopiece-close').click(function() {
				view.cubesviewer.views.cube.explore.selectDrill(view, e, "");
			});

		});

		$(view.params.cuts).each(function(idx, e) {
			var dimparts = view.cube.cvdim_parts(e.dimension.replace(":",  "@"));
			var equality = e.invert ? ' != ' : ' = ';
			var piece = cubesviewer.views.cube.explore.drawInfoPiece(
				$(view.container).find('.cv-view-viewinfo-cut'), "#ffcccc", 480, readonly,
				'<span class="ui-icon ui-icon-zoomin"></span> <span><b>Filter: </b> ' + dimparts.label  + equality + '</span>' +
				'<span title="' + e.value + '">' + e.value + '</span>'
			);
			piece.addClass("cv-view-infopiece-cut");
			piece.attr("data-dimension", e.dimension);
			piece.attr("data-value", e.value);
			piece.attr("data-invert", e.invert || false);
			piece.find('.cv-view-infopiece-close').click(function() {
				view.cubesviewer.views.cube.explore.selectCut(view, e.dimension, "", e.invert);
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

		var dom = null;
		var filterValues = [];
		var idsOfSelectedRows = $('#summaryTable-' + view.id).get(0).idsOfSelectedRows;
		var filterData = $.grep($('#summaryTable-' + view.id).jqGrid('getGridParam','data'), function (gd) {
			return ($.inArray(gd.id, idsOfSelectedRows) != -1);
		} );
		$(filterData).each( function(idx, gd) {
			dom = $(gd["key0"]);
			filterValues.push($(dom).attr("data-value"));
		});

		var invert = false;
		this.selectCut(view, $(dom).attr("data-dimension"), filterValues.join(";"), invert);

	};

	// Select a cut
	this.selectCut = function(view, dimension, value, invert) {

		if (dimension != "") {
			if (value != "") {
				/*
				var existing_cut = $.grep(view.params.cuts, function(e) {
					return e.dimension == dimension;
				});
				if (existing_cut.length > 0) {
					//view.cubesviewer.alert("Cannot cut dataset. Dimension '" + dimension + "' is already filtered.");
					//return;
				} else {*/
					view.params.cuts = $.grep(view.params.cuts, function(e) {
						return e.dimension == dimension;
					}, true);
					view.params.cuts.push({
						"dimension" : dimension,
						"value" : value,
						"invert" : invert
					});
				/*}*/
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
	};

};


