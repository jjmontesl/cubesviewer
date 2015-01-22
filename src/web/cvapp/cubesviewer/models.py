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


from django.db import models
from django.contrib.auth.models import User

from django.conf import settings

class CubesViewerModel(models.Model):
    """
    Base class for Cubes Viewer stored objects.
    """
    create_date = models.DateTimeField(auto_now_add = True)
    update_date = models.DateTimeField(auto_now = True)
    #create_user = models.ForeignKey(User)
    #update_user = models.ForeignKey(User)

    class Meta:
        abstract = True


class CubesView(CubesViewerModel):
    """
    Saved Cubes View
    """
    name = models.CharField("Name", max_length=200)
    data = models.TextField()
    owner = models.ForeignKey(User)
    shared = models.BooleanField(default = False)

    def __unicode__(self):
        return str(self.id) + " " + self.name

    class Meta:
        ordering = ['name']


class Note(CubesViewerModel):
    """
    Saved Cubes View
    """
    key = models.CharField("Key", max_length=200)
    data = models.TextField()
    update_user = models.ForeignKey(User)

    def __unicode__(self):
        return str(self.key)

    class Meta:
        ordering = ['key']

