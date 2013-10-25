CubesViewer - OLAP Visual Viewer and Explore Tool
=================================================

About
-----

CubesViewer is a visual, web-based tool application for exploring and analyzing
OLAP databases served by the Cubes OLAP Framework.

This tool allows users to inspect the different dimensions, measures and
aggregated data in different ways, allowing you to build tables and charts
based on analytical data available from the server.   

CubesViewer is a visual interface for the 
open-source ["Cubes" server](http://databrewery.org/cubes.html) (an OLAP server in Python). 
Purpose is to keep it simple and modular, leveraging the web services 
provided by Cubes.  

The main focus of CubesViewer is the full GUI application 
for CubesViewer views creation and management.
But CubesViewer is mainly an HTML5 application which can also be embedded
completely or partially in other sites. Views can easily be 
inserted on other web pages.

Features:

* Cube explorer providing drilldown and cut operations.
* Supports dimension hierarchies and date filtering.
* Several charts and diagrams can be created.
* View management, cloning, saving and sharing.
* User Interface allows for multiple views on-screen. 
* Multiple modes: explore, data series, chart, facts. 
* Undo / Redo.
* Multi-user.
* Shared wiki notes system to annotate cubes and views.
* Views can be embedded in other web sites.
* Modular and extensible.


Source
------

Github source repository: https://github.com/jjmontesl/cubesviewer

Requirements
------------

CubesViewer requires a [Cubes Server](http://databrewery.org/cubes.html) 0.10.1 or later, configured and running, able to serve 
data cubes. 

Note that **your cubes model should be configured** to add support for CubesViewer features like date filters and descriptions
(see Documentation below). 

The **full CubesViewer application** (which includes all features including sharing/saving
and user notes support) includes a Python Django application. You need Django 1.3 in order to run it,
but it is optional. 

**CubesViewer library is HTML5/Javascript** and should work on most modern browsers
(it may even work on older browsers). Views can be embedded in other websites (see the Demos below).


For further information, see the Documentation section below.

Documentation
-------------

* [CubesViewer Documentation](https://github.com/jjmontesl/cubesviewer/blob/master/doc/guide/index.md)

Online demos
------------

* [CubesViewer Demo page](http://jjmontesl.github.io/cubesviewer/index.html) with one embedded view
* [CubesViewer Explorer](http://jjmontesl.github.io/cubesviewer/cv.html) with the full application

Screenshots
-----------

![CubesViewer Chart Screenshot](https://raw.github.com/jjmontesl/cubesviewer/master/doc/screenshots/view-chart-2.png "CubesViewer Chart")
![CubesViewer Chart Screenshot](https://raw.github.com/jjmontesl/cubesviewer/master/doc/screenshots/view-chart-3-notes.png "CubesViewer Chart")
![CubesViewer Chart Screenshot](https://raw.github.com/jjmontesl/cubesviewer/master/doc/screenshots/view-chart-1.png "CubesViewer Chart")
![CubesViewer Explore Screenshot](https://raw.github.com/jjmontesl/cubesviewer/master/doc/screenshots/view-explore-1.png "CubesViewer Explore")
![CubesViewer Explore Screenshot](https://raw.github.com/jjmontesl/cubesviewer/master/doc/screenshots/view-explore-2.png "CubesViewer Explore")
![CubesViewer Series Screenshot](https://raw.github.com/jjmontesl/cubesviewer/master/doc/screenshots/view-series-1.png "CubesViewer Series")

Support
=======

If you have questions, problems or suggestions, please get in touch. 
CubesViewer doesn't have a list on its own. Instead, please get in touch 
through the Cubes project mailing list:

* Report bugs: https://github.com/jjmontesl/cubesviewer/issues
* Discussion at Google Groups: http://groups.google.com/group/cubes-discuss

If you are using or trying CubesViewer, we'd love to hear from you (tweet: #cubesviewer). 

Authors
=======

CubesViewer is written and maintained by Jose Juan Montes 
<jjmontes@gmail.com> and other contributors. 

See AUTHORS file for more information.

License
=======

Cubes is licensed under MIT license with following addition:

    If your version of the Software supports interaction with it remotely 
    through a computer network, the above copyright notice and this permission 
    notice shall be accessible to all users.

Simply said, that if you use it as part of software as a service (SaaS) you 
have to provide the copyright notice in an about, legal info, credits or some 
similar kind of page or info box.

For full license see the LICENSE file.

