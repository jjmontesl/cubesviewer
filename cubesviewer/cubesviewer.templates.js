angular.module('cv').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('alerts/alerts.html',
    "<div class=\"cv-bootstrap cv-alerts\">\n" +
    "    <div style=\"min-width: 260px; width: 300px; z-index: 1000;\" >\n" +
    "\n" +
    "        {{# cv.alerts }}\n" +
    "        <div class=\"alert alert-warning alert-dismissable\" style=\"margin-bottom: 5px;\">\n" +
    "            <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-hidden=\"true\"><i class=\"fa fa-fw fa-close\"></i></button>\n" +
    "            <i class=\"fa fa-bell\"></i> {{ text }}\n" +
    "        </div>\n" +
    "        {{/ cv.alerts }}\n" +
    "\n" +
    "    </div>\n" +
    "</div>\n"
  );


  $templateCache.put('studio/about.html',
    "<div class=\"modal fade\" id=\"cvAboutModal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\">\n" +
    "  <div class=\"modal-dialog\" role=\"document\">\n" +
    "    <div class=\"modal-content\">\n" +
    "      <div class=\"modal-header\">\n" +
    "        <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\"><i class=\"fa fa-fw fa-close\"></i></span></button>\n" +
    "        <h4 class=\"modal-title\" id=\"myModalLabel\"><i class=\"fa fa-cube\"></i> CubesViewer</h4>\n" +
    "      </div>\n" +
    "      <div class=\"modal-body\">\n" +
    "\n" +
    "            <p><a href=\"http://jjmontesl.github.io/cubesviewer/\">CubesViewer</a> is a visual, web-based tool application for exploring and analyzing\n" +
    "            OLAP databases served by the <a href=\"http://cubes.databrewery.org/\">Cubes OLAP Framework</a>.</p>\n" +
    "            <hr />\n" +
    "\n" +
    "            <p>Version {{ cvVersion }}<br />\n" +
    "            <a href=\"https://github.com/jjmontesl/cubesviewer/\" target=\"_blank\">https://github.com/jjmontesl/cubesviewer/</a></p>\n" +
    "\n" +
    "            <p>by José Juan Montes and others (see AUTHORS)<br />\n" +
    "            2012 - 2016</p>\n" +
    "\n" +
    "      </div>\n" +
    "      <div class=\"modal-footer\">\n" +
    "        <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "\n"
  );


  $templateCache.put('studio/container.html',
    "<div id=\"{{viewId}}\" class=\"cv-bootstrap cv-gui-viewcontainer\">\n" +
    "\n" +
    "    <div class=\"panel panel-primary\">\n" +
    "        <div class=\"panel-heading\" style=\"ver\">\n" +
    "\n" +
    "            <span class=\"cv-gui-title\">Test {{name}}</span>\n" +
    "\n" +
    "            <button type=\"button\" class=\"btn btn-primary btn-xs pull-right\" style=\"margin-left: 10px;\"><i class=\"fa fa-fw fa-close\"></i></button>\n" +
    "            <button type=\"button\" class=\"btn btn-primary btn-xs pull-right\" style=\"margin-left: 10px;\"><i class=\"fa fa-fw fa-caret-up\"></i></button>\n" +
    "\n" +
    "            <span class=\"label label-info pull-right cv-gui-container-state\">Test2</span>\n" +
    "\n" +
    "        </div>\n" +
    "        <div class=\"panel-body\">\n" +
    "            <div class=\"cv-gui-viewcontent\" style=\"overflow: hidden;\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('studio/main.html',
    "<div class=\"cv-bootstrap\" ng-controller=\"CubesViewerStudioController\">\n" +
    "\n" +
    "    <div class=\"cv-gui-panel\" >\n" +
    "\n" +
    "        <div class=\"dropdown m-b\" style=\"display: inline-block;\">\n" +
    "          <button class=\"btn btn-primary dropdown-toggle\" type=\"button\" data-toggle=\"dropdown\" data-submenu>\n" +
    "            <i class=\"fa fa-fw fa-cube\"></i> Cubes <span class=\"caret\"></span>\n" +
    "          </button>\n" +
    "\n" +
    "          <ul class=\"dropdown-menu cv-gui-cubeslist-menu\">\n" +
    "\n" +
    "            <li ng-repeat=\"cube in cubesService.cubesserver._cube_list\" ng-click=\"addViewCube(cube.name)\"><a>{{ cube.label }}</a></li>\n" +
    "\n" +
    "          </ul>\n" +
    "        </div>\n" +
    "\n" +
    "\n" +
    "        <div class=\"dropdown m-b\" style=\"display: inline-block;\">\n" +
    "          <button class=\"btn btn-primary dropdown-toggle\" type=\"button\" data-toggle=\"dropdown\" data-submenu>\n" +
    "            <i class=\"fa fa-fw fa-wrench\"></i> Tools <span class=\"caret\"></span>\n" +
    "          </button>\n" +
    "\n" +
    "          <ul class=\"dropdown-menu\">\n" +
    "          <li class=\"dropdown-submenu\">\n" +
    "          <a tabindex=\"0\">Action</a>\n" +
    "\n" +
    "          <ul class=\"dropdown-menu\">\n" +
    "            <li><a tabindex=\"0\">Sub action</a></li>\n" +
    "            <li class=\"dropdown-submenu\">\n" +
    "              <a tabindex=\"0\">Another sub action</a>\n" +
    "\n" +
    "              <ul class=\"dropdown-menu\">\n" +
    "                <li><a tabindex=\"0\">Sub action</a></li>\n" +
    "                <li><a tabindex=\"0\">Another sub action</a></li>\n" +
    "                <li><a tabindex=\"0\">Something else here</a></li>\n" +
    "              </ul>\n" +
    "            </li>\n" +
    "            <li><a tabindex=\"0\">Something else here</a></li>\n" +
    "            <li class=\"disabled\"><a tabindex=\"-1\">Disabled action</a></li>\n" +
    "            <li class=\"dropdown-submenu\">\n" +
    "              <a tabindex=\"0\">Another action</a>\n" +
    "\n" +
    "              <ul class=\"dropdown-menu\">\n" +
    "                <li><a tabindex=\"0\">Sub action</a></li>\n" +
    "                <li><a tabindex=\"0\">Another sub action</a></li>\n" +
    "                <li><a tabindex=\"0\">Something else here</a></li>\n" +
    "              </ul>\n" +
    "            </li>\n" +
    "          </ul>\n" +
    "        </li>\n" +
    "        <li class=\"dropdown-header\">Dropdown header</li>\n" +
    "        <li class=\"dropdown-submenu\">\n" +
    "          <a tabindex=\"0\">Another action</a>\n" +
    "\n" +
    "          <ul class=\"dropdown-menu\">\n" +
    "            <li><a tabindex=\"0\">Sub action</a></li>\n" +
    "            <li><a tabindex=\"0\">Another sub action</a></li>\n" +
    "            <li><a tabindex=\"0\">Something else here</a></li>\n" +
    "          </ul>\n" +
    "        </li>\n" +
    "        <li><a tabindex=\"0\">Something else here</a></li>\n" +
    "\n" +
    "        <div class=\"divider\" ng-if=\"cvOptions.showAbout\"></div>\n" +
    "        <li class=\"\" ng-if=\"cvOptions.showAbout\"><a data-toggle=\"modal\" data-target=\"#cvAboutModal\">About CubesViewer</a></li>\n" +
    "\n" +
    "        </ul>\n" +
    "        </div>\n" +
    "\n" +
    "        <div ng-include=\"'studio/about.html'\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"cv-gui-workspace\">\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "\n"
  );


  $templateCache.put('views/cube/views_cube.html',
    "<div class=\"cv-view-panel\">\n" +
    "\n" +
    "    <div class=\"cv-view-viewmenu\">\n" +
    "\n" +
    "        <div class=\"panel panel-primary pull-right\" style=\"padding: 3px;\">\n" +
    "\n" +
    "            <div class=\"btn-group\" role=\"group\" aria-label=\"...\">\n" +
    "              <button type=\"button\" class=\"btn btn-primary btn-sm explorebutton\"><i class=\"fa fa-arrow-circle-down\"></i></button>\n" +
    "            </div>\n" +
    "\n" +
    "           <div class=\"dropdown m-b\" style=\"display: inline-block; margin-left: 10px;\">\n" +
    "              <button class=\"btn btn-primary btn-sm dropdown-toggle drilldownbutton\" type=\"button\" data-toggle=\"dropdown\" data-submenu>\n" +
    "                <i class=\"fa fa-fw fa-arrow-down\"></i> Drilldown <span class=\"caret\"></span>\n" +
    "              </button>\n" +
    "\n" +
    "              <ul class=\"dropdown-menu dropdown-menu-right cv-view-menu cv-view-menu-drilldown\">\n" +
    "                <li ><a>Test 1</a></li>\n" +
    "              </ul>\n" +
    "            </div>\n" +
    "\n" +
    "\n" +
    "            <div class=\"dropdown m-b\" style=\"display: inline-block;\">\n" +
    "              <button class=\"btn btn-primary btn-sm dropdown-toggle cutbutton\" type=\"button\" data-toggle=\"dropdown\" data-submenu>\n" +
    "                <i class=\"fa fa-fw fa-search\"></i> Filter <span class=\"caret\"></span>\n" +
    "              </button>\n" +
    "\n" +
    "              <ul class=\"dropdown-menu dropdown-menu-right cv-view-menu cv-view-menu-cut\">\n" +
    "                <li ><a>Test 1</a></li>\n" +
    "                <li ><a>Test 3</a></li>\n" +
    "              </ul>\n" +
    "            </div>\n" +
    "\n" +
    "\n" +
    "            <div class=\"dropdown m-b\" style=\"display: inline-block; margin-left: 5px;\">\n" +
    "              <button class=\"btn btn-primary btn-sm dropdown-toggle\" type=\"button\" data-toggle=\"dropdown\" data-submenu>\n" +
    "                <i class=\"fa fa-fw fa-file\"></i> View <span class=\"caret\"></span>\n" +
    "              </button>\n" +
    "\n" +
    "              <ul class=\"dropdown-menu dropdown-menu-right cv-view-menu cv-view-menu-view\">\n" +
    "                <li ><a>Test 2</a></li>\n" +
    "              </ul>\n" +
    "            </div>\n" +
    "\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"cv-view-viewinfo\">\n" +
    "\n" +
    "    </div>\n" +
    "    <div class=\"clearfix\"></div>\n" +
    "\n" +
    "    <div class=\"cv-view-viewdata\"></div>\n" +
    "    <div class=\"clearfix\"></div>\n" +
    "\n" +
    "    <div class=\"cv-view-viewfooter\"></div>\n" +
    "\n" +
    "</div>\n"
  );

}]);
