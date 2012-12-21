/*
 * CubesViewer
 * Copyright (c) 2012-2013 Jose Juan Montes, see AUTHORS for more details
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

	/*
	 * Cubesviewer reference.
	 */
	this.cubesviewer = cubesviewer;
	
	/*
	 * Adds a new clean view for a cube. 
	 */
	this.createView = function(id, container, type, params) {

		var view = {
			"id": id,
			"cubesviewer": this.cubesviewer,
			"type": type,
			"container": container,
			"params": {}
		};

		$.extend(view.params, params);
		$(document).trigger("cubesviewerViewCreate", [ view ] );
		$.extend(view.params, params);
		
		// Attach view to container
		$(container).data("cubesviewer-view", view);
		
		return view;
		
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
	 * Triggers redraw for a given view.
	 */
	this.redrawView = function (view) {
		$(document).trigger ("cubesviewerViewDraw", [ view ]);
	}
	
	/*
	 * Updates view when the view is refreshed.
	 */
	this.onViewDraw = function (event, view) {
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


