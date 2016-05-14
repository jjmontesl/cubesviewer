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

/**
 * View storage for GUI. This is an optional component.
 * Provides methods to access CubesViewer backend operations like saving and loading user views.
 * The cubesviewer-server project includes a Django backend that supports the basic saving/loading capabilities
 * used by this plugin.
 */
angular.module('cv.studio').controller("CubesViewerSerializeViewController", ['$rootScope', '$scope', '$timeout', '$uibModalInstance', 'element', 'cvOptions', 'cubesService', 'studioViewsService', 'viewsService', 'view',
                                                                              function ($rootScope, $scope, $timeout, $uibModalInstance, element, cvOptions, cubesService, studioViewsService, viewsService, view) {

	$scope.savedViews = [];

	$scope.view.isViewChanged = function() {

		var view = this;

        if (view.savedId == 0) return false;

        // Find saved copy
        var sview = $scope.getSavedView(view.savedId);

        // Find differences
        if (sview != null) {
            if (view.params.name != sview.name) return true;
            if (view.shared != sview.shared) return true;
            if (view.cubesviewer.views.serialize(view) != sview.data) return true;
        }

        return false;

	};

    /*
     * Returns a stored view from memory.
     */
    $scope.getSavedView = function(savedId) {
        var view = $.grep($scope.savedViews, function(ed) { return ed.id == savedId; });
        if (view.length > 0) {
            return view[0];
        } else {
            return null;
        }
    };


}]);

function cubesviewerGuiRestStore() {


    /*
     * Save a view.
     */
    this.saveView = function (view) {

        if (view.owner != view.cubesviewer.gui.options.user) {
            view.cubesviewer.alert ('Cannot save a view that belongs to other user (try cloning the view).');
            return;
        }

        var data = {
            "id": view.savedId,
            "name": view.params.name,
            "shared": view.shared,
            "data":  view.cubesviewer.views.serialize(view)
        };

        $.ajax({
        	"type": "POST",
        	"url": view.cubesviewer.gui.options.backendUrl + "/view/save/",
        	"data": data,
        	"success": view.cubesviewer.gui.reststore._viewSaveCallback(view),
        	"dataType": "json",
        	"headers": {"X-CSRFToken": $.cookie('csrftoken')},
        })
        .fail(cubesviewer.defaultRequestErrorHandler);

    };

    /*
     * Delete a view.
     */
    this.deleteView = function (view) {

        if (view.savedId == 0) {
            view.cubesviewer.alert ("Cannot delete this view as it hasn't been saved.");
            return;
        }
        if (view.owner != view.cubesviewer.gui.options.user) {
            view.cubesviewer.alert ('Cannot delete a view that belongs to other user.');
            return;
        }

        if (! confirm('Are you sure you want to delete and close this view?')) {
            return;
        }

        var data = {
            "id": view.savedId,
            "data": ""
        };

        view.cubesviewer.gui.closeView(view);

        $.ajax({
        	"type": "POST",
        	"url": view.cubesviewer.gui.options.backendUrl + "/view/save/",
        	"data": data,
        	"success": view.cubesviewer.gui.reststore._viewDeleteCallback(view.cubesviewer.gui),
        	"dataType": "json",
        	"headers": {"X-CSRFToken": $.cookie('csrftoken')},
         })
         .fail(cubesviewer.defaultRequestErrorHandler);

    };

    /*
     * Save callback
     */
    this._viewSaveCallback = function(view) {

        var view = view;

        return function(data, status) {
            if (view != null) {
                view.savedId = data.id;

                // Manually update saved list to avoid detecting differences as the list hasn't been reloaded
                var sview = view.cubesviewer.gui.reststore.getSavedView	(view.savedId);
                if (sview != null) {
                    sview.name = view.params.name;
                    sview.shared = view.shared;
                    sview.data = view.cubesviewer.views.serialize(view)
                }

                view.cubesviewer.views.redrawView(view);
            }
            view.cubesviewer.gui.reststore.viewList();

            cubesviewer.showInfoMessage("View saved.", 3000);
        }

    };

    /*
     * Delete callback
     */
    this._viewDeleteCallback = function(gui) {

        var gui = gui;

        return function(data, status) {
            gui.reststore.viewList();
        }

    };

    /*
     * Get view list.
     */
    this.viewList = function () {
        $.get(this.cubesviewer.gui.options.backendUrl + "/view/list/", null, this.cubesviewer.gui.reststore._viewListCallback, "json")
         .fail(cubesviewer.defaultRequestErrorHandler);
    };

    this._viewListCallback = function(data, status) {

        cubesviewer.gui.savedViews = data;

        $(cubesviewer.gui.options.container).find(".cv-gui-savedviews-menu").empty();
        $(cubesviewer.gui.options.container).find(".cv-gui-sharedviews-menu").empty();

        $( data ).each (function(idx, e) {
            var link = '<li><a style="margin-left: 10px; white-space: nowrap; overflow: hidden;" class="backend-loadview" data-view="' + e.id + '" href="#" title="' + e.name + '">' + e.name + '</a></li>';
            if (e.owner == cubesviewer.gui.options.user) {
                $(cubesviewer.gui.options.container).find('.cv-gui-savedviews-menu').append (link);
            }
            if (e.shared) {
                $(cubesviewer.gui.options.container).find('.cv-gui-sharedviews-menu').append (link);
            }
        });

        $(cubesviewer.gui.options.container).find('.cv-gui-savedviews-menu').menu('refresh');
        $(cubesviewer.gui.options.container).find('.cv-gui-sharedviews-menu').menu('refresh');

        $(cubesviewer.gui.options.container).find('.backend-loadview').click(function () {
            cubesviewer.gui.reststore.addViewSaved($(this).attr('data-view'));
            return false;
        });


        function getURLParameter(name) {
            return decodeURI(
                (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
            );
        }

        // Preload views
        /*
        if (!this.urlLoaded) {
            backend.urlLoaded = true;
            views = getURLParameter("views");
            if (views != "null") {
                $(views.split(',')).each(function (idx,e) {
                    backend.viewLoad(e);
                });
            }
        }
        */


    };


    /*
     * Change shared mode
     */
    this.shareView = function(view, sharedstate) {

        if (view.owner != view.cubesviewer.gui.options.user) {
            view.cubesviewer.alert ('Cannot share/unshare a view that belongs to other user (try cloning the view).');
            return;
        }

        view.shared = ( sharedstate == 1 ? true : false );
        this.saveView(view);

    };

    /*
     * Loads a view from the backend.
     * This is equivalent to other view adding methods in the cubesviewer.gui namespace,
     * like "addViewCube" or "addViewObject", but thisloads the view definition from
     * the storage backend.
     */
    this.addViewSaved = function(savedViewId) {

    	// TODO: Check whether the server model is loaded, etc

        var savedview = this.getSavedView(savedViewId);
        var viewobject = $.parseJSON(savedview.data);
        var view = cubesviewer.gui.addViewObject(viewobject);
        view.savedId = savedview.id
        view.owner = savedview.owner;
        view.shared = savedview.shared;

        this.cubesviewer.views.redrawView (view);
    };


};

/*
 * Create object.
 */
cubesviewer.gui.reststore = new cubesviewerGuiRestStore();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.gui.reststore.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.gui.reststore.onViewDraw);
$(document).bind("cubesviewerGuiDraw", { }, cubesviewer.gui.reststore.onGuiDraw);
