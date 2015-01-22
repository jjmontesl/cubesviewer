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


from django.db.models import Q
import requests
from django.conf import settings
from django.contrib.auth.models import User, Group
from django.http import HttpResponse, HttpResponseNotFound, HttpResponseForbidden

# Get an instance of a logger
def connection(request):

    #url = request.path_info
    url = request.META["QUERY_STRING"]

    path = request.path_info
    params = request.META["QUERY_STRING"] # url.split("?")[0] if (len(url.split("?")) > 1) else ""


    pos = path.index("cubes/")
    path = path [(pos + 6) :]

    # Evaluate request
    if (path.find("cube/") == 0):
        cube = path.split("/")[1]

        for acl in settings.CUBESVIEWER_PROXY_ACL:
            if (cube == acl["cube"]):
                groups = [g.name for g in request.user.groups.all()]
                if (not (acl["group"] in groups)):
                    return HttpResponseForbidden("Wrong permissions for this data cube. User needs to be in group %s." % acl["group"])

    elif (path.find("cubes") == 0):
        pass

    elif (path.find("version") == 0):
        pass

    elif (path.find("info") == 0):
        pass

    else:

        return HttpResponseForbidden("CubesViewer proxy unknown path.")

    # Do request
    proxy_url = settings.CUBESVIEWER_CUBES_URL + "/" + path + "?" + params
    if (settings.CUBESVIEWER_CUBES_PROXY_USER == None):
        r = requests.get( proxy_url)
    else:
        r = requests.get( proxy_url, auth=settings.CUBESVIEWER_CUBES_PROXY_USER)

    response = HttpResponse(r.content, content_type = r.headers["content-type"])
    response.status_code = r.status_code
    response.encoding = "utf-8"


    return response

    #return CubesView.objects.filter(Q(owner=request.user) | Q(shared=True) | Q(common=True))

