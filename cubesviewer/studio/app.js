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


// Declare app level module which depends on filters, directives and services
var cvStudioApp = angular.module('cv.studio', ['ui.bootstrap', 'ui.bootstrap-slider', 'ui.validate', 'ngAnimate',
                                    'angularMoment', 'smart-table', 'angular-confirm', 'debounce', 'xeditable',
                                    'nvd3',
                                    'cubesviewer.services', 'cubesviewer.directives', 'cubesviewer.filters' ]);



// Disable Debug Info (for production)
cvStudioApp.config(['$compileProvider', function ($compileProvider) {
	// TODO: Enable debug optionally
	//$compileProvider.debugInfoEnabled(false);
}]);


// Configure moment.js
angular.module('cv').constant('angularMomentConfig', {
    //preprocess: 'unix', // optional
    //timezone: 'Europe/London' // optional
});


cvStudioApp.run(['$timeout', 'editableOptions', 'editableThemes', function($timeout, editableOptions, editableThemes) {

	// XEditable bootstrap3 theme. Can be also 'bs2', 'default'
	editableThemes.bs3.inputClass = 'input-sm';
	editableThemes.bs3.buttonsClass = 'btn-sm';
	editableOptions.theme = 'bs3';

	// Initialize Cubes service
	cubesService.connect();

}]);

// Services and Directives
//var services = angular.module('cvStudioApp.services', []);
//#var directives = angular.module('cvStudioApp.directives', []);

cubesviewer.prototype.studio = {

	init: function(params) {
		angular.element(document).ready(function() {
			angular.bootstrap(document, ['cvStudioApp']);
		});
	}

}

// For backwards compatibilty
cubesviewer.prototype.gui = cubesviewer.prototype.studio;
