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
 * Cubes Viewer GUI
 */
function cubesviewerGui () {

	// Cubesviewer
	this.cubesviewer = cubesviewer;

	// Default options
	this.options = {
		container : null,
		user : null
	};

	// Current views array
	this.views = [];

	// View counter (used to assign different ids to each spawned view)
	this.lastViewId = 0;

	// Track sorting state
	this._sorting = false;

	this.onRefresh = function() {
		cubesviewer.gui.drawCubesList();
	};


	/*
	 * Closes a view.
	 */
	this.closeView = function(view) {
		for ( var i = 0; (i < this.views.length) && (this.views[i].id != view.id); i++) ;

		$('#' + view.id).remove();
		this.views.splice(i, 1);

		cubesviewer.views.destroyView (view);

	};

	// Adds a new clean view for a cube
	this.addViewCube = function(cubename) {

		this.lastViewId++;
		var viewId = "view" + this.lastViewId;

		var container = this.createContainer(viewId);

		// Find cube name
		var cubeinfo = cubesviewer.cubesserver.cubeinfo (cubename);

		var view = this.cubesviewer.views.createView(viewId, $('.cv-gui-viewcontent', container), "cube", { "cubename": cubename, "name": "Cube " + cubeinfo.label });
		this.views.push (view);

		// Bind close button
		$(container).find('.cv-gui-closeview').click(function() {
			cubesviewer.gui.closeView(view);
			return false;
		});

		return view;

	};

	/*
	 * Adds a view given its params descriptor.
	 */
	this.addViewObject = function(data) {

		this.lastViewId++;
		var viewId = "view" + this.lastViewId;

		var container = this.createContainer(viewId);
		var view = this.cubesviewer.views.createView(viewId, $('.cv-gui-viewcontent', container), "cube", data);
		this.views.push (view);

		// Bind close button
		$(container).find('.cv-gui-closeview').click(function() {
			cubesviewer.gui.closeView(view);
			return false;
		});

		return view;

	};

	/*
	 * Creates a container for a view.
	 */
	this.createContainer = function(viewId) {

		$(this.options.container).children('.cv-gui-workspace').append(
			'<div id="'+ viewId + '" class="cv-gui-viewcontainer"></div>'
		);

		// Add view parts (header and body)
		$('#' + viewId).append(
			'<div class="cv-gui-cubesview" ><h3 class="sorthandle">' +
			'<span style="float: right; margin-left: 20px;" class="cv-gui-closeview ui-icon ui-icon-close"></span>' +
			'<span class="cv-gui-container-name" style="margin-left: 30px; margin-right: 20px;">' + /* view.name + */ '</span> <span style="float: right;" class="cv-gui-container-state"></span>' + /* viewstate + */
			'</h3><div class="cv-gui-viewcontent" style="overflow: hidden;"></div></div>'
		);

		// Configure collapsible

		$('#' + viewId + " .cv-gui-cubesview").accordion({
			collapsible : true,
			autoHeight : false
		});
		$('#' + viewId + " .cv-gui-viewcontent").css({
			"height": ""
		});
		$('#' + viewId + " .cv-gui-cubesview").on("accordionbeforeactivate", function (evt, ui) {
			if (cubesviewer.gui._sorting == true) {
				evt.preventDefault();
				evt.stopImmediatePropagation();
			}
		});


		return $('#' + viewId);
	};

	/*
	 * Updates view information in the container when a view is refreshed
	 */
	this.onViewDraw = function (event, view) {

		var container = $(view.container).parents('.cv-gui-cubesview');
		$('.cv-gui-container-name', container).empty().text(view.params.name);

		view.cubesviewer.gui.drawMenu(view);
	}

	/*
	 * Draw cube view menu
	 */
	this.drawMenu = function(view) {

		// Add panel menu options button
		$(view.container).find('.cv-view-toolbar').append(
			'<button class="panelbutton" title="Panel">Panel</button>'
		);

		$(view.container).find('.cv-view-viewmenu').append(
			'<ul class="cv-view-menu cv-view-menu-panel" style="float: right; width: 180px;"></ul>'
		);

		// Buttonize
		$(view.container).find('.panelbutton').button();


		var menu = $(".cv-view-menu-panel", $(view.container));
		menu.append(
			'<li><a class="cv-gui-cloneview" href="#"><span class="ui-icon ui-icon-copy"></span>Clone</a></li>' +
			'<li><a class="cv-gui-renameview" href="#"><span class="ui-icon ui-icon-pencil"></span>Rename...</a></li>' +
			'<div></div>' +
			'<li><a class="cv-gui-closeview" href="#"><span class="ui-icon ui-icon-close"></span>Close</a></li>'
		);

		// Menu functionality
		view.cubesviewer.views.cube._initMenu(view, '.panelbutton', '.cv-view-menu-panel');

		$(view.container).find('.cv-gui-closeview').unbind("click").click(function() {
			cubesviewer.gui.closeView(view);
			return false;
		});
		$(view.container).find('.cv-gui-renameview').unbind("click").click(function() {
			cubesviewer.gui.renameView(view);
			return false;
		});
		$('#' + view.id).find('.cv-gui-container-name').unbind("dblclick").dblclick(function() {
			cubesviewer.gui.renameView(view);
			return false;
		});
		$(view.container).find('.cv-gui-cloneview').unbind("click").click(function() {
			cubesviewer.gui.cloneView(view);
			return false;
		});


	}

	/*
	 * Renames a view (this is the user-defined label that is shown in the GUI header).
	 */
	this.renameView = function(view) {

		var newname = prompt("Enter new view name:", view.params.name);

		// TODO: Validate name

		if ((newname != null) && (newname != "")) {
			view.params.name = newname;
			cubesviewer.views.redrawView(view);
		}

	};

	/*
	 * Clones a view.
	 * This uses the serialization facility.
	 */
	this.cloneView = function(view) {

		viewobject = $.parseJSON(view.cubesviewer.views.serialize(view));
		viewobject.name = "Clone of " + viewobject.name;

		var view = this.addViewObject(viewobject);

		// TODO: These belong to plugins
		view.savedId = 0;
		view.owner = this.options.user;
		view.shared = false;

		this.cubesviewer.views.redrawView (view);
	};

	// Model Loaded Event (redraws cubes list)
	this.onCubesViewerInitialized = function() {
		cubesviewer.gui.drawCubesList();
	};


	this.drawCubesList = function() {

		// Clean list
		$('.cv-gui-cubeslist-menu', $(cubesviewer.gui.options.container)).empty();

		// Add cubes
		$(cubesviewer.cubesserver._cube_list).each(
			function(idx, cube) {
				$('.cv-gui-cubeslist-menu', $(cubesviewer.gui.options.container)).append(
						'<li><a href="#" data-cubename="' + cube.name + '" class="cv-gui-addviewcube">' + cube.label + '</a></li>'
				);
			}
		);
		$('.cv-gui-cubeslist-menu', $(cubesviewer.gui.options.container)).menu("refresh");

		// Add handlers for clicks
		$('.cv-gui-cubeslist-menu', $(cubesviewer.gui.options.container)).find('.cv-gui-addviewcube').click(function() {
			var view = cubesviewer.gui.addViewCube(  $(this).attr('data-cubename') );
			view.cubesviewer.views.redrawView (view);
			return false;
		});

		// Redraw views
		$(cubesviewer.gui.views).each(function(idx, view) {
			view.cubesviewer.views.redrawView(view);
		});

	};

	/*
	 * Draw About info box.
	 */
	this.showAbout = function() {
		this.cubesviewer.alert(
				"CubesViewer - Version " + this.cubesviewer.version + "\n" +
				"https://github.com/jjmontesl/cubesviewer/\n" +
				"\n" +
				"By José Juan Montes and others (see AUTHORS)\n" +
				"2012-2015\n"
		);
	};

	/*
	 * Draws a section in the main GUI menu.
	 */
	this.drawSection = function(gui, title, cssClass) {

		$(gui.options.container).children('.cv-gui-panel').append(
			'<button class="' + cssClass + '" title="' + title + '" style="margin-right: 15px;">' + title + '</button>' +
			'<ul class="' + cssClass + '-menu cv-view-menu"></ul>'
		);
		//$("." + cssClass + "-menu", gui.options.container).appendTo(document.body);
		$("." + cssClass, gui.options.container).button();
		$("." + cssClass, gui.options.container).click(function(ev) {

			// Hide all other menus
			$('.cv-view-menu').hide();

			$("." + cssClass + "-menu", gui.options.container).css("position", "absolute");
			$("." + cssClass + "-menu", gui.options.container).css("z-index", "9990");
			$("." + cssClass + "-menu", gui.options.container).show();
			$("." + cssClass + "-menu", gui.options.container).fadeIn().position({
				my : "left top",
				at : "left bottom",
				of : this
			});

			ev.stopPropagation();
			$(document).one("click", function () {
				$("." + cssClass + "-menu", gui.options.container).fadeOut();
			});

		});

		$("." + cssClass + "-menu", gui.options.container).menu({}).hide();

		// Menu functionality
		//view.cubesviewer.views.cube._initMenu(view, "." + cssClass, "." + cssClass + "-menu");

	};

	/*
	 * Render initial (constant) elements for the GUI
	 */
	this.onGuiDraw = function(event, gui) {

		// Draw cubes section
		gui.drawSection (gui, "Cubes", "cv-gui-cubeslist");
		gui.drawSection (gui, "Tools", "cv-gui-tools");


		if (! ((gui.options.showAbout != undefined) && (gui.options.showAbout == false))) {
			$(gui.options.container).find('.cv-gui-tools-menu').append(
				'<div></div>' +
				'<li><a href="#" class="cv-gui-about">About CubesViewer...</a></li>'
		    );
			$(gui.options.container).find('.cv-gui-tools-menu').menu('refresh');
			$('.cv-gui-about', gui.options.container).click(function() {
				gui.showAbout();
				return false;
			});
		}


		// Configure sortable panel
		$(gui.options.container).children('.cv-gui-workspace').sortable({
			placeholder : "ui-state-highlight",
			// containment: "parent",
			distance : 15,
			delay : 300,
			handle : ".sorthandle",

			start : function(evt, ui) {
				cubesviewer.gui._sorting = true;
			},
			stop : function(evt, ui) {
				setTimeout(function() {
					cubesviewer.gui._sorting = false;
				}, 200);

			}
		// forcePlaceholderSize: true,
		// forceHlperSize: true,
		});



	}

	// Initialize Cubes Viewer GUI
	this.init = function(options) {

		$.extend(this.options, options);

		// Redraw
		$(document).trigger ("cubesviewerGuiDraw", [ this ]);

	}

};

/*
 * Create object.
 */
cubesviewer.gui = new cubesviewerGui();

/*
 * Bind events.
 */
$(document).bind("cubesviewerRefresh", { "gui": cubesviewer.gui }, cubesviewer.gui.onRefresh);
$(document).bind("cubesviewerGuiDraw", { "gui": cubesviewer.gui }, cubesviewer.gui.onGuiDraw);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.gui.onViewDraw);
$(document).bind("cubesviewerInitialized", { }, cubesviewer.gui.onCubesViewerInitialized);
