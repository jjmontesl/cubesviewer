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
 * Facts table. Allows users to see the facts associated to current cut.
 */
function cubesviewerViewCubeFacts() {

	this.cubesviewer = cubesviewer;

	this.onViewCreate = function(event, view) {
		$.extend(view.params, {
		});
	}

	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {

		if (view.cube == null) return;

		// Facts Mode button
		$(view.container).find('.cv-view-toolbar').find(".explorebutton").css("margin-right", "5px").after(
			'<button class="cv-view-button-facts" title="Facts Table" style="margin-right: 10px;"><span class="ui-icon ui-icon-clipboard"></span></button>'
		);

		// Buttonize and event
		$(view.container).find('.cv-view-button-facts').button();
		$(view.container).find('.cv-view-button-facts').click(function() {
			view.cubesviewer.views.cube.facts.modeFacts(view);
			return false;
		});
		$(view.container).find('.cv-view-button-facts').mouseenter(function() {
			$('.cv-view-menu').hide();
		});

		if (view.params.mode != "facts") return;

		// Draw areas
		view.cubesviewer.views.cube.facts.drawInfo(view);

		// Highlight
		$(view.container).find('.cv-view-button-facts').button("option", "disabled", "true").addClass('ui-state-active');

		// Facts menu
		view.cubesviewer.views.cube.facts.drawFactsMenu(view);

		$(view.container).find('.drilldownbutton').button("disable");

		// Only if data is empty
		if ($(view.container).find('.cv-view-viewdata').children().size() == 0) {
			$(view.container).find('.cv-view-viewdata').empty().append('<h3>Facts Table</h3>');
		}

		// Load data
		view.cubesviewer.views.cube.facts.loadData(view);

	};

	/*
	 * Updates view options menus.
	 */
	this.drawFactsMenu = function (view) {

		var menu = $(".cv-view-menu-view", $(view.container));
		var cube = view.cube;


	};

	/*
	 * Change to facts mode.
	 */
	this.modeFacts = function(view) {
		view.params.mode = "facts";
		view.cubesviewer.views.redrawView(view);
	};


	/*
	 * Load and draw current data.
	 */
	this.loadData = function(view) {

		view.cubesviewer.views.blockViewLoading(view);

		var browser_args = this.cubesviewer.views.cube.buildBrowserArgs(view, false, false);
		var browser = new cubes.Browser(view.cubesviewer.cubesserver, view.cube);
		var jqxhr = browser.facts(browser_args, view.cubesviewer.views.cube.facts._loadDataCallback(view));
		jqxhr.always(function() {
			view.cubesviewer.views.unblockView(view);
		});

	};

	this._loadDataCallback = function(view) {

		var view = view;

		return function (data, status) {
			$(view.container).find('.cv-view-viewdata').empty();
			view.cubesviewer.views.cube.facts.drawTable(view, data);
		};

	};

	/*
	 * First calls drawInfo in explore table in order to draw slice info and container.
	 */
	this.drawInfo = function(view) {

	};


	/*
	 * Draws facts table.
	 */
	this.drawTable = function(view, data) {

		$(view.container).find('.cv-view-viewdata').empty();

		if (data.length == 0) {
			$(view.container).find('.cv-view-viewdata').append(
				'<h3>Facts Table</h3>' +
				'<div>No facts are returned by the current filtering combination.</div>'
			);
			return;
		}

		$(view.container).find('.cv-view-viewdata').append(
			'<h3>Facts Table</h3>' +
			'<table id="factsTable-' + view.id + '"></table>' +
			'<div id="factsPager-' + view.id + '"></div>'
		);

		var colNames = [];
		var colModel = [];
		var dataRows = [];
		var dataTotals = [];

		var dimensions = view.cube.dimensions;
		var measures = view.cube.measures;
        var details = view.cube.details;

		colNames.push("ID");
		colModel.push({
			name : "id",
			index : "id",
			align : "left",
			width : cubesviewer.views.cube.explore.defineColumnWidth(view, "id", 65),
			sorttype : "number",
		});

		for ( var dimensionIndex in dimensions) {
			// Get dimension
			var dimension = dimensions[dimensionIndex];

			for (var i = 0; i < dimension.levels.length; i++) {
				var level = dimension.levels[i];

				colNames.push(level.label);
				colModel.push({
					name : level.key().ref,
					index : level.key().ref,
					align : "left",
					//sorttype : "number",
					width : cubesviewer.views.cube.explore.defineColumnWidth(view, level.key().ref, 85),
					//formatter: 'number',
					//cellattr: this.columnTooltipAttr(column),
					//formatoptions: { decimalSeparator:".", thousandsSeparator: " ", decimalPlaces: 2 }
				});
			}
		}

		for (var measureIndex in measures) {
			var measure = measures[measureIndex];

			colNames.push(measure.name);
			colModel.push({
				name : measure.ref,
				index : measure.ref,
				align : "right",
				sorttype : "number",
				width : cubesviewer.views.cube.explore.defineColumnWidth(view, measure.ref, 75),
				formatter: 'number',
				//cellattr: this.columnTooltipAttr(column),
				formatoptions: { decimalSeparator:".", thousandsSeparator: " ", decimalPlaces: 2 }
			});
		}

        for (var detailIndex in details){
            var detail = details[detailIndex];

            colNames.push(detail.name);
			colModel.push({
				name : detail.ref,
                index : detail.ref,
                align : "left",
                //sorttype : "number",
                width : cubesviewer.views.cube.explore.defineColumnWidth(view, level.key().ref, 85),
                //formatter: 'number',
                //cellattr: this.columnTooltipAttr(column),
                //formatoptions: { decimalSeparator:".", thousandsSeparator: " ", decimalPlaces: 2 }
			});
        }


		// Process cells
		view.cubesviewer.views.cube.facts._addRows (view, dataRows, data);

		$('#factsTable-' + view.id).jqGrid({
			data: dataRows,
			//userData: dataTotals,
			datatype: "local",
			height: 'auto',
			rowNum: cubesviewer.options.pagingOptions[0],
			rowList: cubesviewer.options.pagingOptions,
			colNames: colNames,
			colModel: colModel,
	        pager: "#factsPager-" + view.id,
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
	this._addRows = function(view, rows, data) {

		var counter = 0;
		var dimensions = view.cube.dimensions;
		var measures = view.cube.measures;
        var details = view.cube.details;

		$(data).each( function(idx, e) {

			var nid = [];
			var row = [];
			var key = [];

			for ( var dimensionIndex in dimensions) {
				// Get dimension
				var dimension = dimensions[dimensionIndex];

				for (var i = 0; i < dimension.levels.length; i++) {

					var level = dimension.levels[i];
					var levelData = level.readCell (e);

					row[level.key().ref] = levelData.label;

				}
			}

			for (var measureIndex in measures) {
				var measure = measures[measureIndex];
				row[measure.ref] = e[measure.ref];
			}

            for (var detailIndex in details) {
				var detail = details[detailIndex];
				row[detail.ref] = e[detail.ref];
			}

			// Set key
			row["id"] = counter++;
			if ("id" in e) row["id"] = e["id"];
			row["key"] = row["id"];

			rows.push(row);
		});


	};

};

/*
 * Create object.
 */
cubesviewer.views.cube.facts = new cubesviewerViewCubeFacts();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.cube.facts.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.facts.onViewDraw);
