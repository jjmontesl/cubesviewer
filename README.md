CubesViewer - OLAP Visual Viewer and Explore Tool
=================================================

About
-----

CubesViewer is a client side application for exploring and analyzing
OLAP databases served by the Cubes OLAP Framework.

This tool allow to inspect the diferent dimensions, measures and
aggregate data in different ways. It is a frontend for the
open-source ["Cubes" server](http://databrewery.org/cubes.html) (an OLAP server in Python). 
Purpose is to keep it simple and modular, leveraging the data model 
provided by Cubes. 

CubesViewer is mainly an HTML5 application which can be embedded
completely or partially in other sites. Widgets can be inserted
separately in order to show a particular view to users, but the full
OLAP Explorer User Interface is the main focus of the application.

Features:

* User Interface allowing for multiple cube views on-screen. 
* Cube explorer providing drilldown and cut operations.
* Several types of charts.
* View management, sharing and saving.
* Modular and extensible.

Source
------

Github source repository: https://github.com/jjmontesl/cubesviewer

Requirements
------------

*CubesViewer library is HTML5/Javascript* and should work on most modern browsers
(it may even work on older browsers). 

CubesViewer requires *[Cubes Server](http://databrewery.org/cubes.html)* 0.11 or later, configured and running, able to serve 
data cubes. 

The full *Cubes Viewer application* (which includes all features including sharing/saving
support) is a Python Django application. In order to run it,
follow the usual procedure to set up a Djanjo application (creation of database and launching
the server).

CubesViewer has been tested on Ubuntu Server 12.04.

Screenshots
-----------

![CubesViewer Chart Screenshot](/doc/screenshots/view-chart-1.png "CubesViewer Chart")
![CubesViewer Chart Screenshot](/doc/screenshots/view-chart-2.png "CubesViewer Chart")
![CubesViewer Chart Screenshot](/doc/screenshots/view-chart-3-notes.png "CubesViewer Chart")
![CubesViewer Explore Screenshot](/doc/screenshots/view-explore-1.png "CubesViewer Explore")
![CubesViewer Explore Screenshot](/doc/screenshots/view-explore-2.png "CubesViewer Explore")
![CubesViewer Series Screenshot](/doc/screenshots/view-series-1.png "CubesViewer Series")

Support
=======

If you have questions, problems or suggestions, get in touch. CubesViewer doesn't
have a list on its own. Instead, you can contact the author and users via the 
Cubes project mailing list:

* Google group: http://groups.google.com/group/cubes-discuss

Report bugs using github issue tracking: https://github.com/jjmontesl/cubesviewer/issues

Development
-----------

Any suggestion, idea, patch, improvement or bug report would be very welcome.

Please let me know if you are using CubesViewer. It's encouraging.

Authors
=======

CubesViewer is written and maintained by Jose Juan Montes 
<jjmontes@gmail.com> and other contributors. See AUTHORS file for more 
information.

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

