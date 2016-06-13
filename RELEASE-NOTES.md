
CubesViewer 2.0 Release Notes
=============================

CubesViewer is a visual, web-based tool application for exploring and analyzing
OLAP databases served by the Cubes OLAP Framework.

CubesViewer can be used for data exploration and data auditory,
generation of reports, chart design and embedding,
and as a (simple) company-wide analytics application.

* [CubesViewer Official Site](http://www.cubesviewer.com)
* [CubesViewer at GitHub](https://github.com/jjmontesl/cubesviewer)


2.0 Release Notes
-----------------

This is a major release of CubesViewer featuring tons of improvements, new
features, a rebranded look and feel as well as a new code architecture
that greatly eases development and paves the way for following versions.

CubesViewer has undergone a major upgrade. The code is now built upon
*AngularJS*, and the UI framework has been migrated from jQueryUI to
*Bootstrap* and *Angular Bootstrap* components. HTML has been rewritten
and separated into easier to handle templates.

The application is now more *responsive* and *mobile friendly*
and looks more stylish overall. CSS has been reworked and namespaced,
easing integration into other web documents.

Migration to AngularJS has involved an comprehensive
refactoring and review of every module, and we trust it's been for the better.
Internally, the build pipeline now uses *Less*, *Grunt* and *Bower*, and a lot
of dependencies have been removed. All together allow CubesViewer to now be
distributed as a single `.js` file (minified version also available) and
accompanying `.css` file. *JSDoc* has also been introduced.

Other additions feature:

* Printer friendly CSS.
* Export charts as images.
* New horizontal bars chart.
* Line and area charts with curved lines.
* Improved error reporting and user interface.
* CubesViewer Server (optional) upgraded to Django 1.9.
* Plugin for cube usage tracking via Google Analytics.
* Improved documentation and tutorials.

Make sure you read the [Changelog]() for the full list of changes.

Special thanks to Stefan Urbanek, Devin Howard and all the other
contributors and users for your support and collaboration.


Requirements
------------

CubesViewer consists of two parts:

**CubesViewer client** is a HTML5 application that runs on any modern browser.
It can run without server side support. **Simply download the package and open**
`html/studio.html` in your favorite browser. Views can also be embedded in other sites.

CubesViewer also features an optional **server side application**
which provides a full web application and supports features like sharing/saving views.
This project lives on a separate repository: [CubesViewer Server](https://github.com/jjmontesl/cubesviewer-server)
(not to be confused with Cubes Server itself).

You need a configured and running [Cubes Server](http://databrewery.org/cubes.html) version 1.0.x or later.
Your Cubes model may need some extra configuration if you wish to use features like date filters.


Upgrading from 2.0.1
--------------------

1. A new Javascript dependency (masonry) has been added to the Studio application
   (this does not apply if you are using CubesViewer Server or embedding CubesViewer
   views: only if embedding CubesViewer Studio). Check the sample `html/studio.html`
   for an up to date list of dependencies.


Upgrading from 0.10 or 0.11
---------------------------

1. If you are integrating CubesViewer in your HTML, note that the code needed for
   initializing CubesViewer has changed slightly. The list of Javascript and CSS
   dependencies has also changed. Refer to the [Embedding CubesViewer] for detailed
   instructions on integrating views and the full list of initialization options.

2. View definitions are (partially) backwards compatible, but some of the attributes
   have changed (ie. column width definition). If you or your users have stored view
   definitions, either via CubesViewer Server or any other JSON view definition,
   it is recommended to test drive your existing view definitions to check they
   show up as expected.

3. The "Range Filter" feature hasn't yet been upgraded from previous version and
   is not available. If you were using "Range Filter" these will not show up.

4. Column sorting now follows `order_attribute` from model. Depending on your
   model definition, you may find that some columns are not ordered as in 0.x.
   See documentation "CubesViewer Model options" for details.

5. For CubesViewer clients to connect to Cubes server ("slicer"), your Cubes server
   possibly needs to allow cross origin resource sharing (CORS). To enable it,
   add `allow_cors_origin: *` (or a more restrictive setting)
   under the `[server]` section of the `slicer.ini` file.

6. If you are using CubesViewer Server, you need to upgrade your database after
   upgrading the application package. As with any Django app,
   run `python manage.py migrate`.


For complete installation instructions, see the
[CubesViewer Documentation](http://github.com/jjmontesl/cubesviewer/blob/master/doc/guide/index.md).


Upgrading from 0.9 or earlier
-----------------------------

CubesViewer 0.9 supported older Cubes 0.10.x. This version of Cubes is no longer supported
by CubesViewer and thus you need to upgrade your Cubes Server installation first and
reinstall CubesViewer.

