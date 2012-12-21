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

/*
 * CubesViewer view notes. This is an optional component.
 * Requires the inclusion of the JS wiki library.
 */
function cubesviewerNotes () {

	this.notesEdit = function(viewId) {
		var view = cubesviewer.views[viewId];
		$('#' + viewId).find('.cubes-notes-html').empty();
		$('#' + viewId).find('.cubes-notes-html').append(
			'<div style="width: 60%;">'
					+ '<div><textarea style="height: 140px; width: 100%;" name="notes">'
					+ view.notes
					+ '</textarea></div>'
					+ '<div style="float:right;"><a href="http://goessner.net/articles/wiky/" style="font-size: 10px;" target="_blank">[markup help]</a> <button class="cubes-notes-save">Save</button></div>'
					+ '</div>');
		$('#' + viewId).find('.cubes-notes-html').find('button').button();
		$('#' + viewId).find('.cubes-notes-html').find('button').click(
				function() {
					view.notes = $('#' + viewId).find('.cubes-notes-html')
							.find('textarea').val();
					cubesviewer.redrawView(viewId);
				});

	};

	// Draw notes
	this.drawNotes = function(viewId) {

		var view = cubesviewer.views[viewId];

		var htmlNotes = Wiky.toHtml(view.notes);

		$('#' + viewId)
				.find('.viewnotes')
				.append(
						'<div><h3 style="margin-top: 14px; margin-bottom: 16px;">Notes <a href="#" style="font-size: 12px;" class="cubes-notes-edit">[edit]</a></h3></div>');
		$('#' + viewId).find('.viewnotes>div').append(
				'<div class="cubes-notes-html">' + htmlNotes + '</div>');

		if (view.owner == cubesviewer.options.user) {
			$('#' + viewId).find('.cubes-notes-edit').click(function() {
				cubesviewer.notesEdit(viewId);
				return false;
			});
		} else {
			$('#' + viewId).find('.cubes-notes-edit').remove();
		}

	};

	
};

