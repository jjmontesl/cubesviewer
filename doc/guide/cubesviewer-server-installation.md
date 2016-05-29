CubesViewer - OLAP Visual Viewer and Explore Tool
=================================================

Installing the full CubesViewer application
-------------------------------------------

CubesViewer Studio Server includes the complete set of user interface features to explore and navigate
a Cubes Server.

This full CubesViewer application adds a server-side Python/Django application which serves as backend for
some of the operations (ie. saving / sharing).

The CubesViewer Studio Server application is a web application and as such it must be served by an HTTP server.
It can be run using Python Django local webserver, but for more serious/production environments, it should
be fronted by a real web server like Apache.

As a side note, it should be pointed that CubesViewer is, however, mainly a client-side Javascript application,
which means that although the full application is a Python Django Server-Side app, you can use a subset
of the GUI features running the tool directly from your browser (as long as the Cubes server is accessible).

The installation steps are:


## 1 - Python Cubes Requisite

In order to use CubesViewer, you need to have a working installation and configuration of the latest version of
[Cubes Framework](http://databrewery.org/cubes.html) version.

Cubes includes an HTTP server called "slicer", which provides a REST-like API interface to one or more data cubes. This
server needs to be running for CubesViewer. Follow [Cubes Framework](http://databrewery.org/cubes.html) instructions
in order to install and set up a cubes server if you haven't done so yet.

It is not required that the *Cubes Server* runs on the same host as the *CubesViewer Server* application.

For CubesViewer clients to connect to Cubes server (*slicer*), your Cubes server possibly needs to allow
cross origin resource sharing (CORS). To enable it, add `allow_cors_origin: *`
(or a more restrictive setting) under the `[server]` section of the `slicer.ini` file.


## 2 - Dependencies

CubesViewer application runs on Python/Django. You need to have the following packages available in your system:

* Python 2.7
* Django 1.9

You will also need Python packages "requests" and "django-rest-framework". Check the requirements.txt file for
the full list of dependencies (you can also use this file to install all dependencies via
`pip install -r requirements.txt`).

Django applications can run on local SQLite files, but if you plan to run on a different database system, you may
need to install also the Python connectors for the appropriate database backend.


## 3 - Download and install CubesViewer

Download **cubesviewer-server** project from GitHub (https://github.com/jjmontesl/cubesviewer-server).
You can use 'git' or get a zipped package from the project page.

```
git clone https://github.com/jjmontesl/cubesviewer-server.git
```


## 4 - Configure the application.

There are a few parameters that need to be configured.

Besides of the OLAP database served by Cubes, the CubesViewer application requires access to a database in order
to support save/load operations. You can use a local SQLite file or any other database system supported by Django.

By default, CubesViewer uses a SQLite database located in the same directory as the `settings.py` file (`cvapp/cvapp/`).
See [Django Database configuration](https://docs.djangoproject.com/en/dev/ref/settings/#databases) documents for
more information on the database configuration.

**Edit the web/cvapp/cvapp/settings.py file**, and review the following sections according to your
Cubes URL, database config and installation path.

```python
##
# 1. Configuration of application database for storing reports
##

# Note: Default database uses sqlite and places the database file in the same
# directory as this configuration file. Change the database connection to
# match your needs.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',  # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': os.path.join(CURRENT_DIR, 'cubesviewer.sqlite'),  # Or path to database file if using sqlite3.
        'USER': '',                      # Not used with sqlite3.
        'PASSWORD': '',                  # Not used with sqlite3.
        'HOST': '',                      # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '',                      # Set to empty string for default. Not used with sqlite3.
    },
}
```

```python
##
# 2. Configuration of CubesViewer Server
##

# Base Cubes Server URL.
# Your Cubes Server needs to be running and listening on this URL, and it needs
# to be accessible to clients of the application.
CUBESVIEWER_CUBES_URL = "http://localhost:5000"

# CubesViewer Store backend URL. It should point to this application.
# Note that this must match the URL that you use to access the application,
# otherwise you may hit security issues. If you access your server
# via http://localhost:8000, use the same here. Note that 127.0.0.1 and
# 'localhost' are different strings for this purpose. (If you wish to accept
# requests from different URLs, you may need to add CORS support).
CUBESVIEWER_BACKEND_URL = "http://localhost:8000/cubesviewer"

# Optional user and password tuple to access the backend, or False
# (only applies when CubesViewer Cubes proxy is used)
#CUBESVIEWER_CUBES_PROXY_USER = ('user', 'password')
CUBESVIEWER_CUBES_PROXY_USER = None

# CubesViewer Proxy ACL
# (only applies when CubesViewer Cubes proxy is used)
# ie. CUBESVIEWER_PROXY_ACL = [ { "cube": "my_cube", "group": "my_group" } ]
CUBESVIEWER_PROXY_ACL = [ ]
```

```python
##
# 3. Other Django application settings
##

# Uncomment this if you need to allow access to CubesViewer resources
# from a different origin (schema, domain or port) from which CubesViewer
# is served to users.
#CORS_ORIGIN_ALLOW_ALL = True

# Path to static files
STATIC_DIR = ( os.path.join(BASE_DIR, os.path.pardir, 'static'), )
TEMPLATE_DIR = ( os.path.join(BASE_DIR, os.path.pardir, 'templates'), )

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# On Unix systems, a value of None will cause Django to use the same
# timezone as the operating system.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'Europe/Madrid'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'
```


## 5 - Initializing the database

Once the application is configured, we need to initialize the backend database.
Django applications are initialized using the `manage.py` script.

Move into your `cubesviewer-server/cvapp` directory and run the manage script with the `syncdb` option:

```
python manage.py syncdb
```

You will be prompted for an "admin" user and password. This is the user that will have access
to the administration section.


## 6 - Running with Django WebServer

Finally, let's run the application. Django provides a convenient way to spawn a server
for testing purposes. Run the manage script with the following parameters:

```
python manage.py runserver 0.0.0.0:8000
```

Now, the application should be available from your browser using `http://localhost:8000/`.

If the data model can be loaded from Cubes server and contains any cube definitions, you should be able to see them and inspect
them using CubesViewer.


## 7 - Configure your model for CubesViewer

Note that you can benefit from extra features if you configure your Cubes model. Check the
[Configuring your Cubes data model](cubesviewer-model.md) section of the documentation.


If you are using CubesViewer, please share and tweet #cubesviewer !


Further information
-------------------

* [Documentation index](index.md)
