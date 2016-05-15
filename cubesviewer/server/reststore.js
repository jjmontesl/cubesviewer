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

"use strict";

angular.module('cv.studio').service("reststoreService", ['$rootScope', '$http', '$cookies', 'cvOptions', 'cubesService', 'viewsService', 'dialogService', 'studioViewsService',
                                                           function ($rootScope, $http, $cookies, cvOptions, cubesService, viewsService, dialogService, studioViewsService) {

	var reststoreService = this;

	reststoreService.savedViews = [];

	reststoreService.initialize = function() {
		if (! cvOptions.backendUrl) return;
		reststoreService.viewList();
	};

    /**
     * Returns a stored view from memory.
     */
	reststoreService.getSavedView = function(savedId) {
        var view = $.grep(reststoreService.savedViews, function(ed) { return ed.id == savedId; });
        if (view.length > 0) {
            return view[0];
        } else {
            return null;
        }
    };

    /**
     * Save a view.
     */
    reststoreService.saveView = function (view) {

        if (view.owner != cvOptions.user) {
            dialogService.show('Cannot save a view that belongs to other user (try cloning the view).');
            return;
        }

        var data = {
            "id": view.savedId,
            "name": view.params.name,
            "shared": view.shared,
            "data":  viewsService.serializeView(view)
        };

        $http({
        	"method": "POST",
        	"url": cvOptions.backendUrl + "/view/save/",
        	"data": JSON.stringify(data),
        	"headers": {"X-CSRFToken": $cookies.get('csrftoken')},
        }).then(reststoreService._viewSaveCallback(view), cubesService.defaultRequestErrorHandler);

    };

    /**
     * Save callback
     */
    reststoreService._viewSaveCallback = function(view) {

        var view = view;

        return function(data, status) {
            data = data.data;
        	if (view != null) {
                view.savedId = data.id;

                // Manually update saved list to avoid detecting differences as the list hasn't been reloaded
                var sview = reststoreService.getSavedView(view.savedId);
                if (sview != null) {
                    sview.name = view.params.name;
                    sview.shared = view.shared;
                    sview.data = viewsService.serializeView(view)
                }
            }
            reststoreService.viewList();

            dialogService.show("View saved.");
        }

    };

    /**
     * Delete a view.
     */
    reststoreService.deleteView = function (view) {

        if (view.savedId == 0) {
        	dialogService.show("Cannot delete this view as it hasn't been saved.");
            return;
        }
        if (view.owner != cvOptions.user) {
            dialogService.show('Cannot delete a view that belongs to other user.');
            return;
        }

        if (! confirm('Are you sure you want to delete and close this view?')) {
            return;
        }

        var data = {
            "id": view.savedId,
            "data": ""
        };

        studioViewsService.closeView(view);

        $http({
        	"method": "POST",
        	"url": cvOptions.backendUrl + "/view/save/",
        	"data": JSON.stringify(data),
        	"headers": {"X-CSRFToken": $cookies.get('csrftoken')}
         }).then(reststoreService._viewDeleteCallback, cubesviewer.defaultRequestErrorHandler);

    };

    /*
     * Delete callback
     */
    reststoreService._viewDeleteCallback = function() {
    	reststoreService.viewList();
    };

    /*
     * Get view list.
     */
    reststoreService.viewList = function () {
        $http.get(cvOptions.backendUrl + "/view/list/").then(
        		reststoreService._viewListCallback, cubesService.defaultRequestErrorHandler);
    };

    reststoreService._viewListCallback = function(data, status) {
    	reststoreService.savedViews = data.data;
    };

    reststoreService.isViewChanged = function(view) {

        if (view.savedId == 0) return false;

        // Find saved copy
        var sview = reststoreService.getSavedView(view.savedId);

        // Find differences
        if (sview != null) {
            if (view.params.name != sview.name) return true;
            if (view.shared != sview.shared) return true;
            if (viewsService.serializeView(view) != sview.data) return true;
        }

        return false;

	};

    /**
     * Change shared mode
     */
	reststoreService.shareView = function(view, sharedstate) {

        if (view.owner != cvOptions.user) {
            dialogService.show('Cannot share/unshare a view that belongs to other user (try cloning the view).');
            return;
        }

        view.shared = ( sharedstate == 1 ? true : false );
        reststoreService.saveView(view);

    };

    /**
     * Loads a view from the backend.
     * This is equivalent to other view adding methods in the cubesviewer.gui namespace,
     * like "addViewCube" or "addViewObject", but thisloads the view definition from
     * the storage backend.
     */
    reststoreService.addSavedView = function(savedViewId) {

    	// TODO: Check whether the server model is loaded, etc

        var savedview = reststoreService.getSavedView(savedViewId);
        var viewobject = $.parseJSON(savedview.data);
        var view = studioViewsService.addViewObject(viewobject);

        if (savedview.owner == cvOptions.user) {
        	view.savedId = savedview.id;
        	view.owner = savedview.owner;
        	view.shared = savedview.shared;
        } else {
        	view.savedId = 0;
        	view.owner = cvOptions.user;
        	view.shared = false;
        }

    };

    reststoreService.initialize();

}]);

