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
 * Undo/Redo plugin.
 */
function cubesviewerViewsUndo () {

this.cubesviewer = cubesviewer; 
	
	this.maxUndo = 32;

	/*
	 * Prepares the view. 
	 */
	this.onViewCreate = function(event, view) {

		$.extend(view.params, {
			//"showUndo" : true,
		});
		
		view.undoList = [];
		view.undoPos = -1;
	};	
	
	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {
		
		if (view.cube == null) return;
		
		// Undo/Redo buttons
		$(view.container).find('.cv-view-toolbar').before(
			'<div style="margin-right: 15px; display: inline-block;">' + 
			'<button class="cv-view-undo cv-view-button-undo" title="Undo" style="margin-right: 5px;"><span class="ui-icon ui-icon-arrowreturnthick-1-w"></span></button>' +
			'<button class="cv-view-redo cv-view-button-redo" title="Redo" style=""><span class="ui-icon ui-icon-arrowreturnthick-1-e"></span></button>' +
			'</div>'
		);
		
		// Undo menu
		view.cubesviewer.views.undo.drawUndoMenu(view);		
		
		// Buttonize and events 
		$(view.container).find('.cv-view-button-undo').button();
		$(view.container).find('.cv-view-undo').click(function() { 
			view.cubesviewer.views.undo.undo(view);
			return false;
		});
		$(view.container).find('.cv-view-button-redo').button();
		$(view.container).find('.cv-view-redo').click(function() { 
			view.cubesviewer.views.undo.redo(view);
			return false;
		});

		// Process undo operations
		view.cubesviewer.views.undo._processDrawState(view);
		
		// Disable
		//$(view.container).find('.cv-view-button-chart').button("option", "disabled", "true").addClass('ui-state-active');
		if (view.undoPos <= 0) {
			$(view.container).find('.cv-view-button-undo').button("option", "disabled", "true")
			$(view.container).find('.cv-view-undo').addClass('disabled');
		}
		if (view.undoPos >= view.undoList.length - 1) {
			$(view.container).find('.cv-view-button-redo').button("option", "disabled", "true")
			$(view.container).find('.cv-view-redo').addClass('disabled');
		}		
		
		
		
	};	

	/*
	 * Updates view options menus.
	 */
	this.drawUndoMenu = function (view) {
		
		var menu = $(".cv-view-menu-view", $(view.container));
		var cube = view.cube;
		
		/*
		menu.append(
	  		'<div></div>' +
			'<li><a href="#" class="cv-view-undo"><span class="ui-icon ui-icon-arrowreturnthick-1-w"></span> Undo</a></li>' +
	  		'<li><a href="#" class="cv-view-redo"><span class="ui-icon ui-icon-arrowreturnthick-1-e"></span> Redo</a></li>'
	  	);
		
		$(menu).menu( "refresh" );
		$(menu).addClass("ui-menu-icons");
		*/

		// Events are added by the drawView method
		
	};
	
	this._processDrawState = function(view) {
		
		var drawn = view.cubesviewer.views.serialize(view);
		var current = this.getCurrentUndoState(view);
		 
		if (drawn != current) {
			this.pushUndo(view, drawn);
		}
		
	}
	
	this.pushUndo = function (view, state) {
		view.undoPos = view.undoPos + 1;
		if (view.undoPos + 1 <= view.undoList.length) {
			view.undoList.splice(view.undoPos, view.undoList.length - view.undoPos);
		}
		view.undoList.push(state);
		
		if (view.undoList.length > this.maxUndo) {
			view.undoList.splice(0, view.undoList.length - this.maxUndo);
			view.undoPos = view.undoList.length - 1;
		}
	}
	
	this.getCurrentUndoState = function (view) {
		if (view.undoList.length == 0) return "{}";
		return view.undoList[view.undoPos];
	};
	
	this.undo = function (view) {
		view.undoPos = view.undoPos - 1;
		if (view.undoPos < 0) view.undoPos = 0;
		this.applyCurrentUndoState (view);
	};
	
	this.redo = function (view) {
		view.undoPos = view.undoPos + 1;
		this.applyCurrentUndoState (view);
	};
	
	this.applyCurrentUndoState = function(view) {
		var current = this.getCurrentUndoState(view);
		view.params = $.parseJSON(current);
		view.cubesviewer.views.redrawView(view);
	};

	
};

/*
 * Create object.
 */
cubesviewer.views.undo = new cubesviewerViewsUndo();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.undo.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.undo.onViewDraw);

