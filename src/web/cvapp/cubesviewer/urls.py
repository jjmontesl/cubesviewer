# CubesViewer
#
# Copyright (c) 2012-2014 Jose Juan Montes, see AUTHORS for more details
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# If your version of the Software supports interaction with it remotely through
# a computer network, the above copyright notice and this permission notice
# shall be accessible to all users.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

from django.conf.urls import patterns, include, url
from django.contrib import admin

from django.conf import settings
from django.contrib.auth.decorators import login_required
from cubesviewer.views.cubesviewer import CubesViewerView
from cubesviewer.api import proxy
from cubesviewer.api.view import ViewSaveView, ViewListView
from django.views.decorators.csrf import csrf_exempt

# Enable admin
admin.autodiscover()

urlpatterns = patterns('',

    url(r'^$', login_required( CubesViewerView.as_view() ) ),

    url(r'^view/list/$', ViewListView.as_view() ),
    url(r'^view/save/$', csrf_exempt(ViewSaveView.as_view()) ),

    url(r'^cubes/', login_required(proxy.connection))

)
