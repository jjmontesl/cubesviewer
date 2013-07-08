CubesViewer - OLAP Visual Viewer and Explore Tool
=================================================

Installing the full CubesViewer application
-------------------------------------------

CubesViewer full application includes the complete of user interface features to explore and navigate
a Cubes Server.

The full CubesViewer application includes a server-side Python/Django application which serves as backend for some
of the operations (ie. saving / sharing).

The CubesViewer application is a web application and as such it must be served by an HTTP server.
It can be run using Python Django local webserver, but for more serious/production environments, it should
be fronted by a real web server like Apache. 

As a side note, it should be pointed that CubesViewer is, however, mainly a client-side Javascript library, 
which means that you don't need to use any particular server side technology as long as there is a running
Cubes server accessible to the client browser. This makes it (or parts of it) easily integrable in existing 
web applications.

The installation workflow is as follows:

## 1 - Python Cubes Requisite

In order to use CubesViewer, you need to have a working installation and configuration of the latest version of 
[Cubes Framework](http://databrewery.org/cubes.html) version.

Cubes includes an HTTP server called "slicer", which provides a REST-like API interface to one or more data cubes. This
server needs to be running for CubesViewer. Follow [Cubes Framework](http://databrewery.org/cubes.html) instructions
in order to install and set up a cubes server if you haven't done so yet.

It is not required that the Cubes server runs on the same host as the CubesViewer application.    

## 2 - Dependencies

CubesViewer application runs on Python/Django. You need to have the following packages available in your system:

* Python 2.7
* Django 1.3

You will also need the following Python packages:
* requests
* django-piston

Django applications can run on local SQLite files, but if you plan to run on a different database system, you may
need to install also the Python connectors for the appropriate database backend (ie. python-mysqldb).   

## 3 - Download and install CubesViewer

Download CubesViewer project from GitHub (https://github.com/jjmontesl/cubesviewer). You can use 'git' or [download the ZIP 
version](https://github.com/jjmontesl/cubesviewer/archive/master.zip) of the project. 

Put the content of the /src directory of the project, in the target directory of your choice.

## 4 - Configure the application.

There are a few parameters that need to be configured.

Besides of the OLAP database served by Cubes, the CubesViewer application requires access to a database in order
to support save/load operations. You can use a local SQLite file or any other database system supported by Django.

By default, CubesViewer uses a SQLite database located in the same directory as the "settings.py" file (web/cvapp).

See [Django Database configuration](https://docs.djangoproject.com/en/dev/ref/settings/#databases) documents for more information. 

**Edit the web/cvapp/settings.py file**, and review the following sections according to your Cubes URL, database config and 
installation path.  

```python
##
# 1. Configuration of application database for storing reports
##

# Note: Default database uses sqlite and places the database file in the same
# directory as this configuration file. Change the database connection to
# match your needs.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3', # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': os.path.join(CURRENT_DIR, 'cubesviewer.sqlite'), # Or path to database file if using sqlite3.
        'USER': '',                      # Not used with sqlite3.
        'PASSWORD': '',                  # Not used with sqlite3.
        'HOST': '',                      # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '',                      # Set to empty string for default. Not used with sqlite3.
    },
}
```

```python
##
# 2. Configuration of Slicer OLAP Server
##

# Base Cubes Server URL.
# Your Cubes Server needs to be running and listening on this URL, and it needs
# to be accessible to clients of the application.
CUBESVIEWER_CUBES_URL="http://localhost:5000"

# CubesViewer Store backend URL. It should point to this application.
CUBESVIEWER_BACKEND_URL="http://localhost:8000/cubesviewer"

# Optional user and password tuple to access the backend, or False
# (only meaningful when CubesViewer Cubes proxy is used)
#CUBESVIEWER_CUBES_PROXY_USER = ('user', 'password') 
CUBESVIEWER_CUBES_PROXY_USER = None

# CubesViewer Proxy ACL
# (only meaningful when CubesViewer Cubes proxy is used)
# ie. CUBESVIEWER_PROXY_ACL = [ { "cube": "my_cube", "group": "my_group" } ]
CUBESVIEWER_PROXY_ACL = [
                         ]
```

```python
##
# 3. Other Django application settings
##

# Path to static files
STATIC_DIR=os.path.join(CURRENT_DIR, os.path.pardir, 'static')
TEMPLATE_DIR=os.path.join(CURRENT_DIR, os.path.pardir, 'templates')

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

Once the application is configured, we need to initialize the backend database. Django applications are initialized using the "manage.py" script.

Move into your INSTALLATION_PATH/web/cvapp directory and run the manage script with the "syncdb" option:

```
python manage.py syncdb
```

You will be prompted for an "admin" user and password. This is the user that will have access to the administration section.

## 6 - Running with Django WebServer

Finally, let's run the application. As mentioned above, you should think of using a front web server like Apache for production web sites.
However, Django provides a convenient way to spawn a server for testing purposes. Run the manage script with the following parameters:

```
python manage.py runserver
```

Now, the application should be available from your browser, using the following URL:

http://localhost:8000/

If the data model can be loaded from Cubes server and contains any cube definitions, you should be able to see them and inspect 
them using CubesViewer.
 
 

