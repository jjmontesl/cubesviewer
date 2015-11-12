# CubesViewer
# Web (Django Application) Configuration File

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
BASE_DIR = os.path.dirname(os.path.dirname(__file__))


##
# 1. Configuration of CubesViewer database
##

# Note: Default database uses sqlite and places the database file in the same
# directory as this configuration file. Change the database connection to
# match your needs.
# https://docs.djangoproject.com/en/1.6/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3', # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': os.path.join(BASE_DIR, 'cubesviewer.sqlite'), # Or path to database file if using sqlite3.
        'USER': '',                      # Not used with sqlite3.
        'PASSWORD': '',                  # Not used with sqlite3.
        'HOST': '',                      # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '',                      # Set to empty string for default. Not used with sqlite3.
    },
}


##
# 2. Configuration of CubesViewer
##

# Base Cubes Server URL.
# Your Cubes Server needs to be running and listening on this URL, and it needs
# to be accessible to clients of the application.
CUBESVIEWER_CUBES_URL="http://localhost:5000"

# CubesViewer Store backend URL. It should point to this application.
# Note that this must match the URL that you use to access the application,
# otherwise you may hit security issues. If you access your server
# via http://localhost:8000, use the same here. Note that 127.0.0.1 and
# 'localhost' are different strings for this purpose. (If you wish to accept
# requests from different URLs, you may need to add CORS support).
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

##
# 3. Other Django application settings
##

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.6/howto/deployment/checklist/
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'q7@$_+^^na@k!adnet*4^=e@)06q_=gmoena1g=g-f*vc!vlfe'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True
TEMPLATE_DEBUG = True

ALLOWED_HOSTS = []

# Application definition

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    #'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'django.contrib.admin',
    'django.contrib.admindocs',

    'cubesviewer',

    'rest_framework',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    #'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'testing.urls'

WSGI_APPLICATION = 'cvapp.wsgi.application'

# Django auth settings
LOGIN_REDIRECT_URL = CUBESVIEWER_BACKEND_URL

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
#     'django.template.loaders.eggs.Loader',
)

# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.6/howto/static-files/
STATIC_URL = '/static/'


# Path to static files
STATIC_DIR = ( os.path.join(BASE_DIR, os.path.pardir, 'static'), )
TEMPLATE_DIR = ( os.path.join(BASE_DIR, os.path.pardir, 'templates'), )

ADMINS = (
    # ('Your Name', 'your_email@example.com'),
)

MANAGERS = ADMINS

# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    #STATIC_DIR,
    os.path.join(BASE_DIR, os.path.pardir, 'static'),
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
#    'django.contrib.staticfiles.finders.DefaultStorageFinder',
)

ROOT_URLCONF = 'cvapp.urls'

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    TEMPLATE_DIR
)

# A sample logging configuration. The only tangible logging
# performed by this configuration is to send an email to
# the site admins on every HTTP 500 error.
# See http://docs.djangoproject.com/en/dev/topics/logging for
# more details on how to customize your logging configuration.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s'
        },
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
    },
    'handlers': {
        'mail_admins': {
            'level': 'DEBUG',
            'class': 'django.utils.log.AdminEmailHandler'
        },
       'console':{
            'level':'INFO',
            'class':'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'cubesviewer': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}







