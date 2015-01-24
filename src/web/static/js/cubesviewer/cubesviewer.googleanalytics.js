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
 * Google Analytics plugin.
 *
 * This is an optional plugin. When loaded, it uses Google Analytics event system to
 * log CubesViewer operations. Model loading, Aggregations, Facts and Dimension queries
 * are registered as non-interactive events (and don't affect bounce rate). Each
 * view refresh isregistered as an interactive event.
 *
 * Note: If the cache plugin is used, this plugin must be loaded _after_ the cache plugin.
 */


/*
 * Override original cubesRequest
 */
cubesviewer._gaOverridedCubesRequest = cubesviewer.cubesRequest;

cubesviewer.cubesRequest = function(path, params, successCallback, completeCallback, errorCallback) {

	cubesviewer._gaOverridedCubesRequest.apply(this, arguments);

	if (_gaq) {
		if (path.indexOf("/model") == 0) {
			_gaq.push(['_trackEvent', 'CubesViewer', 'Model', , , true]);
		} else if (path.indexOf("/cube") == 0) {
			var cubeOperation = path.split("/");
			if (cubeOperation[3] == "aggregate") {
				_gaq.push(['_trackEvent', 'CubesViewer', 'Aggregate', cubeOperation[2], , true]);
			} else if (cubeOperation[3] == "facts") {
				_gaq.push(['_trackEvent', 'CubesViewer', 'Facts', cubeOperation[2], , true]);
			} else if (cubeOperation[3] == "dimension") {
				_gaq.push(['_trackEvent', 'CubesViewer', 'Dimension', cubeOperation[4], , true]);
			}
		}
	}

}

/*
 * Tracks a "ViewDraw" event (except for the first call, which is discarded).
 */
$(document).bind("cubesviewerViewDraw", { }, function(event, view) {

	if (view.cube == null) return;
	if (_gaq) {
		if ("gaFirstDraw" in view) {
			_gaq.push(['_trackEvent', 'CubesViewer', 'ViewDraw', view.cube.name]);
			view.gaFirstDraw = false;
		} else {
			view.gaFirstDraw = true;
		}
	}

});


