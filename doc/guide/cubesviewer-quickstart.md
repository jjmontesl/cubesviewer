CubesViewer - Quickstart
========================

Hello Cubes!
------------

CubesViewer is a client-side HTML5 application. You can test it by simply downloading
the package and opening the HTML file in your browser.

1. Download the latest cubesviewer:

   `git clone https://github.com/jjmontesl/cubesviewer.git`

   (You can also download a zipped package).

2. Open `html/views.html` in your browser. When prompted,
   accept the default server URL (`http://cubesdemo.cubesviewer.com/`).

3. Done! You are running your own copy of CubesViewer connecting to data
   from CubesViewer public demo server.


CubesViewer family
------------------

* *Cubes* is the OLAP Cubes Server by DataBrewery.
* *CubesViewer* is the client-side HTML5 viewer library for Cubes.
* *CubesViewer Studio* is the client-side HTML5 exploring solution for Cubes.
* *CubesViewer Server* is the server-side backend for CubesViewer Studio (optional).


Setting up Cubes and CubesViewer example data
---------------------------------------------

The example above uses data from CubesViewer public demo server. But in order to serve your
own data, you need to run your own Cubes installation.

We'll download the example data and install it locally along with Cubes. This example
needs *Python*, *PIP* and *virtualenv* installed:

1. Clone the CubesViewer cubes-examples repository which contains this example:

   `git clone https://github.com/jjmontesl/cubes-examples`

2. Enter the directory. Create a virtual environment and activate it (this is optional,
   but helps keeping your Python installation clean):

   ```
   cd cubes-examples
   virtualenv env
   . env/bin/activate
   ```

3. Install Cubes package via PIP:

   `pip install -r requirements.txt`

   This will install dependencies: Cubes, Flask and SQLAlchemy.

4. Enter the "webshop" dir and run Cubes OLAP server (the tool is called `slicer`):

   ```
   cd webshop
   slicer serve slicer.ini
   ```

   This will use the `slicer.ini` file and `model.json` config files to
   initialize Cubes server. The database is a SQLite database included in
   the same directory.

5. Visit `http://localhost:5000` and check the server response. Cubes should reply
   with a short web page describing its configuration.


Refer to [Cubes](https://pythonhosted.org/cubes/index.html) site for download
and installation instructions.


Put it all together
-------------------

1. Make sure your Cubes *slicer* service is running (from the section above).

2. Use your browser to load `html/studio.html` in the `cubesviewer` package.

3. When prompted, accept the default Cubes location: `http://localhost:5000`.

4. Done! You are now using your copy of CubesViewer to access your local
   Cubes server.


CubesViewer Studio and Server
-----------------------------

If you wish to install the full CubesViewer Studio Server environment, which
allows several users to save / share views, check the
[Installing CubesViewer Server](cubesviewer-server-installation.md) section.

You can also embed the CubesViewer views you design into other web applications.
Check [Integrating CubesViewer views in other web applications](cubesviewer-embed.md)
for further information.


Further information
-------------------

* [Configuring your Cubes model](cubesviewer-model.md)
* [Documentation index](index.md)

