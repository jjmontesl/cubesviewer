# CubesViewer
#
# Copyright (c) 2012-2013 Jose Juan Montes, see AUTHORS for more details
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


from piston.handler import BaseHandler
from django.db.models import Q

from cubesviewer.models import Note

class NoteSaveHandler(BaseHandler):

    allowed_methods = ('POST')

    def create(self, request, *args, **kwargs):

        tnote = None
        
        tnotes = Note.objects.filter(pk = request.POST["key"])
        if (len(tnotes) > 0):
            tnote = tnotes[0]
        else:
            tnote = Note()
            tnote.key = request.POST["key"]
        
        tnote.data = request.POST["data"]
        tnote.update_user = request.user
        
        # Update or delete as necessary
        if (str(request.POST["data"]) == ""):
            tnote.delete()
        else:
            tnote.save()

        return tnote


class NoteViewHandler(BaseHandler):

    allowed_methods = ('GET')
    exclude = ()

    def read(self, request, *args, **kwargs):

        note = Note.objects.filter(pk=kwargs['pk'])
        return note

