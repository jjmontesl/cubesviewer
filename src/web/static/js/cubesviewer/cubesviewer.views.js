/*
 * CubesViewer
 * Copyright (c) 2012-2014 Jose Juan Montes, see AUTHORS for more details
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

function cubesviewerViews () {

	this.STATE_INITIALIZING = 1;
	this.STATE_INITIALIZED = 2;
	this.STATE_ERROR = 3;
	
	/*
	 * Cubesviewer reference.
	 */
	this.cubesviewer = cubesviewer;
	
	/*
	 * Shows an error message on a view container.
	 */
	this.showFatal = function (container, message) {
		container.empty().append (
				'<div class="ui-widget">' +
				'<div class="ui-state-error ui-corner-all" style="padding: 0 .7em;">' +
				'<p><span class="ui-icon ui-icon-alert" style="float: left; margin-right: .3em;"></span>' +
				'<strong>Error</strong><br/><br/>' + message + 
				'</p></div></div>'
		);
	}
	
	/*
	 * Adds a new clean view for a cube. 
	 * This accepts parameters as an object or as a serialized string.
	 */
	this.createView = function(id, container, type, data) {

		// Check if system is initialized, otherwise
		// show a friendly error
		// TODO: Review if this code is needed or how
		/*
		if () {
			cubesviewer.views.showFatal (container, 'Cannot create CubesViewer view.<br />CubesViewer state is: <b>' + cubesviewer.state + '</b>.<br /><br />Try reloading or contact the administrator.</p>');
			return null;
		}
		*/
		
		// Create view
		
		var params = {};
		
		if (typeof data == "string") {
			try {
				params = $.parseJSON(data);
			} catch (err) {
				this.cubesviewer.alert ('Error: could not process serialized data (JSON parse error).');
				params["name"] = "Undefined view";
			}
		} else {
			params = data;
		}
		
		var view = {
			"id": id,
			"cubesviewer": this.cubesviewer,
			"type": type,
			"container": container,
			"state": cubesviewer.views.STATE_INITIALIZING,
			"params": {}
		};

		$.extend(view.params, params);
		$(document).trigger("cubesviewerViewCreate", [ view ] );
		$.extend(view.params, params);
		
		if (view.state == cubesviewer.views.STATE_INITIALIZING) view.state = cubesviewer.views.STATE_INITIALIZED;
		
		// Attach view to container
		$(container).data("cubesviewer-view", view);
		
		return view;
		
	};
	
	/**
	 * Destroys a view
	 */
	this.destroyView = function(view) {
		
		// Do cleanup
		
		// Trigger destroyed event
		$(document).trigger("cubesviewerViewDestroyed", [ view ] );
		
	};
	
	/*
	 * Locates a view object walking up the parents chain of an element.
	 */
	this.getParentView = function(node) {
		var view = null;
		$(node).parents().each(function(idx, el) {
			if (($(el).data("cubesviewer-view") != undefined) && (view == null)) {
				view = $(el).data("cubesviewer-view");
			}
		});
		return view;
	}
	
	/*
	 * Block the view interface.
	 */
	this.blockView = function (view, message) {
		if (message == "undef") message = null;
		$(view.container).block({ 
			"message": message, 
			"fadeOut": 200,
			"onUnblock": function() { 
				// Fix conflict with jqBlock which makes menus to not overflow off the view (makes menus innacessible)
				$(view.container).css("position", "inherit");
			}
		});
	}
	
	/*
	 * Block the view interface with a loading message
	 */
	this.blockViewLoading = function (view) {
		this.blockView (view, '<span class="ajaxloader" title="Loading..." >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Loading</span>');
	}

	/*
	 * Unblock the view interface.
	 */
	this.unblockView = function (view) {
		
		$(view.container).unblock();
		
	}

	
	/*
	 * Triggers redraw for a given view.
	 */
	this.redrawView = function (view) {
		// TODO: Review if if below is needed
		//if (view == null) return;
		$(document).trigger ("cubesviewerViewDraw", [ view ]);
	}
	
	/*
	 * Updates view when the view is refreshed.
	 */
	this.onViewDraw = function (event, view) {
		
		if (view.state == cubesviewer.views.STATE_ERROR) {
			cubesviewer.views.showFatal (view.container, 'An error has occurred. Cannot present view.');
			event.stopImmediatePropagation();
			return;
		}
		
	}	

	/*
	 * Serialize view data.
	 */
	this.serialize = function (view) {
		return JSON.stringify (view.params);
	};
	
};

/*
 * Create object.
 */
cubesviewer.views = new cubesviewerViews();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.onViewDraw);

