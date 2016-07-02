CubesViewer - OLAP Visual Viewer and Explore Tool
=================================================

Embedding CubesViewer views
---------------------------

As CubesViewer is mainly a Javascript library, views (or the full GUI) can easily be embedded in other
applications.

Views are designed using CubesViewer Studio. Then, using the `View > Serialize to JSON` option,
you can export your view definitions as JSON, and use the serialized JSON to initialize views in
your application.

Note that you still need a running Cubes server. CubesViewer views don't store any data, and when
they are initialized they need to access Cubes server to retrieve the necessary data for the view.


Embedded views examples
-----------------------

Examples of integration of views can be found in the
[html](https://github.com/jjmontesl/cubesviewer/tree/master/html) directory.

This includes a local HTML file (studio.html) that features a complete static version of
CubesViewer Studio interface, great for quickly testing the app on your
 favourite Cubes server. Just open the file on your web browser.

The directory includes an example of a view embedded into a web page (`views.html`),
and the same example integration under Angular (`views-angular.html`).


Files
---------------------

You need to include CubesViewer CSS and Javascript in the `dist` directory.

You can get dependencies using your favourite dependency manager, but all the needed libraries
are available in the `html/lib` directory for convenience.


Including CubesViewer
---------------------

In order to run CubesViewer, you need to include a number Javascript and CSS dependencies, listed below.

Note that the paths may vary in your application, depending on where you copy libraries. Also,
note that **the order of inclusion of Javascript and CSS files is critical**.

```
    <link rel="stylesheet" href="lib/angular-ui-grid/ui-grid.css" />
    <link rel="stylesheet" href="lib/font-awesome/css/font-awesome.css" />
    <link rel="stylesheet" href="lib/nvd3/nv.d3.css" />
    <link rel="stylesheet" href="lib/openlayers/ol.css" /> <!-- for maps -->
    <link rel="stylesheet" href="lib/cubesviewer/cubesviewer.css" />
    <link rel="stylesheet" href="lib/bootstrap-submenu/css/bootstrap-submenu.css" /> <!-- after cubesviewer.css! -->

    <script src="lib/jquery/jquery.js"></script>
    <script src="lib/bootstrap/bootstrap.js"></script>
    <script src="lib/bootstrap-submenu/js/bootstrap-submenu.js"></script>
    <script src="lib/angular/angular.js"></script>
    <script src="lib/angular-cookies/angular-cookies.js"></script>
    <script src="lib/angular-bootstrap/ui-bootstrap-tpls.js"></script>
    <script src="lib/angular-ui-grid/ui-grid.js"></script>
    <script src="lib/d3/d3.js"></script>
    <script src="lib/nvd3/nv.d3.js"></script>
    <script src="lib/flotr2/flotr2.min.js"></script>
    <script src="lib/openlayers/ol.js"></script> <!-- for maps -->
    <script src="lib/cubesviewer/cubesviewer.js"></script>
```

Check if your project is using any of the included Javascript and CSS dependencies,
as including them twice may cause errors, or there may be version conflicts (jQuery, AngularJS, D3.js, NVD3...).

(Note: the most up to date list of JS and CSS files, and examples of HTML/CSS integration of CubesViewer
is best shown by the examples in the `/html` directory of the package).


Container
---------

In your page, reserve a space for your embedded view or views:

```
<div id="cv-view-1" style="width: 100%; min-height: 120px;">Loading CubesViewer...</div>
```


Initializing CubesViewer
------------------------

Cubesviewer needs to be instantiated after the document has been loaded. We use the jQuery library to
handle the `$(document).ready()` event.

Inside this method:

* Initialize CubesViewer (the URL of the Cubes server needs to be passed)
* Use `cubesviewer.createView()` to create a view in your container (options
  can be defined with a JSON string or a Javascript array).
* You need to wrap your calls to CubesViewer in a `cubesviewer.apply()`
  (note: if you are using CubesViewer from an Angular application, you don't
  need to do this, instead you should be using CubesViewer directives directly).


```
    // Reference to the created view
    var view1 = null;

    // Initialize CubesViewer when document is ready
    $(document).ready(function() {

        // Get user Cubes information for the example
        var cubesUrl = prompt ("Enter your Cubes Server URL", "http://localhost:5000");

        // Initialize CubesViewer system
        cubesviewer.init({
            cubesUrl: cubesUrl
        });

        // Sample serialized view (based on cubes-examples project data)
        var serializedView = '{"cubename":"webshop_sales","name":"Cube Webshop / Sales","mode":"chart","drilldown":["country:continent"],"cuts":[],"datefilters":[{"dimension":"date_sale@daily","mode":"auto-last24m","date_from":"","date_to":""}],"rangefilters":[],"xaxis":"date_sale@daily:month","yaxis":"price_total_sum","charttype":"lines-stacked","columnHide":{},"columnWidths":{},"columnSort":{},"chart-barsvertical-stacked":true,"chart-disabledseries":{"key":"product@product:product_category","disabled":{"Books":false,"Sports":false,"Various":false,"Videos":false}}}';

        // Using a JSON string for view parameters:
        cubesviewer.apply(function() {
            view1 = cubesviewer.createView("#cv-view-1", "cube", serializedView);
        });

    });
```

Use CubesViewer Studio to design views
--------------------------------------

CubesViewer Studio includes a menu option for serializing a view as JSON, which can be used to initialize views,
as shown above. It also includes an option to load views from serialized JSON strings.

If you plan to embed the full CubesViewer Studio, you will need a slightly different
initialization procedure. Check the `/html` examples for further details.

Further information
-------------------

* [Configuring your Cubes model](cubesviewer-model.md)
* [Documentation index](index.md)

