CubesViewer - OLAP Visual Viewer and Explore Tool
=================================================

About
-----

CubesViewer is a visual, web-based tool for exploring and analyzing
OLAP databases served by the Cubes OLAP Framework.

CubesViewer can be used for data exploration and auditory,
generation of reports, chart designing and embedding,
and as a (simple) company-wide analytics application.

CubesViewer is a visual interface for the
open source [Cubes server](http://databrewery.org/cubes.html) (an OLAP server in Python).
Purpose is to keep it simple while leveraging the web services provided by Cubes.

**CubesViewer 2.0 is out** with tons of new features! Check the
[official site](http://www.cubesviewer.com/) and
the [release notes](http://github.com/jjmontesl/cubesviewer/blob/master/RELEASE-NOTES.md)!

Features:

* Dimension hierarchies, date filtering
* Several charts and diagrams can be created
* Explore, create data series, draw charts, see raw facts
* Export data and images
* Responsive design, tablet friendly
* Undo / redo
* Views can be embedded in other web sites
* User Interface allows for multiple views on-screen
* Optional multi-user server-side backend for saving/sharing views


Online Demos
------------

* [CubesViewer Site](http://www.cubesviewer.com)
* [CubesViewer Studio](http://www.cubesviewer.com/studio.html) with the full application

<!---
* [CubesViewer Embedded Views](http://jjmontesl.github.io/cubesviewer/views.html) showing embedded views
-->

Download
--------

Latest CubesViewer stable release is 2.0.2:

* CubesViewer 2.0.2
  * [cubesviewer-v2.0.2.zip](https://github.com/jjmontesl/cubesviewer/archive/v2.0.2.zip)
  * [cubesviewer-server-v2.0.2.zip](https://github.com/jjmontesl/cubesviewer-server/archive/v2.0.2.zip)
  * [Changelog](http://github.com/jjmontesl/cubesviewer/blob/v2.0.2/CHANGES.txt)
  * [Release Notes](http://github.com/jjmontesl/cubesviewer/blob/v2.0.2/RELEASE-NOTES.txt)
  * Works with *Cubes 1.0.x* and *Cubes 1.1.x*

CubesViewer Server already includes the CubesViewer library so you just need that package
if you plan to deploy the server-side application.

If you do modifications to the project, cloning both repositories via `git` is encouraged, so you can
easily contribute your fixes and improvements back.

Requirements
------------

CubesViewer consists of two parts:

**CubesViewer client** is an HTML5 application that runs on any modern browser.
It can run without server side support. **Simply download the package and open**
`html/studio.html` in your favorite browser. Views can also be embedded in other sites.

CubesViewer also features an optional **server side application**
which provides a full web application and supports features like sharing/saving views.
This project lives on a separate repository: [CubesViewer Server](http://github.com/jjmontesl/cubesviewer-server)
(not to be confused with Cubes Server itself).

You need a configured and running [Cubes Server](http://databrewery.org/cubes.html) version 1.0.x or later.
Your Cubes model may use some extra configuration if you wish to use features like date
filters and range filters (see Documentation below).

For CubesViewer clients to connect to Cubes server ("slicer"), your Cubes server possibly needs to allow
cross origin resource sharing (CORS). To enable it, add `allow_cors_origin: *`
(or a more restrictive setting) under the `[server]` section of the `slicer.ini` file.

For further information, see the Documentation section below.

Documentation
-------------

This tool allows users to inspect the different dimensions, measures and
aggregated data in different ways, allowing you to build tables and charts
based on the analytical data available from the server.

* [CubesViewer Quick Start](http://github.com/jjmontesl/cubesviewer/blob/master/doc/guide/cubesviewer-quickstart.md)
* [CubesViewer Documentation](http://github.com/jjmontesl/cubesviewer/blob/master/doc/guide/index.md)

* [CubesViewer 2.0 Release Notes](http://github.com/jjmontesl/cubesviewer/blob/master/RELEASE-NOTES.md)


Screenshots
-----------

![CubesViewer Explore Screenshot](https://raw.github.com/jjmontesl/cubesviewer/master/doc/screenshots/view-explore-1.png "CubesViewer Explore")
![CubesViewer Chart Screenshot](https://raw.github.com/jjmontesl/cubesviewer/master/doc/screenshots/view-chart-2.png "CubesViewer Chart")

Support
=======

You can use the Cubes discuss group for CubesViewer related questions,
and report bugs or features via CubesViewer issue tracker:

* User group: http://groups.google.com/group/cubes-discuss
* Report bugs: http://github.com/jjmontesl/cubesviewer/issues

Source
======

Github source repository:

* http://github.com/jjmontesl/cubesviewer
* http://github.com/jjmontesl/cubesviewer-server

About versioning:

* Tagged versions (ie. v2.0.x) are stable releases.
* The "master" branch may be ahead the latest stable version, but is meant to be stable (fixes and documentation improvements).
* Development and latest changes happen in the "devel" branch and others.

Collaborate!
------------

Using CubesViewer or interested in data engineering / data visualization? CubesViewer
is an open source project and could grow up best with the help of fellow coders.

You can collaborate:

* If you find bugs, please [file an issue](http://github.com/jjmontesl/cubesviewer/issues).
* If you have a feature request, also file an issue.
* If you fix bugs, please do send a pull request.
* If you make reusable changes, please document those and send a pull request.
* If you wish to take over a larger feature, get in touch through the Cubes discuss group above
  in order to plan for it collectively. Check the TODO.txt file if you need some inspiration.
* You can also help improving the documentation or writing about Cubes/CubesViewer, and spreading the love.

If you are using or trying CubesViewer, we'd love to hear from you (please tweet #cubesviewer !).

Authors
=======

CubesViewer is written and maintained by Jose Juan Montes
and other contributors.

See AUTHORS file for more information.

License
=======

CubesViewer is published under MIT license.

For full license see the LICENSE file.

