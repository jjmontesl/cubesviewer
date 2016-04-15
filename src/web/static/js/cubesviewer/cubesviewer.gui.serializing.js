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
 * View serialization inteface. This is an optional component.
 * Provides visual assistance for serializing views and instancing of views from
 * serialized data. Note that only the view parameters are serialized,
 * but not data. The Cubes Server still needs to be available to serve data.
 * This serialized strings can also be used to initialize different views from code,
 * which is handy when these are going to be instantiated from code later on
 * (ie. when embedding views on a web site).
 */
function cubesviewerGuiSerializing() {

	this.cubesviewer = cubesviewer;

	//this.urlLoaded = false;

	/*
	 * Draw GUI options
	 */
	this.onGuiDraw = function(event, gui) {

		$(gui.options.container).find('.cv-gui-tools-menu').prepend(
			'<li><a href="#" class="cv-gui-addserialized">Add view from JSON</a></li>'
		);
		$(gui.options.container).find('.cv-gui-tools-menu').menu('refresh');
		//$('.cv-gui-addserialized', gui.options.container).button();
		$('.cv-gui-addserialized', gui.options.container).click(function() {
			cubesviewer.gui.serializing.addSerializedView(gui);
			return false;
		});

	}

	/*
	 * Draw export options.
	 */
	this.onViewDraw = function(event, view) {

		view.cubesviewer.gui.serializing.drawMenu(view);

	};

	/*
	 * Draw export menu options.
	 */
	this.drawMenu = function(view) {

		var menu = $(".cv-view-menu-panel", $(view.container));
		var cube = view.cube;

		// Draw menu options (depending on mode)
		menu.find (".cv-gui-renameview").parent().after(
			'<li><a class="cv-gui-serializeview" href="#"><span class="ui-icon ui-icon-rss"></span> Serialize</a></li>'
		);

		$(menu).menu( "refresh" );
		$(menu).addClass("ui-menu-icons");

		// Events
		$(view.container).find('.cv-gui-serializeview').click(function() {
			view.cubesviewer.gui.serializing.serializeView(view);
			return false;
		});

	};

	/*
	 * Save a view.
	 */
	this.serializeView = function (view) {
		var serialized = view.cubesviewer.views.serialize(view);
		console.log(serialized);
		this.jqueryUiPopup(serialized);
	};

	this.jqueryUiPopup = function (text) {
		$('<p/>', {
			text: text
		}).dialog({
			buttons: [{
					text: "Close",
					click: function() {
						$(this).dialog("close");
					},
			}],
			open: function() {
				//autoselect text for copying
				window.getSelection().removeAllRanges();
				var range = document.createRange();
				range.selectNode($(this)[0]);
				window.getSelection().addRange(range);
			},
			create: function() {
				var dialog = $(this);
				var click_id = 'click.' + $(dialog).attr('id');

				$('div#body').bind(click_id, function() {
					$(dialog).dialog('close');
					$(this).unbind(click_id);
				});
			},
		});
	};

	/*
	 * Shows the dialog to add a serialized view.
	 * This is equivalent to other view adding methods in the cubesviewer.gui namespace,
	 * like "addViewObject", but this loads the view definition from
	 * the storage backend.
	 */
	this.addSerializedView = function (gui) {

		var serialized = prompt ("Enter serialized view data: ");

		if (serialized != null) {
			var view = cubesviewer.gui.addViewObject(serialized);
			this.cubesviewer.views.redrawView (view);
		}
	};

};

/*
 * Create object.
 */
cubesviewer.gui.serializing = new cubesviewerGuiSerializing();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.gui.serializing.onViewDraw);
$(document).bind("cubesviewerGuiDraw", { }, cubesviewer.gui.serializing.onGuiDraw);

