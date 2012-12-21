import os, sys

sys.path.append('/opt/cubesviewer/web')
sys.path.append('/opt/cubesviewer/web/cubesviewer')
os.environ['DJANGO_SETTINGS_MODULE'] = 'cubesviewer.settings'

import django.core.handlers.wsgi

application = django.core.handlers.wsgi.WSGIHandler()
