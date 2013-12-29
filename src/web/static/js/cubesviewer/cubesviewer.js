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
	this.version = "0.9";
	
	// Default options
	this.options = {
		cubesUrl : null,
		cubesLang : null,
		pagingOptions: [15, 30, 100, 250],
		datepickerShowWeek: true,
		datepickerFirstDay: 1,
		tableResizeHackMinWidth: 350 ,
		jsonRequestType: "json" // "json | jsonp"
	};

	// Model data as obtained from Cubes
	this.model = null;
	
	// Error state (failed to load model)
	this.state = "Not initialized";
	
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
	 * Cubes centralized request 
	 */
	this.cubesRequest = function(path, params, successCallback, completeCallback, errorCallback) {
		
		var jqxhr = $.get(this.options["cubesUrl"] + path, params, this._cubesRequestCallback(successCallback), cubesviewer.options.jsonRequestType);
		
		if (completeCallback != undefined && completeCallback != null) {
			jqxhr.always (completeCallback);
		}

		if (errorCallback != undefined && errorCallback != null) {
			jqxhr.fail (errorCallback);
		} else {
			jqxhr.fail (cubesviewer.defaultRequestErrorHandler);
		}
		
	}
	
	this._cubesRequestCallback = function(pCallback) {
		var callback = pCallback;
		return function(data, status) {
			pCallback(data);
		}
	};
	
	/*
	 * Default XHR error handler for CubesRequests
	 */
	this.defaultRequestErrorHandler = function(xhr, textStatus, errorThrown) {
		if (xhr.status == 401) {
			cubesviewer.alert("Unauthorized.");
		} else if (xhr.status == 403) {
			cubesviewer.alert("Forbidden.");
		} else {
			cubesviewer.alert("An error occurred while accessing the data server. Please try again or "
					+ "contact the server administrator if the problem persists.");
		}
		//$('.ajaxloader').hide();
	};
	
	/*
	 * Load model (cube list, dimensions...)
	 */ 
	this.loadModel = function() {
		this.cubesRequest ("/model", { "lang": this.options.cubesLang }, this._loadModelCallback(), function() {}, function (xhr, textStatus, errorThrown) {
			cubesviewer.state = "Failed to load model";
			cubesviewer.showInfoMessage ('CubesViewer could not load model from Cubes server. CubesViewer will not work. Try reloading.<br /><br>Status: ' + xhr.status);
			$(document).trigger("cubesviewerModelLoaded", null );
		});
		//$.get(this.options["cubesUrl"] + "/model", { "lang": this.options.cubesLang }, this._loadModelCallback());
	};

	this._loadModelCallback = function() {
		var cubesviewer = this;
		return function(data) {
			// Set new model
			cubesviewer.model = cubesviewer.buildModel(data);
			
			cubesviewer.state = "Initialized";
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
		// TODO: This should probably not be a global handler!
		//$(document).ajaxError(
			// Nothing, remove
		//);		
		
		// Bind events
		$(document).bind ("cubesviewerRefresh", this.onRefresh);
		
	};
	
	/*
	 * Show quick tip message.
	 */
	this.showInfoMessage = function(message, delay) {
		
		if (delay == undefined) delay = 5000;
		
		if ($('#cv-cache-indicator').size() < 1) {
				
			$("body").append('<div id="cv-cache-indicator" class="cv-view-panel cv-cssreset" style="display: none;"></div>')
			$('#cv-cache-indicator').qtip({
				   content: 'NO MESSAGE DEFINED',
				   position: {
					   my: 'bottom right',
					   at: 'bottom right',
					   target: $(window),
					   adjust: {
						   x: -10,
						   y: -10
					   }
				   },
				   style: {
					   classes: 'fixed',
					   tip: {
						   corner: false
					   }
				   },
				   show: {
					   delay: 0,
					   event: ''
				   },
				   hide: {
					   inactive: delay
				   }
			});
		}

		$('#cv-cache-indicator').qtip('option', 'content.text', message);
		$('#cv-cache-indicator').qtip('toggle', true);
	};
	
};

/*
 * Global cubesviewer variable.
 */
cubesviewer = new cubesviewer();


