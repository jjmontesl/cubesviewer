# Sample file to deploy Cubes slicer as a WSGI application

import sys
import os.path
import ConfigParser


_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(CURRENT_DIR, "slicer.ini")

try:
    config = ConfigParser.SafeConfigParser()
    config.read(CONFIG_PATH)
except Exception as e:
    raise Exception("Unable to load configuration: %s" % e)

import cubes.server
application = cubes.server.Slicer(config)
