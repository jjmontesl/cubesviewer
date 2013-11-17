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
 * Override original cubesRequest 
 */
cubesviewer._gaOverridedCubesRequest = cubesviewer.cubesRequest;


cubesviewer.cubesRequest = function(path, params, successCallback, completeCallback, errorCallback) {
	
	cubesviewer._cacheOverridedCubesRequest.apply(this, arguments);
	
	if (_gaq) {
		if (path.indexOf("/model") == 0) {
			_gaq.push(['_trackEvent', 'CubesViewer', 'Model']);
			//console.debug ("GA Event: CubesViewer / Model");
		} else if (path.indexOf("/cube") == 0) {
			var cubeOperation = path.split("/");
			if (cubeOperation[3] == "aggregate") {
				_gaq.push(['_trackEvent', 'CubesViewer', 'Aggregate', cubeOperation[2]]);
				//console.debug ("GA Event: CubesViewer / Aggregate");
			} else if (cubeOperation[3] == "facts") {
				_gaq.push(['_trackEvent', 'CubesViewer', 'Facts', cubeOperation[2]]);
				//console.debug ("GA Event: CubesViewer / Facts");
			} else if (cubeOperation[3] == "dimension") {
				_gaq.push(['_trackEvent', 'CubesViewer', 'Dimension', cubeOperation[4]]);
				//console.debug ("GA Event: CubesViewer / Dimension");
			}
		}
	}
	
}


