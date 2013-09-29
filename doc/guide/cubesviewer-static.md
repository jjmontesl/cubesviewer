CubesViewer - OLAP Visual Viewer and Explore Tool
=================================================

Embedding CubesViewer views
---------------------------

As CubesViewer is mainly a Javascript library, views (or the full GUI) can easily be embedded in other
applications.

You can design your views using CubesViewer GUI. Then, using the "cubesviewer.gui.serializing" plugin
(which is included in the full CubesViewer application) you can export your views as JSON, and use 
the serialized JSON in order to initialize yviews for your application. 

Note that you still need a running Cubes server. CubesViewer views don't store any data, and when
they are initialized they need to access Cubes server to retrieve the necessary data for the view.  

Embedded views examples
-----------------------

Examples of static (Javascript only) views and GUI can be found in the 
[src/htmlviews](https://github.com/jjmontesl/cubesviewer/tree/master/src/htmlviews) directory.

This includes a static HTML file (gui.html) that features a complete static version of
CubesViewer interface, great for quickly testing the app on your favourite Cubes server.
Just open the file on your web browser.

Theh same directory includes an example of a view embedded into a web page (views.html). 

Files
---------------------

You will need to copy the contents of the [src/web/static](https://github.com/jjmontesl/cubesviewer/tree/master/src/web/static) 
directory to your application, so they can be accessed by your users.

Including CubesViewer 
---------------------

In order to run CubesViewer, you need to include a number Javascript and CSS dependencies, listed below.

Note that the paths may vary in your application, depending on where you put CubesViewer file. Also,
note that **the order of inclusion of Javascript files is critical** (  though you could remove optional components).

(Note: the first CSS link, *screen.css*, is not required. It applies default fonts and styles and may be ignored
if you already have applied styles to your site.)  
 
```
    <link rel="stylesheet" href="../web/static/css/blueprint/screen.css" type="text/css" media="screen, projection">

    <link type="text/css" href="../web/static/css/jqueryui-cupertino/jquery-ui-1.9.2.custom.css" rel="stylesheet" />
    <link rel="stylesheet" type="text/css" media="screen" href="../web/static/css/jqgrid/ui.jqgrid.css" />
    <link type="text/css" href="../web/static/js/qtip/jquery.qtip.css" rel="stylesheet" />

    <link rel="stylesheet" type="text/css" href="../web/static/css/cvapp.css" />

    
    <script type="text/javascript" src="../web/static/js/dateformat/dateformat.js"></script>

    <script type="text/javascript" src="../web/static/js/jquery/jquery-1.8.3.js"></script>
    <script type="text/javascript" src="../web/static/js/jquery/jquery-ui-1.9.2.custom.min.js"></script>
    <script type="text/javascript" src="../web/static/js/jquery/jquery.cookie.js"></script>
    
    <script type="text/javascript" src="../web/static/js/qtip/jquery.qtip.js"></script>

    <script src="../web/static/js/jqgrid/i18n/grid.locale-en.js" type="text/javascript"></script>
    <script src="../web/static/js/jqgrid/jquery.jqGrid.min.js" type="text/javascript"></script>

    <script type="text/javascript" src="../web/static/js/cvapp.js"></script>      

    <link type="text/css" rel="stylesheet" href="../web/static/css/cubesviewer/cubesviewer.css" />    
    <link type="text/css" rel="stylesheet" href="../web/static/js/wiky/wiky.math.css" />    
        
    <script type="text/javascript" src="../web/static/js/wiky/wiky.js"></script>
    <script type="text/javascript" src="../web/static/js/wiky/wiky.math.js"></script>
    <script type="text/javascript" src="../web/static/js/flotr2/flotr2.min.js"></script>
    
    <script type="text/javascript" src="../web/static/js/cubesviewer/cubesviewer.js"></script>
    <script type="text/javascript" src="../web/static/js/cubesviewer/cubesviewer.model.js"></script>
    <script type="text/javascript" src="../web/static/js/cubesviewer/cubesviewer.views.js"></script>
    <script type="text/javascript" src="../web/static/js/cubesviewer/cubesviewer.views.cube.js"></script>
    <script type="text/javascript" src="../web/static/js/cubesviewer/cubesviewer.views.cube.explore.js"></script>
    <script type="text/javascript" src="../web/static/js/cubesviewer/cubesviewer.views.cube.series.js"></script>
    <script type="text/javascript" src="../web/static/js/cubesviewer/cubesviewer.views.cube.chart.js"></script>
```

Container
---------

In your page, reserve a space for your embedded view or views:

```
<div id="cv-view1"></div>
```

If you plan to embed the full GUI statically, you will need a different container layout. Check the examples for further details.


Initializing CubesViewer 
------------------------

Cubesviewer needs to be instantiated after the document has been loaded. We use the jQuery library to
handle the *$(document).ready()* event.

First, inside this method, 

* Initialize CubesViewer (the URL of the Cubes server needs to be passed)
* Respond to "cubesviewerModelLoaded" event (because views can only be created once the model is loaded).
* Use *cubesviewer.views.createView* to create a view in your container (options 
  can be defined with a JSON string or a Javascript).
* View need to be redrawn after initializing them (calling *cubesviewer.views.redrawView(view)*).  

 
```
    // Initialize CubesViewer when document is ready
    $(document).ready(function() {
        
        // Initialize CubesViewer system
        cubesviewer.init({
            cubesUrl: "http://localhost:5000"
        });
        
        // Add views
        $(document).bind("cubesviewerModelLoaded", { }, function() {

            // Sample serialized view (Based on cubes-examples project data)
            var serializedView = 
                '{"cubename":"contracts","name":"Cube View - Contracts","mode":"chart","drilldown":["geography:kraj"],"cuts":[],' +
                '"datefilters":[],"xaxis":"date:year","yaxis":"record_count","charttype":"lines-stacked"}';
            
            // Use a serialized JSON string of the object with view arguments
            view1 = cubesviewer.views.createView("olapview1", $('#cv-view1'), "cube", serializedView);
            
            cubesviewer.views.redrawView (view1);
            
        });
        
        // Start Cubesviewer system
        cubesviewer.refresh();
        
    });
```

Use CubesViewer GUI to design views 
-----------------------------------

CubesViewer GUI includes a menu option for serializing a view as JSON, which can be used to initialize views,
as shown above.

The GUI also includes an option to load views from serialized JSON strings.

