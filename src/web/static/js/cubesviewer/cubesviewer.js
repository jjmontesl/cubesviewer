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
 * Main cubesviewer object. It is created by the library and made 
 * available as the global "cubesviewer" variable.
 */
function cubesviewer () {
	
	// CubesViewer version
	this.version = "0.5-devel";
	
	// Default options
	this.options = {
		cubesUrl : null,
		cubesLang : null
	};

	// Model data as obtained from Cubes
	this.model = null;
	
	/*
	 * Show a global alert
	 */
	this.alert = function (message) {
		alert ("CubesViewer " + this.version + "\n\n" + message);
	}
	
	/*
	 * Refresh
	 */
	this.refresh = function() {
		$(document).trigger("cubesviewerRefresh");
	}
	
	/*
	 * Respond to the restart event
	 */ 
	this.onRefresh = function() {
		// Loading the model will cause menus to be redrawn
		cubesviewer.loadModel();
	}

	/*
	 * Load model (cube list, dimensions...)
	 */ 
	this.loadModel = function() {
		$.get(this.options["cubesUrl"] + "/model", { "lang": this.options.cubesLang }, this._loadModelCallback(), "json");
	};

	this._loadModelCallback = function() {
		var cubesviewer = this;
		return function(data, status) {
			// Set new model
			cubesviewer.model = cubesviewer.buildModel(data);
			$(document).trigger("cubesviewerModelLoaded", [ cubesviewer.model ] )
		}
	};		
	
	/*
	 * Change language for Cubes operations 
	 * (locale must be one of the possible languages for the model).
	 */
	this.changeCubesLang = function(lang) {
		
		this.options.cubesLang = (lang == "" ? null : lang);

		// Reinitialize system
		this.refresh();
		
	};	
	
	/*
	 * Initialize CubesViewer library.
	 */ 
	this.init = function (options) {

		$.extend(cubesviewer.options, options);

		// Avoid square brackets in serialized array params
		$.ajaxSetup({
			traditional : true
		});

		// Global AJAX error handler
		$(document).ajaxError(
			function myErrorHandler(event, xhr, ajaxOptions, thrownError) {
				cubesviewer.alert("An error occurred while accessing the data server. Please try again or\n"
						+ "contact the server administrator if the problem persists.");
				//$('.ajaxloader').hide();
			}
		);		
		
		// Bind events
		$(document).bind ("cubesviewerRefresh", this.onRefresh);
		
	};
	
};

/*
 * Global cubesviewer variable.
 */
cubesviewer = new cubesviewer();


