/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
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

"use strict";


angular.module('cv.views.cube').controller("CubesViewerViewsUndoController", ['$rootScope', '$scope', '$timeout', '$element', 'cvOptions', 'cubesService', 'viewsService',
                                                                                   function ($rootScope, $scope, $timeout, $element, cvOptions, cubesService, viewsService) {

  	$scope.initialize = function() {
  		// Add chart view parameters to view definition
  		$scope.view.undoList = [];
  		$scope.view.undoPos = -1;
  	};

  	$scope.initialize();

  	$scope.$on('ViewRefresh', function(view) { $scope._processState(view); });

	$scope._processState = function() {

		var drawn = viewsService.serializeView($scope.view);
		var current = $scope.getCurrentUndoState();

		if (drawn != current) {
			$scope.pushUndo(drawn);
		}

	}

	$scope.pushUndo = function (state) {

		var view = $scope.view;

		view.undoPos = view.undoPos + 1;
		if (view.undoPos + 1 <= view.undoList.length) {
			view.undoList.splice(view.undoPos, view.undoList.length - view.undoPos);
		}
		view.undoList.push(state);

		if (view.undoList.length > cvOptions.undoSize) {
			view.undoList.splice(0, view.undoList.length - cvOptions.undoSize);
			view.undoPos = view.undoList.length - 1;
		}
	};

	$scope.view.updateUndo = function() {
		var view = $scope.view;
		var state = viewsService.serializeView(view);

		if (view.undoList[view.undoPos]) {
			view.undoList[view.undoPos] = state;
		}
	};

	$scope.getCurrentUndoState = function () {
		if ($scope.view.undoList.length == 0) return "{}";
		return $scope.view.undoList[$scope.view.undoPos];
	};

	$scope.undo = function () {
		$scope.view.undoPos = $scope.view.undoPos - 1;
		if ($scope.view.undoPos < 0) $scope.view.undoPos = 0;
		$scope.applyCurrentUndoState();
	};

	$scope.redo = function () {
		$scope.view.undoPos = $scope.view.undoPos + 1;
		$scope.applyCurrentUndoState ();
	};

	$scope.applyCurrentUndoState = function() {
		var current = $scope.getCurrentUndoState();
		$scope.view.params = $.parseJSON(current);
		$scope.refreshView();
	};


}]);


