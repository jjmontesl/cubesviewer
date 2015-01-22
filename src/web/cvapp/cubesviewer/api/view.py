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

from rest_framework import routers, serializers, viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from cubesviewer.models import CubesView
from django.views.decorators.csrf import csrf_exempt


class CubesViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = CubesView
        #fields = ('url', 'username', 'email', 'groups')


class ViewSaveView(APIView):

    #model = Match
    #serializer_class = MatchSerializer

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):

        #tview = None
        if (int(request.POST["id"]) > 0):
            tview = CubesView.objects.get(pk = request.POST["id"])
            if (tview.owner_id != request.user.id):
                raise Exception("Cannot save View belonging to other users.")
        else:
            tview = CubesView()

        # Update or delete as necessary
        if (str(request.POST["data"]) == ""):
            tview.delete()
        else:
            tview.name = request.POST["name"]
            tview.data = request.POST["data"]
            tview.owner = request.user
            if (request.POST["shared"] == "true"):
                tview.shared = True
            else:
                tview.shared = False

            tview.save()

        serializer = CubesViewSerializer(tview, many=False, context={'request': request})
        return Response(serializer.data)


class ViewListView(APIView):

    #model = Match
    #serializer_class = MatchSerializer

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, *args, **kwargs):

        views = CubesView.objects.filter(Q(owner=request.user) | Q(shared=True))
        serializer = CubesViewSerializer(views, many=True, context={'request': request})
        return Response(serializer.data)


