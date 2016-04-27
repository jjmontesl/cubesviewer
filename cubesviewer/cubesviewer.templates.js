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


  $templateCache.put('studio/panel.html',
    "<div class=\"cv-bootstrap cv-gui-viewcontainer\" ng-controller=\"CubesViewerStudioViewController\">\n" +
    "\n" +
    "    <div class=\"panel panel-primary\">\n" +
    "        <div class=\"panel-heading\" style=\"ver\">\n" +
    "\n" +
    "            <button type=\"button\" ng-click=\"studioViewsService.closeView(view)\" class=\"btn btn-danger btn-xs\" style=\"margin-right: 10px;\"><i class=\"fa fa-fw fa-close\"></i></button>\n" +
    "\n" +
    "            <button type=\"button\" ng-click=\"studioViewsService.toggleCollapseView(view)\" class=\"btn btn-primary btn-xs\" style=\"margin-right: 10px;\"><i class=\"fa fa-fw\" ng-class=\"{'fa-caret-up': !view.collapsed, 'fa-caret-down': view.collapsed }\"></i></button>\n" +
    "\n" +
    "            <span class=\"cv-gui-title\">{{ view.params.name }}</span>\n" +
    "\n" +
    "            <span class=\"badge badge-primary pull-right cv-gui-container-state\" style=\"margin-right: 10px;\">Test</span>\n" +
    "\n" +
    "        </div>\n" +
    "        <div class=\"panel-body\" ng-hide=\"view.collapsed\">\n" +
    "            <div class=\"cv-gui-viewcontent\">\n" +
    "\n" +
    "                <div cv-view-cube view=\"view\"></div>\n" +
    "\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('studio/studio.html',
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
    "            <li ng-repeat=\"cube in cubesService.cubesserver._cube_list\" ng-click=\"studioViewsService.addViewCube(cube.name)\"><a>{{ cube.label }}</a></li>\n" +
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
    "\n" +
    "        <div ng-repeat=\"studioView in studioViewsService.views\">\n" +
    "            <div cv-studio-view view=\"studioView\"></div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "\n"
  );


  $templateCache.put('views/cube/cube.html',
    "<div class=\"cv-view-panel\" ng-controller=\"CubesViewerViewsCubeController\">\n" +
    "\n" +
    "    <div class=\"cv-view-viewmenu\">\n" +
    "\n" +
    "        <div class=\"panel panel-primary pull-right\" style=\"padding: 3px;\">\n" +
    "\n" +
    "            <div class=\"btn-group\" role=\"group\" aria-label=\"...\">\n" +
    "              <button type=\"button\" ng-click=\"setViewMode('explore')\" ng-class=\"{'active': view.params.mode == 'explore'}\" class=\"btn btn-primary btn-sm explorebutton\" title=\"Explore\"><i class=\"fa fa-fw fa-arrow-circle-down\"></i></button>\n" +
    "              <button type=\"button\" ng-click=\"setViewMode('facts')\" ng-class=\"{'active': view.params.mode == 'facts'}\" class=\"btn btn-primary btn-sm \" title=\"Facts\"><i class=\"fa fa-fw fa-th\"></i></button>\n" +
    "              <button type=\"button\" ng-click=\"setViewMode('series')\" ng-class=\"{'active': view.params.mode == 'series'}\" class=\"btn btn-primary btn-sm \" title=\"Series\"><i class=\"fa fa-fw fa-table\"></i></button>\n" +
    "              <button type=\"button\" ng-click=\"setViewMode('chart')\" ng-class=\"{'active': view.params.mode == 'chart'}\" class=\"btn btn-primary btn-sm \" title=\"Charts\"><i class=\"fa fa-fw fa-area-chart\"></i></button>\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-include=\"'views/cube/menu-drilldown.html'\" class=\"dropdown m-b\" style=\"display: inline-block; margin-left: 10px;\"></div>\n" +
    "\n" +
    "\n" +
    "            <div class=\"dropdown m-b\" style=\"display: inline-block;\">\n" +
    "              <button class=\"btn btn-primary btn-sm dropdown-toggle cutbutton\" type=\"button\" data-toggle=\"dropdown\" data-submenu>\n" +
    "                <i class=\"fa fa-fw fa-filter\"></i> Filter <span class=\"caret\"></span>\n" +
    "              </button>\n" +
    "\n" +
    "              <ul class=\"dropdown-menu dropdown-menu-right cv-view-menu cv-view-menu-cut\">\n" +
    "\n" +
    "                <li ng-click=\"filterSelected()\"><a href=\"\"><i class=\"fa fa-fw fa-filter\"></i> Filter selected rows</a></li>\n" +
    "                <div class=\"divider\"></div>\n" +
    "\n" +
    "                <li class=\"dropdown-submenu\">\n" +
    "                    <a tabindex=\"0\"><i class=\"fa fa-fw fa-bars\"></i> Dimension filter</a>\n" +
    "                    <ul class=\"dropdown-menu\">\n" +
    "\n" +
    "                      <!-- if ((grayout_drill) && ((($.grep(view.params.drilldown, function(ed) { return ed == dimension.name; })).length > 0))) { -->\n" +
    "                      <li on-repeat-done ng-repeat-start=\"dimension in view.cube.dimensions\" ng-if=\"dimension.levels.length == 1\" ng-click=\"selectDrill(dimension.name, true);\">\n" +
    "                        <a href=\"\">{{ dimension.label }}</a>\n" +
    "                      </li>\n" +
    "                      <li ng-repeat-end ng-if=\"dimension.levels.length != 1\" class=\"dropdown-submenu\">\n" +
    "                        <a tabindex=\"0\">{{ dimension.label }}</a>\n" +
    "\n" +
    "                        <ul ng-if=\"dimension.hierarchies_count() != 1\" class=\"dropdown-menu\">\n" +
    "                            <li ng-repeat=\"(hikey,hi) in dimension.hierarchies\" class=\"dropdown-submenu\">\n" +
    "                                <a tabindex=\"0\" href=\"\" onclick=\"return false;\">{{ hi.label }}</a>\n" +
    "                                <ul class=\"dropdown-menu\">\n" +
    "                                    <li ng-repeat=\"level in hi.levels\" ng-click=\"selectDrill(dimension.name + '@' + hi.name + ':' + level.name, true)\"><a href=\"\">{{ level.label }}</a></li>\n" +
    "                                </ul>\n" +
    "                            </li>\n" +
    "                        </ul>\n" +
    "\n" +
    "                        <ul ng-if=\"dimension.hierarchies_count() == 1\" class=\"dropdown-menu\">\n" +
    "                            <li ng-repeat=\"level in dimension.default_hierarchy().levels\" ng-click=\"selectDrill(dimension.name + ':' + level.name, true)\"><a href=\"\">{{ level.label }}</a></li>\n" +
    "                        </ul>\n" +
    "\n" +
    "                      </li>\n" +
    "\n" +
    "                    </ul>\n" +
    "                </li>\n" +
    "\n" +
    "                <!--\n" +
    "                // Events\n" +
    "                $(view.container).find('.cv-view-show-dimensionfilter').click( function() {\n" +
    "                    cubesviewer.views.cube.dimensionfilter.drawDimensionFilter(view, $(this).attr('data-dimension'));\n" +
    "                    return false;\n" +
    "                });\n" +
    "                 -->\n" +
    "\n" +
    "                <div class=\"divider\"></div>\n" +
    "                <li><a href=\"\"><i class=\"fa fa-fw fa-close\"></i> Clear filters</a></li>\n" +
    "\n" +
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
    "                <li><a><i class=\"fa fa-fw fa-close\"></i> Close</a></li>\n" +
    "              </ul>\n" +
    "            </div>\n" +
    "\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"cv-view-viewinfo\">\n" +
    "        <div>\n" +
    "            <div class=\"cv-view-viewinfo-drill\">\n" +
    "\n" +
    "                <div class=\"label label-secondary cv-infopiece cv-view-viewinfo-cubename\" style=\"color: white; background-color: black;\">\n" +
    "                    <span><i class=\"fa fa-fw fa-cube\"></i> <b>Cube:</b> {{ view.cube.label }}</span>\n" +
    "                    <button type=\"button\" class=\"btn btn-info btn-xs\" style=\"visibility: hidden;\"><i class=\"fa fa-fw fa-info\"></i></button>\n" +
    "                </div>\n" +
    "\n" +
    "                <div ng-repeat=\"drilldown in view.params.drilldown\" class=\"label label-secondary cv-infopiece cv-view-viewinfo-drill\" style=\"color: black; background-color: #ccffcc;\">\n" +
    "                    <span><i class=\"fa fa-fw fa-arrow-down\"></i> <b>Drilldown:</b> {{ view.cube.cvdim_parts(drilldown).label }}</span>\n" +
    "                    <button type=\"button\" ng-click=\"selectDrill(drilldown, '')\" class=\"btn btn-danger btn-xs\" style=\"margin-left: 5px;\"><i class=\"fa fa-fw fa-close\"></i></button>\n" +
    "                </div>\n" +
    "\n" +
    "            </div>\n" +
    "            <div class=\"cv-view-viewinfo-cut\">\n" +
    "                <div ng-repeat=\"cut in view.params.cuts\" ng-init=\"dimparts = view.cube.cvdim_parts(cut.dimension.replace(':',  '@')); equality = cut.invert ? ' != ' : ' = ';\" class=\"label label-secondary cv-infopiece cv-view-viewinfo-cut\" style=\"color: black; background-color: #ffcccc;\">\n" +
    "                    <span style=\"max-width: 480px;\"><i class=\"fa fa-fw fa-filter\"></i> <b>Filter:</b> {{ dimparts.label }} {{ equality }} <span title=\"{{ cut.value }}\">{{ cut.value }}</span></span>\n" +
    "                    <button type=\"button\" ng-click=\"selectCut(cut.dimension, '',cut.invert )\" class=\"btn btn-danger btn-xs\" style=\"margin-left: 5px;\"><i class=\"fa fa-fw fa-close\"></i></button>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"cv-view-viewinfo-extra\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"clearfix\"></div>\n" +
    "\n" +
    "    <div class=\"cv-view-viewdata\">\n" +
    "\n" +
    "        <div ng-if=\"view.params.mode == 'explore'\" ng-include=\"'views/cube/explore/explore.html'\"></div>\n" +
    "        <div ng-if=\"view.params.mode == 'chart'\" ng-include=\"'views/cube/explore/chart.html'\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "    <div class=\"clearfix\"></div>\n" +
    "\n" +
    "    <div class=\"cv-view-viewfooter\"></div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('views/cube/explore/explore.html',
    "<div ng-controller=\"CubesViewerViewsCubeExploreController\">\n" +
    "\n" +
    "    <!-- ($(view.container).find('.cv-view-viewdata').children().size() == 0)  -->\n" +
    "    <h3><i class=\"fa fa-fw fa-arrow-circle-down\"></i> Aggregated Data</h3>\n" +
    "\n" +
    "    <div ui-grid=\"gridOptions\" ui-grid-resize-columns ui-grid-move-columns ui-grid-selection ui-grid-auto-resize ui-grid-pagination style=\"width: 100%;\" ng-style=\"{height: ((gridOptions.data.length < 15 ? gridOptions.data.length : 15) * 24) + 44 + 30 + 'px'}\">\n" +
    "    </div>\n" +
    "    <div style=\"height: 30px;\">&nbsp;</div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('views/cube/menu-drilldown.html',
    "  <button class=\"btn btn-primary btn-sm dropdown-toggle drilldownbutton\" type=\"button\" data-toggle=\"dropdown\" data-submenu>\n" +
    "    <i class=\"fa fa-fw fa-arrow-down\"></i> Drilldown <span class=\"caret\"></span>\n" +
    "  </button>\n" +
    "\n" +
    "  <ul class=\"dropdown-menu dropdown-menu-right cv-view-menu-drilldown\">\n" +
    "\n" +
    "      <!-- if ((grayout_drill) && ((($.grep(view.params.drilldown, function(ed) { return ed == dimension.name; })).length > 0))) { -->\n" +
    "      <li on-repeat-done ng-repeat-start=\"dimension in view.cube.dimensions\" ng-if=\"dimension.levels.length == 1\" ng-click=\"selectDrill(dimension.name, true);\">\n" +
    "        <a href=\"\">{{ dimension.label }}</a>\n" +
    "      </li>\n" +
    "      <li ng-repeat-end ng-if=\"dimension.levels.length != 1\" class=\"dropdown-submenu\">\n" +
    "        <a tabindex=\"0\">{{ dimension.label }}</a>\n" +
    "\n" +
    "        <ul ng-if=\"dimension.hierarchies_count() != 1\" class=\"dropdown-menu\">\n" +
    "            <li ng-repeat=\"(hikey,hi) in dimension.hierarchies\" class=\"dropdown-submenu\">\n" +
    "                <a tabindex=\"0\" href=\"\" onclick=\"return false;\">{{ hi.label }}</a>\n" +
    "                <ul class=\"dropdown-menu\">\n" +
    "                    <li ng-repeat=\"level in hi.levels\" ng-click=\"selectDrill(dimension.name + '@' + hi.name + ':' + level.name, true)\"><a href=\"\">{{ level.label }}</a></li>\n" +
    "                </ul>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "\n" +
    "        <ul ng-if=\"dimension.hierarchies_count() == 1\" class=\"dropdown-menu\">\n" +
    "            <li ng-repeat=\"level in dimension.default_hierarchy().levels\" ng-click=\"selectDrill(dimension.name + ':' + level.name, true)\"><a href=\"\">{{ level.label }}</a></li>\n" +
    "        </ul>\n" +
    "\n" +
    "      </li>\n" +
    "\n" +
    "      <div class=\"divider\"></div>\n" +
    "      <li ng-click=\"selectDrill(null)\"><a href=\"\"><i class=\"fa fa-fw fa-close\"></i> None</a></li>\n" +
    "\n" +
    "  </ul>\n" +
    "\n"
  );

}]);
