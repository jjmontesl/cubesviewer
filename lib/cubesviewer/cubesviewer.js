/*
 * angular-bootstrap-submenu
 * Copyright (c) 2016 Jose Juan Montes
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";


angular.module('bootstrapSubmenu', []).directive("submenu", ['$timeout', function($timeout) {
	return {
		restrict: 'A',
		link: function(scope, iElement, iAttrs) {
			// FIXME: This is not a proper way of waiting for the menu to be constructed.
			$timeout(function() {
				$(iElement).submenupicker();
			}, 500);
		}
	};
}]);

;/* Cubes.js
 *
 * JavaScript library for Cubes OLAP.
 *
 */

(function(){

    // Light-weight "underscore" replacements

    var _ = {};

    _.map = function(ary, f) {
      var ret = [];
      for (var i = 0; i < ary.length; i++) {
        ret.push(f(ary[i]));
      }
      return ret;
    };

    _.filter = function(ary, f) {
      var ret = [];
      for (var i = 0; i < ary.length; i++) {
        if ( f(ary[i]) ) ret.push(ary[i]);
      }
      return ret;
    };

    _.find = function(ary, f) {
      var i;
      if (Object.prototype.toString.call(ary) === '[object Array]') {
        for (i = 0; i < ary.length; i++) {
          if ( f(ary[i]) ) return ary[i];
        }
      } else {
        for (i in ary) {
          if ( f(ary[i]) ) return ary[i];
        }
      }
      return null;
    };

    _.indexOf = function(ary, f) {
      var i;
      if (Object.prototype.toString.call(ary) === '[object Array]') {
        for (i = 0; i < ary.length; i++) {
          if ( f(ary[i]) ) return i;
        }
      } else {
        for (i in ary) {
          if ( f(ary[i]) ) return i;
        }
      }
      return -1;
    };

    _.isObject = function(o) {
      return Object.prototype.toString.call(o) === '[object Object]';
    };

    _.isString = function(o) {
      return Object.prototype.toString.call(o) === '[object String]';
    };

    // Variables and functions go here.
    var root = this;
    var cubes = { };

    /*
     * Server
     * ======
     */

    cubes.Server = function(ajaxHandler){
        // Represents Cubes Slicer Server connection.
        //
        // Attributes:
        //
        // * `ajaxHandler`: a function accepting jquery-style settings object as in $.ajax(settings)
        //

        if(ajaxHandler)
        {
            this.ajaxRequest = ajaxHandler;
        }
        else
        {
            this.ajaxRequest = $.ajax;
        }
        this._cube_list = [];
        this._cubes = {}
    };

    cubes.Server.prototype.cubeinfo = function(cubename) {
    	var cubeinfos = $.grep(this._cube_list, function (ci) { return ci.name == cubename });
    	if (cubeinfos.length != 1) throw "Found " + cubeinfos.length + " cubes with name '" + cubename + "' in the cube list";
    	return cubeinfos[0];
    };

    cubes.Server.prototype.ajaxRequest = function(settings) {
        throw "Must implement ajaxRequest for server to process jquery-style $.ajax settings object";
    };

    cubes.Server.prototype.query = function(query, cube, args, callback, errCallback, completeCallback) {
        var params = {dataType : 'json', type : "GET"};

        var cube_name = null;
        if(cube.hasOwnProperty("name"))
            cube_name = cube.name;
        else
            cube_name = cube;

        params.url = this.url + "cube/" + cube_name + "/" + query;
        params.data = args;

        if(args && args.cut)
            params.data.cut = params.data.cut.toString();

        if(args && args.drilldown)
          params.data.drilldown = params.data.drilldown.toString();

        params.success = function(obj) {
            callback(obj);
        };
        params.error = function(obj) {
            // FIXME: Some error handler here
            if (errCallback) errCallback(obj);
        };
        params.complete = function(obj) {
            if (completeCallback) completeCallback(obj);
        };

        return this.ajaxRequest(params);
    };

    /**
     * Connect to the Slicer server.
     *
     * @param {url} Slicer server URL
     * @param {callback} Function called on successfull connect
     * @param {errCallback} Function called on error
     *     one line.
     */

    cubes.Server.prototype.connect = function(url, callback, errCallback) {
        var self = this;

        self.url = self._normalize_url(url);

        var options = {dataType : 'json', type : "GET"};

        options.url = self.url + 'info';

        options.success = function(resp, status, xhr) {
            self.server_version = resp.cubes_version;
            self.cubes_version = resp.cubes_version;
            self.api_version = resp.api_version;
            self.info = resp;
            self.load_cube_list(callback, errCallback);
        };

        options.error = function(resp, status, xhr) {
            if (errCallback)
                errCallback(resp);
        };

        this.ajaxRequest(options);
    };

    cubes.Server.prototype._normalize_url = function(url) {
        if(url[url.length-1] != '/')
            return url + '/';
        return url;
    };

    cubes.Server.prototype.load_cube_list = function(callback, errCallback) {
        var self = this;

        var options = {dataType : 'json', type : "GET"};

        options.url = self.url + 'cubes';

        options.success = function(resp, status, xhr) {
            self._cube_list = resp;

            if (callback)
                callback(self._cube_list);
        };

        options.error = function(resp, status, xhr) {
            if (errCallback)
                errCallback(resp);
        };

        return this.ajaxRequest(options);
    };

    cubes.Server.prototype.get_cube = function(name, callback, errCallback) {

    	var self = this;

        // Return the cube if already loaded
        if((name in this._cubes) && callback){
        	var jqxhr = $.Deferred();
        	jqxhr.error = function() { };
        	setTimeout(function() {
        		// TODO: What is the correct ordering of success/complete callbacks?
        		callback(self._cubes[name]);
        		jqxhr.resolve(); //.promise();
        	}, 0);
        	return jqxhr;
        }

        var options = {dataType : 'json', type : "GET"};

        options.url = self.url + 'cube/' + encodeURI(name) + '/model';

        options.success = function(resp, status, xhr) {
            // must parse dimensions first into a "fake" model
            var cube = new cubes.Cube(resp);

            self._cubes[name] = cube;

            // FIXME: handle model parse failure
            if (callback)
                callback(cube);
        };

        options.error = function(resp, status, xhr) {
            if (errCallback)
                errCallback(resp);
        };

        return this.ajaxRequest(options);
    };

    /*
     * The Cube
     * ========
     */

    cubes.Cube = function(metadata) {
        var i, obj;

        this.name = metadata.name;
        !metadata.label || (this.label = metadata.label);
        !metadata.description || (this.description = metadata.description);
        !metadata.key || (this.key = metadata.key);
        !metadata.info || (this.info = metadata.info);
        !metadata.category || (this.category = metadata.category);
        !metadata.features || (this.features = metadata.features);

        this.measures = _.map(metadata.measures || [], function(m) { return new cubes.Measure(m); });
        this.aggregates = _.map(metadata.aggregates || [], function(m) { return new cubes.MeasureAggregate(m); });
        this.details = _.map(metadata.details || [], function(m) { return new cubes.Attribute(m); });

        this.dimensions = _.map(metadata.dimensions || [], function(dim) {return new cubes.Dimension(dim);} );
    };

    cubes.Cube.prototype.dimension = function(name) {
        if ( _.isObject(name) )
          return name;
        // Return a dimension with given name
        return _.find(this.dimensions, function(obj){return obj.name === name;});
    };

    /*
     * Dimension
     * =========
     */

    cubes.Dimension = function(md){
        var dim = this;
        var i;

        dim.name = md.name;
        dim.label = md.name;
        !md.label || (dim.label = md.label);
        !md.description || (dim.description = md.description);
        !md.default_hierarchy_name || (dim.default_hierarchy_name = md.default_hierarchy_name);
        !md.info || (dim.info = md.info);
        !md.role || (dim.role = md.role);
        !md.cardinality || (dim.cardinality = md.cardinality);
        !md.nonadditive || (dim.nonadditive = md.nonadditive);

        dim.levels = [];

        if(md.levels) {
            for(i in md.levels) {
                var level = new cubes.Level(dim.name, md.levels[i]);
                dim.levels.push(level);
            }
        }

        this.hierarchies = {};

        if(md.hierarchies) {
            for(i in md.hierarchies) {
                var hier = new cubes.Hierarchy(md.hierarchies[i], this);
                dim.hierarchies[hier.name] = hier;
            }
        }

        // if no default_hierarchy_name defined, use first hierarchy's name.
        if ( ! dim.default_hierarchy_name && md.hierarchies
                    && md.hierarchies.length > 0 ) {
          dim.default_hierarchy_name = md.hierarchies[0].name;
        }
    };

    cubes.Dimension.prototype.hierarchy = function(name) {
        if ( _.isObject(name) )
          return name;
        if ( ! name ) {
          return this.hierarchies[this.default_hierarchy_name];
        }
        // Return a hierarchy with given name
        return this.hierarchies[name];
    }

    cubes.Dimension.prototype.level = function(name) {
        if ( _.isObject(name) )
          return name;
        // Return a level with given name
        return _.find(this.levels, function(obj) {return obj.name == name;});
    };

    cubes.Dimension.prototype.toString = function(desc) {
        return this.name;
    };

    cubes.Dimension.prototype.display_label = function() {
        return this.label || this.name;
    };

    cubes.Dimension.prototype.hierarchy = function(name) {
        if ( _.isObject(name) )
          return name;
        else if(name != null)
            return this.hierarchies[name];
        else
            return this.hierarchies[this.default_hierarchy_name];
    };

    /*
     * Hierarchy
     * ---------
     */

    cubes.Hierarchy = function(obj, dim) {
        this.parse(obj, dim);
    };

    cubes.Hierarchy.prototype.parse = function(desc, dim) {
        var hier = this;
        var i;

        hier.name = desc.name;
        hier.label = hier.name;
        !desc.label || (hier.label = desc.label)
        !desc.description || (hier.description = desc.description)
        !desc.info || (hier.info = desc.info);

        var level_names = desc.levels || [];

        hier.levels = _.map(level_names, function(name) {return dim.level(name);} );
    };

    cubes.Hierarchy.prototype.toString = function() {
        return cubes.HIERARCHY_PREFIX_CHAR + this.name;
    };

    cubes.Hierarchy.prototype.display_label = function() {
        return this.label || this.name;
    };

    /*
     * Level
     * -----
     */

    cubes.Level = function(dimension_name, obj){
        this.parse(dimension_name, obj);
    };

    cubes.Level.prototype.parse = function(dimension_name, desc) {
        var level = this;
        var i;

        level.dimension_name = dimension_name;
        level.name = desc.name;
        !desc.label || (level.label = desc.label);
        !desc.description || (level.description = desc.description);
        !desc.info || (level.info = desc.info);
        level._key = desc.key;
        level._label_attribute = desc.label_attribute;
        level._order_attribute = desc.order_attribute;
        !desc.role || (level.role = desc.role);
        !desc.cardinality || (level.cardinality = desc.cardinality);
        level.nonadditive = desc.nonadditive;

        level.attributes = [];

        if(desc.attributes) {
            for(i in desc.attributes) {
                var attr = new cubes.Attribute(desc.attributes[i]);
                level.attributes.push(attr);
            }
        }
    };

    cubes.Level.prototype.key = function() {
        // Key attribute is either explicitly specified or it is first attribute in the list
        var key = this._key;
        var the_attr = _.find(this.attributes, function(a) { return a.name === key; });
        return the_attr || this.attributes[0];
    };

    cubes.Level.prototype.label_attribute = function() {
        // Label attribute is either explicitly specified or it is second attribute if there are more
        // than one, otherwise it is first
        var the_attr = null;
        if ( this._label_attribute ) {
            var label_attribute = this._label_attribute;
            the_attr = _.find(this.attributes, function(a) { return a.name === label_attribute; });
        }
        return the_attr || this.key();
    };

    cubes.Level.prototype.order_attribute = function() {
        var the_attr = null;
        var order_attribute = this._order_attribute;
        if (order_attribute ) {
          the_attr = _.find(this.attributes, function(a) { return a.name === order_attribute; });
        }
        return the_attr || this.label_attribute();
    };

    cubes.Level.prototype.toString = function() {
        return this.name;
    };

    cubes.Level.prototype.display_name = function() {
      return this.label || this.name;
    };

    cubes.Level.prototype.full_name = function() {
        return this.dimension_name + cubes.ATTRIBUTE_STRING_SEPARATOR_CHAR + this.name;
    };

    cubes.Level.prototype.full_name_for_drilldown = function() {
        return this.dimension_name + cubes.DIMENSION_STRING_SEPARATOR_CHAR + this.name;
    };


    /*
     * Attributes, measures and measure aggregates
     * -------------------------------------------
     * */

    cubes.Attribute = function(obj){
        this.ref = obj.ref;
        this.name = obj.name;
        this.label = obj.label;
        this.order = obj.order;
        this.info = (obj.info || {});
        this.description = obj.description;
        this.format = obj.format;
        this.missing_value = obj.missing_value;
        this.locales = obj.locales;
    };

    cubes.Measure = function(obj){
        this.ref = obj.ref;
        this.name = obj.name;
        this.label = obj.label;
        this.order = obj.order;
        this.info = (obj.info || {});
        this.description = obj.description;
        this.format = obj.format;
        this.missing_value = obj.missing_value;
        this.nonadditive = obj.nonadditive;
        if (obj.aggregates) {
            this.aggregates = obj.aggregates;
        }
    };
    cubes.MeasureAggregate = function(obj){
        this.ref = obj.ref;
        this.name = obj.name;
        this.label = obj.label;
        this.order = obj.order;
        this.locales = obj.locales;
        this.info = (obj.info || {});
        this.description = obj.description;
        this.format = obj.format;
        this.missing_value = obj.missing_value;
        this.nonadditive = obj.nonadditive;

        this["function"] = obj["function"];
        this.measure = obj.measure;
    };


    /*
     * Browser
     * =======
     * */

    cubes.Browser = function(server, cube){
        this.cube = cube;
        this.server = server;
    };

    cubes.Browser.prototype.full_cube = function() {
        return new cubes.Cell(this.cube);
    };

    cubes.Browser.prototype.aggregate = function(args, callback) {
        if ( ! args )
          args = {};

        var http_args = {};

        if (args.cut) http_args.cut = args.cut.toString();
        if (args.measure) http_args.measure = args.measure.toString();
        if (args.drilldown) http_args.drilldown = args.drilldown.toString();
        if (args.split) http_args.split = args.split.toString();
        if (args.order) http_args.order = args.order.toString();
        if (args.page) http_args.page = args.page;
        if (args.pagesize) http_args.pagesize = args.pagesize;

        return this.server.query("aggregate", this.cube, args, callback);
    };

    cubes.Browser.prototype.facts = function(args, callback) {
        if ( ! args )
          args = {};

        var http_args = {};

        if (args.cut) http_args.cut = args.cut.toString();
        if (args.order) http_args.order = args.order.toString();
        if (args.page) http_args.page = args.page;
        if (args.pagesize) http_args.pagesize = args.pagesize;

        return this.server.query("facts", this.cube, args, callback);
    };

    cubes.Drilldown = function(dimension, hierarchy, level) {
        if ( ! _.isObject(dimension) )
            throw "Drilldown requires a Dimension object as first argument";
        this.dimension = dimension;
        this.hierarchy = dimension.hierarchy(hierarchy);
        this.level = dimension.level(level) || this.hierarchy.levels[0];
        if ( ! this.hierarchy )
            throw "Drilldown cannot recognize hierarchy " + hierarchy + " for dimension " + dimension;
        if ( ! this.level )
            throw "Drilldown cannot recognize level " + level  + " for dimension " + dimension;
    };

    cubes.Drilldown.prototype.toString = function() {
        return "" + this.dimension + this.hierarchy + cubes.DIMENSION_STRING_SEPARATOR_CHAR + this.level;
    };

    cubes.Drilldown.prototype.keysInResultCell = function() {
        var drill = this;
        var saw_this_level = false;
        var levels_to_look_for = _.filter(drill.hierarchy.levels, function(lvl) { return ( lvl.key() === drill.level.key() && (saw_this_level = true) ) || ( ! saw_this_level ); });
        return _.map(levels_to_look_for, function(lvl) { return lvl.key().ref });
    }

    cubes.Drilldown.prototype.labelsInResultCell = function() {
        var drill = this;
        var saw_this_level = false;
        var levels_to_look_for = _.filter(drill.hierarchy.levels, function(lvl) { return ( lvl.key() === drill.level.key() && (saw_this_level = true) ) || ( ! saw_this_level ); });
        return _.map(levels_to_look_for, function(lvl) { return lvl.label_attribute().ref });
    }

    cubes.Cell = function(cube, cuts) {
        this.cube = cube;
        this.cuts = _.map((cuts || []), function(i) { return i; });
    };

    cubes.Cell.prototype.slice = function(new_cut) {
        var cuts = [];
        var new_cut_pushed = false;
        for (var i = 0; i < this.cuts.length; i++) {
          var c = this.cuts[i];
          if ( c.dimension == new_cut.dimension ){
            cuts.push(new_cut);
            new_cut_pushed = true;
          }
          else {
            cuts.push(c);
          }
        }
        if ( ! new_cut_pushed ) {
          cuts.push(new_cut);
        }
        var cell = new cubes.Cell(this.cube, cuts);
        return cell;
    };

    cubes.Cell.prototype.toString = function() {
        return _.map(this.cuts || [], function(cut) { return cut.toString(); }).join(cubes.CUT_STRING_SEPARATOR_CHAR);
    };

    cubes.Cell.prototype.cut_for_dimension = function(name) {
        return _.find(this.cuts, function(cut) {
            return cut.dimension.name == name;
        });
    };

    cubes.PointCut = function(dimension, hierarchy, path, invert) {
        this.type = 'point';
        this.dimension = dimension;
        this.hierarchy = dimension.hierarchy(hierarchy);
        this.path = path;
        this.invert = !!invert;
    };

    cubes.PointCut.prototype.toString = function() {
        var path_str = cubes.string_from_path(this.path);
        return (this.invert ? cubes.CUT_INVERSION_CHAR : "") +
            this.dimension +
            ( this.hierarchy || '' ) +
            cubes.DIMENSION_STRING_SEPARATOR_CHAR +
            path_str;
    };

    cubes.SetCut = function(dimension, hierarchy, paths, invert) {
        this.type = 'set';
        this.dimension = dimension;
        this.hierarchy = dimension.hierarchy(hierarchy);
        this.paths = paths;
        this.invert = !!invert;
    };

    cubes.SetCut.prototype.toString = function() {
        var path_str = _.map(this.paths, cubes.string_from_path).join(cubes.SET_CUT_SEPARATOR_CHAR);
        return (this.invert ? cubes.CUT_INVERSION_CHAR : "") +
            this.dimension +
            ( this.hierarchy || '' ) +
            cubes.DIMENSION_STRING_SEPARATOR_CHAR +
            path_str;
    };

    cubes.RangeCut = function(dimension, hierarchy, from_path, to_path, invert){
        this.type = 'range';
        this.dimension = dimension;
        this.hierarchy = dimension.hierarchy(hierarchy);
        if ( from_path === null && to_path === null ) {
            throw "Either from_path or to_path must be defined for RangeCut";
        }
        this.from_path = from_path;
        this.to_path = to_path;
        this.invert = !!invert;
    };

    cubes.RangeCut.prototype.toString = function() {
        var path_str = cubes.string_from_path(this.from_path) + cubes.RANGE_CUT_SEPARATOR_CHAR + cubes.string_from_path(this.to_path);
        return (this.invert ? cubes.CUT_INVERSION_CHAR : "") +
            this.dimension +
            ( this.hierarchy || '' ) +
            cubes.DIMENSION_STRING_SEPARATOR_CHAR +
            path_str;
    };

    cubes.CUT_INVERSION_CHAR = "!";
    cubes.CUT_STRING_SEPARATOR_CHAR = "|";
    cubes.DIMENSION_STRING_SEPARATOR_CHAR = ":";
    cubes.ATTRIBUTE_STRING_SEPARATOR_CHAR = ".";
    cubes.HIERARCHY_PREFIX_CHAR = "@";
    cubes.PATH_STRING_SEPARATOR_CHAR = ",";
    cubes.RANGE_CUT_SEPARATOR_CHAR = "-";
    cubes.SET_CUT_SEPARATOR_CHAR = ";";

    cubes.CUT_STRING_SEPARATOR = /\|/g;
    cubes.DIMENSION_STRING_SEPARATOR = /:/g;
    cubes.PATH_STRING_SEPARATOR = /,/g;
    cubes.RANGE_CUT_SEPARATOR = /-/g;
    cubes.SET_CUT_SEPARATOR = /;/g;

    cubes.PATH_PART_ESCAPE_PATTERN = /([\\!|:;,-])/g;
    cubes.PATH_PART_UNESCAPE_PATTERN = /\\([\\!|:;,-])/g;

    cubes.CUT_PARSE_REGEXP = new RegExp("^(" + cubes.CUT_INVERSION_CHAR + "?)(\\w+)(?:" + cubes.HIERARCHY_PREFIX_CHAR + "(\\w+))?" + cubes.DIMENSION_STRING_SEPARATOR_CHAR + "(.*)$")
    cubes.DRILLDOWN_PARSE_REGEXP = new RegExp("^(\\w+)(?:" + cubes.HIERARCHY_PREFIX_CHAR + "(\\w+))?(?:" + cubes.DIMENSION_STRING_SEPARATOR_CHAR + "(\\w+))?$")
    cubes.NULL_PART_STRING = '__null__';
    cubes.SPLIT_DIMENSION_STRING = '__within_split__';

    cubes.SPLIT_DIMENSION = new cubes.Dimension({
      name: cubes.SPLIT_DIMENSION_STRING,
      label: 'Matches Filters',
      hierarchies: [ { name: 'default', levels: [ cubes.SPLIT_DIMENSION_STRING ] } ],
      levels: [ { name: cubes.SPLIT_DIMENSION_STRING, attributes: [{name: cubes.SPLIT_DIMENSION_STRING}], label: 'Matches Filters' } ]
    });

    cubes._split_with_negative_lookbehind = function(input, regex, lb) {
      var string = input;
      var match;
      var splits = [];


      while ((match = regex.exec(string)) != null) {
          if ( string.substr(match.index - lb.length, lb.length) != lb ) {
            splits.push(string.substring(0, match.index));
            string = string.substring(Math.min(match.index + match[0].length, string.length));
            regex.lastIndex = 0;
          }
          else {
            // match has the lookbehind, must exclude
        	// TODO: I suspect an infinite loop on this branch as the string is not modified
          }
      }
      splits.push(string);
      return splits;
    }

    cubes._escape_path_part = function(part) {
        if ( part == null ) {
          return cubes.NULL_PART_STRING;
        }
        return part.toString().replace(cubes.PATH_PART_ESCAPE_PATTERN, function(match, b1) { return "\\" + b1; });
    };

    cubes._unescape_path_part = function(part) {
        if ( part === cubes.NULL_PART_STRING ) {
          return null;
        }
        return part.replace(cubes.PATH_PART_UNESCAPE_PATTERN, function(match, b1) { return b1; });
    };

    cubes.string_from_path = function(path){
        var fixed_path = _.map(path || [], function(element) {return cubes._escape_path_part(element);}).join(cubes.PATH_STRING_SEPARATOR_CHAR);
        return fixed_path;
    };

    cubes.path_from_string = function(path_string) {
        var paths = cubes._split_with_negative_lookbehind(path_string, cubes.PATH_STRING_SEPARATOR, '\\');
        var parsed = _.map(paths || [], function(e) { return cubes._unescape_path_part(e); });
        return parsed;
    };

    cubes.cut_from_string = function(cube_or_model, cut_string) {
        // parse out invert, dim_name, hierarchy, and path thingy
        var match = cubes.CUT_PARSE_REGEXP.exec(cut_string);
        if (!match) {
          return null;
        }
        var invert = !!(match[1]),
            dim_name = match[2],
            hierarchy = match[3] || null,
            path_thingy = match[4];
        var dimension = cube_or_model.dimension(dim_name);
        // if path thingy splits on set separator, make a SetCut.
        var splits = cubes._split_with_negative_lookbehind(path_thingy, cubes.SET_CUT_SEPARATOR, '\\');
        if ( splits.length > 1 ) {
          return new cubes.SetCut(dimension, hierarchy, _.map(splits, function(ss) { return cubes.path_from_string(ss); }), invert);
        }
        // else if path thingy splits into two on range separator, make a RangeCut.
        splits = cubes._split_with_negative_lookbehind(path_thingy, cubes.RANGE_CUT_SEPARATOR, '\\');
        if ( splits.length == 2 ) {
          var from_path = splits[0] ? cubes.path_from_string(splits[0]) : null;
          var to_path = splits[1] ? cubes.path_from_string(splits[1]) : null;
          return new cubes.RangeCut(dimension, hierarchy, from_path, to_path, invert);
        }
        // else it's a PointCut.
        return new cubes.PointCut(dimension, hierarchy, cubes.path_from_string(path_thingy), invert);
    };

    cubes.cuts_from_string = function(cube_or_model, cut_param_value) {
        var cut_strings = cubes._split_with_negative_lookbehind(cut_param_value, cubes.CUT_STRING_SEPARATOR, '\\');
        return _.map(cut_strings || [], function(e) { return cubes.cut_from_string(cube_or_model, e); });
    };

    cubes.cell_from_string = function(cube, cut_param_value) {
        return new cubes.Cell(cube, cubes.cuts_from_string(cube, cut_param_value));
    };

    cubes.drilldown_from_string = function(cube_or_model, drilldown_string) {
        var match = cubes.DRILLDOWN_PARSE_REGEXP.exec(drilldown_string);
        if (!match) {
          return null;
        }
        var dim_name = match[1],
            hierarchy = match[2] || null,
            level = match[3] || null;
        var dimension = cube_or_model.dimension(dim_name);
        if ( ! dimension )
          if ( dim_name === cubes.SPLIT_DIMENSION_STRING )
            dimension = cubes.SPLIT_DIMENSION;
          else
            return null;
        return new cubes.Drilldown(dimension, hierarchy, level);
    };

    cubes.drilldowns_from_string = function(cube_or_model, drilldown_param_value) {
        var dd_strings = cubes._split_with_negative_lookbehind(drilldown_param_value, cubes.CUT_STRING_SEPARATOR, '\\');
        return _.map(dd_strings || [], function(e) { return cubes.drilldown_from_string(cube_or_model, e); });
    };

    cubes.drilldowns_to_string = function(drilldowns) {
      return _.map(drilldowns, function(d) { return d.toString(); }).join(cubes.CUT_STRING_SEPARATOR_CHAR);
    };

    root['cubes'] = cubes;

}).call(this);
;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

/* Extensions to cubesviewer client lib */
cubes.Dimension.prototype.hierarchies_count = function()  {

	var count = 0;
	for (var hiename in this.hierarchies) {
		if (this.hierarchies.hasOwnProperty(hiename)) {
			count++;
		}
	}
	return count;
};

cubes.Dimension.prototype.default_hierarchy = function()  {
	return this.hierarchies[this.default_hierarchy_name];
};

/*
 * Extend model prototype to support datefilter dimensions.
 */
cubes.Dimension.prototype.isDateDimension = function()  {

	// Inform if a dimension is a date dimension and can be used as a date
	// filter (i.e. with date selection tool).
	return ((this.role == "time") &&
			((! ("cv-datefilter" in this.info)) || (this.info["cv-datefilter"] == true)) );

};

/**
 * List date dimensions.
 *
 * @returns An array with the dimensions that are date dimensions (role: time).
 */
cubes.Cube.prototype.dateDimensions = function() {
	var result = [];
	for (var index in this.dimensions) {
		var dimension = this.dimensions[index];
		if (dimension.isDateDimension()) result.push(dimension);
	}
	return result;
};


cubes.Cube.prototype.cvdim_dim = function(dimensionString) {
	// Get a dimension by name. Accepts dimension hierarchy and level in the input string.
	var dimname = dimensionString;
	if (dimensionString.indexOf('@') > 0) {
		dimname = dimensionString.split("@")[0];
	} else if (dimensionString.indexOf(':') > 0) {
		dimname = dimensionString.split(":")[0];
	}

	return this.dimension(dimname);
};

cubes.Cube.prototype.dimensionPartsFromCut = function(cut) {
	var parts = this.dimensionParts(cut.dimension);
	var depth = (cut.value.split(';')[0].match(/,/g) || []).length + 1;

	var dimstring = parts.dimension.name + '@' + parts.hierarchy.name + ':' + parts.hierarchy.levels[depth - 1].name;
	return this.dimensionParts(dimstring);
};

cubes.Cube.prototype.dimensionParts = function(dimensionString) {
	// Get a dimension info by name. Accepts dimension hierarchy and level in the input string.

	if (!dimensionString) return null;

	var dim = this.cvdim_dim(dimensionString);
	var hie = dim.default_hierarchy();

	if (dimensionString.indexOf("@") > 0) {
		var hierarchyName = dimensionString.split("@")[1].split(":")[0];
		hie = dim.hierarchy(hierarchyName);
	}

	var lev = null;
	var levelIndex = 0;
	if (dimensionString.indexOf(":") > 0) {
		var levelname = dimensionString.split(":")[1];
		lev = dim.level(levelname);
		for (levelIndex = 0; levelIndex < hie.levels.length && hie.levels[levelIndex] != lev; levelIndex++);
	} else {
		lev = dim.level(hie.levels[0]);
	}

	var depth = null;
	for (var i = 0; i < hie.levels.length; i++) {
		if (lev.name == hie.levels[i]) {
			depth = i + 1;
			break;
		}
	}

	return {
		dimension: dim,
		level: lev,
		levelIndex: levelIndex,
		depth: depth,
		hierarchy: hie,
		label: dim.label + ( hie.name != "default" ? (" - " + hie.label) : "" ) + ( hie.levels.length > 1 ? (" / " + lev.label) : "" ),
		labelShort: (dim.label +  ( hie.levels.length > 1 ? (" / " + lev.label) : "" )),
		labelNoLevel: dim.label + ( hie.name != "default" ? (" - " + hie.label) : "" ),

		fullDrilldownValue: dim.name + ( hie.name != "default" ? ("@" + hie.name) : "" ) + ":" + lev.name,
		drilldownDimension: dim.name + '@' + hie.name + ':' + lev.name,
		drilldownDimensionPlus: (hie.levels.length > 1 && levelIndex < hie.levels.length - 1) ? (dim.name + '@' + hie.name + ':' + hie.levels[levelIndex + 1].name) : null,
		drilldownDimensionMinus: (hie.levels.length > 1 && levelIndex > 0) ? (dim.name + '@' + hie.name + ':' + hie.levels[levelIndex - 1].name) : null,

		cutDimension: dim.name + ( hie.name != "default" ? "@" + hie.name : "" )
	};

};

/**
 * Returns the aggregates for the given measure, by name.
 * If passed null, returns aggregates with no measure.
 *
 * @returns The list of aggregates of a measure.
 */
cubes.Cube.prototype.measureAggregates = function(measureName) {
	var aggregates = $.grep(this.aggregates, function(ia) { return measureName ? ia.measure == measureName : !ia.measure; } );
	return aggregates;
};


cubes.Cube.prototype.aggregateFromName = function(aggregateName) {
	var aggregates = $.grep(this.aggregates, function(ia) { return aggregateName ? ia.name == aggregateName : !ia.measure; } );
	return aggregates.length == 1 ? aggregates[0] : null;
};



/*
 * Processes a cell and returns an object with consistent information:
 * o.key
 * o.label
 * o.info[]
 */
cubes.Level.prototype.readCell = function(cell) {

	if (!(this.key().ref in cell)) return null;

	var result = {};
	result.key = cell[this.key().ref];
	result.label = cell[this.label_attribute().ref];
	result.orderValue = cell[this.order_attribute().ref];
	result.info = {};
	$(this.attributes).each(function(idx, attribute) {
		result.info[attribute.ref] = cell[attribute.ref];
	});

	return result;
};

cubes.Hierarchy.prototype.readCell = function(cell, level_limit) {

	var result = [];
	var hie = this;

	for (var i = 0; i < this.levels.length; i ++) {
		var level = this.levels[i];
		var info = level.readCell(cell);
		if (info != null) result.push(info);

		// Stop if we reach level_limit
		if ((level_limit != undefined) && (level_limit != null)) {
			if (level_limit.name == level.name) break;
		}
	}
	return result;
};

;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

/**
 * CubesViewer Cubes module. Provides an interface to the Cubes client.
 *
 * @namespace cv.cubes
 */
angular.module('cv.cubes', []);

/**
 * This service manages the Cubes client instance and provides methods to
 * connect to and query the Cubes server.
 *
 * @class cubesService
 * @memberof cv.cubes
 */
angular.module('cv.cubes').service("cubesService", ['$rootScope', '$log', 'cvOptions', 'gaService',
                                                    function ($rootScope, $log, cvOptions, gaService) {

	var cubesService = this;

	this.cubesserver = null;

	this.state = cubesviewer.VIEW_STATE_INITIALIZING;

	this.stateText = "";


	this.initialize = function() {
	};

	/**
	 * Connects this service to the Cubes server, using the parameters
	 * defined by the configured {@link cvOptions}.
	 *
	 * @memberOf cv.cubes.cubesService
	 */
	this.connect = function() {
		// Initialize Cubes client library
		this.cubesserver = new cubes.Server(cubesService._cubesAjaxHandler);
		console.debug("Cubes client connecting to: " + cvOptions.cubesUrl);
		this.cubesserver.connect (cvOptions.cubesUrl, function() {
			$log.debug('Cubes client initialized (server version: ' + cubesService.cubesserver.server_version + ')');
			cubesService.state = cubesviewer.VIEW_STATE_INITIALIZED;
			$rootScope.$apply();
		}, function(xhr) {

			console.debug(xhr);
			console.debug('Could not connect to Cubes server [code=' + xhr.status + "]");
			cubesService.state = cubesviewer.VIEW_STATE_ERROR;

			if (xhr.status == 401) {
				cubesService.stateText = "Unauthorized.";
			} else if (xhr.status == 403) {
				cubesService.stateText = "Forbidden.";
			} else if (xhr.status == 400) {
				cubesService.stateText = "Bad request: " + ($.parseJSON(xhr.responseText).message);
			} else {
				cubesService.stateText = "Unknown error.";
			}


			$rootScope.$apply();
		} );
	};


	/*
	 * Ajax handler for cubes library
	 */
	this._cubesAjaxHandler = function (settings) {
		return cubesService.cubesRequest(settings.url, settings.data || [], settings.success, settings.error);
	};


	/**
	 * Sends a request to the Cubes server.
	 *
	 * @memberOf cv.cubes.cubesService
	 * @returns The jQuery XHR object.
	 */
	this.cubesRequest = function(path, params, successCallback, errCallback) {


		// TODO: normalize how URLs are used (full URL shall come from client code)
		if (path.charAt(0) == '/') path = cvOptions.cubesUrl + path;

		if (cvOptions.debug) {
			$log.debug("Cubes request: " + path + " (" + JSON.stringify(params) + ")");
		}

		var jqxhr = $.get(path, params, cubesService._cubesRequestCallback(successCallback), cvOptions.jsonRequestType);

		jqxhr.fail(errCallback || cubesService.defaultRequestErrorHandler);

		try {
			gaService.trackRequest(path);
		} catch(e) {
			$log.error("An error happened during CubesViewer event tracking: " + e)
		}

		return jqxhr;

	}

	this._cubesRequestCallback = function(pCallback) {
		var callback = pCallback;
		return function(data, status) {
			pCallback(data);
		}
	};

	/*
	 * Default XHR error handler for CubesRequests
	 */
	this.defaultRequestErrorHandler = function(xhr, textStatus, errorThrown) {
		$log.error("Cubes request error: " + xhr)
	};

	/*
	 * Builds Cubes Server query parameters based on current view values.
	 */
	this.buildBrowserArgs = function(view, includeXAxis, onlyCuts) {

		// "lang": view.cubesviewer.options.cubesLang

		//console.debug(view);

		var args = {};

		if (!onlyCuts) {

			var drilldowns = view.params.drilldown.slice(0);

			// Include X Axis if necessary
			if (includeXAxis) {
				drilldowns.splice(0, 0, view.params.xaxis);
			}

			// Preprocess
			for (var i = 0; i < drilldowns.length; i++) {
				drilldowns[i] = cubes.drilldown_from_string(view.cube, view.cube.dimensionParts(drilldowns[i]).fullDrilldownValue);
			}

			// Include drilldown array
			if (drilldowns.length > 0)
				args.drilldown = cubes.drilldowns_to_string(drilldowns);
		}

		// Cuts
		var cuts = this.buildQueryCuts(view);
		if (cuts.length > 0) args.cut = new cubes.Cell(view.cube, cuts);

		return args;

	};

	/*
	 * Builds Query Cuts
	 */
	this.buildQueryCutsStrings = function(view) {

		var cuts = [];

		// Cuts
		$(view.params.cuts).each(function(idx, e) {
			var invert = e.invert ? "!" : "";
			var dimParts = view.cube.dimensionParts(e.dimension);
			var cutDim = dimParts.dimension.name + ( dimParts.hierarchy.name != "default" ? "@" + dimParts.hierarchy.name : "" );

			cuts.push(invert + cutDim + ":" + e.value.replace("-", "\\-"));
		});

		// Date filters
		$(view.params.datefilters).each(function(idx, e) {
			var datefilterval = cubesService.datefilterValue(view, e);
			if (datefilterval != null) {
				cuts.push(e.dimension + ":" + datefilterval);
			}
		});

		return cuts;
	};

	this.buildQueryCuts = function(view) {
		var cuts = [];
		var cutsStrings = cubesService.buildQueryCutsStrings(view);
		$(cutsStrings).each(function(idx, e) {
			cuts.push(cubes.cut_from_string(view.cube, e));
		});
		return cuts;
	};

	/*
	 * Composes a filter with appropriate syntax and time grain from a
	 * datefilter
	 */
	this.datefilterValue = function(view, datefilter) {

		var date_from = null;
		var date_to = null;

		if (datefilter.mode.indexOf("auto-") == 0) {
			if (datefilter.mode == "auto-last1m") {
				date_from = new Date();
				date_from.setMonth(date_from.getMonth() - 1);
			} else if (datefilter.mode == "auto-last3m") {
				date_from = new Date();
				date_from.setMonth(date_from.getMonth() - 3);
			} else if (datefilter.mode == "auto-last6m") {
				date_from = new Date();
				date_from.setMonth(date_from.getMonth() - 6);
			} else if (datefilter.mode == "auto-last12m") {
				date_from = new Date();
				date_from.setMonth(date_from.getMonth() - 12);
			} else if (datefilter.mode == "auto-last24m") {
				date_from = new Date();
				date_from.setMonth(date_from.getMonth() - 24);
			} else if (datefilter.mode == "auto-january1st") {
				date_from = new Date();
				date_from.setMonth(0);
				date_from.setDate(1);
			} else if (datefilter.mode == "auto-yesterday") {
				date_from = new Date();
				date_from.setDate(date_from.getDate() - 1);
				date_to = new Date();
                date_to.setDate(date_from.getDate() - 1);
			}

		} else if (datefilter.mode == "custom") {
			if ((datefilter.date_from != null) && (datefilter.date_from != "")) {
				date_from = new Date(datefilter.date_from);
			}
			if ((datefilter.date_to != null) && (datefilter.date_to != "")) {
				date_to = new Date(datefilter.date_to);
			}
		}

		if ((date_from != null) || (date_to != null)) {
			var datefiltervalue = "";
			if (date_from != null)
				datefiltervalue = datefiltervalue + cubesService._datefiltercell(view, datefilter, date_from);
			datefiltervalue = datefiltervalue + "-";
			if (date_to != null)
				datefiltervalue = datefiltervalue + cubesService._datefiltercell(view, datefilter, date_to);
			return datefiltervalue;
		} else {
			return null;
		}

	};

	this._datefiltercell = function(view, datefilter, tdate) {

		var values = [];

		var dimensionparts = view.cube.dimensionParts(datefilter.dimension);
		for (var i = 0; i < dimensionparts.hierarchy.levels.length; i++) {
			var level = dimensionparts.hierarchy.levels[i];

			var field = level.role;
			if (field == "year") {
				values.push(tdate.getFullYear());
			} else if (field == "month") {
				values.push(tdate.getMonth() + 1);
			} else if (field == "quarter") {
				values.push((Math.floor(tdate.getMonth() / 3) + 1));
			} else if (field == "week") {
				values.push(this._weekNumber(tdate));
			} else if (field == "day") {
				values.push(tdate.getDate());
			} else {
				dialogService.show("Wrong configuration of model: time role of level '" + level.name + "' is invalid.");
			}
		}

		return values.join(',');

		/*return tdate.getFullYear() + ","
				+ (Math.floor(tdate.getMonth() / 3) + 1) + ","
				+ (tdate.getMonth() + 1); */
	};

	this._weekNumber = function(d) {
	    // Copy date so don't modify original
	    d = new Date(d);
	    d.setHours(0,0,0);
	    // Get first day of year
	    var yearStart = new Date(d.getFullYear(),0,1);
	    // Calculate full weeks to nearest Thursday
	    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7)
	    // Return array of year and week number
	    return weekNo;
	};


	this.initialize();

}]);


;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

angular.module('cv.cubes').service("cubesCacheService", ['$rootScope', '$log', 'cvOptions', 'cubesService', 'gaService',
                                                         function ($rootScope, $log, cvOptions, cubesService, gaService) {

	var cubesCacheService = this;

	this.cache = {};

	this._cacheOverridedCubesRequest = null;

	this.initialize = function() {
		if (this._cacheOverridedCubesRequest) {
			$log.warn("Error: tried to initialize CubesCacheService but it was already initialized.")
			return;
		}
		if (cvOptions.cacheEnabled) {
			// Replace request function
			$log.debug("Replacing Cubes request method with caching version.")
			cubesCacheService._cacheOverridedCubesRequest = cubesService.cubesRequest;
			cubesService.cubesRequest = cubesCacheService.cachedCubesRequest;
		}
	};

	this.cachedCubesRequest = function(path, params, successCallback, errCallback) {

		cubesCacheService._cacheCleanup();

		var requestHash = path + "?" + $.param(params);
		var jqxhr = null;
		if (requestHash in cubesCacheService.cache && cvOptions.cacheEnabled) {

			// Warn that data comes from cache (QTip can do this?)
			var timediff = Math.round ((new Date().getTime() - cubesCacheService.cache[requestHash].time) / 1000);
			if (timediff > cvOptions.cacheNotice) {
				//cubesviewer.showInfoMessage("Data loaded from cache<br/>(" + timediff + " minutes old)", 1000);
				$log.debug("Data loaded from cache (" + Math.floor(timediff / 60, 2) + " minutes old)");
			}

			jqxhr = $.Deferred();
			jqxhr.error = function() { };

			setTimeout(function() {
				// TODO: What is the correct ordering of success/complete callbacks?
				successCallback(cubesCacheService.cache[requestHash].data);
				jqxhr.resolve(); //.promise();
			}, 0);

			gaService.trackRequest(path);

		} else {
			// Do request
			jqxhr = cubesCacheService._cacheOverridedCubesRequest(path, params, cubesCacheService._cacheCubesRequestSuccess(successCallback, requestHash), errCallback);
		}

		return jqxhr;
	};

	/*
	 * Reviews the cache and removes old elements and oldest if too many
	 */
	this._cacheCleanup = function() {

		var cacheDuration = cvOptions.cacheDuration;
		var cacheSize = cvOptions.cacheSize;

		var oldestTime = new Date().getTime() - (1000 * cacheDuration);

		var elements = [];
		for (var element in cubesCacheService.cache) {
			if (cubesCacheService.cache[element].time < oldestTime) {
				delete cubesCacheService.cache[element];
			} else {
				elements.push (element);
			}
		}

		elements.sort(function(a, b) {
			return (cubesCacheService.cache[a].time - cubesCacheService.cache[b].time);
		});
		if (elements.length >= cacheSize) {
			for (var i = 0; i < elements.length - cacheSize; i++) {
				delete cubesCacheService.cache[elements[i]];
			}
		}

	}

	this._cacheCubesRequestSuccess = function(pCallback, pRequestHash) {
		var requestHash = pRequestHash;
		var callback = pCallback;
		return function(data) {
			// TODO: Check if cache is enabled
			cubesCacheService.cache[pRequestHash] = {
				"time": new Date().getTime(),
				"data": data
			};
			pCallback(data);
		};
	};

}]);

;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


"use strict";

/**
 * CubesViewer namespace.
 *
 * @namespace cv
 */

// Main CubesViewer angular module
angular.module('cv', ['ui.bootstrap', 'bootstrapSubmenu',
                      'ui.grid', 'ui.grid.resizeColumns', 'ui.grid.selection', 'ui.grid.autoResize',
                      'ui.grid.pagination', 'ui.grid.pinning', /*'ui.grid.exporter',*/
                      'ngCookies',
                      'cv.cubes', 'cv.views']);

// Configure moment.js
/*
angular.module('cv').constant('angularMomentConfig', {
	// preprocess: 'unix', // optional
	// timezone: 'Europe/London' // optional
});
*/

/*
 * Configures cv application (cvOptions, log provider...).
 */
angular.module('cv').config([ '$logProvider', 'cvOptions', /* 'editableOptions', 'editableThemes', */
                           function($logProvider, cvOptions /*, editableOptions, editableThemes */) {

	//console.debug("Bootstrapping CubesViewer.");

    var defaultOptions = {

    		cubesUrl : null,
            //cubesLang : null,
    		jsonRequestType: "json", // "json | jsonp"

    		pagingOptions: [15, 30, 100, 250],

            cacheEnabled: true,
            cacheDuration: 30 * 60,
            cacheNotice: 10 * 60,
            cacheSize: 32,

			datepickerShowWeeks: true,
		    datepickerFirstDay: 1,  // Starting day of the week from 0-6 (0=Sunday, ..., 6=Saturday).

            undoEnabled: true,
            undoSize: 32,

            seriesOperationsEnabled: false,

        	hideControls: false,

            gaTrackEvents: false,

            debug: false
    };

	$.extend(defaultOptions, cvOptions);
	$.extend(cvOptions, defaultOptions);

	$logProvider.debugEnabled(cvOptions.debug);

	// Avoid square brackets in serialized array params
	// TODO: Shall be done for $http instead?
	/*
	$.ajaxSetup({
		traditional : true
	});
	*/

	// XEditable bootstrap3 theme. Can be also 'bs2', 'default'
	/*
	editableThemes.bs3.inputClass = 'input-sm';
	editableThemes.bs3.buttonsClass = 'btn-sm';
	editableOptions.theme = 'bs3';
	*/

}]);

/*
 *
 */
angular.module('cv').run([ '$timeout', '$log', 'cvOptions', 'cubesService', 'cubesCacheService', /* 'editableOptions', 'editableThemes', */
	                           function($timeout, $log, cvOptions, cubesService, cubesCacheService /*, editableOptions, editableThemes */) {

	$log.debug("CubesViewer debug mode is enabled.");

	// Initialize cache service
	cubesCacheService.initialize();

	// Initialize Cubes service
	cubesService.connect();

}]);


/**
 * CubesViewer class, used to initialize CubesViewer and
 * create views. Note that the initialization method varies depending
 * on whether your application uses Angular 1.x or not.
 *
 * An instance of this class is available as the global `cubesviewer`
 * variable. This class must not be instantiated.
 *
 * @class
 */
function CubesViewer() {

	// CubesViewer version
	this.version = "2.0.3-devel";

	/**
	 * State of a view that has not yet been fully initialized, and cannot be interacted with.
	 * @const
	 */
	this.VIEW_STATE_INITIALIZING = 1;

	/**
	 * State of a view that has been correctly initialized.
	 * @const
	 */
	this.VIEW_STATE_INITIALIZED = 2;

	/**
	 * State of a view that has failed initialization, and cannot be used.
	 * @const
	 */
	this.VIEW_STATE_ERROR = 3;


	this._configure = function(options) {
		$('.cv-version').html(cubesviewer.version);
		angular.module('cv').constant('cvOptions', options);
	};

	/**
	 * Initializes CubesViewer system.
	 *
	 * If you are using CubesViewer in an Angular application, you don't
	 * need to call this method. Instead, use your application Angular `config`
	 * block to initialize the cvOptions constant with your settings,
	 * and add the 'cv' module as a dependency to your application.
	 */
	this.init = function(options) {

		this._configure(options);
		angular.element(document).ready(function() {
			angular.bootstrap(document, ['cv']);
		});
	};

	/**
	 * Creates a CubesViewer view object and interface, and attaches it
	 * to the specified DOM element.
	 *
	 * If you are embedding CubesViewer in an Angular application, you can
	 * avoid this method and use the {@link viewsService} and the
	 * {@link cvViewCube} directive instead.
	 *
	 * @param container A selector, jQuery object or DOM element where the view will be attached.
	 * @param type View type (currently only "cube" is available).
	 * @param viewData An object or JSON string with the view parameters.
	 * @returns The created view object.
	 */
	this.createView = function(container, type, viewData) {

		//console.debug("Creating view: " + viewData);

		var $compile = angular.element(document).injector().get('$compile');
		var viewsService = angular.element(document).injector().get('viewsService');

		var view = viewsService.createView("cube", viewData);

		var viewDirective = '<div class="cv-bootstrap"><div cv-view-cube view="view"></div></div>';
		$(container).first().html(viewDirective);

		var scope = angular.element(document).scope().$root;
		var templateScope = scope.$new();
		templateScope.view = view;

		//templateCtrl = $controller("CubesViewerStudioController", { $scope: templateScope } );
		//$(cvOptions.container).children().data('$ngControllerController', templateCtrl);

		$compile($(container).first().contents())(templateScope);

		return view;

	};

	/**
	 * Performs changes within CubesViewer scope. If are not using CubesViewer from
	 * Angular, you need to wrap all your CubesViewer client code within this
	 * method in order for changes to be observed.
	 *
	 * @param routine Function that will be executed within CubesViewer Angular context.
	 */
	this.apply = function(routine) {
		if (! angular.element(document).scope()) {
			console.debug("Delaying");
			setTimeout(function() { cubesviewer.apply(routine); }, 1000);
		} else {
			angular.element(document).scope().$apply(routine);
		}
	};

};

/**
 * This is Cubesviewer main entry point. Please see {@link CubesViewer}
 * documentation for further information.
 *
 * @global
 */
var cubesviewer = new CubesViewer();

;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


"use strict";


/**
 * View class, which contains view definition (params), view state,
 * and provides the view API.
 *
 * This is the generic base View class definition.
 * Specific views (ie. CubeView) enrich this model.
 *
 * @param cvOptions The cv options object.
 * @param id The numeric id of the view to be created.
 * @param type The view type (ie. 'cube').
 * @returns The new view object.
 *
 * @namespace cubesviewer
 */
cubesviewer.View = function(cvOptions, id, type) {

	var view = {};

	view.id = "_cv-view-" + id;
	view.type = type;
	view.cvOptions = cvOptions;

	view.state = cubesviewer.VIEW_STATE_INITIALIZING;
	view.error = "";

	view.params = {};

	view.savedId = 0;
	view.owner = cvOptions.user;
	view.shared = false;


	/**
	 * Returns a boolean indicating whether controls are hidden for this view.
	 *
	 * @returns boolean indicating whether controls are hidden for this view.
	 */
	view.getControlsHidden = function() {
		return !!view.params.controlsHidden || !!view.cvOptions.hideControls;
	};

	view.setControlsHidden = function(controlsHidden) {
		view.params.controlsHidden = controlsHidden;
	};

	return view;

};



/**
 * The views module manages different views in CubesViewer.
 *
 * @namespace cv.views
 */
angular.module('cv.views', ['cv.views.cube']);


/**
 * This service manages CubesViewer views in the application.
 *
 * @class viewsService
 * @memberof cv.views
 */
angular.module('cv.views').service("viewsService", ['$rootScope', '$window', 'cvOptions', 'cubesService', 'dialogService',
                                                    function ($rootScope, $window, cvOptions, cubesService, dialogService) {

	this.views = [];

	this.lastViewId = 0;

	this.studioViewsService = null;

	/**
	 * Adds a new clean view for a cube.
	 *
	 * @param type Type of view to create. Currently only "cube" is available.
	 * @param data View parameters, as an object or as a serialized JSON string.
	 * @returns CubesViewer view object.
	 *
	 * @memberOf cv.views.viewsService
	 */
	this.createView = function(type, data) {

		// Create view

		this.lastViewId++;

		var params = {};

		if (typeof data == "string") {
			try {
				params = $.parseJSON(data);
			} catch (err) {
				console.debug('Error: could not process serialized data (JSON parse error)');
				dialogService.show('Error: could not process serialized data (JSON parse error).')
				params["name"] = "Undefined view";
			}
		} else {
			params = data;
		}

		// FIXME: cvOptions shall not be passed, and getControlsHidden() shall possibly be part of this view service
		var view = cubesviewer.CubeView(cvOptions, this.lastViewId, type);
		$.extend(view.params, params);

		return view;
	};

	/**
	 * Serialize view data.
	 *
	 * @param view The view object for which definition will be serialized.
	 * @returns A string with the definition of the view (view.params) serialized in JSON.
	 */
	this.serializeView = function(view) {
		//return JSON.stringify(view.params);
		return angular.toJson(view.params);  // Ignores $$ attributes
	};


}]);


;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

angular.module('cv.views').service("dialogService", ['$rootScope', '$uibModal', 'cvOptions', 'cubesService',
                                                    function ($rootScope, $uibModal, cvOptions, cubesService) {

	var dialogService = this;

	this.initialize = function() {
		$("body").append('<div class="cv-modals cv-bootstrap"></div>');
	};

	this.show = function(text) {

	    var modalInstance = $uibModal.open({
	    	animation: true,
	    	templateUrl: 'dialog/dialog.html',
	    	controller: 'CubesViewerViewsDialogController',
	    	appendTo: angular.element($("body").find('.cv-modals')[0]),
		    resolve: {
	    		dialog: function() { return { 'text': text }; }
		    },
	    	/*
		    size: size,
	    	 */
	    });

	    modalInstance.result.then(function (selectedItem) {
	    	//$scope.selected = selectedItem;
	    }, function () {
	        //console.debug('Modal dismissed at: ' + new Date());
	    });

	};

	this.initialize();

}]);


/**
 */
angular.module('cv.views').controller("CubesViewerViewsDialogController", ['$rootScope', '$scope', '$timeout', '$uibModalInstance', 'cvOptions', 'cubesService', 'viewsService', 'dialog',
                                                                           function ($rootScope, $scope, $timeout, $uibModalInstance, cvOptions, cubesService, viewsService, dialog) {

	$scope.$rootScope = $rootScope;

	$scope.dialog = dialog;

	$scope.close = function() {
		$uibModalInstance.dismiss('cancel');
	};


}]);

;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

/**
 * The CubeView class represents a view of type `cube`.
 *
 * @param cvOptions The cv options object.
 * @param id The numeric id of the view to be created.
 * @param type The view type (ie. 'cube').
 * @returns The new view object.
 *
 * @namespace cubesviewer
 */
cubesviewer.CubeView = function(cvOptions, id, type) {

	var view = cubesviewer.View(cvOptions, id, type);

	view.resultLimitHit = false;
	view.requestFailed = false;
	view.pendingRequests = 0;
	view.dimensionFilter = null;

	view._invalidatedData = true;
	view._invalidatedDefs = true;

	view.grid = {
		api: null,
		data: [],
		columnDefs: []
	};

	view.invalidateData = function() {
		view._invalidatedData = true;
	};

	view.invalidateDefs = function() {
		view._invalidatedData = true;
		view._invalidatedDefs = true;
	};

	view.setViewMode = function(mode) {
		view.params.mode = mode;
		view.invalidateDefs();
	};

	return view;

};


/**
 * CubesViewer view module.
 *
 * @namespace cv.views.cube
 */
angular.module('cv.views.cube', []);


/**
 * cvViewCube directive and controller.
 *
 * FIXME: Some of this code shall be on a parent generic "view" directive.
 */
angular.module('cv.views.cube').controller("CubesViewerViewsCubeController", ['$rootScope', '$log', '$window','$injector', '$scope', '$timeout', 'cvOptions', 'cubesService', 'viewsService', 'exportService', 'rowSorter', 'dialogService',
                                                                               function ($rootScope, $log, $window, $injector, $scope, $timeout, cvOptions, cubesService, viewsService, exportService, rowSorter, dialogService) {

	// TODO: Functions shall be here?
	$scope.viewController = {};

	$scope.$rootScope = $rootScope;
	$scope.viewsService = viewsService;
	$scope.cvOptions = cvOptions;
	$scope.cubesService = cubesService;
	$scope.exportService = exportService;

	$scope.reststoreService = null;

    if ($injector.has('reststoreService')) {
        $scope.reststoreService = $injector.get('reststoreService');
    }


    $scope.refreshView = function() {
    	if ($scope.view && $scope.view.cube) {
			//$scope.view.grid.data = [];
			//$scope.view.grid.columnDefs = [];
			$scope.$broadcast("ViewRefresh", $scope.view);
		}
	};

	$scope.setViewMode = function(mode) {
		console.debug("Remove setViewMode call on the controller?")
		$scope.view.setViewMode(mode);
	};


	$scope.initCube = function() {

		$scope.view.cube = null;

		// Apply default cube view parameters
		var cubeViewDefaultParams = {
			"mode" : "explore",
			"drilldown" : [],
			"cuts" : [],

			"datefilters": [],

			"columnHide": {},
			"columnWidths": {},
			"columnSort": {},
		};

		var jqxhr = cubesService.cubesserver.get_cube($scope.view.params.cubename, function(cube) {

			$scope.view.cube = cube;

			$log.debug($scope.view.cube);

			// Apply parameters if cube metadata contains specific cv-view-params
			// TODO: Don't do this if this was a saved or pre-initialized view, only for new views
			if ('cv-view-params' in $scope.view.cube.info) {
				$scope.view.params = $.extend({}, cubeViewDefaultParams, $scope.view.cube.info['cv-view-params'], $scope.view.params);
			} else {
				$scope.view.params = $.extend({}, cubeViewDefaultParams, $scope.view.params);
			}

			$scope.view.state = cubesviewer.VIEW_STATE_INITIALIZED;
			$scope.view.error = "";

			$rootScope.$apply();

		});
		jqxhr.fail(function(req) {
			var data = req.responseJSON;
			$scope.view.state = cubesviewer.VIEW_STATE_ERROR;
			$scope.view.error = "Error loading model: " + data.message + " (" + data.error + ")";
			console.debug(data);
			$rootScope.$apply();
		});
	};

	$scope.requestErrorHandler = function() {
		$scope.view.requestFailed = true;
	};


	$scope.resetGrid = function() {
		rowSorter.colSortFnCache = {};
		//$scope.view.grid.api.core.notifyDataChange(uiGridConstants.dataChange.ALL);
	};


	// TODO: Move to explore view or grid component as cube view shall be split into directives
    $scope.onGridRegisterApi = function(gridApi) {
    	//console.debug("Grid Register Api: Explore");
        $scope.view.grid.api = gridApi;
        gridApi.selection.on.rowSelectionChanged($scope, function(row){
          //console.debug(row.entity);
        });
        gridApi.selection.on.rowSelectionChangedBatch($scope, function(rows){
          //console.debug(rows);
        });
        gridApi.core.on.columnVisibilityChanged($scope, function (column) {
        	if (column.visible) {
        		delete ($scope.view.params.columnHide[column.field]);
        	} else {
        		$scope.view.params.columnHide[column.field] = true;
        		delete ($scope.view.params.columnWidths[column.field]);
        	}
        	$scope.view.updateUndo();
        });
        gridApi.core.on.sortChanged($scope, function(grid, sortColumns){
            // do something
        	$scope.view.params.columnSort[$scope.view.params.mode] = {};
        	$(sortColumns).each(function (idx, col) {
        		$scope.view.params.columnSort[$scope.view.params.mode][col.field] = { direction: col.sort.direction, priority: col.sort.priority };
        	});
        	$scope.view.updateUndo();
        });
        gridApi.colResizable.on.columnSizeChanged($scope, function(colDef, deltaChange) {
        	var colIndex = -1;
        	$(gridApi.grid.columns).each(function(idx, e) {
        		if (e.field == colDef.field) colIndex = idx;
        	});
        	if (colIndex >= 0) {
        		$scope.view.params.columnWidths[colDef.field] = gridApi.grid.columns[colIndex].width;
        	}
        	$scope.view.updateUndo();
        });
    };

	$scope.view.grid.onRegisterApi = $scope.onGridRegisterApi;

	$scope.validateData = function(data, status) {
		//console.debug(data);
		$scope.view.requestFailed = false;
		$scope.view.resultLimitHit = false;
		if ( ("cells" in data && data.cells.length >= cubesService.cubesserver.info.json_record_limit) ||
		     (data.length && data.length >= cubesService.cubesserver.info.json_record_limit) ) {
			$scope.view.resultLimitHit = true;
		}
	};

	$scope.newViewStateKey = function() {
		$scope._viewStateKey = Math.floor(Math.random() * 999999999999);
		return $scope._viewStateKey;
	};

	/**
	 * Adds a drilldown level.
	 * Dimension is encoded using Cubes notation: dimension[@hierarchy][:level]
	 */
	$scope.selectDrill = function(dimension, value) {

		var cube = $scope.view.cube;

		// view.params.drilldown = (drilldown == "" ? null : drilldown);
		if (! dimension) {
			$scope.view.params.drilldown = [];
		} else {
			$scope.removeDrill(dimension);
			if (value == true) {
				$scope.view.params.drilldown.push(dimension);
			}
		}

		$scope.refreshView();
	};

	/**
	 * Removes a level from the view.
	 */
	$scope.removeDrill = function(drilldown) {

		$scope.view.params.drilldown = $.grep($scope.view.params.drilldown, function(e) {
			return $scope.view.cube.dimensionParts(e).dimension.name == $scope.view.cube.dimensionParts(drilldown).dimension.name;
		}, true);

		$scope.refreshView();
	};


	/**
	 * Accepts an aggregation or a measure and returns the formatter function.
	 *
	 * @param agmes Aggregation or measure object.
	 * @returns A formatter function that takes an argument with the metric value to be formatted.
	 */
	$scope.columnFormatFunction = function(agmes) {

		var view = $scope.view;

		var measure = agmes;

		if (!measure) {
			return function(value) {
				return value;
			};
		}

		if ('measure' in agmes) {
			measure = $.grep(view.cube.measures, function(item, idx) { return item.ref == agmes.measure; })[0];
		}

		var formatterFunction = null;
		if (measure && ('cv-formatter' in measure.info)) {
			formatterFunction = function(value, row) {
				return eval(measure.info['cv-formatter']);
			};
		} else {
			formatterFunction = function(value) {
				return Math.formatnumber(value, (agmes.ref=="record_count" ? 0 : 2));
			};
		}

		return formatterFunction;
	};

	// Select a cut
	$scope.selectCut = function(dimension, value, invert) {

		var view = $scope.view;

		if (dimension) {
			if (value) {
				/*
				var existing_cut = $.grep(view.params.cuts, function(e) {
					return e.dimension == dimension;
				});
				if (existing_cut.length > 0) {
					//dialogService.show("Cannot cut dataset. Dimension '" + dimension + "' is already filtered.");
					//return;
				} else {*/
					view.params.cuts = $.grep(view.params.cuts, function(e) {
						return view.cube.dimensionParts(e.dimension).cutDimension == view.cube.dimensionParts(dimension).cutDimension;
					}, true);
					view.params.cuts.push({
						"dimension" : view.cube.dimensionParts(dimension).cutDimension,
						"value" : value,
						"invert" : invert
					});
				/*}*/
			} else {
				view.params.cuts = $.grep(view.params.cuts, function(e) {
					return view.cube.dimensionParts(e.dimension).cutDimension == view.cube.dimensionParts(dimension).cutDimension;
				}, true);
			}
		} else {
			view.params.cuts = [];
		}

		$scope.refreshView();

	};


	/*
	 * Filters current selection
	 */
	$scope.filterSelected = function() {

		var view = $scope.view;

		if (view.params.drilldown.length != 1) {
			dialogService.show('Can only filter multiple values in a view with one level of drilldown.');
			return;
		}

		if (view.grid.api.selection.getSelectedCount() <= 0) {
			dialogService.show('Cannot filter. No rows are selected.');
			return;
		}

		var filterValues = [];
		var selectedRows = view.grid.api.selection.getSelectedRows();
		$(selectedRows).each( function(idx, gd) {
			filterValues.push(gd["key0"].cutValue);
		});

		var invert = false;
		$scope.selectCut(view.grid.columnDefs[0].cutDimension, filterValues.join(";"), invert);

	};


	$scope.showDimensionFilter = function(dimension) {
		var parts = $scope.view.cube.dimensionParts(dimension);
		if ($scope.view.dimensionFilter && $scope.view.dimensionFilter == parts.drilldownDimension) {
			$scope.view.dimensionFilter = null;
		} else {
			$scope.view.dimensionFilter = parts.drilldownDimension;
		}
	};

	/*
	 * Selects measure axis
	 */
	$scope.selectMeasure = function(measure) {
		$scope.view.params.yaxis = measure;
		$scope.refreshView();
	};

	/*
	 * Selects horizontal axis
	 */
	$scope.selectXAxis = function(dimension) {
		$scope.view.params.xaxis = (dimension == "" ? null : dimension);
		$scope.refreshView();
	};

	/*
	 * Selects chart type
	 */
	$scope.selectChartType = function(charttype) {
		$scope.view.params.charttype = charttype;
		$scope.refreshView();
	};

	/*
	 * Selects chart type
	 */
	$scope.selectCalculation = function(calculation) {
		$scope.view.params.calculation = calculation;
		$scope.refreshView();  // TODO: This depends on the calculation
	};


	/*
	 * Serialize view dialog
	 */
	$scope.showSerializeView = function(view) {
		studioViewsService.studioScope.showSerializeView(view);
	};

	/**
	 * Adds a date filter.
	 */
	$scope.selectDateFilter = function(dimension, enabled) {

		var view = $scope.view;
		var cube = view.cube;

		// TODO: Show a notice if the dimension already has a date filter (? and cut filter)

		if (dimension != "") {
			if (enabled == "1") {
				view.params.datefilters.push({
					"dimension" : dimension,
					"mode" : "auto-last3m",
					"date_from" : null,
					"date_to" : null
				});
			} else {
				for ( var i = 0; i < view.params.datefilters.length; i++) {
					if (view.params.datefilters[i].dimension.split(':')[0] == dimension) {
						view.params.datefilters.splice(i, 1);
						break;
					}
				}
			}
		} else {
			view.params.datefilters = [];
		}

		$scope.refreshView();

	};

	$scope.clearFilters = function() {
		$scope.view.params.cuts = [];
		$scope.view.params.datefilters = [];
		$scope.refreshView();
	};

	$scope.defineColumnWidth = function(column, vdefault) {
		if (column in $scope.view.params.columnWidths) {
			return $scope.view.params.columnWidths[column];
		} else {
			return vdefault;
		}
	};

	$scope.defineColumnSort = function(column) {
		var columnSort = null;
		if ($scope.view.params.columnSort[$scope.view.params.mode] && $scope.view.params.columnSort[$scope.view.params.mode][column]) {
			columnSort = {
				"direction": $scope.view.params.columnSort[$scope.view.params.mode][column].direction,
				"priority": $scope.view.params.columnSort[$scope.view.params.mode][column].priority
			};
		}
		return columnSort;
	};

	/**
	 * Function to compare two values by guessing the
	 * data type.
	 *
	 * @return An integer, negative or positive depending on relative inputs ordering.
	 */
	$scope.sortValues = function(a, b) {
		if (typeof a == "number" && typeof b == "number") {
			return a - b;
		} else if (typeof a == "string" && typeof b == "string") {
			if ($.isNumeric(a) && $.isNumeric(b)) {
				return parseFloat(a) - parseFloat(b);
			} else {
				return a.localeCompare(b);
			}
		} else if (a == null && b == null) {
			return 0;
		} else if (a == null) {
			return 1;
		} else if (b == null) {
			return -1;
		} else {
			return a - b;
		}
	};

	/**
	 * Called to sort a column which is a dimension drilled down to a particular level.
	 * This is called by UIGrid, since this method is used as `compareAlgorithm` for it.
	 *
	 * @returns A compare function.
	 */
	$scope.sortDimensionParts = function(tdimparts) {

		var dimparts = tdimparts;

		var cmpFunction = function(a, b, rowA, rowB, direction) {
			var result = 0;

			for (var j = 0; result == 0 && j < dimparts.hierarchy.levels.length; j++) {
				var level = dimparts.hierarchy.levels[j];
				var order_attribute = level.order_attribute();
				var fieldname = order_attribute.ref;
				if ((fieldname in rowA.entity._cell) && (fieldname in rowB.entity._cell)) {
					result = $scope.sortValues(rowA.entity._cell[fieldname], rowB.entity._cell[fieldname]);
				} else {
					break;
				}
			}

			return result;
		};

		return cmpFunction;
	};

	/**
	 * Called to sort a column which is a level of a dimension, without a hierarchy
	 * context. This is ie. used from the Facts view (where levels are sorted independently).
	 *
	 * This is called by UIGrid, since this method is used as `compareAlgorithm` for it.
	 *
	 * @returns A compare function.
	 */
	$scope.sortDimensionLevel = function(level) {
		var cmpFunction = function(a, b, rowA, rowB, direction) {
			var result = 0;
			var order_attribute = level.order_attribute();
			var fieldname = order_attribute.ref;
			if ((fieldname in rowA.entity._cell) && (fieldname in rowB.entity._cell)) {
				result = $scope.sortValues(rowA.entity._cell[fieldname], rowB.entity._cell[fieldname]);
			}
			return result;
		};
		return cmpFunction;
	};

	$scope.onResize = function() {
		$rootScope.$broadcast('ViewResize');
	};

	angular.element($window).on('resize', $scope.onResize);

	$scope.$on("$destroy", function() {
		angular.element($window).off('resize', $scope.onResize);
	});


}]).directive("cvViewCube", function() {
	return {
		restrict: 'A',
		templateUrl: 'views/cube/cube.html',
		scope: {
			view: "="
		},
		controller: "CubesViewerViewsCubeController",
		link: function(scope, iElement, iAttrs) {
			//console.debug(scope);
			scope.initCube();
		}
	};
});


Math.formatnumber = function(value, decimalPlaces, decimalSeparator, thousandsSeparator) {

	if (value === undefined) return "";

	if (decimalPlaces === undefined) decimalPlaces = 2;
	if (decimalSeparator === undefined) decimalSeparator = ".";
	if (thousandsSeparator === undefined) thousandsSeparator = " ";

	var result = "";


	var avalue = Math.abs(value);

	var intString = Math.floor(avalue).toString();
	for (var i = 0; i < intString.length; i++) {
		result = result + intString[i];
		var invPos = (intString.length - i - 1);
		if (invPos > 0 && invPos % 3 == 0) result = result + thousandsSeparator;
	}
	if (decimalPlaces > 0) {
		result = result + parseFloat(avalue - Math.floor(avalue)).toFixed(decimalPlaces).toString().replace(".", decimalSeparator).substring(1);
	}

	if (value < 0) result = "-" + result;

	return result;
};

;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


/**
 */

"use strict";

angular.module('cv.views.cube').controller("CubesViewerViewsCubeExploreController", ['$rootScope', '$scope', '$timeout', 'cvOptions', 'cubesService', 'viewsService', 'dialogService', 'uiGridConstants',
                                                     function ($rootScope, $scope, $timeout, cvOptions, cubesService, viewsService, dialogService, uiGridConstants) {

	$scope.view.grid.enableRowSelection = true;
	$scope.view.grid.enableRowHeaderSelection = true;

	$scope.initialize = function() {
		$scope.refreshView();
	};

	$scope.$on("ViewRefresh", function(view) {
		$scope.loadData();
	});

	$scope.loadData = function() {

		//$scope.view.cubesviewer.views.blockViewLoading(view);
		var browser_args = cubesService.buildBrowserArgs($scope.view, false, false);
		var browser = new cubes.Browser(cubesService.cubesserver, $scope.view.cube);
		var viewStateKey = $scope.newViewStateKey();
		var jqxhr = browser.aggregate(browser_args, $scope._loadDataCallback(viewStateKey));

		$scope.view.pendingRequests++;
		jqxhr.always(function() {
			$scope.view.pendingRequests--;
			$rootScope.$apply();
		});
		jqxhr.error($scope.requestErrorHandler);

	};

	$scope._loadDataCallback = function(viewStateKey) {
		return function(data, status) {
			// Only update if view hasn't changed since data was requested.
			if (viewStateKey == $scope._viewStateKey) {
				$scope.validateData(data, status);
				$scope.processData(data);
				//$scope.view.grid.api.core.notifyDataChange(uiGridConstants.dataChange.ALL);
				$rootScope.$apply();
			}
		};
	};

	$scope.exploreCut = function(dimension, value, invert) {
		$scope.selectCut(dimension, value, invert);
		if ($scope.view.params.drilldown.length == 1) {
			// A single item has been selected, so automatically drill one more level
			var dimparts = $scope.view.cube.dimensionParts($scope.view.params.drilldown[0]);
			if (dimparts.levelIndex < dimparts.hierarchy.levels.length - 1) {
				var drilldown = dimparts.dimension.name + ( dimparts.hierarchy.name != "default" ? ("@" + dimparts.hierarchy.name) : "" ) + ":" + dimparts.hierarchy.levels[dimparts.levelIndex + 1].name;
				$scope.selectDrill(drilldown, true);
			}
		}
	};

	$scope.processData = function(data) {

		var view = $scope.view;

		$scope.resetGrid();
		$scope.view.grid.data = [];
		$scope.view.grid.columnDefs = [];
		$rootScope.$apply();

	    // Configure grid
	    angular.extend(view.grid, {
	    	data: [],
    		//minRowsToShow: 3,
    		rowHeight: 24,
    		onRegisterApi: $scope.onGridRegisterApi,
    		enableColumnResizing: true,
    		showColumnFooter: true,
    		enableGridMenu: true,
    		//showGridFooter: true,
    	    paginationPageSizes: cvOptions.pagingOptions,
    	    paginationPageSize: cvOptions.pagingOptions[0],
    		//enableHorizontalScrollbar: 0,
    		//enableVerticalScrollbar: 0,
    		enableRowSelection: view.params.drilldown.length > 0,
    		//enableRowHeaderSelection: false,
    		//enableSelectAll: false,
    		enablePinning: false,
    		multiSelect: true,
    		selectionRowHeaderWidth: 20,
    		//rowHeight: 50,
    		columnDefs: []
	    });

		$(view.cube.aggregates).each(function(idx, ag) {
			var col = {
				name: ag.label,
				field: ag.ref,
				index : ag.ref,
				cellClass : "text-right",
				type : "number",
				headerCellClass: "cv-grid-header-measure",
				width : $scope.defineColumnWidth(ag.ref, 115),
				visible: ! view.params.columnHide[ag.ref],
				cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ col.colDef.formatter(COL_FIELD, row, col) }}</div>',
				formatter: $scope.columnFormatFunction(ag),
				sort: $scope.defineColumnSort(ag.ref)
				//formatoptions: {},
				//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
			};
			col.footerValue = $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col);
			col.footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>';
			view.grid.columnDefs.push(col);

			//if (data.summary) dataTotals[ag.ref] = data.summary[ag.ref];
		});

		// If there are cells, show them
		//$scope._sortData(data.cells, false);
		$scope._addRows(data);

		/*
		colNames.sort();
		colModel.sort(function(a, b) {
			return (a.name < b.name ? -1 : (a.name == b.name ? 0 : 1));
		});
		*/

		var label = [];
		$(view.params.drilldown).each(function(idx, e) {
			label.push(view.cube.cvdim_dim(e).label);
		});
		for (var i = 0; i < view.params.drilldown.length; i++) {

			// Get dimension
			var dim = view.cube.cvdim_dim(view.params.drilldown[i]);
			var parts = view.cube.dimensionParts(view.params.drilldown[i]);
			//var cutDimension = parts.dimension.name + ( parts.hierarchy.name != "default" ? "@" + parts.hierarchy.name : "" );
			var cutDimension = view.params.drilldown[i];

			//nid.push(drilldownLevelValues.join("-"));

			var footer = "";
			if (i == 0) footer = (cubesService.buildQueryCuts(view).length == 0) ? "<b>Summary</b>" : '<b>Summary <i style="color: #ddaaaa;">(Filtered)</i></b>';

			view.grid.columnDefs.splice(i, 0, {
				name: label[i],
				field: "key" + i,
				index: "key" + i,
				headerCellClass: "cv-grid-header-dimension",
				enableHiding: false,
				cutDimension: cutDimension,
				width : $scope.defineColumnWidth("key" + i, 190),
				cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP"><a href="" ng-click="grid.appScope.exploreCut(col.colDef.cutDimension, COL_FIELD.cutValue, false)">{{ COL_FIELD.title }}</a></div>',
				footerCellTemplate: '<div class="ui-grid-cell-contents">' + footer + '</div>',
				sort: $scope.defineColumnSort("key" + i),
				sortingAlgorithm: $scope.sortDimensionParts(parts)
			});
		}

		if (view.params.drilldown.length == 0) {
			view.grid.columnDefs.splice(0, 0, {
				name: view.cube.label,
				field: "key" + 0,
				index: "key" + 0,
				enableHiding: false,
				align: "left",
				width : $scope.defineColumnWidth("key" + 0, 190),
				sort: $scope.defineColumnSort("key" + 0),
				//type: "string"
			});
		}


	};


	$scope._addRows = function(data) {

		var view = $scope.view;
		var rows = view.grid.data;

		$(data.cells).each( function(idx, e) {

			var nid = [];
			var row = {};
			var key = [];

			// For each drilldown level
			for ( var i = 0; i < view.params.drilldown.length; i++) {

				// Get dimension
				var dim = view.cube.cvdim_dim(view.params.drilldown[i]);

				var parts = view.cube.dimensionParts(view.params.drilldown[i]);
				var infos = parts.hierarchy.readCell(e, parts.level);

				// Values and Labels
				var drilldownLevelValues = [];
				var drilldownLevelLabels = [];

				$(infos).each(function(idx, info) {
					drilldownLevelValues.push (info.key);
					drilldownLevelLabels.push (info.label);
				});

				nid.push(drilldownLevelValues.join("-"));

				var cutDimension = parts.dimension.name + ( parts.hierarchy.name != "default" ? "@" + parts.hierarchy.name : "" );
				key.push({ cutValue: drilldownLevelValues.join(","), title: drilldownLevelLabels.join(" / ") });
			}

			// Set key
			row["key"] = key.join (" / ");
			for (var i = 0; i < key.length; i++) {
				row["key" + i] = key[i];
			}
			//row["key"] = key.join(' / ');

			// Add columns
			$(view.cube.aggregates).each(function(idx, ag) {
				row[ag.ref] = e[ag.ref];
			});

			row["id"] = nid.join('-');
			row["_cell"] = e;
			rows.push(row);
		});

		// Copy summary if there's no data
		// This allows a scrollbar to appear in jqGrid when only the summary row is shown.
		if ((rows.length == 0) && (data.summary)) {
			var row = {};
			var summary = (cubesService.buildQueryCuts(view).length == 0) ? "Summary" : "Summary (Filtered)";
			row["key0"] = summary;

			$(view.cube.aggregates).each(function(idx, ag) {
				row[ag.ref] = data.summary[ag.ref];
			});

			rows.push(row);
		}

	};

	// Sort data according to current view
	$scope._sortData = function(data, includeXAxis) {
		//data.sort(cubesviewer._drilldownSortFunction(view.id, includeXAxis));
	};


	$scope.$on("$destroy", function() {
		$scope.view.grid.data = [];
		$scope.view.grid.columnDefs = [];
	});

	$scope.initialize();

}]);




function cubesviewerViewCubeExplore() {


	/*
	 *
	 */
	this._drilldownSortFunction = function(view, includeXAxis) {

		var drilldown = view.params.drilldown.slice(0);

		// Include X Axis if necessary
		if (includeXAxis) {
			drilldown.splice(0, 0, view.params.xaxis);
		}

		return function(a, b) {

			// For the horizontal axis drilldown level, if present
			for ( var i = 0; i < drilldown.length; i++) {

				// Get dimension
				var dimension = view.cube.cvdim_dim(drilldown[i]);

				// row["key"] = ((e[view.params.drilldown_field] != null) &&
				// (e[view.params.drilldown] != "")) ? e[view.params.drilldown] : "Undefined";
				if (dimension.is_flat == true) {
					if (a[dimension.name] < b[dimension.name])
						return -1;
					if (a[dimension.name] > b[dimension.name])
						return 1;
				} else {
					var drilldown_level_value = [];
					for ( var j = 0; j < dimension.levels.length; j++) {
						var fieldname = dimension.name + "."
								+ dimension.levels[j].name;
						if ((fieldname in a) && (fieldname in b)) {
							if (a[fieldname] < b[fieldname])
								return -1;
							if (a[fieldname] > b[fieldname])
								return 1;
						} else {
							break;
						}
					}
				}
			}

			return 0;
		};
	},

	this.columnTooltipAttr = function(column) {
		return function (rowId, val, rawObject) {
			return 'title="' + column + ' = ' + val + '"';
		};
	};


};


;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */



/**
 */

"use strict";

angular.module('cv.views.cube').controller("CubesViewerViewsCubeFilterDimensionController", ['$rootScope', '$scope', '$filter', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, $filter, cvOptions, cubesService, viewsService) {

	$scope.parts = null;
	$scope.dimensionValues = null;
	$scope.loadingDimensionValues = false;

	$scope.searchString = "";
	$scope.selectedValues = null;
	$scope.filterInverted = null;
	$scope.filterShowAll = false;

	$scope.currentDataId = null;

	$scope.initialize = function() {

		// Check if current filter is inverted
		var view = $scope.view;
		var parts = view.cube.dimensionParts($scope.view.dimensionFilter);
		for (var i = 0; i < view.params.cuts.length ; i++) {
			if (view.params.cuts[i].dimension == parts.cutDimension) {
				$scope.filterInverted = view.params.cuts[i].invert;
				break;
			}
		}
	};

	$scope.$watch("view.dimensionFilter", function() {
		$scope.parts = $scope.view.cube.dimensionParts($scope.view.dimensionFilter);
		$scope.loadDimensionValues();
	});

	$scope.$on("ViewRefresh", function(view) {
		// FIXME: Update checkboxes, but do not reload.
		$scope.loadDimensionValues();
	});
	$scope.$watch("filterShowAll", function(view) {
		$scope.loadDimensionValues();
	});


	$scope.closeDimensionFilter = function() {
		$scope.view.dimensionFilter = null;
	};

	/*
	 * Load dimension values.
	 */
	$scope.loadDimensionValues = function() {

		var params = {
			"hierarchy": $scope.parts.hierarchy.name,
			"depth": $scope.parts.depth
		};

		//view.cubesviewer.views.blockViewLoading(view);

		if (! $scope.filterShowAll) {

			var parts = $scope.view.cube.dimensionParts($scope.view.dimensionFilter);
			var buildQueryCutsStrings = cubesService.buildQueryCutsStrings($scope.view);

			if (buildQueryCutsStrings.length > 0) {
				// Remove current dimension
				buildQueryCutsStrings = $.grep(buildQueryCutsStrings, function(cs) {
					return ((cs.indexOf(parts.dimension.name) != 0) && (cs.indexOf("!" + parts.dimension.name) != 0));
				});

				params["cut"] = buildQueryCutsStrings.join(cubes.CUT_STRING_SEPARATOR_CHAR);
			}

		};

		var path = "/cube/" + $scope.view.cube.name + "/members/" + $scope.parts.dimension.name;
		var dataId = path + "?" + $.param(params);
		if ($scope.currentDataId == dataId) { return; }
		$scope.currentDataId = dataId;

		var tdimension = $scope.view.dimensionFilter;
		$scope.loadingDimensionValues = true;
		var jqxhr = cubesService.cubesRequest(
                // Doc says it's dimension, not members
				path,
				params,
				$scope._loadDimensionValuesCallback(tdimension));
		jqxhr.always(function() {
			//unblockView
			$scope.loadingDimensionValues = false;
			$scope.$apply();
		});

	};

	/*
	 * Updates info after loading data.
	 */
	$scope._loadDimensionValuesCallback = function(dimension) {
		var dimension = dimension;
		return function(data, status) {
			if ($scope.view.dimensionFilter == dimension) $scope._processDimensionValuesData(data);
		};
	};

	$scope.filterDimensionValue = function(searchString) {
		return function(item) {
			var lowerCaseSearch = searchString.toLowerCase();
			return ((searchString == "") || (item.label.toLowerCase().indexOf(lowerCaseSearch) >= 0));
		};
	};

	$scope.selectAll = function() {
		var filter = $scope.filterDimensionValue($scope.searchString);
		$($scope.dimensionValues).each(function(idx, val) {
			if (filter(val)) val.selected = true;
		});
	};

	$scope.selectNone = function() {
		var filter = $scope.filterDimensionValue($scope.searchString);
		$($scope.dimensionValues).each(function(idx, val) {
			if (filter(val)) val.selected = false;
		});
	};

	$scope._processDimensionValuesData = function(data) {

		// Get dimension
		var view = $scope.view;
		var dimension = $scope.view.cube.cvdim_dim($scope.view.dimensionFilter);
		var dimensionValues = [];

		var parts = view.cube.dimensionParts($scope.view.dimensionFilter);
		//var cutDimension = parts.dimension.name + ( parts.hierarchy.name != "default" ? "@" + parts.hierarchy.name : "" );

		var filterValues = [];
		for (var i = 0; i < view.params.cuts.length ; i++) {
			if (view.params.cuts[i].dimension == view.cube.dimensionParts($scope.view.dimensionFilter).cutDimension) {
				$scope.filterInverted = view.params.cuts[i].invert;
				filterValues = view.params.cuts[i].value.split(";");
				break;
			}
		}

		$(data.data).each( function(idx, e) {

			// Get dimension
			var parts = $scope.view.cube.dimensionParts($scope.view.dimensionFilter);
			var infos = parts.hierarchy.readCell(e, parts.level);

			// Values and Labels
			var drilldownLevelValues = [];
			var drilldownLevelLabels = [];

			$(infos).each(function(idx, info) {
				drilldownLevelValues.push(info.key);
				drilldownLevelLabels.push(info.label);
			});

			dimensionValues.push({
				'label': drilldownLevelLabels.join(' / '),
				'value': drilldownLevelValues.join (','),
				'selected': filterValues.indexOf(drilldownLevelValues.join (',')) >= 0
			});

		});

		$scope.dimensionValues = dimensionValues;
		$scope.$apply();
	};

	/*
	 * Updates info after loading data.
	 */
	$scope.applyFilter = function() {

		var view = $scope.view;

		var filterValues = [];
		$($scope.dimensionValues).each(function(idx, val) {
			if (val.selected) filterValues.push(val.value);
		});

		// If all values are selected, the filter is empty and therefore removed by selectCut
		if (filterValues.length >= $scope.dimensionValues.length) filterValues = [];

		// Cut dimension
		var cutDimension = $scope.parts.dimension.name + ( $scope.parts.hierarchy.name != "default" ? "@" + $scope.parts.hierarchy.name : "" ) + ':' + $scope.parts.level.name;
		$scope.selectCut(cutDimension, filterValues.join(";"), $scope.filterInverted);

	};


	$scope.initialize();

}]);

;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Adds support for datefilters.
 *
 * This module requires that the model is configured
 * to declare which dimensions may use a datefilter,
 * and which fields of the dimension correspond to
 * calendar fields (year, quarter, month, day, week...).
 * (see integrator documentation for more information).
 *
 */

"use strict";

angular.module('cv.views.cube').filter("datefilterMode", ['$rootScope', 'cvOptions',
                                                          function ($rootScope, cvOptions) {
	return function(val) {
		var text = "None";
		switch (val) {
			case "custom": text = "Custom"; break;
			case "auto-last1m": text = "Last month"; break;
			case "auto-last3m": text = "Last 3 months"; break;
			case "auto-last6m": text = "Last 6 months"; break;
			case "auto-last12m": text = "Last year"; break;
			case "auto-last24m": text = "Last 2 years"; break;
			case "auto-january1st": text = "From January 1st"; break;
			case "auto-yesterday": text = "Yesterday"; break;
		}
		return text;
	};
}]);

angular.module('cv.views.cube').controller("CubesViewerViewsCubeFilterDateController", ['$rootScope', '$scope', '$filter', 'cvOptions', 'cubesService', 'viewsService',
                                                                                        function ($rootScope, $scope, $filter, cvOptions, cubesService, viewsService) {
	$scope.initialize = function() {
		$scope.dateStart.value = $scope.datefilter.date_from ? new Date($scope.datefilter.date_from) : null;
		$scope.dateEnd.value = $scope.datefilter.date_to ? new Date($scope.datefilter.date_to) : null;
	};

	$scope.dateStart = {
		opened: false,
		value: null,
		options: {
			//dateDisabled: disabled,
	    	formatYear: 'yyyy',
	    	//maxDate: new Date(2020, 12, 31),
	    	//minDate: new Date(1970, 1, 1),
	    	startingDay: cvOptions.datepickerFirstDay,
	    	showWeeks: cvOptions.datepickerShowWeeks
	    }
	};
	$scope.dateEnd = {
		opened: false,
		value: null,
		options: {
			//dateDisabled: disabled,
	    	formatYear: 'yyyy',
	    	//maxDate: new Date(2020, 12, 31),
	    	//minDate: new Date(1970, 1, 1),
	    	startingDay: cvOptions.datepickerFirstDay,
	    	showWeeks: cvOptions.datepickerShowWeeks
	    }
	};

	$scope.dateStartOpen = function() {
		$scope.dateStart.opened = true;
	}
	$scope.dateEndOpen = function() {
		$scope.dateEnd.opened = true;
	}

	$scope.setMode = function(mode) {
		$scope.datefilter.mode = mode;
	};

	$scope.updateDateFilter = function() {
		$scope.datefilter.date_from = $scope.dateStart.value ? $filter('date')($scope.dateStart.value, "yyyy-MM-dd") : null;
		$scope.datefilter.date_to = $scope.dateEnd.value? $filter('date')($scope.dateEnd.value, "yyyy-MM-dd") : null;
		$scope.refreshView();
	}

	$scope.$watch("dateStart.value", $scope.updateDateFilter);
	$scope.$watch("dateEnd.value", $scope.updateDateFilter);
	$scope.$watch("datefilter.mode", $scope.updateDateFilter);

	$scope.initialize();

}]);


;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Sof	tware, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


/**
 * Facts table. Allows users to see the facts associated to current cut.
 */

"use strict";

angular.module('cv.views.cube').controller("CubesViewerViewsCubeFactsController", ['$rootScope', '$scope', '$timeout', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, $timeout, cvOptions, cubesService, viewsService) {

	$scope.view.grid.enableRowSelection = false;
	$scope.view.grid.enableRowHeaderSelection = false;

	$scope.initialize = function() {
		$scope.refreshView();
	};

	$scope.$on("ViewRefresh", function(view) {
		$scope.loadData();
	});

	$scope.loadData = function() {

		var browser_args = cubesService.buildBrowserArgs($scope.view, false, false);
		var browser = new cubes.Browser(cubesService.cubesserver, $scope.view.cube);
		var viewStateKey = $scope.newViewStateKey();
		var jqxhr = browser.facts(browser_args, $scope._loadDataCallback(viewStateKey));

		$scope.view.pendingRequests++;
		jqxhr.always(function() {
			$scope.view.pendingRequests--;
			$rootScope.$apply();
		});
		jqxhr.error($scope.requestErrorHandler);

	};

	$scope._loadDataCallback = function(viewStateKey) {
		return function(data, status) {
			// Only update if view hasn't changed since data was requested.
			if (viewStateKey == $scope._viewStateKey) {
				$scope.validateData(data, status);
				$scope.processData(data);
				$rootScope.$apply();
			}
		};
	};

	$scope.processData = function(data) {

		var view = $scope.view;

		$scope.resetGrid();
		$scope.view.grid.data = [];
		$scope.view.grid.columnDefs = [];
		$rootScope.$apply();

		var dimensions = view.cube.dimensions;
		var measures = view.cube.measures;
        var details = view.cube.details;

	    // Configure grid
	    angular.extend($scope.view.grid, {
    		data: [],
    		//minRowsToShow: 3,
    		rowHeight: 24,
    		onRegisterApi: $scope.onGridRegisterApi,
    		enableColumnResizing: true,
    		showColumnFooter: false,
    		enableGridMenu: true,
    		//showGridFooter: false,
    	    paginationPageSizes: cvOptions.pagingOptions,
    	    paginationPageSize: cvOptions.pagingOptions[0],
    		//enableHorizontalScrollbar: 0,
    		//enableVerticalScrollbar: 0,
    		enableRowSelection: false,
    		enableRowHeaderSelection: false,
    		//enableSelectAll: false,
    		enablePinning: false,
    		multiSelect: false,
    		//selectionRowHeaderWidth: 20,
    		//rowHeight: 50,
    		columnDefs: []
	    });

		view.grid.columnDefs.push({
			name: "id",
			field: "id",
			index: "id",
			enableHiding: false,
			width: 80, //cubesviewer.views.cube.explore.defineColumnWidth(view, "id", 65),
		});

		for (var dimensionIndex in dimensions) {

			var dimension = dimensions[dimensionIndex];

			for (var i = 0; i < dimension.levels.length; i++) {
				var level = dimension.levels[i];
				var col = {
					name: level.label,
					field: level.key().ref,
					index : level.key().ref,
					headerCellClass: "cv-grid-header-dimension",
					//cellClass : "text-right",
					//sorttype : "number",
					cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ row.entity[col.colDef.field] }}</div>',
					//formatter: $scope.columnFormatFunction(ag),
					//footerValue: $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col)
					//formatoptions: {},
					//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
					//footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>'
					visible: ! view.params.columnHide[level.key().ref],
					width : $scope.defineColumnWidth(level.key().ref, 95),
					sort: $scope.defineColumnSort(level.key().ref),
					sortingAlgorithm: $scope.sortDimensionLevel(level)
				};
				view.grid.columnDefs.push(col);

				// Additional dimension attributes
				$(level.attributes).each(function(idx, e) {
					if (e.ref != level.key().ref && e.ref != level.label_attribute().ref) {
						var col = {
							name: e.name,
							field: e.ref,
							index : e.ref,
							headerCellClass: "cv-grid-header-dimensionattribute",
							//cellClass : "text-right",
							//sorttype : "number",
							cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ row.entity[col.colDef.field] }}</div>',
							//formatter: $scope.columnFormatFunction(ag),
							//footerValue: $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col)
							//formatoptions: {},
							//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
							//footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>'
							visible: ! view.params.columnHide[e.ref],
							width : $scope.defineColumnWidth(e.ref, 85),
							sort: $scope.defineColumnSort(e.ref),
							//sortingAlgorithm: $scope.sortDimensionLevel(level)
						};
						view.grid.columnDefs.push(col);
					}
				});

			}
		}

		for (var measureIndex in measures) {
			var measure = measures[measureIndex];

			var col = {
				name: measure.label,
				field: measure.ref,
				index : measure.ref,
				cellClass : "text-right",
				headerCellClass: "cv-grid-header-measure",
				//type : "number",
				cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ col.colDef.formatter(COL_FIELD, row, col) }}</div>',
				formatter: $scope.columnFormatFunction(measure),
				//footerValue: $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col)
				//formatoptions: {},
				//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
				//footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>';
				visible: ! view.params.columnHide[measure.ref],
				width : $scope.defineColumnWidth(measure.ref, 75),
				sort: $scope.defineColumnSort(measure.ref),
			};
			view.grid.columnDefs.push(col);
		}

        for (var detailIndex in details) {
            var detail = details[detailIndex];

            var col = {
				name: detail.name,
				field: detail.ref,
				index : detail.ref,
				//cellClass : "text-right",
				//sorttype : "number",
				//cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ col.colDef.formatter(COL_FIELD, row, col) }}</div>',
				//formatter: $scope.columnFormatFunction(ag),
				//footerValue: $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col)
				//formatoptions: {},
				//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
				//footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>'
				visible: ! view.params.columnHide[detail.ref],
				width: $scope.defineColumnWidth(detail.ref, 95),
				sort: $scope.defineColumnSort(detail.ref),
				sortingAlgorithm: $scope.sortValues
			};
            view.grid.columnDefs.push(col);
        }

		// If there are cells, show them
		$scope._addRows(data);

	};


	/*
	 * Adds rows.
	 */
	$scope._addRows = function(data) {

		var view = $scope.view;
		var rows = view.grid.data;

		var counter = 0;
		var dimensions = view.cube.dimensions;
		var measures = view.cube.measures;
        var details = view.cube.details;

		$(data).each( function(idx, e) {

			var nid = [];
			var row = [];
			var key = [];

			for ( var dimensionIndex in dimensions) {
				// Get dimension
				var dimension = dimensions[dimensionIndex];

				for (var i = 0; i < dimension.levels.length; i++) {

					var level = dimension.levels[i];
					var levelData = level.readCell(e);

					row[level.key().ref] = levelData.label;

					$(level.attributes).each(function(aidx, ae) {
						if (ae.ref != level.key().ref && ae.ref != level.label_attribute().ref) {
							row[ae.ref] = levelData.info[ae.ref];
						}
					});

				}
			}

			for (var measureIndex in measures) {
				var measure = measures[measureIndex];
				row[measure.ref] = e[measure.ref];
			}

            for (var detailIndex in details) {
				var detail = details[detailIndex];
				row[detail.ref] = e[detail.ref];
			}

			// Set key
            row["id"] = counter++;
			if ("id" in e) row["id"] = e["id"];
			row["key"] = row["id"];

			row["_cell"] = e;

			rows.push(row);
		});

	};

	$scope.$on("$destroy", function() {
		$scope.view.grid.data = [];
		$scope.view.grid.columnDefs = [];
	});

	$scope.initialize();

}]);



;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Sof	tware, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */



/**
 * Manipulates series.
 */

"use strict";


/**
 * SeriesTable object. This is part of the "cube" view. Allows the user to select
 * a dimension to use as horizontal axis of a table. This is later used to generate
 * charts.
 */
angular.module('cv.views.cube').controller("CubesViewerViewsCubeSeriesController", ['$rootScope', '$scope', '$timeout', 'cvOptions', 'cubesService', 'viewsService', 'seriesOperationsService',
                                                     function ($rootScope, $scope, $timeout, cvOptions, cubesService, viewsService, seriesOperationsService) {

	$scope.view.grid.enableRowSelection = false;
	$scope.view.grid.enableRowHeaderSelection = false;

	$scope.initialize = function() {
		$scope.view.params = $.extend(
			{},
			{ "xaxis" : null, "yaxis" : null },
			$scope.view.params
		);
		$scope.refreshView();
	};

	$scope.$on("ViewRefresh", function(view) {
		$scope.loadData();
	});

	$scope.loadData = function() {

		var view = $scope.view;

		// Check if we can produce a table
		if (view.params.yaxis == null) return;

		var browser_args = cubesService.buildBrowserArgs($scope.view, $scope.view.params.xaxis != null ? true : false, false);
		var browser = new cubes.Browser(cubesService.cubesserver, $scope.view.cube);
		var viewStateKey = $scope.newViewStateKey();
		var jqxhr = browser.aggregate(browser_args, $scope._loadDataCallback(viewStateKey));

		$scope.view.pendingRequests++;
		jqxhr.always(function() {
			$scope.view.pendingRequests--;
			$rootScope.$apply();
		});
		jqxhr.error($scope.requestErrorHandler);

	};

	$scope._loadDataCallback = function(viewStateKey) {
		return function(data, status) {
			// Only update if view hasn't changed since data was requested.
			if (viewStateKey == $scope._viewStateKey) {
				$scope.validateData(data, status);
				$scope.processData(data);
				$rootScope.$apply();
			}
		};
	};

	$scope.processData = function(data) {

		var view = $scope.view;

		//$scope.rawData = data;

		$scope.resetGrid();
		$scope.view.grid.data = [];
		$scope.view.grid.columnDefs = [];
		$rootScope.$apply();

		// Configure grid
		angular.extend($scope.view.grid, {
			data: [],
    		//minRowsToShow: 3,
    		rowHeight: 24,
    		onRegisterApi: $scope.onGridRegisterApi,
    		enableColumnResizing: true,
    		showColumnFooter: false,
    		enableGridMenu: true,
    		//showGridFooter: false,
    	    paginationPageSizes: cvOptions.pagingOptions,
    	    paginationPageSize: cvOptions.pagingOptions[0],
    		//enableHorizontalScrollbar: 0,
    		//enableVerticalScrollbar: 0,
    		enableRowSelection: false,
    		enableRowHeaderSelection: false,
    		//enableSelectAll: false,
    		enablePinning: false,
    		multiSelect: false,
    		selectionRowHeaderWidth: 20,
    		//rowHeight: 50,
    		columnDefs: []
	    });

		// Process data
		//$scope._sortData (data.cells, view.params.xaxis != null ? true : false);
	    $scope._addRows($scope, data);
	    seriesOperationsService.applyCalculations($scope.view, $scope.view.grid.data, view.grid.columnDefs);

	    /*
	    // TODO: Is this needed?

		colNames.forEach(function (e) {
			var colLabel = null;
			$(view.cube.aggregates).each(function (idx, ag) {
				if (ag.name == e) {
					colLabel = ag.label||ag.name;
					return false;
				}
			});
			if (!colLabel) {
				$(view.cube.measures).each(function (idx, me) {
					if (me.name == e) {
						colLabel = me.label||ag.name;
						return false;
					}
				});
			}
			//colLabel = view.cube.getDimension(e).label
			colLabels.push(colLabel||e);
		});
		*/

	};


	/*
	 * Adds rows.
	 */
	$scope._addRows = cubesviewer._seriesAddRows;

	$scope.$on("$destroy", function() {
		$scope.view.grid.data = [];
		$scope.view.grid.columnDefs = [];
	});

	$scope.initialize();

}]);

cubesviewer._seriesAddRows = function($scope, data) {

	var view = $scope.view;
	var rows = view.grid.data;

	var counter = 0;
	var dimensions = view.cube.dimensions;
	var measures = view.cube.measures;
    var details = view.cube.details;

	// Copy drilldown as we'll modify it
	var drilldown = view.params.drilldown.slice(0);

	// Include X Axis if necessary
	if (view.params.xaxis != null) {
		drilldown.splice(0,0, view.params.xaxis);
	}
	var baseidx = ((view.params.xaxis == null) ? 0 : 1);

	var addedCols = [];
	$(data.cells).each(function (idx, e) {

		var row = [];
		var key = [];

		// For the drilldown level, if present
		for (var i = 0; i < drilldown.length; i++) {

			// Get dimension
			var parts = view.cube.dimensionParts(drilldown[i]);
			var infos = parts.hierarchy.readCell(e, parts.level);

			// Values and Labels
			var drilldownLevelValues = [];
			var drilldownLevelLabels = [];

			$(infos).each(function(idx, info) {
				drilldownLevelValues.push(info.key);
				drilldownLevelLabels.push(info.label);
			});

			key.push (drilldownLevelLabels.join(" / "));

		}

		// Set key
		var colKey = (view.params.xaxis == null) ? view.params.yaxis : key[0];
		var value = (e[view.params.yaxis]);
		var rowKey = (view.params.xaxis == null) ? key.join (' / ') : key.slice(1).join (' / ');

		// Search or introduce
		var row = $.grep(rows, function(ed) { return ed["key"] == rowKey; });
		if (row.length > 0) {
			row[0][colKey] = value;
			row[0]["_cell"] = e;
		} else {
			var newrow = {};
			newrow["key"] = rowKey;
			newrow[colKey] = value;

			for (var i = baseidx ; i < key.length; i++) {
				newrow["key" + (i - baseidx)] = key[i];
			}

			newrow["_cell"] = e;
			rows.push ( newrow );
		}


		// Add column definition if the column hasn't been added yet
		if (addedCols.indexOf(colKey) < 0) {
			addedCols.push(colKey);

			var ag = $.grep(view.cube.aggregates, function(ag) { return ag.ref == view.params.yaxis })[0];

			var col = {
				name: colKey,
				field: colKey,
				index : colKey,
				cellClass : "text-right",
				//sorttype : "number",
				cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ col.colDef.formatter(COL_FIELD, row, col) }}</div>',
				formatter: $scope.columnFormatFunction(ag),
				//footerValue: $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col)
				//formatoptions: {},
				//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
				//footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>';
				enableHiding: false,
				width: $scope.defineColumnWidth(colKey, 90),
				sort: $scope.defineColumnSort(colKey),
			};
			view.grid.columnDefs.push(col);
		}
	});

	//var label = [];
	$(view.params.drilldown).each (function (idx, e) {
		var col = {
			name: view.cube.cvdim_dim(e).label,
			field: "key" + idx,
			index : "key" + idx,
			headerCellClass: "cv-grid-header-dimension",
			enableHiding: false,
			//cellClass : "text-right",
			//sorttype : "number",
			//cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ col.colDef.formatter(COL_FIELD, row, col) }}</div>',
			//formatter: $scope.columnFormatFunction(ag),
			//footerValue: $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col)
			//formatoptions: {},
			//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
			//footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>';
			width : $scope.defineColumnWidth("key" + idx, 190),
			sort: $scope.defineColumnSort("key" + idx),
			sortingAlgorithm: $scope.sortDimensionParts(view.cube.dimensionParts(e))
		};
		view.grid.columnDefs.splice(idx, 0, col);
	});

	if (view.params.drilldown.length == 0 && rows.length > 0) {
		rows[0]["key0"] = view.cube.aggregateFromName(view.params.yaxis).label;

		var col = {
			name: "Measure",
			field: "key0",
			index : "key0",
			headerCellClass: "cv-grid-header-measure",
			enableHiding: false,
			//cellClass : "text-right",
			//sorttype : "number",
			//cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ col.colDef.formatter(COL_FIELD, row, col) }}</div>',
			//formatter: $scope.columnFormatFunction(ag),
			//footerValue: $scope.columnFormatFunction(ag)(data.summary[ag.ref], null, col)
			//formatoptions: {},
			//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
			//footerCellTemplate = '<div class="ui-grid-cell-contents text-right">{{ col.colDef.footerValue }}</div>';
			width : $scope.defineColumnWidth("key0", 190),
			sort: $scope.defineColumnSort("key0")
		};
		view.grid.columnDefs.splice(0, 0, col);
	}

};

;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Sof	tware, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */



/**
 * Manipulates series.
 */

"use strict";

angular.module('cv.views').service("seriesOperationsService", ['$rootScope', 'cvOptions', 'cubesService',
                                                               function ($rootScope, cvOptions, cubesService) {

	this.calculateDifferentials = function(view, rows, columnDefs) {

		console.debug("FIXME: Differentials are ignoring drilldown.length columns, but fails in some cases.");

		$(rows).each(function(idx, e) {
			var lastValue = null;
			for (var i = view.params.drilldown.length; i < columnDefs.length; i++) {
	    		var value = e[columnDefs[i].field];
	    		var diff = null;
	    		if ((lastValue != null) && (value != null)) {
	    			var diff = value - lastValue;
	    			e[columnDefs[i].field] = diff;
	    		} else {
	    			delete e[columnDefs[i].field];
	    			//e[columnDefs[i].field] = null;
	    		}
	    		lastValue = value;
	    	}
		});

	};

	this.calculateDifferentialsPercent = function(view, rows, columnDefs) {

		console.debug("FIXME: Differentials are ignoring drilldown.length columns, but fails in some cases.");

		$(rows).each(function(idx, e) {
			var lastValue = null;
			for (var i = view.params.drilldown.length; i < columnDefs.length; i++) {
	    		var value = e[columnDefs[i].field];
	    		var diff = null;
	    		if ((lastValue != null) && (value != null)) {
	    			var diff = (value - lastValue) / lastValue;
	    			e[columnDefs[i].field] = diff;
	    		} else {
	    			delete e[columnDefs[i].field];
	    			//e[columnDefs[i].field] = null;
	    		}
	    		lastValue = value;
	    	}
		});

	};

	this.calculateAccum = function(view, rows, columnDefs) {

	};

	this.applyCalculations = function(view, rows, columnDefs) {
		if (view.params.calculation == "difference") {
			this.calculateDifferentials(view, rows, columnDefs);
		}
		if (view.params.calculation == "percentage") {
			this.calculateDifferentialsPercent(view, rows, columnDefs);
		}
	};


}]);


;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

/*
 * Series chart object. Contains view functions for the 'chart' mode.
 * This is an optional component, part of the cube view.
 */

angular.module('cv.views.cube').controller("CubesViewerViewsCubeChartController", ['$rootScope', '$scope', '$timeout', '$element', 'cvOptions', 'cubesService', 'viewsService', 'seriesOperationsService', 'exportService',
                                                     function ($rootScope, $scope, $timeout, $element, cvOptions, cubesService, viewsService, seriesOperationsService, exportService) {

	var chartCtrl = this;

	this.chart = null;

	this.initialize = function() {
		// Add chart view parameters to view definition
		$scope.view.params = $.extend(
			{},
			{ "charttype" : "bars-vertical", "chartoptions": { showLegend: true } },
			$scope.view.params
		);
		//$scope.refreshView();
	};

	$scope.$watch("view.params.charttype", function() {
		chartCtrl.loadData();
	});
	$scope.$on("ViewRefresh", function(view) {
		chartCtrl.loadData();
	});

	this.loadData = function() {

		var view = $scope.view;

		// Check if we can produce a table
		if (view.params.yaxis == null) return;

		var browser_args = cubesService.buildBrowserArgs($scope.view, $scope.view.params.xaxis != null ? true : false, false);
		var browser = new cubes.Browser(cubesService.cubesserver, $scope.view.cube);
		var viewStateKey = $scope.newViewStateKey();
		var jqxhr = browser.aggregate(browser_args, $scope._loadDataCallback(viewStateKey));

		$scope.view.pendingRequests++;
		jqxhr.always(function() {
			$scope.view.pendingRequests--;
			$rootScope.$apply();
		});
		jqxhr.error($scope.requestErrorHandler);

	};

	$scope._loadDataCallback = function(viewStateKey) {
		return function(data, status) {
			// Only update if view hasn't changed since data was requested.
			if (viewStateKey == $scope._viewStateKey) {
				$scope.validateData(data, status);
				chartCtrl.processData(data);
				$rootScope.$apply();
			}
		};
	};

	this.processData = function(data) {

		if ($scope.view.pendingRequests == 0) {
			$($element).find("svg").empty();
			$($element).find("svg").parent().children().not("svg").remove();
		}

		$scope.rawData = data;

		$scope.resetGrid();
		$scope.view.grid.data = [];
		$scope.view.grid.columnDefs = [];
		$rootScope.$apply();

		var view = $scope.view;
		var rows = $scope.view.grid.data;
		var columnDefs = view.grid.columnDefs;

		// Process data
		//$scope._sortData (data.cells, view.params.xaxis != null ? true : false);
	    this._addRows($scope, data);
	    seriesOperationsService.applyCalculations($scope.view, $scope.view.grid.data, view.grid.columnDefs);

		// Join keys
		if (view.params.drilldown.length > 0) {
			columnDefs.splice (0, view.params.drilldown.length, {
				name: "key"
			});

			$(rows).each(function(idx, e) {
				var jointkey = [];
				for (var i = 0; i < view.params.drilldown.length; i++) jointkey.push(e["key" + i]);
				e["key"] = jointkey.join(" / ");
			});
		}

		$scope.$broadcast("gridDataUpdated");

	};

	/*
	 * Adds rows.
	 */
	this._addRows = cubesviewer._seriesAddRows;

	this.cleanupNvd3 = function() {

		//$($element).find("svg").empty();
		$($element).find("svg").parent().children().not("svg").remove();

		if (chartCtrl.chart) {
			$("#" + chartCtrl.chart.tooltip.id()).remove(); // div.nvtooltip
		}

		//$scope.chart = null;

		/*
		var len = nv.graphs.length;
		while (len--) {
			if (! ($.contains(document.documentElement, nv.graphs[len].container))) {
			    // Element is detached, destroy graph
				nv.graphs.splice (len,1);
			}
		}
		*/
	};

	$scope.$watch('cvOptions.studioTwoColumn', function() {
		if (chartCtrl.chart) {
			$timeout(function() {
				chartCtrl.chart.update();
			}, 100);
		}
	});

	this.resizeChart = function(size) {
		var view = $scope.view;
		$($element).find('svg').height(size);
		$($element).find('svg').resize();

		if (chartCtrl.chart) chartCtrl.chart.update();
	};

	$scope.$on("ViewResize", function(view) {
		if (chartCtrl.chart) chartCtrl.chart.update();
	});

	/**
	 * FIXME: This shouldn't be defined here.
	 * Note that `this` refers to the view in this context.
	 */
	$scope.view.exportChartAsPNG = function() {

		var doctype = '<?xml version="1.0" standalone="no"?>'
			  + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

		// Get page styles
		var styles = exportService.getDocumentStyles();
		styles = (styles === undefined) ? "" : styles;

		// Serialize our SVG XML to a string.
		var svgSel = $($element).find('svg').first();
		svgSel.addClass("cv-bootstrap");
		svgSel.css("font-size", "10px");
		svgSel.css("font-family", "Helvetica, Arial, sans-serif");
		svgSel.css("background-color", "white");
		svgSel.attr("width", svgSel.width());
		svgSel.attr("height", svgSel.height());
		svgSel.attr("version", "1.1")

		var defsEl = document.createElement("defs");
	    svgSel[0].insertBefore(defsEl, svgSel[0].firstChild);
	    //defsEl.setAttribute("class", "cv-bootstrap");
	    var styleEl = document.createElement("style")
	    defsEl.appendChild(styleEl);
	    styleEl.setAttribute("type", "text/css");

		var source = (new XMLSerializer()).serializeToString(svgSel.get(0));
		source = source.replace('</style>', '<![CDATA[' + styles + ']]></style>')

		// Create a file blob of our SVG.
		var blob = new Blob([doctype + source], { type: 'image/svg+xml;charset=utf-8' });

		var url = window.URL.createObjectURL(blob);

		// Put the svg into an image tag so that the Canvas element can read it in.
		var img = d3.select('body').append('img').attr('visibility', 'hidden').attr('width', svgSel.width()).attr('height', svgSel.height()).node();

		img.onload = function() {
		  // Now that the image has loaded, put the image into a canvas element.
		  var canvas = d3.select('body').append('canvas').node();
		  $(canvas).addClass("cv-bootstrap");
		  $(canvas).attr('visibility', 'hidden');
		  canvas.width = svgSel.width();
		  canvas.height = svgSel.height();
		  var ctx = canvas.getContext('2d');
		  ctx.drawImage(img, 0, 0, svgSel.width(), svgSel.height());
		  var canvasUrl = canvas.toDataURL("image/png");

		  $(img).remove();
		  $(canvas).remove();

		  // this is now the base64 encoded version of our PNG! you could optionally
		  // redirect the user to download the PNG by sending them to the url with
		  // `window.location.href= canvasUrl`.
		  /*
		  var img2 = d3.select('body').append('img')
		    .attr('width', svgSel.width())
		    .attr('height', svgSel.height())
		    .node();
		   */
		  //img2.src = canvasUrl;
		  exportService.saveAs(canvasUrl, $scope.view.cube.name + "-" + $scope.view.params.charttype + ".png");
		}
		// start loading the image.
		img.src = url;
	};


	$scope.$on("$destroy", function() {
		chartCtrl.cleanupNvd3();
		$scope.view.grid.data = [];
		$scope.view.grid.columnDefs = [];
	});

	this.initialize();

}]);


;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*
 * Series chart object. Contains view functions for the 'chart' mode.
 * This is an optional component, part of the cube view.
 */

"use strict";

angular.module('cv.views.cube').controller("CubesViewerViewsCubeChartBarsVerticalController", ['$rootScope', '$scope', '$element', '$timeout', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, $element, $timeout, cvOptions, cubesService, viewsService) {

	$scope.chart = null;

	$scope.initialize = function() {
	};

	$scope.$on('gridDataUpdated', function() {
		$scope.chartCtrl.cleanupNvd3();
		$timeout(function() {
			$scope.drawChartBarsVertical();
		}, 0);
	});

	/**
	 * Draws a vertical bars chart.
	 */
	$scope.drawChartBarsVertical = function () {

		var view = $scope.view;
		var dataRows = $scope.view.grid.data;
		var columnDefs = view.grid.columnDefs;

		var container = $($element).find("svg").get(0);
		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.dimensionParts(view.params.xaxis).label : "None")

	    var d = [];

	    var numRows = dataRows.length;
	    var serieCount = 0;
	    $(dataRows).each(function(idx, e) {
	    	var serie = [];
	    	for (var i = 1; i < columnDefs.length; i++) {
	    		var value = e[columnDefs[i].name];
	    		serie.push( { "x": columnDefs[i].name, "y":  (value != undefined) ? value : 0 } );
	    	}
	    	var series = { "values": serie, "key": e["key"] != "" ? e["key"] : view.params.yaxis };
	    	if (view.params["chart-disabledseries"]) {
	    		if (view.params["chart-disabledseries"]["key"] == (view.params.drilldown.join(","))) {
	    			series.disabled = !! view.params["chart-disabledseries"]["disabled"][series.key];
	    		}
	    	}
	    	d.push(series);
	    	serieCount++;
	    });
	    d.sort(function(a,b) { return a.key < b.key ? -1 : (a.key > b.key ? +1 : 0) });

	    /*
	    xticks = [];
	    for (var i = 1; i < colNames.length; i++) {
    		xticks.push([ i * 10, colNames[i] ]);
	    }
	    */

	    var chartOptions = {
	    	  //barColor: d3.scale.category20().range(),
	    	  delay: 1200,
	    	  groupSpacing: 0.1,
	    	  //reduceXTicks: false,
	    	  //staggerLabels: true
	    };

	    var ag = $.grep(view.cube.aggregates, function(ag) { return ag.ref == view.params.yaxis })[0];
		var colFormatter = $scope.columnFormatFunction(ag);

	    nv.addGraph(function() {
	        var chart = nv.models.multiBarChart()
		          //.margin({bottom: 100})
		          .showLegend(!!view.params.chartoptions.showLegend)
		          .margin({left: 120});

	    	if (view.params["chart-barsvertical-stacked"]) {
	    		chart.stacked ( view.params["chart-barsvertical-stacked"] );
	    	}

	        chart.options(chartOptions);
	        chart.multibar.hideable(true);

	        //chart.xAxis.axisLabel(xAxisLabel).showMaxMin(true).tickFormat(d3.format(',0f'));
	        chart.xAxis.axisLabel(xAxisLabel);

	        //chart.yAxis.tickFormat(d3.format(',.2f'));
	        chart.yAxis.tickFormat(function(d,i) {
	        	return colFormatter(d);
	        });

	        d3.select(container)
	            .datum(d)
	            .call(chart);

	        //nv.utils.windowResize(chart.update);

    	    // Handler for state change
            chart.dispatch.on('stateChange', function(newState) {
            	view.params["chart-barsvertical-stacked"] = newState.stacked;
            	view.params["chart-disabledseries"] = {
        			  "key": view.params.drilldown.join(","),
        			  "disabled": {}
            	};
            	for (var i = 0; i < newState.disabled.length; i++) {
            		view.params["chart-disabledseries"]["disabled"][d[i]["key"]] =  newState.disabled[i];
            	}
            	view.updateUndo();
            });

	        //chart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });

            $scope.chartCtrl.chart = chart;

	        return chart;

	    });

	}

	$scope.initialize();

}]);


;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

/*
 * Series chart object. Contains view functions for the 'chart' mode.
 * This is an optional component, part of the cube view.
 */
angular.module('cv.views.cube').controller("CubesViewerViewsCubeChartBarsHorizontalController", ['$rootScope', '$scope', '$element', '$timeout', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, $element, $timeout, cvOptions, cubesService, viewsService) {

	$scope.chart = null;

	$scope.initialize = function() {
	};

	$scope.$on('gridDataUpdated', function() {
		$scope.chartCtrl.cleanupNvd3();
		$timeout(function() {
			$scope.drawChartBarsVertical();
		}, 0);
	});

	/**
	 * Draws a vertical bars chart.
	 */
	$scope.drawChartBarsVertical = function () {

		var view = $scope.view;
		var dataRows = $scope.view.grid.data;
		var columnDefs = view.grid.columnDefs;

		var container = $($element).find("svg").get(0);
		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.dimensionParts(view.params.xaxis).label : "None")

	    var d = [];

	    var numRows = dataRows.length;
	    var serieCount = 0;
	    $(dataRows).each(function(idx, e) {
	    	var serie = [];
	    	for (var i = 1; i < columnDefs.length; i++) {
	    		var value = e[columnDefs[i].name];

	    		// If second serie is reversed
	    		if (dataRows.length == 2 && serieCount == 1 && view.params.chartoptions.mirrorSerie2) value = (value != undefined) ? -value : 0;

	    		serie.push( { "x": columnDefs[i].name, "y":  (value != undefined) ? value : 0 } );
	    	}

	    	// Reverse horizontal dimension to make series start from the base
	    	serie.reverse();

	    	var series = { "values": serie, "key": e["key"] != "" ? e["key"] : view.params.yaxis };
	    	if (view.params["chart-disabledseries"]) {
	    		if (view.params["chart-disabledseries"]["key"] == (view.params.drilldown.join(","))) {
	    			series.disabled = !! view.params["chart-disabledseries"]["disabled"][series.key];
	    		}
	    	}
	    	d.push(series);
	    	serieCount++;
	    });
	    d.sort(function(a,b) { return a.key < b.key ? -1 : (a.key > b.key ? +1 : 0) });

	    /*
	    xticks = [];
	    for (var i = 1; i < colNames.length; i++) {
    		xticks.push([ i * 10, colNames[i] ]);
	    }
	    */

	    var chartOptions = {
	    	  //barColor: d3.scale.category20().range(),
	    	  delay: 1200,
	    	  groupSpacing: 0.1,
	    	  //reduceXTicks: false,
	    	  //staggerLabels: true
	    };

	    var ag = $.grep(view.cube.aggregates, function(ag) { return ag.ref == view.params.yaxis })[0];
		var colFormatter = $scope.columnFormatFunction(ag);

		nv.addGraph(function() {
	        var chart = nv.models.multiBarHorizontalChart()
			      //.x(function(d) { return d.label })
			      //.y(function(d) { return d.value })
		          .showLegend(!!view.params.chartoptions.showLegend)
		          .margin({left: 120})
			      //.showValues(true)           //Show bar value next to each bar.
		          //.tooltips(true)             //Show tooltips on hover.
		          //.transitionDuration(350)
		          .showControls(true);        //Allow user to switch between "Grouped" and "Stacked" mode.

	    	if (view.params["chart-barsvertical-stacked"]) {
	    		chart.stacked ( view.params["chart-barsvertical-stacked"] );
	    	}

	        chart.options(chartOptions);

	        //chart.xAxis.axisLabel(xAxisLabel).showMaxMin(true).tickFormat(d3.format(',0f'));
	        //chart.xAxis.axisLabel(xAxisLabel);

	        //chart.yAxis.tickFormat(d3.format(',.2f'));

	        chart.yAxis.tickFormat(function(d, i) {
	        	if (dataRows.length == 2 && view.params.chartoptions.mirrorSerie2 && d < 0) d = -d;
	        	return colFormatter(d);
	        });

	        d3.select(container)
	            .datum(d)
	            .call(chart);

	        //nv.utils.windowResize(chart.update);

    	    // Handler for state change
            chart.dispatch.on('stateChange', function(newState) {
            	view.params["chart-barsvertical-stacked"] = newState.stacked;
            	view.params["chart-disabledseries"] = {
        			  "key": view.params.drilldown.join(","),
        			  "disabled": {}
            	};
            	for (var i = 0; i < newState.disabled.length; i++) {
            		view.params["chart-disabledseries"]["disabled"][d[i]["key"]] =  newState.disabled[i];
            	}
            	view.updateUndo();
            });

	        //chart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });

            $scope.chartCtrl.chart = chart;

	        return chart;

	    });

	}

	$scope.initialize();

}]);


;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*
 * Series chart object. Contains view functions for the 'chart' mode.
 * This is an optional component, part of the cube view.
 */

"use strict";

angular.module('cv.views.cube').controller("CubesViewerViewsCubeChartLinesController", ['$rootScope', '$scope', '$element', '$timeout', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, $element, $timeout, cvOptions, cubesService, viewsService) {

	$scope.chart = null;

	$scope.initialize = function() {
		if (! "lineInterpolation" in $scope.view.params.chartoptions) {
			$scope.view.params.chartoptions.lineInterpolation = "linear";
		}
	};

	$scope.$on('gridDataUpdated', function() {
		$scope.chartCtrl.cleanupNvd3();
		$timeout(function() {
			$scope.drawChartLines();
		}, 0);
	});


	/**
	 * Draws a vertical bars chart.
	 */
	$scope.drawChartLines = function () {

		var view = $scope.view;
		var dataRows = $scope.view.grid.data;
		var columnDefs = view.grid.columnDefs;

		var container = $($element).find("svg").get(0);

		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.dimensionParts(view.params.xaxis).label : "None")


	    // TODO: Check there's only one value column

		var d = [];
	    var numRows = dataRows.length;
	    var serieCount = 0;
	    $(dataRows).each(function(idx, e) {
	    	var serie = [];
	    	for (var i = 1; i < columnDefs.length; i++) {
	    		if (columnDefs[i].field in e) {
	    			var value = e[columnDefs[i].field];
	    			serie.push( { "x": i, "y":  (value != undefined) ? value : 0 } );
	    		} else  {
	    			if (view.params.charttype == "lines-stacked") {
	    				serie.push( { "x": i, "y":  0 } );
	    			}
	    		}
	    	}
	    	var series = { "values": serie, "key": e["key"] != "" ? e["key"] : view.params.yaxis };
	    	if (view.params["chart-disabledseries"]) {
	    		if (view.params["chart-disabledseries"]["key"] == (view.params.drilldown.join(","))) {
	    			series.disabled = !! view.params["chart-disabledseries"]["disabled"][series.key];
	    		}
	    	}
	    	d.push(series);
	    	serieCount++;
	    });
	    d.sort(function(a,b) { return a.key < b.key ? -1 : (a.key > b.key ? +1 : 0) });

	    /*
	    xticks = [];
	    for (var i = 1; i < colNames.length; i++) {
    		xticks.push([ i, colNames[i] ]);
	    }
	    */

	    var ag = $.grep(view.cube.aggregates, function(ag) { return ag.ref == view.params.yaxis })[0];
	    var colFormatter = $scope.columnFormatFunction(ag);

	    if (view.params.charttype != "lines-stacked") {

		    nv.addGraph(function() {
		    	var chart = nv.models.lineChart()
		    		.useInteractiveGuideline(true)
		    		.interpolate($scope.view.params.chartoptions.lineInterpolation)
		    		.showLegend(!!view.params.chartoptions.showLegend)
		    		.margin({left: 120});

		    	chart.xAxis
		    		.axisLabel(xAxisLabel)
		    		.tickFormat(function(d,i) {
		    			return (columnDefs[d].name);
				    });

	    		chart.yAxis.tickFormat(function(d,i) {
		        	return colFormatter(d);
		        });

		    	d3.select(container)
		    		.datum(d)
		    		.call(chart);

		    	  // Handler for state change
		          chart.dispatch.on('stateChange', function(newState) {
		        	  view.params["chart-disabledseries"] = {
		        			  "key": view.params.drilldown.join(","),
		        			  "disabled": {}
		        	  };
		        	  for (var i = 0; i < newState.disabled.length; i++) {
		        		  view.params["chart-disabledseries"]["disabled"][d[i]["key"]] =  newState.disabled[i];
		        	  }
		          });

		        $scope.chartCtrl.chart = chart;
		    	return chart;
		    });

	    } else {

		    nv.addGraph(function() {
	    	  var chart = nv.models.stackedAreaChart()
	    	                //.x(function(d) { return d[0] })
	    	                //.y(function(d) { return "y" in d ? d.y : 0 })
	    	  				.showLegend(!!view.params.chartoptions.showLegend)
	    	  				.interpolate($scope.view.params.chartoptions.lineInterpolation)
	    	  				.margin({left: 130})
	    	                .clipEdge(true)
	    	                .useInteractiveGuideline(true);

	    	  if (	view.params["chart-stackedarea-style"] ) {
	    		  chart.style ( view.params["chart-stackedarea-style"] );
	    	  }

	    	  chart.xAxis	        //chart.xAxis.axisLabel(xAxisLabel).showMaxMin(true).tickFormat(d3.format(',0f'));
	    	  	  .axisLabel(xAxisLabel)
	    	      .showMaxMin(false)
	    	      .tickFormat(function(d, i) {
	    	    	  return (columnDefs[d].name);
			      });

	    	  chart.yAxis.tickFormat(function(d,i) {
	    		  return colFormatter(d);
	    	  });

	    	  d3.select(container)
	    	  	  .datum(d)
	    	      .call(chart);

	    	  // Handler for state change
	          chart.dispatch.on('stateChange', function(newState) {
	        	  view.params["chart-stackedarea-style"] = newState.style;
	        	  view.params["chart-disabledseries"] = {
	        			  "key": view.params.drilldown.join(","),
	        			  "disabled": {}
	        	  };
	        	  for (var i = 0; i < newState.disabled.length; i++) {
	        		  view.params["chart-disabledseries"]["disabled"][d[i]["key"]] =  newState.disabled[i];
	        	  }
	        	  view.updateUndo();
	          });

	          $scope.chartCtrl.chart = chart;
	    	  return chart;
	    	});
	    }

	};



	/**
	 */
	/*
	this.drawChartLinesCumulative = function (view, colNames, dataRows, dataTotals) {

		var container = $('#seriesChart-' + view.id).find("svg").get(0);
		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.getDimensionParts(view.params.xaxis).label : "None")

	    var d = [];


	    numRows = dataRows.length;
	    var serieCount = 1;
	    $(dataRows).each(function(idx, e) {
	    	serie = [];
	    	for (var i = 1; i < colNames.length; i++) {
	    		if ( (colNames[i] in e) && (e[colNames[i]] != null) && (e[colNames[i]]) ) {
	    			var value = e[colNames[i]];
	    			serie.push( { "x": i, "y": parseFloat(value) } );
	    		} else {
	    			serie.push( { "x": i, "y": 0 } );
	    		}
	    	}
	    	d.push({ "values": serie, "key": e["key"] != "" ? e["key"] : view.params.yaxis });
	    });
	    d.sort(function(a,b) { return a.key < b.key ? -1 : (a.key > b.key ? +1 : 0) });

	    nv.addGraph(function() {
	        var chart = nv.models.cumulativeLineChart()
                          //.x(function(d) { return d.x })
		                  //.y(function(d) { return d.y })
		                  .showLegend(!!view.params.chartoptions.showLegend)
		                  .color(d3.scale.category20().range())
	                      //.color(d3.scale.category10().range())
		                  .useInteractiveGuideline(true)
	                      ;

	         chart.xAxis
	            .axisLabel(xAxisLabel)
			      .tickFormat(function(d,i) {
			                return (colNames[d]);
			       })	;

	         chart.yAxis
	         .tickFormat(d3.format(',.2f'));

	        d3.select(container)
	            .datum(d)
	          .transition().duration(500)
	            .call(chart);

    	  // Handler for state change
	          chart.dispatch.on('stateChange', function(newState) {
	        	  view.params["chart-stackedarea-style"] = newState.style;
	        	  view.params["chart-disabledseries"] = {
	        			  "key": view.params.drilldown.join(","),
	        			  "disabled": newState.disabled
	        	  };
	          });

	        //TODO: Figure out a good way to do this automatically
	        nv.utils.windowResize(chart.update);

	        return chart;
      });

	};
	*/


	$scope.initialize();

}]);


;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*
 * Series chart object. Contains view functions for the 'chart' mode.
 * This is an optional component, part of the cube view.
 */

"use strict";

angular.module('cv.views.cube').controller("CubesViewerViewsCubeChartPieController", ['$rootScope', '$scope', '$element', '$timeout', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, $element, $timeout, cvOptions, cubesService, viewsService) {

	$scope.chart = null;

	$scope.initialize = function() {
	};

	$scope.$on('gridDataUpdated', function() {
		$scope.chartCtrl.cleanupNvd3();
		$timeout(function() {
			$scope.drawChartPie();
		}, 0);
	});

	/**
	 */
	$scope.drawChartPie = function () {

		var view = $scope.view;
		var dataRows = $scope.view.grid.data;
		var columnDefs = view.grid.columnDefs;

		var container = $($element).find("svg").get(0);

		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.dimensionParts(view.params.xaxis).label : "None")

	    var d = [];

	    var numRows = dataRows.length;
	    var serieCount = 0;
	    $(dataRows).each(function(idx, e) {
	    	var serie = [];
	    	var value = e[columnDefs[1].field];
    		if ((value != undefined) && (value > 0)) {

    	    	var series = { "y": value, "key": e["key"] != "" ? e["key"] : columnDefs[0].name };
    	    	if (view.params["chart-disabledseries"]) {
    	    		if (view.params["chart-disabledseries"]["key"] == (view.params.drilldown.join(","))) {
    	    			series.disabled = !! view.params["chart-disabledseries"]["disabled"][series.key];
    	    		}
    	    	}

    	    	d.push(series);
    			serieCount++;

    		}

	    });
	    d.sort(function(a,b) { return a.y < b.y ? -1 : (a.y > b.y ? +1 : 0) });

	    var xticks = [];
	    for (var i = 1; i < columnDefs.length; i++) {
    		xticks.push([ i - 1, columnDefs[i].name ]);
	    }

	    var ag = $.grep(view.cube.aggregates, function(ag) { return ag.ref == view.params.yaxis })[0];
	    var colFormatter = $scope.columnFormatFunction(ag);

	    nv.addGraph(function() {

	        var chart = nv.models.pieChart()
	            .x(function(d) { return d.key })
	            .y(function(d) { return d.y })
	            .showLegend(!!view.params.chartoptions.showLegend)
	            .margin({bottom: 20, top: 20})
	            //.color(d3.scale.category20().range())
	            //.width(width)
	            //.height(height)
	            .labelType("percent");
	            //.donut(true);

	        /*
		    chart.pie
		        .startAngle(function(d) { return d.startAngle/2 -Math.PI/2 })
		        .endAngle(function(d) { return d.endAngle/2 -Math.PI/2 });
		        */

	        chart.valueFormat(function(d,i) {
	        	return colFormatter(d);
	        });

	        d3.select(container)
	              .datum(d)
	              //.attr('width', width)
	              //.attr('height', height)
	              .call(chart);

	        //nv.utils.windowResize(chart.update);

	    	// Handler for state change
	        chart.dispatch.on('stateChange', function(newState) {
	        	view.params["chart-disabledseries"] = {
	        			"key": view.params.drilldown.join(","),
	        			"disabled": {}
	        	};
	        	for (var i = 0; i < newState.disabled.length; i++) {
	        		view.params["chart-disabledseries"]["disabled"][d[i]["key"]] =  newState.disabled[i];
	        	}
	        	view.updateUndo();
	        });

	        $scope.chartCtrl.chart = chart;
	        return chart;
	    });

	};

	$scope.initialize();

}]);


;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*
 * Series chart object. Contains view functions for the 'chart' mode.
 * This is an optional component, part of the cube view.
 */

"use strict";

angular.module('cv.views.cube').controller("CubesViewerViewsCubeChartRadarController", ['$rootScope', '$scope', '$element', '$timeout', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, $element, $timeout, cvOptions, cubesService, viewsService) {

	$scope.chart = null;

	$scope.initialize = function() {
	};

	$scope.$on('gridDataUpdated', function() {
		$timeout(function() {
			$scope.drawChartRadar();
		}, 2000);
	});
	$scope.$watch('cvOptions.studioTwoColumn', function() {
		$timeout(function() {
			$scope.drawChartRadar();
		}, 2000);
	});

	$scope.$on("ViewResize", function (){
		$scope.$apply(function(){
			$scope.drawChartRadar();
		});
	});


	/**
	 */
	$scope.drawChartRadar = function () {

		var view = $scope.view;
		var dataRows = $scope.view.grid.data;
		var columnDefs = view.grid.columnDefs;

		var container = $($element).find(".cv-chart-container")[0];
		$(container).empty();
		$(container).height(400);

	    var d = [];

	    var numRows = dataRows.length;
	    $(dataRows).each(function(idx, e) {
	    	var serie = [];
	    	for (var i = 1; i < columnDefs.length; i++) {
	    		var value = e[columnDefs[i].field];
	    		if (value != undefined) {
	    			serie.push( [i-1, value] );
	    		} else {
	    			serie.push( [i-1, 0] );
	    		}
	    	}
	    	d.push({ data: serie, label: e["key"] != "" ? e["key"] : view.params.yaxis });
	    });
	    d.sort(function(a,b) { return a.label < b.label ? -1 : (a.label > b.label ? +1 : 0) });

	    var xticks = [];
	    for (var i = 1; i < columnDefs.length; i++) {
    		xticks.push([ i - 1, columnDefs[i].name ]);
	    }

	    var flotrOptions = {
	    	//HtmlText: ! view.doExport,
	    	HtmlText: false,
	    	shadowSize: 2,
	    	height: 350,
	        radar: {
	            show: true,
	            fill: numRows < 4,
	            fillOpacity: 0.2
	        },
	        mouse: {
	            track: false,
	            relative: true
	        },
	        grid: {
	            circular: true,
	            minorHorizontalLines: true
	        },
	        xaxis: {
	            ticks: xticks
	        },
	        yaxis: {
	        },
	        legend: {
	        	show: (!!view.params.chartoptions.showLegend),
	            position: "se",
	            backgroundColor: "#D2E8FF"
	        }
	    };
	    $scope.flotrDraw = Flotr.draw(container, d, flotrOptions);

	};

	$scope.initialize();

}]);


;/*
 * CubesViewer
 * Copyright (c) 2012-2013 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Sof	tware, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*
 * Series Sunburst object. Contains view functions for the 'sunburst' mode.
 * This is an optional component, part of the cube view. Depends on the series mode.
 */

"use strict";

angular.module('cv.views.cube').controller("CubesViewerViewsCubeChartSunburstController", ['$rootScope', '$scope', '$element', '$timeout', 'cvOptions', 'cubesService', 'viewsService',
                                                                                           function ($rootScope, $scope, $element, $timeout, cvOptions, cubesService, viewsService) {

	$scope.chart = null;

	$scope.initialize = function() {
	};

	$scope.$on('gridDataUpdated', function() {
		$timeout(function() {
			$scope.drawChartSunburst();
		}, 2000);
	});

	/**
	 * Draws Series Chart.
	 */
	$scope.drawChartSunburst = function() {

		var view = $scope.view;
		var data = $scope.rawData;
		var dataRows = $scope.view.grid.data;
		var columnDefs = view.grid.columnDefs;

		/*
		$(view.container).find('.cv-view-viewdata').empty();

		if (data.cells.length == 0) {
			$(view.container).find('.cv-view-viewdata').empty().append(
				'<h3>Dynamic Chart</h3>' +
				'<div>Cannot present chart as no data is returned by the current filtering and drilldown combination.</div>'
			);
			return;
		}

		$(view.container).find('.cv-view-viewdata').css("width", "95%");
		$(view.container).find('.cv-view-viewdata').append(
			'<div><h3>Dynamic Chart</h3>' +
			'<div id="dynamicChart-' + view.id + '" style="height: 480px; width: 480px; float: left; "></div></div>' +
			'<div id="dynamicChart-details-' + view.id + '" style="width: 95%; margin-left: 10px;" >' +
			'<h3>Selected Segment</h3>' +
			'<h3>Drilldowns</h3>' +
			'</div>'
		);
		*/

		// Process and draw cells
		//$scope._sortData (data.cells, view.params.xaxis != null ? true : false);
		var json = $scope.prepareDrilldownTree (data);
		$scope.draw3DJSSunburst (json);

	};

	/*
	 * Prepares drilldowndata
	 */
	$scope.prepareDrilldownTree = function (data) {

		var view = $scope.view;

		var json =  [{
			children: [],
			name: "Current Slice",
		}];

		var current = null;

		$(data.cells).each(function (idx, e) {

			current = json[0];

			// For the horizontal axis drilldown level, if present
			for (var i = 0; i < view.params.drilldown.length; i++) {

				// Get dimension
				var parts = view.cube.dimensionParts(view.params.drilldown[i]);
				var infos = parts.hierarchy.readCell(e);

				$(infos).each(function(idx, info) {
					var child = $.grep(current.children, function(ed) { return ed.name == info.key; });
					if (child.length > 0) {
						current = child[0];
					} else {
						child = {
							children: [],
							name: String(info.key),
							label: info.label,
							//color: "#aabbcc" ,
						};
						current.children.push(child);
						current = child;
					}
				});

			}

			current.measure = (e[view.params.yaxis]);

		});


		return json[0].children;

	};

	String.prototype.hashCode = function() {
		  var hash = 0, i, chr, len;
		  if (this.length === 0) return hash;
		  for (i = 0, len = this.length; i < len; i++) {
		    chr   = this.charCodeAt(i);
		    hash  = ((hash << 5) - hash) + chr;
		    hash |= 0; // Convert to 32bit integer
		  }
		  return hash;
	};

	$scope.draw3DJSSunburst = function(json) {



		var view = $scope.view;
		var json = json;

		var data = $scope.rawData;
		var columnDefs = view.grid.columnDefs;

		var container = $($element).find("svg").parent().empty().get(0);
		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.dimensionParts(view.params.xaxis).label : "None");


		var width = 470;
		var height = width;
		var radius = width / 2;
		var varx = d3.scale.linear().range([ 0.0 * Math.PI, 2.0 * Math.PI ]);
		//var vary = d3.scale.pow().exponent(1).domain([ 0, 1 ]).range([ 5, radius]);
		var vary = d3.scale.linear().domain([ 0, 1 ]).range([ 20, radius]);
		var varp = 5;
		var duration = 1000;

		var colorScale = d3.scale.category20b().domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);

		var lastD = null;

		function isParentOf(p, c) {
	        if (p === c)
	            return true;
	        if ((p.children) && (p.children.length > 0)) {
	            return p.children.some(function(d) {
	                return isParentOf(d, c);
	            });
	        }
	        return false;
	    }

	    function colour(d) {

	    	// TODO: Color shall be different and consistent for each drilldown dimension, but shades
	    	// of same palette for levels within same dimension. Use the various colourscales.


	    	if (!d) return "#ffaaaa";

	    	if (d.color != undefined) {
	    		return d.color;
	    	} else if ((d.parent != null) && (d.parent.parent != null)) {
	    		d.color = colour(d.parent);
	    		var color2 = colorScale(Math.abs(String(d.name).hashCode()) % 20);
	    		d.color = d3.scale.linear().domain([0,100]).interpolate(d3.interpolateRgb).range([d.color, color2])(30);
	    		d.color = color2;
	    	} else {
	    		if (! ("name" in d)) {
	    			d.color = "#ffffff"; // center
	    		} else {
	    			d.color = colorScale(Math.abs(String(d.name).hashCode()) % 20);
	    		}
    			//console.debug (d.name + "  hash: " + (Math.abs(String(d.name).hashCode()) % 20) + " color: " + d.color);
	    	}
	    	return d.color;

	    }

	    // Interpolate the scales!
	    function arcTween(d) {
	        var my = maxY(d),
	            xd = d3.interpolate(varx.domain(), [ d.x, d.x + d.dx ]),
	            yd = d3.interpolate(vary.domain(), [ d.y, my ]),
	            //yr = d3.interpolate(vary.range(), [ d.y ? 20 : 0, radius]);
	            yr = d3.interpolate(vary.range(), [ 20, radius]);
	        return function(d) {
	            return function(t) {
	                varx.domain(xd(t));
	                vary.domain(yd(t)).range(yr(t));
	                return arc(d);
	            };
	        };

	    }

	    function maxY(d) {
	    	return 1;
	    	//return d.children ? Math.max.apply(Math, d.children.map(maxY)) : d.y + d.dy;
	    }

	    //http://www.w3.org/WAI/ER/WD-AERT/#color-contrast
	    function brightness(rgb) {
	        return rgb.r * .299 + rgb.g * .587 + rgb.b * .114;
	    }

	    function textPart(text, part) {
	    	var parts = text.split(" ");
	    	var overflow = (parts.length > 8);

	    	if (parts.length <= 2) {
	    		return (part == 0) ? text : "";
	    	}

	    	parts = parts.slice(0, 8);
	    	if (part == 0) {
	    		parts = parts.slice(0, Math.floor(parts.length / 2));
	    	} else {
	    		parts = parts.slice(Math.floor(parts.length / 2));
	    	}
	    	return parts.join(" ") + (overflow && part == 1 ? "..." : "");
	    }

	    var div = d3.select(container);

	    var vis = div.append("svg").attr("width", width + varp * 2).attr("height",
	            height + varp * 2).append("g").attr("transform",
	            "translate(" + (radius + varp) + "," + (radius + varp) + ")");

	    var partition = d3.layout.partition().sort(null).value(function(d) {
	        return d.measure;
	    });

	    var arc = d3.svg.arc().startAngle(function(d) {
	        return Math.max(0, Math.min(2 * Math.PI, varx(d.x)));
	    }).endAngle(function(d) {
	        return Math.max(0, Math.min(2 * Math.PI, varx(d.x + d.dx)));
	    }).innerRadius(function(d) {
	        return Math.max(0, d.y ? vary(d.y) : d.y);
	    }).outerRadius(function(d) {
	        return Math.max(0, vary(d.y + d.dy));
	    });

       var nodes = partition.nodes({
           children : json
       });

       var path = vis.selectAll("path").data(nodes);

       path.enter().append("path").attr("id", function(d, i) {
           return "path-" + i;
       }).attr("d", arc).attr("fill-rule", "evenodd").style(
               "fill", colour).on("click", click)
       .each(function(d, i) {
    	   var el = this;
    	   $(el).hover(function() {
    		   d3.select(el)
    		      //.style("fill", "#ccccff")
    		      .style('stroke', '#ffffff')
    		      .style('stroke-width', '2')
    		      .style('stroke-opacity', '1');
    		   $(el).insertBefore($('text').first());
    	   }, function() {
    		   d3.select(el)
	    		   .style('stroke', '#000000')
	               .style('stroke-width', '0')
	               .style('stroke-opacity', '0');
    	   });
       });


       lastD = nodes[0];

       var text = vis.selectAll("text").data(nodes);
       var textEnter = text
               .enter()
               .append("text")
               .style("fill-opacity", 1)
               .style(
                       "fill",
                       function(d) {
                           return brightness(d3.rgb(colour(d))) < 125 ? "#eee"
                                   : "#000";
                       })
               .style("font-size", 9)
               .style("-webkit-touch-callout", "none")
               .style("-webkit-user-select", "none")
    		   .style("-khtml-user-select", "none")
			   .style("-moz-user-select", "none")
			   .style("-ms-user-select", "none")
			   .style("user-select", "none")
			   .style("pointer-events", "none")
               .style(
	               "visibility",
	               function(e) {
	                   var show = ( Math.abs(varx(e.x + e.dx ) - varx(e.x) ) > Math.PI / 48 );
	                   show = true;
	                   return show ? null  : "hidden";
	                   //return isParentOf(d, e) ? null  : d3.select(this).style("visibility");
	               })
               .attr(
                       "text-anchor",
                       function(d) {
                           return varx(d.x + d.dx / 2) > Math.PI ? "end"
                                   : "start";
                       })
               .attr("dy", ".2em")
               .attr(
                       "transform",
                       function(d) {
                           var multiline = (('label' in d ? String(d.label) : "") || "").split(" ").length > 1
                           var angle = varx(d.x + d.dx / 2)* 180 / Math.PI - 90
                           var rotate = angle + (multiline ? -.5 : 0);
                           return "rotate(" + rotate + ")translate("
                                   + (vary(d.y) + varp) + ")rotate("
                                   + (angle > 90 ? -180 : 0)
                                   + ")";
                       }).on("click", click);
       textEnter.append("tspan").attr("x", 0).text(
               function(d) {
                   return d.depth ? (textPart(d.label, 0)) : "";
               });
       textEnter
               .append("tspan")
               .attr("x", 0)
               .attr("dy", "1em")
               .text(function(d) { return d.depth ? textPart(d.label, 1) || "" : ""; });

       /*
       d3.select("#graphBlocks").on("click", function() {
           graphBlocks();
           return false;
       });
       d3.select("#graphSize").on("click", function() {
           graphSize();
           return false;
       });
       */

       function updateText(d) {
    	   // Note the example hacked this as they rely on arcTween updating the scales.
           text
                   .style(
                           "visibility",
                           function(e) {
                               var show = ( Math.abs(varx(e.x + e.dx ) - varx(e.x) ) > Math.PI / 48 );
                               return show ? null  : "hidden";
                               //return isParentOf(d, e) ? null  : d3.select(this).style("visibility");
                           })
                   .transition()
                   .duration(duration)
                   .attrTween(
                           "text-anchor",
                           function(d) {
                               return function() {
                                   return varx(d.x + d.dx / 2) > Math.PI ? "end"
                                           : "start";
                               };
                           })
                   .attrTween(
                           "transform",
                           function(d) {
                               var multiline = (d.name || "").split(" ").length > 1;
                               return function() {
                                   var angle = varx(d.x + d.dx
                                           / 2)
                                           * 180
                                           / Math.PI
                                           - 90, rotate = angle
                                           + (multiline ? -.5
                                                   : 0);
                                   return "rotate(" + rotate + ")translate(" + (vary(d.y) + varp)
                                           + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
                               };
                           }).style(
                           "fill-opacity",
                           function(e) {
                               return isParentOf(d, e) ? 1
                                       : 1e-6;
                           }).each(
                           "end",
                           function(e) {

                        	   var show = ( Math.abs(varx(e.x + e.dx ) - varx(e.x) ) > Math.PI / 48 );
                        	   d3.select(this).style("visibility", show ? null  : "hidden");
                        	   //d3.select(this).style("visibility", && isParentOf(d, e)  ? null  : "hidden");
                           });
           }

       function click(d) {

    	   lastD = d;

           path.transition().duration(duration).attrTween("d", arcTween(d));

           updateText(d);
       }

	};



}]);

function cubesviewerViewCubeDynamicChart() {

	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {
		// Remove horizontal dimension menu
		$(".cv-view-series-horizontal-menu", $(view.container)).remove();
		// Remove horizontal dimension info
		$(".cv-view-series-horizontal-info", $(view.container)).parents('.infopiece').remove();
	};


	/*
	 * Load and draw current data
	 */
	this.loadData = function(view) {

		// Build params (do not include xaxis)
		var params = this.cubesviewer.views.cube.buildQueryParams(view, false, false);

		$('#' + view.id).find('.cv-view-viewdata').empty().append('<h3>Dynamic Chart</h3><span class="ajaxloader" title="Loading...">  Loading</span>');

		$.get(view.cubesviewer.options.cubesUrl + "/cube/" + view.cube.name + "/aggregate", params,
				view.cubesviewer.views.cube.dynamicchart._loadDataCallback(view), "json");

	};

};
;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*
 * This addon adds export to CSV capability to CubesViewer cube view.
 * It offers an "export facts" menu option for all cube view modes,
 * and a "export table" option in Explore and Series mode.
 */

"use strict";

/**
 * Provides methods to export data from "cube" views.
 *
 * @class exportService
 * @memberof cv.views.cube
 */
angular.module('cv.views.cube').service("exportService", ['$rootScope', '$timeout', 'cvOptions', 'cubesService', 'viewsService', 'seriesOperationsService',
                                                         function ($rootScope, $timeout, cvOptions, cubesService, viewsService, seriesOperationsService) {

	/**
	 * Download facts in CSV format from Cubes Server
	 *
	 * @memberof cv.views.cube.exportService
	 */
	this.exportFacts = function(view) {

		var args = cubesService.buildBrowserArgs(view, false, true);

        var http_args = {};
        http_args["format"] = "csv";

        if (args.cut) http_args.cut = args.cut.toString();
        if (args.order) http_args.order = args.order.toString();


		var url = cvOptions.cubesUrl + "/cube/" + view.cube.name + "/facts?" + $.param(http_args);
		window.open(url, '_blank');
		window.focus();

	};

	/**
	 * Export a view (either in "explore" or "series" mode) in CSV format.
	 *
	 * @memberof cv.views.cube.exportService
	 */
	this.exportGridAsCsv = function (view) {

		if (!view.grid) {
			console.debug("View has no grid that can be exported.");
			return;
		}

		var gridOptions = view.grid;
		var dataRows = view.grid.data;

		var content = "";
		var values = [];

		$(view.grid.columnDefs).each(function(idx, e) {
			values.push ('"' + e.name + '"');
		});
		content = content + (values.join(",")) + "\n";

		$(dataRows).each(function(idxr, r) {
			values = [];
			$(view.grid.columnDefs).each(function(idx, e) {
				if (r[e.field] && r[e.field].title) {
					// Explore view uses objects as values, where "title" is the label
					values.push('"' + r[e.field].title + '"');
				} else {
					//
					values.push('"' + r[e.field] + '"');
				}
			});
			content = content + (values.join(",")) + "\n";
		});


		//window.open (url, "_blank");
		this.saveAs(content, "text/csv", view.cube.name + "-summary.csv")
	};

	/**
	 * Delivers a data URI to the client with a given filename.
	 *
	 * @memberof cv.views.cube.exportService
	 */
	this.saveAs = function(content, mime, filename) {

		// Method 1
		//var uri = "data:" + mime + ";charset=utf-8," + encodeURIComponent(content);

		// Method 2
		var csvData = new Blob([content], { type: mime });
		var uri = URL.createObjectURL(csvData);

		var link = document.createElement('a');
	    if (typeof link.download === 'string') {
	        document.body.appendChild(link); // Firefox requires the link to be in the body
	        link.download = filename;
	        link.href = uri;
	        link.click();
        	document.body.removeChild(link); // remove the link when done
	    } else {
	        location.replace(uri);
	    }
	};

	/**
	 * Grab page styles as a string to embed them into the SVG source
	 * From: https://github.com/NYTimes/svg-crowbar/blob/gh-pages/svg-crowbar.js
	 */
	this.getDocumentStyles = function() {

		var doc = window.document;

		var styles = "", styleSheets = doc.styleSheets;

		if (styleSheets) {
			for ( var i = 0; i < styleSheets.length; i++) {
				processStyleSheet(styleSheets[i]);
			}
		}

	    function processStyleSheet(ss) {
	    	try {
		    	if (ss.cssRules) {
		    		console.debug(ss);
					for ( var i = 0; i < ss.cssRules.length; i++) {
						var rule = ss.cssRules[i];
						if (rule.type === 3) {
							// Import Rule
							processStyleSheet(rule.styleSheet);
						} else {
							// hack for illustrator crashing
							// on descendent selectors
							if (rule.selectorText) {
								if (rule.selectorText
										.indexOf(">") === -1) {
									styles += "\n"
											+ rule.cssText;
								}
							}
						}
					}
				}
	    	} catch (err) {
	    		console.debug("Could not access document stylesheet.")
	    	}
		}

		return styles;
	}

}]);

;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*
 * Undo/Redo plugin.
 */

"use strict";


angular.module('cv.views.cube').controller("CubesViewerViewsUndoController", ['$rootScope', '$scope', '$timeout', '$element', 'cvOptions', 'cubesService', 'viewsService',
                                                                                   function ($rootScope, $scope, $timeout, $element, cvOptions, cubesService, viewsService) {

  	$scope.initialize = function() {
  		// Add chart view parameters to view definition
  		$scope.view.undoList = [];
  		$scope.view.undoPos = -1;
  	};

  	$scope.initialize();

  	$scope.$on('ViewRefresh', function(view) { $scope._processState(view); });

	$scope._processState = function() {

		var drawn = viewsService.serializeView($scope.view);
		var current = $scope.getCurrentUndoState();

		if (drawn != current) {
			$scope.pushUndo(drawn);
		}

	}

	$scope.pushUndo = function (state) {

		var view = $scope.view;

		view.undoPos = view.undoPos + 1;
		if (view.undoPos + 1 <= view.undoList.length) {
			view.undoList.splice(view.undoPos, view.undoList.length - view.undoPos);
		}
		view.undoList.push(state);

		if (view.undoList.length > cvOptions.undoSize) {
			view.undoList.splice(0, view.undoList.length - cvOptions.undoSize);
			view.undoPos = view.undoList.length - 1;
		}
	};

	$scope.view.updateUndo = function() {
		var view = $scope.view;
		var state = viewsService.serializeView(view);

		if (view.undoList[view.undoPos]) {
			view.undoList[view.undoPos] = state;
		}
	};

	$scope.getCurrentUndoState = function () {
		if ($scope.view.undoList.length == 0) return "{}";
		return $scope.view.undoList[$scope.view.undoPos];
	};

	$scope.undo = function () {
		$scope.view.undoPos = $scope.view.undoPos - 1;
		if ($scope.view.undoPos < 0) $scope.view.undoPos = 0;
		$scope.applyCurrentUndoState();
	};

	$scope.redo = function () {
		$scope.view.undoPos = $scope.view.undoPos + 1;
		$scope.applyCurrentUndoState ();
	};

	$scope.applyCurrentUndoState = function() {
		var current = $scope.getCurrentUndoState();
		$scope.view.params = $.parseJSON(current);
		$scope.refreshView();
	};


}]);


;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

/**
 * CubesViewer Studio module. CubesViewer Studio is the (optional) interface that
 * provides a full visualization environment allowing users to create and
 * interact with cubes and views.
 *
 * See the CubesViewer Studio demo at `html/studio.html` in the package.
 *
 * @namespace cv.studio
 */
angular.module('cv.studio', ['cv' /*'ui.bootstrap-slider', 'ui.validate', 'ngAnimate', */
                             /*'angularMoment', 'smart-table', 'angular-confirm', 'debounce', 'xeditable',
                             'nvd3' */ ]);

/**
 * This service manages the panels and views of the CubesViewer Studio interface.
 * Provides methods to create, remove and collapse view panels which are rendered
 * within the CubesViewer Studio user interface.
 *
 * @class studioViewsService
 * @memberof cv.studio
 */
angular.module('cv.studio').service("studioViewsService", ['$rootScope', '$anchorScroll', '$timeout', 'cvOptions', 'cubesService', 'viewsService', 'dialogService',
                                                            function ($rootScope, $anchorScroll, $timeout, cvOptions, cubesService, viewsService, dialogService) {

	this.views = [];

	this.studioScope = null;

	viewsService.studioViewsService = this;
	cubesviewerStudio.studioViewsService = this;

	/**
	 * Adds a new clean view of type "cube" given a cube name.
	 *
	 * @memberof cv.studio.studioViewsService
	 * @returns The created view object.
	 */
	this.addViewCube = function(cubename) {

		// Find cube name
		var cubeinfo = cubesService.cubesserver.cubeinfo(cubename);

		//var container = this.createContainer(viewId);
		//$('.cv-gui-viewcontent', container),

		var name = cubeinfo.label + " (" + (viewsService.lastViewId + 1) + ")";
		var view = viewsService.createView("cube", { "cubename": cubename, "name": name });
		this.views.push(view);

		$timeout(function() {
			$('.cv-views-container').masonry('appended', $('.cv-views-container').find(".sv" + view.id).show());
			//$('.cv-views-container').masonry('reloadItems');
			//$('.cv-views-container').masonry('layout');
			$timeout(function() { $anchorScroll("cvView" + view.id); }, 500);
		}, 0);

		return view;
	};

	/**
	 * Adds a view given its parameters descriptor either as an object or as
	 * a JSON string.
	 *
	 * @memberof cv.studio.studioViewsService
	 * @returns The created view object.
	 */
	this.addViewObject = function(data) {

		// Check at least JSON is valid to avoid creating an unusable view from Studio
		if (typeof data == "string") {
			try {
				$.parseJSON(data);
			} catch (err) {
				dialogService.show('Could not process serialized data: JSON parse error.')
				return;
			}
		}

		var view = viewsService.createView("cube", data);
		this.views.push(view);

		$timeout(function() {
			$('.cv-views-container').masonry('appended', $('.cv-views-container').find(".sv" + view.id).show());
			//$('.cv-views-container').masonry('reloadItems');
			//$('.cv-views-container').masonry('layout');
			$timeout(function() { $anchorScroll("cvView" + view.id); }, 500);
		}, 0);

		return view;
	};

	/**
	 * Closes the panel of the given view.
	 *
	 * @memberof cv.studio.studioViewsService
	 */
	this.closeView = function(view) {
		var viewIndex = this.views.indexOf(view);
		if (viewIndex >= 0) {
			$('.cv-views-container').masonry('remove', $('.cv-views-container').find(".sv" + view.id));
			this.views.splice(viewIndex, 1);
			//$('.cv-views-container').masonry('reloadItems');
			$('.cv-views-container').masonry('layout');
		}

	};

	/**
	 * Collapses the panel of the given view.
	 *
	 * @memberof cv.studio.studioViewsService
	 */
	this.toggleCollapseView = function(view) {
		view.collapsed = !view.collapsed;
		$timeout(function() {
			$('.cv-views-container').masonry('layout');
		}, 100);
	};


}]);


/**
 * cvStudioView directive. Shows a Studio panel containing the corresponding view.
 */
angular.module('cv.studio').controller("CubesViewerStudioViewController", ['$rootScope', '$scope', 'cvOptions', 'cubesService', 'studioViewsService', 'reststoreService',
                                                     function ($rootScope, $scope, cvOptions, cubesService, studioViewsService, reststoreService) {

	$scope.cubesService = cubesService;
	$scope.studioViewsService = studioViewsService;
	$scope.cvOptions = cvOptions;
	$scope.reststoreService = reststoreService;

	$scope.$watch('__height', function() {
		$('.cv-views-container').masonry('layout');
	});

}]).directive("cvStudioView", function() {
	return {
		restrict: 'A',
		templateUrl: 'studio/panel.html',
		scope: {
			view: "="
		},
        link: function( scope, elem, attrs ) {

            scope.$watch( function() {
                scope.__height = elem.height();
            } );

        }

	};
});



angular.module('cv.studio').controller("CubesViewerStudioController", ['$rootScope', '$scope', '$uibModal', '$element', '$timeout', 'cvOptions', 'cubesService', 'studioViewsService', 'viewsService', 'reststoreService',
                                                                       function ($rootScope, $scope, $uibModal, $element, $timeout, cvOptions, cubesService, studioViewsService, viewsService, reststoreService) {

	$scope.cvVersion = cubesviewer.version;
	$scope.cvOptions = cvOptions;
	$scope.cubesService = cubesService;
	$scope.studioViewsService = studioViewsService;
	$scope.reststoreService = reststoreService;

	$scope.studioViewsService.studioScope = $scope;

	$scope.initialize = function() {
	};

	$scope.showSerializeAdd = function() {

	    var modalInstance = $uibModal.open({
	    	animation: true,
	    	templateUrl: 'studio/serialize-add.html',
	    	controller: 'CubesViewerSerializeAddController',
	    	appendTo: angular.element($($element).find('.cv-gui-modals')[0]),
	    	/*
		    size: size,
	    	 */
	    });

	    modalInstance.result.then(function (selectedItem) {
	    	//$scope.selected = selectedItem;
	    }, function () {
	        //console.debug('Modal dismissed at: ' + new Date());
	    });
	};

	$scope.showSerializeView = function(view) {

	    var modalInstance = $uibModal.open({
	    	animation: true,
	    	templateUrl: 'studio/serialize-view.html',
	    	controller: 'CubesViewerSerializeViewController',
	    	appendTo: angular.element($($element).find('.cv-gui-modals')[0]),
		    resolve: {
		        view: function () { return view; },
	    		element: function() { return $($element).find('.cv-gui-modals')[0] },
		    }
	    });

	    modalInstance.result.then(function (selectedItem) {
	    	//$scope.selected = selectedItem;
	    }, function () {
	        //console.debug('Modal dismissed at: ' + new Date());
	    });
	};

	/*
	 * Renames a view (this is the user-defined label that is shown in the GUI header).
	 */
	$scope.showRenameView = function(view) {

		var modalInstance = $uibModal.open({
	    	animation: true,
	    	templateUrl: 'studio/rename.html',
	    	controller: 'CubesViewerRenameController',
	    	appendTo: angular.element($($element).find('.cv-gui-modals')[0]),
	    	size: "md",
		    resolve: {
		        view: function () { return view; },
	    		element: function() { return $($element).find('.cv-gui-modals')[0] },
		    }
	    });

	    modalInstance.result.then(function (selectedItem) {
	    	//$scope.selected = selectedItem;
	    }, function () {
	        //console.debug('Modal dismissed at: ' + new Date());
	    });

	};

	/*
	 * Clones a view.
	 * This uses the serialization facility.
	 */
	$scope.cloneView = function(view) {

		var viewObject = $.parseJSON(viewsService.serializeView(view));
		viewObject.name = "Clone of " + viewObject.name;

		var view = studioViewsService.addViewObject(viewObject);

		// TODO: These belong to plugins
		view.savedId = 0;
		view.owner = cvOptions.user;
		view.shared = false;
	};

	/**
	 * Toggles two column mode.
	 */
	$scope.toggleTwoColumn = function() {
		cvOptions.studioTwoColumn = ! cvOptions.studioTwoColumn;
		$timeout(function() {
			$('.cv-views-container').masonry('layout');
		}, 100);
	};

	/**
	 * Toggles two column mode.
	 */
	$scope.toggleHideControls = function() {
		cvOptions.hideControls = ! cvOptions.hideControls;
		$timeout(function() {
			$('.cv-views-container').masonry('layout');
		}, 100);
	};

	$scope.initialize();

}]);




angular.module('cv.studio').controller("CubesViewerRenameController", ['$rootScope', '$scope', '$uibModalInstance', 'cvOptions', 'cubesService', 'studioViewsService', 'view',
                                                                       function ($rootScope, $scope, $uibModalInstance, cvOptions, cubesService, studioViewsService, view) {

	$scope.cvVersion = cubesviewer.version;
	$scope.cvOptions = cvOptions;
	$scope.cubesService = cubesService;
	$scope.studioViewsService = studioViewsService;

	$scope.viewName = view.params.name;

	/*
	 * Add a serialized view.
	 */
	$scope.renameView = function(viewName) {

		// TODO: Validate name
		if ((viewName != null) && (viewName != "")) {
			view.params.name = viewName;
		}

		$uibModalInstance.close(view);
	};

	$scope.close = function() {
		$uibModalInstance.dismiss('cancel');
	};

}]);



// Disable Debug Info (for production)
angular.module('cv.studio').config([ '$compileProvider', function($compileProvider) {
	// TODO: Enable debug optionally
	// $compileProvider.debugInfoEnabled(false);
} ]);


angular.module('cv.studio').run(['$rootScope', '$compile', '$controller', '$http', '$templateCache', 'cvOptions',
           function($rootScope, $compile, $controller, $http, $templateCache, cvOptions) {

	console.debug("Bootstrapping CubesViewer Studio.");

    // Add default options
	var defaultOptions = {
        container: null,
        user: null,
        studioTwoColumn: false,
        hideControls: false,

        backendUrl: null
    };
	$.extend(defaultOptions, cvOptions);
	$.extend(cvOptions, defaultOptions);;

    // Get main template from template cache and compile it
	$http.get("studio/studio.html", { cache: $templateCache } ).then(function(response) {

		//var scope = angular.element(document).scope();
		var templateScope = $rootScope.$new();
		$(cvOptions.container).html(response.data);

		//templateCtrl = $controller("CubesViewerStudioController", { $scope: templateScope } );
		//$(cvOptions.container).children().data('$ngControllerController', templateCtrl);

		$compile($(cvOptions.container).contents())(templateScope);
	});

}]);


/**
 * CubesViewer Studio global instance and entry point. Used to initialize
 * CubesViewer Studio.
 *
 * This class is available through the global cubesviewerStudio variable,
 * and must not be instantiated.
 *
 * If you are embedding views in a 3rd party site and you do not need
 * Studio features, use {@link CubesViewer} initialization method instead.
 *
 * Note that the initialization method varies depending
 * on whether your application uses Angular 1.x or not.
 *
 * @class
 */
function CubesViewerStudio() {

	this._configure = function(options) {
		cubesviewer._configure(options);
	};

	/**
	 * Initializes CubesViewer Studio.
	 *
	 * If you wish to embed CubesViewer Studio within an Angular application, you don't
	 * need to call this method. Instead, use your application Angular `config`
	 * block to initialize the cvOptions constant with your settings,
	 * and add the 'cv.studio' module as a dependency to your application.
	 *
	 * See the `cv-angular.html` example for further information.
	 */
	this.init = function(options) {
		this._configure(options);
   		angular.element(document).ready(function() {
   			angular.bootstrap(document, ['cv.studio']);
   		});
	};

}

/**
 * This is Cubesviewer Studio main entry point. Please see {@link CubesViewerStudio}
 * documentation for further information.
 *
 * @global
 */
var cubesviewerStudio = new CubesViewerStudio();

;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

/**
 * View serialization inteface. This is an optional component.
 * Provides visual assistance for serializing views and instancing of views from
 * serialized data. Note that only the view parameters are serialized,
 * but not data. The Cubes Server still needs to be available to serve data.
 * This serialized strings can also be used to initialize different views from code,
 * which is handy when these are going to be instantiated from code later on
 * (ie. when embedding views on a web site).
 */
angular.module('cv.studio').controller("CubesViewerSerializeViewController", ['$rootScope', '$scope', '$timeout', '$uibModalInstance', 'element', 'cvOptions', 'cubesService', 'studioViewsService', 'viewsService', 'view',
                                                                             function ($rootScope, $scope, $timeout, $uibModalInstance, element, cvOptions, cubesService, studioViewsService, viewsService, view) {

	$scope.cvVersion = cubesviewer.version;
	$scope.cvOptions = cvOptions;
	$scope.cubesService = cubesService;
	$scope.studioViewsService = studioViewsService;

	$scope.serializedView = "";

	$scope.initialize = function() {

		$scope.serializedView  = viewsService.serializeView(view);
		console.log("Serialized view: " + $scope.serializedView);

		$timeout(function() {
			window.getSelection().removeAllRanges();
			var range = document.createRange();
			range.selectNodeContents($(element).find(".cv-serialized-view")[0]);
			window.getSelection().addRange(range);
		} , 0);

	};

	$scope.close = function() {
		$uibModalInstance.dismiss('cancel');
	};

	$scope.initialize();

}]);


angular.module('cv.studio').controller("CubesViewerSerializeAddController", ['$rootScope', '$scope', '$uibModalInstance', 'cvOptions', 'cubesService', 'studioViewsService',
                                                                             function ($rootScope, $scope, $uibModalInstance, cvOptions, cubesService, studioViewsService) {

	$scope.cvVersion = cubesviewer.version;
	$scope.cvOptions = cvOptions;
	$scope.cubesService = cubesService;
	$scope.studioViewsService = studioViewsService;

	$scope.serializedView = null;

	/*
	 * Add a serialized view.
	 */
	$scope.addSerializedView = function (serialized) {
		if (serialized != null) {
			var view = studioViewsService.addViewObject(serialized);
		}
		$uibModalInstance.close(serialized);
	};

	$scope.close = function() {
		$uibModalInstance.dismiss('cancel');
	};

}]);



;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

angular.module('cv.studio').service("reststoreService", ['$rootScope', '$http', '$cookies', 'cvOptions', 'cubesService', 'viewsService', 'dialogService', 'studioViewsService',
                                                           function ($rootScope, $http, $cookies, cvOptions, cubesService, viewsService, dialogService, studioViewsService) {

	var reststoreService = this;

	reststoreService.savedViews = [];

	reststoreService.initialize = function() {
		if (! cvOptions.backendUrl) return;
		reststoreService.viewList();
	};

    /**
     * Returns a stored view from memory.
     */
	reststoreService.getSavedView = function(savedId) {
        var view = $.grep(reststoreService.savedViews, function(ed) { return ed.id == savedId; });
        if (view.length > 0) {
            return view[0];
        } else {
            return null;
        }
    };

    /**
     * Save a view.
     */
    reststoreService.saveView = function (view) {

        if (view.owner != cvOptions.user) {
            dialogService.show('Cannot save a view that belongs to other user (try cloning the view).');
            return;
        }

        var data = {
            "id": view.savedId,
            "name": view.params.name,
            "shared": view.shared,
            "data":  viewsService.serializeView(view)
        };

        $http({
        	"method": "POST",
        	"url": cvOptions.backendUrl + "/view/save/",
        	"data": JSON.stringify(data),
        	"headers": {"X-CSRFToken": $cookies.get('csrftoken')},
        }).then(reststoreService._viewSaveCallback(view), cubesService.defaultRequestErrorHandler);

    };

    /**
     * Save callback
     */
    reststoreService._viewSaveCallback = function(view) {

        var view = view;

        return function(data, status) {
            data = data.data;
        	if (view != null) {
                view.savedId = data.id;

                // Manually update saved list to avoid detecting differences as the list hasn't been reloaded
                var sview = reststoreService.getSavedView(view.savedId);
                if (sview != null) {
                    sview.name = view.params.name;
                    sview.shared = view.shared;
                    sview.data = viewsService.serializeView(view)
                }
            }
            reststoreService.viewList();

            dialogService.show("View saved.");
        }

    };

    /**
     * Delete a view.
     */
    reststoreService.deleteView = function (view) {

        if (view.savedId == 0) {
        	dialogService.show("Cannot delete this view as it hasn't been saved.");
            return;
        }
        if (view.owner != cvOptions.user) {
            dialogService.show('Cannot delete a view that belongs to other user.');
            return;
        }

        if (! confirm('Are you sure you want to delete and close this view?')) {
            return;
        }

        var data = {
            "id": view.savedId,
            "data": ""
        };

        studioViewsService.closeView(view);

        $http({
        	"method": "POST",
        	"url": cvOptions.backendUrl + "/view/save/",
        	"data": JSON.stringify(data),
        	"headers": {"X-CSRFToken": $cookies.get('csrftoken')}
         }).then(reststoreService._viewDeleteCallback, cubesviewer.defaultRequestErrorHandler);

    };

    /*
     * Delete callback
     */
    reststoreService._viewDeleteCallback = function() {
    	reststoreService.viewList();
    };

    /*
     * Get view list.
     */
    reststoreService.viewList = function () {
        $http.get(cvOptions.backendUrl + "/view/list/").then(
        		reststoreService._viewListCallback, cubesService.defaultRequestErrorHandler);
    };

    reststoreService._viewListCallback = function(data, status) {
    	reststoreService.savedViews = data.data;
    };

    reststoreService.isViewChanged = function(view) {

        if (view.savedId == 0) return false;

        // Find saved copy
        var sview = reststoreService.getSavedView(view.savedId);

        // Find differences
        if (sview != null) {
            if (view.params.name != sview.name) return true;
            if (view.shared != sview.shared) return true;
            if (viewsService.serializeView(view) != sview.data) return true;
        }

        return false;

	};

    /**
     * Change shared mode
     */
	reststoreService.shareView = function(view, sharedstate) {

        if (view.owner != cvOptions.user) {
            dialogService.show('Cannot share/unshare a view that belongs to other user (try cloning the view).');
            return;
        }

        view.shared = ( sharedstate == 1 ? true : false );
        reststoreService.saveView(view);

    };

    /**
     * Loads a view from the backend.
     * This is equivalent to other view adding methods in the cubesviewer.gui namespace,
     * like "addViewCube" or "addViewObject", but thisloads the view definition from
     * the storage backend.
     */
    reststoreService.addSavedView = function(savedViewId) {

    	// TODO: Check whether the server model is loaded, etc

        var savedview = reststoreService.getSavedView(savedViewId);
        var viewobject = $.parseJSON(savedview.data);
        var view = studioViewsService.addViewObject(viewobject);

        if (savedview.owner == cvOptions.user) {
        	view.savedId = savedview.id;
        	view.owner = savedview.owner;
        	view.shared = savedview.shared;
        } else {
        	view.savedId = 0;
        	view.owner = cvOptions.user;
        	view.shared = false;
        }

    };

    reststoreService.initialize();

}]);

;/*
 * CubesViewer
 * Copyright (c) 2012-2016 Jose Juan Montes, see AUTHORS for more details
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


/*
 * Google Analytics events tracking service.
 *
 * When enabled, it uses Google Analytics event system to
 * log CubesViewer operations. Model loading, Aggregations, Facts and Dimension queries
 * are registered as non-interactive events (and don't affect bounce rate). Each
 * view refresh is registered as an interactive event.
 *
 */


"use strict";

angular.module('cv.cubes').service("gaService", ['$rootScope', '$http', '$cookies', '$log', 'cvOptions',
                                                  function ($rootScope, $http, $cookies, $log, cvOptions) {

	var gaService = this;

	this.ignorePeriod = 12; // 35

	this.initTime = new Date();

	this.initialize = function() {
		if (cvOptions.gaTrackEvents) $log.debug("Google Analytics events tracking plugin enabled.")
	};

	this.trackRequest = function(path) {

		if (! (cvOptions.gaTrackEvents)) return;
		if ((((new Date()) - this.initTime) / 1000) < this.ignorePeriod) return;

		// Track request, through Google Analytics events API
		var event = null;
		var pathParts = path.split("/");
		var modelPos = pathParts.indexOf("cube");

		if (modelPos >= 0) {
			pathParts = pathParts.slice(modelPos + 1);

			if (pathParts[1] == "model") {
				event = ['model', pathParts[0]];
			} else if (pathParts[1] == "aggregate") {
				event = ['aggregate', pathParts[0]];
			} else if (pathParts[1] == "facts") {
				event = ['facts', pathParts[0]];
			} else if (pathParts[1] == "members") {
				event = ['dimension', pathParts[2]];
			}
		}


		if (event) {
			if (typeof ga !== 'undefined') {
				ga('send', 'event', "CubesViewer", event[0], event[1]);
				$log.debug("Tracking GA event: " + event[0] + "/" + event[1]);
			} else {
				$log.debug("Cannot track CubesViewer events: GA object 'ga' not available.")
			}
		} else {
			$log.warn("Unknown cubes operation, cannot be tracked by GA service: " + path)
		}

	};

	this.initialize();

}]);


;angular.module('cv').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('dialog/dialog.html',
    "  <div class=\"modal-header\">\n" +
    "    <button type=\"button\" ng-click=\"close()\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\"><i class=\"fa fa-fw fa-close\"></i></span></button>\n" +
    "    <h4 class=\"modal-title\" id=\"myModalLabel\"><i class=\"fa fa-fw fa-exclamation\"></i> CubesViewer</h4>\n" +
    "  </div>\n" +
    "  <div class=\"modal-body\">\n" +
    "        <p>{{ dialog.text }}</p>\n" +
    "  </div>\n" +
    "  <div class=\"modal-footer\">\n" +
    "    <!-- <button type=\"button\" ng-click=\"close()\" class=\"btn btn-secondary\" data-dismiss=\"modal\">Cancel</button>  -->\n" +
    "    <button type=\"button\" ng-click=\"close()\" class=\"btn btn-primary\" data-dismiss=\"modal\">Close</button>\n" +
    "  </div>\n" +
    "\n"
  );


  $templateCache.put('studio/about.html',
    "<div class=\"modal fade\" id=\"cvAboutModal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"\">\n" +
    "  <div class=\"modal-dialog\" role=\"document\">\n" +
    "    <div class=\"modal-content\">\n" +
    "      <div class=\"modal-header\">\n" +
    "        <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\"><i class=\"fa fa-fw fa-close\"></i></span></button>\n" +
    "        <h4 class=\"modal-title\" id=\"myModalLabel\"><i class=\"cv-logo-embedded\"></i> CubesViewer</h4>\n" +
    "      </div>\n" +
    "      <div class=\"modal-body\">\n" +
    "\n" +
    "            <p><a href=\"http://jjmontesl.github.io/cubesviewer/\" target=\"_blank\">CubesViewer</a> is a visual, web-based application for exploring and analyzing\n" +
    "            OLAP databases served by the <a href=\"http://cubes.databrewery.org/\" target=\"_blank\">Cubes OLAP Framework</a>.</p>\n" +
    "            <hr />\n" +
    "\n" +
    "            <p>Version {{ cvVersion }}<br />\n" +
    "            <a href=\"https://github.com/jjmontesl/cubesviewer/\" target=\"_blank\">https://github.com/jjmontesl/cubesviewer/</a></p>\n" +
    "\n" +
    "            <p>by José Juan Montes and others (see AUTHORS)<br />\n" +
    "            2012 - 2016</p>\n" +
    "\n" +
    "            <p>\n" +
    "            <a href=\"http://github.com/jjmontesl/cubesviewer/blob/master/LICENSE.txt\" target=\"_blank\">LICENSE</a>\n" +
    "            </p>\n" +
    "\n" +
    "      </div>\n" +
    "      <div class=\"modal-footer\">\n" +
    "        <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\"><i class=\"fa fa-cube\"></i> Close</button>\n" +
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
    "        <div ng-if=\"! cvOptions.hideControls\" class=\"panel-heading\">\n" +
    "\n" +
    "            <button type=\"button\" ng-click=\"studioViewsService.closeView(view)\" class=\"btn btn-danger btn-xs pull-right hidden-print\" style=\"margin-left: 10px;\"><i class=\"fa fa-fw fa-close\"></i></button>\n" +
    "            <button type=\"button\" ng-click=\"studioViewsService.toggleCollapseView(view)\" class=\"btn btn-primary btn-xs pull-right hidden-print\" style=\"margin-left: 5px;\"><i class=\"fa fa-fw\" ng-class=\"{'fa-caret-up': !view.collapsed, 'fa-caret-down': view.collapsed }\"></i></button>\n" +
    "\n" +
    "            <i class=\"fa fa-fw fa-file\"></i> <span class=\"cv-gui-title\" style=\"cursor: pointer;\" ng-dblclick=\"studioViewsService.studioScope.showRenameView(view)\"><a name=\"cvView{{ view.id }}\"></a>{{ view.params.name }}</span>\n" +
    "\n" +
    "            <span ng-if=\"view.savedId > 0 && reststoreService.isViewChanged(view)\" class=\"badge cv-gui-container-state\" style=\"margin-left: 15px; font-size: 80%;\">Modified</span>\n" +
    "            <span ng-if=\"view.savedId > 0 && !reststoreService.isViewChanged(view)\" class=\"badge cv-gui-container-state\" style=\"margin-left: 15px; font-size: 80%;\">Saved</span>\n" +
    "            <span ng-if=\"view.shared\" class=\"badge cv-gui-container-state\" style=\"margin-left: 5px; font-size: 80%;\">Shared</span>\n" +
    "\n" +
    "            <button type=\"button\" class=\"btn btn-danger btn-xs\" style=\"visibility: hidden;\"><i class=\"fa fa-fw fa-info\"></i></button>\n" +
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


  $templateCache.put('studio/rename.html',
    "  <div class=\"modal-header\">\n" +
    "    <button type=\"button\" ng-click=\"close();\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\"><i class=\"fa fa-fw fa-close\"></i></span></button>\n" +
    "    <h4 class=\"modal-title\" id=\"myModalLabel\"><i class=\"fa fa-pencil\"></i> Rename view</h4>\n" +
    "  </div>\n" +
    "  <div class=\"modal-body\">\n" +
    "\n" +
    "        <form class=\"form\" ng-submit=\"renameView(viewName);\">\n" +
    "            <div class=\"form-group\">\n" +
    "                <label for=\"serializedView\">Name:</label>\n" +
    "                <input class=\"form-control\" ng-model=\"viewName\" />\n" +
    "            </div>\n" +
    "        </form>\n" +
    "\n" +
    "  </div>\n" +
    "  <div class=\"modal-footer\">\n" +
    "    <button type=\"button\" ng-click=\"close();\" class=\"btn btn-secondary\" data-dismiss=\"modal\">Cancel</button>\n" +
    "    <button type=\"button\" ng-click=\"renameView(viewName);\" class=\"btn btn-primary\" data-dismiss=\"modal\">Rename</button>\n" +
    "  </div>\n" +
    "\n"
  );


  $templateCache.put('studio/serialize-add.html',
    "  <div class=\"modal-header\">\n" +
    "    <button type=\"button\" ng-click=\"close()\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\"><i class=\"fa fa-fw fa-close\"></i></span></button>\n" +
    "    <h4 class=\"modal-title\" id=\"myModalLabel\"><i class=\"fa fa-code\"></i> Add view from serialized JSON</h4>\n" +
    "  </div>\n" +
    "  <div class=\"modal-body\">\n" +
    "\n" +
    "        <div class=\"form\">\n" +
    "            <label for=\"serializedView\">Code:</label>\n" +
    "            <textarea class=\"form-control\" ng-model=\"serializedView\" style=\"width: 100%; height: 12em;\" />\n" +
    "        </div>\n" +
    "\n" +
    "  </div>\n" +
    "  <div class=\"modal-footer\">\n" +
    "    <button type=\"button\" ng-click=\"close()\" class=\"btn btn-secondary\" data-dismiss=\"modal\">Cancel</button>\n" +
    "    <button type=\"button\" ng-click=\"addSerializedView(serializedView)\" class=\"btn btn-primary\" data-dismiss=\"modal\">Add View</button>\n" +
    "  </div>\n" +
    "\n"
  );


  $templateCache.put('studio/serialize-view.html',
    "  <div class=\"modal-header\">\n" +
    "    <button type=\"button\" ng-click=\"close()\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\"><i class=\"fa fa-fw fa-close\"></i></span></button>\n" +
    "    <h4 class=\"modal-title\" id=\"myModalLabel\"><i class=\"fa fa-code\"></i> Serialized View</h4>\n" +
    "  </div>\n" +
    "  <div class=\"modal-body\">\n" +
    "\n" +
    "        <div class=\"form\">\n" +
    "            <label for=\"serializedView\">View definition JSON:</label>\n" +
    "            <textarea class=\"form-control cv-serialized-view\" ng-bind=\"serializedView\" style=\"width: 100%; height: 12em;\" readonly></textarea>\n" +
    "        </div>\n" +
    "\n" +
    "  </div>\n" +
    "  <div class=\"modal-footer\">\n" +
    "    <button type=\"button\" ng-click=\"close()\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n" +
    "  </div>\n" +
    "\n"
  );


  $templateCache.put('studio/serverinfo.html',
    "<div class=\"modal fade\" id=\"cvServerInfo\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"\">\n" +
    "  <div class=\"modal-dialog\" role=\"document\">\n" +
    "    <div class=\"modal-content\">\n" +
    "      <div class=\"modal-header\">\n" +
    "        <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\"><i class=\"fa fa-fw fa-close\"></i></span></button>\n" +
    "        <h4 class=\"modal-title\" id=\"myModalLabel\"><i class=\"fa fa-fw fa-database\"></i> Server info</h4>\n" +
    "      </div>\n" +
    "      <div class=\"modal-body\">\n" +
    "\n" +
    "            <p>\n" +
    "                <i>This CubesViewer version supports Cubes Server version 1.0.x and 1.1.x</i><br />\n" +
    "                <br />\n" +
    "                <b>Server version:</b> {{ cubesService.cubesserver.server_version }} <br />\n" +
    "                <b>Cubes version:</b> {{ cubesService.cubesserver.cubes_version }} <br />\n" +
    "                <b>API version:</b> {{ cubesService.cubesserver.api_version }} <br />\n" +
    "            </p>\n" +
    "            <p>\n" +
    "                <b>Timezone:</b> {{ cubesService.cubesserver.info.timezone }} <br />\n" +
    "                <b>Week start:</b> {{ cubesService.cubesserver.info.first_weekday }} <br />\n" +
    "            </p>\n" +
    "            <p>\n" +
    "                <b>Result limit:</b> <strong class=\"text-warning\">{{ cubesService.cubesserver.info.json_record_limit }}</strong> items<br />\n" +
    "            </p>\n" +
    "\n" +
    "      </div>\n" +
    "      <div class=\"modal-footer\">\n" +
    "        <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\"> Close</button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "\n"
  );


  $templateCache.put('studio/studio.html',
    "<div class=\"cv-bootstrap\" ng-controller=\"CubesViewerStudioController\">\n" +
    "\n" +
    "    <div class=\"cv-gui-panel hidden-print\">\n" +
    "\n" +
    "        <div class=\"dropdown m-b\" style=\"display: inline-block;\">\n" +
    "          <button class=\"btn btn-primary dropdown-toggle\" type=\"button\" data-toggle=\"dropdown\" data-submenu>\n" +
    "            <i class=\"fa fa-fw fa-cube\"></i> Cubes <span class=\"caret\"></span>\n" +
    "          </button>\n" +
    "\n" +
    "          <ul class=\"dropdown-menu cv-gui-cubeslist-menu\">\n" +
    "\n" +
    "            <li ng-show=\"cubesService.state === 1\" class=\"disabled\"><a>Loading...</a></li>\n" +
    "            <li ng-show=\"cubesService.state === 2 && cubesService.cubesserver._cube_list.length === 0\" class=\"disabled\"><a>No cubes found</a></li>\n" +
    "            <li ng-show=\"cubesService.state === 3\" class=\"disabled text-danger\"><a>Loading failed</a></li>\n" +
    "\n" +
    "            <li ng-repeat=\"cube in cubesService.cubesserver._cube_list | orderBy:'label'\" ng-click=\"studioViewsService.addViewCube(cube.name)\"><a>{{ cube.label }}</a></li>\n" +
    "\n" +
    "          </ul>\n" +
    "        </div>\n" +
    "\n" +
    "\n" +
    "        <div ng-if=\"cvOptions.backendUrl\" class=\"dropdown m-b\" style=\"display: inline-block; \">\n" +
    "          <button class=\"btn btn-primary dropdown-toggle\" type=\"button\" data-toggle=\"dropdown\" data-submenu>\n" +
    "            <i class=\"fa fa-fw fa-file\"></i> Saved views <span class=\"caret\"></span>\n" +
    "          </button>\n" +
    "\n" +
    "          <ul class=\"dropdown-menu cv-gui-catalog-menu\">\n" +
    "\n" +
    "            <li class=\"dropdown-header\">Personal views</li>\n" +
    "\n" +
    "            <!-- <li ng-show=\"true\" class=\"disabled\"><a>Loading...</a></li>  -->\n" +
    "            <li ng-repeat=\"sv in reststoreService.savedViews | orderBy:'sv.name'\" ng-if=\"sv.owner == cvOptions.user\" ng-click=\"reststoreService.addSavedView(sv.id)\"><a style=\"max-width: 360px; overflow-x: hidden; text-overflow: ellipsis; white-space: nowrap;\"><i class=\"fa fa-fw\"></i> {{ sv.name }}</a></li>\n" +
    "\n" +
    "            <li class=\"dropdown-header\">Shared by others</li>\n" +
    "\n" +
    "            <!-- <li ng-show=\"true\" class=\"disabled\"><a>Loading...</a></li>  -->\n" +
    "            <li ng-repeat=\"sv in reststoreService.savedViews | orderBy:'sv.name'\" ng-if=\"sv.shared && sv.owner != cvOptions.user\" ng-click=\"reststoreService.addSavedView(sv.id)\"><a style=\"max-width: 360px; overflow-x: hidden; text-overflow: ellipsis; white-space: nowrap;\"><i class=\"fa fa-fw\"></i> {{ sv.name }}</a></li>\n" +
    "\n" +
    "          </ul>\n" +
    "        </div>\n" +
    "\n" +
    "\n" +
    "        <div class=\"dropdown m-b\" style=\"display: inline-block; margin-left: 5px;\">\n" +
    "          <button class=\"btn btn-primary dropdown-toggle\" type=\"button\" data-toggle=\"dropdown\" data-submenu>\n" +
    "            <i class=\"fa fa-fw fa-wrench\"></i> Tools <span class=\"caret\"></span>\n" +
    "          </button>\n" +
    "\n" +
    "          <ul class=\"dropdown-menu\">\n" +
    "\n" +
    "                <li ng-click=\"showSerializeAdd()\"><a tabindex=\"0\"><i class=\"fa fa-fw fa-code\"></i> Add view from JSON...</a></li>\n" +
    "\n" +
    "                <div class=\"divider\"></div>\n" +
    "\n" +
    "                <li ng-click=\"toggleTwoColumn()\" ng-class=\"{ 'hidden-xs': ! cvOptions.studioTwoColumn, 'disabled': studioViewsService.views.length == 0 }\"><a tabindex=\"0\"><i class=\"fa fa-fw fa-columns\"></i> 2 column\n" +
    "                    <span class=\"label label-default\" style=\"margin-left: 10px;\" ng-class=\"{ 'label-success': cvOptions.studioTwoColumn }\">{{ cvOptions.studioTwoColumn ? \"ON\" : \"OFF\" }}</span></a>\n" +
    "                </li>\n" +
    "                <li ng-click=\"toggleHideControls()\" ng-class=\"{ 'disabled': studioViewsService.views.length == 0 }\"><a tabindex=\"0\"><i class=\"fa fa-fw fa-unlock-alt\"></i> Hide controls\n" +
    "                    <span class=\"label label-default\" style=\"margin-left: 10px;\" ng-class=\"{ 'label-success': cvOptions.hideControls }\">{{ cvOptions.hideControls ? \"ON\" : \"OFF\" }}</span></a>\n" +
    "                </li>\n" +
    "\n" +
    "                <div class=\"divider\"></div>\n" +
    "\n" +
    "\n" +
    "                <!-- <li class=\"\"><a data-toggle=\"modal\" data-target=\"#cvServerInfo\"><i class=\"fa fa-fw fa-server\"></i> Data model</a></li> -->\n" +
    "                <li class=\"\" ng-class=\"{ 'disabled': cubesService.state != 2 }\"><a data-toggle=\"modal\" data-target=\"#cvServerInfo\" ><i class=\"fa fa-fw fa-database\"></i> Server info</a></li>\n" +
    "\n" +
    "                <div class=\"divider\"></div>\n" +
    "\n" +
    "                <li class=\"\"><a href=\"http://github.com/jjmontesl/cubesviewer/blob/master/doc/guide/cubesviewer-user-main.md\" target=\"_blank\"><i class=\"fa fa-fw fa-question\"></i> User guide</a></li>\n" +
    "                <li class=\"\"><a data-toggle=\"modal\" data-target=\"#cvAboutModal\"><i class=\"fa fa-fw fa-info\"></i> About CubesViewer...</a></li>\n" +
    "\n" +
    "            </ul>\n" +
    "        </div>\n" +
    "\n" +
    "        <div style=\"display: inline-block; margin-left: 10px; margin-bottom: 0px;\">\n" +
    "\n" +
    "             <div class=\"form-group hidden-xs\" style=\"display: inline-block; margin-bottom: 0px;\">\n" +
    "                <button class=\"btn\" type=\"button\" title=\"2 column\" ng-disabled=\"studioViewsService.views.length == 0\" ng-class=\"cvOptions.studioTwoColumn ? 'btn-active btn-success' : 'btn-primary'\" ng-click=\"toggleTwoColumn()\"><i class=\"fa fa-fw fa-columns\"></i></button>\n" +
    "             </div>\n" +
    "             <div class=\"form-group\" style=\"display: inline-block; margin-bottom: 0px;\">\n" +
    "                <button class=\"btn\" type=\"button\" title=\"Hide controls\" ng-disabled=\"studioViewsService.views.length == 0\" ng-class=\"cvOptions.hideControls ? 'btn-active btn-success' : 'btn-primary'\" ng-click=\"toggleHideControls()\"><i class=\"fa fa-fw fa-unlock-alt\"></i></button>\n" +
    "             </div>\n" +
    "\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"cv-gui-modals\">\n" +
    "            <div ng-include=\"'studio/about.html'\"></div>\n" +
    "            <div ng-include=\"'studio/serverinfo.html'\"></div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"cv-gui-workspace\">\n" +
    "\n" +
    "        <div class=\"row\">\n" +
    "            <div ng-if=\"cubesService.state == 3\" class=\"col-xs-12\" style=\"margin-bottom: 10px;\">\n" +
    "                <div class=\"alert alert-danger\" style=\"margin: 0px;\">\n" +
    "                    <p>Could not connect to server: {{ cubesService.stateText }}</p>\n" +
    "                    <p>Please try again and contact your administrator if the problem persists.</p>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row cv-views-container\" data-masonry='{ \"itemSelector\": \".cv-view-container\", \"columnWidth\": \".cv-views-gridsizer\", \"percentPosition\": true }'>\n" +
    "\n" +
    "            <div class=\"col-xs-1 cv-views-gridsizer\"></div>\n" +
    "\n" +
    "            <div ng-repeat=\"studioView in studioViewsService.views\" style=\"display: none;\" class=\"col-xs-12 cv-view-container sv{{ studioView.id }}\" ng-class=\"(cvOptions.studioTwoColumn ? 'col-sm-6' : 'col-sm-12')\">\n" +
    "                <div >\n" +
    "                    <div cv-studio-view view=\"studioView\"></div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "\n"
  );


  $templateCache.put('views/cube/alerts.html',
    "<div>\n" +
    "\n" +
    "    <div ng-if=\"view.requestFailed\" class=\"alert alert-dismissable alert-danger\" style=\"margin-bottom: 5px;\">\n" +
    "        <div style=\"display: inline-block;\"><i class=\"fa fa-exclamation\"></i></div>\n" +
    "        <div style=\"display: inline-block; margin-left: 20px;\">\n" +
    "            An error has occurred. Cannot present view.<br />\n" +
    "            Please try again and contact your administrator if the problem persists.\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"view.resultLimitHit\" class=\"alert alert-dismissable alert-warning\" style=\"margin-bottom: 5px;\">\n" +
    "        <button type=\"button\" class=\"close\" ng-click=\"view._resultLimitHit = false;\" data-dismiss=\"alert\" aria-hidden=\"true\">&times;</button>\n" +
    "        <div style=\"display: inline-block; vertical-align: top;\"><i class=\"fa fa-exclamation\"></i></div>\n" +
    "        <div style=\"display: inline-block; margin-left: 20px;\">\n" +
    "            Limit of {{ cubesService.cubesserver.info.json_record_limit }} items has been hit. <b>Results are incomplete.</b><br />\n" +
    "            <i>Tip</i>: reduce level of drilldown or filter your selection to reduce the number of items in the result.\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('views/cube/chart/chart-common.html',
    "<div ng-show=\"(view.grid.data.length > 0 && view.params.yaxis != null) && (!(view.params.charttype == 'pie' && view.grid.columnDefs.length > 2)) && (!(view.params.charttype == 'radar' && view.grid.columnDefs.length < 4))\" style=\"width: 99%;\">\n" +
    "    <div>\n" +
    "        <div class=\"cv-chart-container\">\n" +
    "            <svg style=\"height: 400px;\" />\n" +
    "        </div>\n" +
    "        <div ng-hide=\"view.getControlsHidden() || view.params.charttype == 'radar'\" style=\"font-size: 8px; float: right;\">\n" +
    "            <a href=\"\" class=\"cv-chart-height\" ng-click=\"chartCtrl.resizeChart(400);\">Small</a>\n" +
    "            <a href=\"\" class=\"cv-chart-height\" ng-click=\"chartCtrl.resizeChart(550);\">Medium</a>\n" +
    "            <a href=\"\" class=\"cv-chart-height\" ng-click=\"chartCtrl.resizeChart(700);\">Tall</a>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div ng-if=\"view.params.yaxis == null\" class=\"alert alert-info\" style=\"margin-bottom: 0px;\">\n" +
    "    <p>\n" +
    "        Cannot present chart: no <b>measure</b> has been selected.\n" +
    "    </p>\n" +
    "    <p>\n" +
    "        Tip: use the <kbd><i class=\"fa fa-fw fa-cogs\"></i> View &gt; <i class=\"fa fa-fw fa-crosshairs\"></i> Measure</kbd> menu.\n" +
    "    </p>\n" +
    "</div>\n" +
    "\n" +
    "<div ng-if=\"view.pendingRequests == 0 && view.params.yaxis != null && view.grid.data.length == 0\" class=\"alert alert-info\" style=\"margin-bottom: 0px;\">\n" +
    "    <p>\n" +
    "        Cannot present chart: <b>no rows returned</b> by the current filtering, horizontal dimension, and drilldown combination.\n" +
    "    </p>\n" +
    "    <p>\n" +
    "        Tip: use the <kbd><i class=\"fa fa-fw fa-cogs\"></i> View</kbd> menu to select an horizontal dimension.\n" +
    "    </p>\n" +
    "</div>\n" +
    "\n" +
    "<div ng-if=\"view.pendingRequests == 0 && view.params.charttype == 'pie' && view.grid.columnDefs.length > 2\" class=\"alert alert-info\" style=\"margin-bottom: 0px;\">\n" +
    "    <p>\n" +
    "        Cannot present a <b>pie chart</b> when <b>more than one column</b> is present.<br />\n" +
    "    </p>\n" +
    "    <p>\n" +
    "        Tip: review chart data and columns in <a href=\"\" ng-click=\"setViewMode('series')\" class=\"alert-link\">series mode</a>,\n" +
    "        or <a href=\"\" ng-click=\"selectXAxis(null);\" class=\"alert-link\">remove horizontal dimension</a>.\n" +
    "    </p>\n" +
    "</div>\n" +
    "\n" +
    "<div ng-if=\"view.pendingRequests == 0 && view.params.yaxis != null && view.params.charttype == 'radar' && view.grid.columnDefs.length < 4\" class=\"alert alert-info\" style=\"margin-bottom: 0px;\">\n" +
    "    Cannot present a <b>radar chart</b> when <b>less than 3 columns</b> are present.<br />\n" +
    "    Tip: review chart data and columns in <a href=\"\" ng-click=\"setViewMode('series')\" class=\"alert-link\">series mode</a>.\n" +
    "</div>\n"
  );


  $templateCache.put('views/cube/chart/chart.html',
    "<div ng-controller=\"CubesViewerViewsCubeChartController as chartCtrl\">\n" +
    "\n" +
    "    <div ng-if=\"view.params.charttype == 'pie'\">\n" +
    "        <h3><i class=\"fa fa-fw fa-pie-chart\"></i> Chart\n" +
    "            <i ng-show=\"view.pendingRequests > 0\" class=\"fa fa-circle-o-notch fa-spin fa-fw margin-bottom text-info pull-right\"></i>\n" +
    "        </h3>\n" +
    "        <div ng-if=\"view.pendingRequests > 0\" class=\"loadingbar-content\">\n" +
    "            <span class=\"loadingbar-expand\"></span>\n" +
    "        </div>\n" +
    "        <div ng-controller=\"CubesViewerViewsCubeChartPieController\">\n" +
    "            <div ng-include=\"'views/cube/chart/chart-common.html'\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"view.params.charttype == 'bars-vertical'\">\n" +
    "        <h3><i class=\"fa fa-fw fa-bar-chart\"></i> Chart\n" +
    "            <i ng-show=\"view.pendingRequests > 0\" class=\"fa fa-circle-o-notch fa-spin fa-fw margin-bottom text-info pull-right\"></i>\n" +
    "        </h3>\n" +
    "        <div ng-if=\"view.pendingRequests > 0\" class=\"loadingbar-content\">\n" +
    "            <span class=\"loadingbar-expand\"></span>\n" +
    "        </div>\n" +
    "        <div ng-controller=\"CubesViewerViewsCubeChartBarsVerticalController\">\n" +
    "            <div ng-include=\"'views/cube/chart/chart-common.html'\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"view.params.charttype == 'bars-horizontal'\">\n" +
    "        <h3><i class=\"fa fa-fw fa-bar-chart fa-rotate-270\"></i> Chart\n" +
    "            <i ng-show=\"view.pendingRequests > 0\" class=\"fa fa-circle-o-notch fa-spin fa-fw margin-bottom text-info pull-right\"></i>\n" +
    "        </h3>\n" +
    "        <div ng-if=\"view.pendingRequests > 0\" class=\"loadingbar-content\">\n" +
    "            <span class=\"loadingbar-expand\"></span>\n" +
    "        </div>\n" +
    "        <div ng-controller=\"CubesViewerViewsCubeChartBarsHorizontalController\">\n" +
    "            <div ng-include=\"'views/cube/chart/chart-common.html'\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"view.params.charttype == 'lines'\">\n" +
    "        <h3><i class=\"fa fa-fw fa-line-chart\"></i> Chart\n" +
    "            <i ng-show=\"view.pendingRequests > 0\" class=\"fa fa-circle-o-notch fa-spin fa-fw margin-bottom text-info pull-right\"></i>\n" +
    "        </h3>\n" +
    "        <div ng-if=\"view.pendingRequests > 0\" class=\"loadingbar-content\">\n" +
    "            <span class=\"loadingbar-expand\"></span>\n" +
    "        </div>\n" +
    "        <div ng-controller=\"CubesViewerViewsCubeChartLinesController\">\n" +
    "            <div ng-include=\"'views/cube/chart/chart-common.html'\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"view.params.charttype == 'lines-stacked'\">\n" +
    "        <h3><i class=\"fa fa-fw fa-area-chart\"></i> Chart\n" +
    "            <i ng-show=\"view.pendingRequests > 0\" class=\"fa fa-circle-o-notch fa-spin fa-fw margin-bottom text-info pull-right\"></i>\n" +
    "        </h3>\n" +
    "        <div ng-if=\"view.pendingRequests > 0\" class=\"loadingbar-content\">\n" +
    "            <span class=\"loadingbar-expand\"></span>\n" +
    "        </div>\n" +
    "        <div ng-controller=\"CubesViewerViewsCubeChartLinesController\">\n" +
    "            <div ng-include=\"'views/cube/chart/chart-common.html'\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"view.params.charttype == 'radar'\">\n" +
    "        <h3><i class=\"fa fa-fw fa-bullseye\"></i> Chart\n" +
    "            <i ng-show=\"view.pendingRequests > 0\" class=\"fa fa-circle-o-notch fa-spin fa-fw margin-bottom text-info pull-right\"></i>\n" +
    "        </h3>\n" +
    "        <div ng-if=\"view.pendingRequests > 0\" class=\"loadingbar-content\">\n" +
    "            <span class=\"loadingbar-expand\"></span>\n" +
    "        </div>\n" +
    "        <div ng-controller=\"CubesViewerViewsCubeChartRadarController\">\n" +
    "            <div ng-include=\"'views/cube/chart/chart-common.html'\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"view.params.charttype == 'sunburst'\">\n" +
    "        <h3><i class=\"fa fa-fw fa-sun-o\"></i> Chart\n" +
    "            <i ng-show=\"view.pendingRequests > 0\" class=\"fa fa-circle-o-notch fa-spin fa-fw margin-bottom text-info pull-right\"></i>\n" +
    "        </h3>\n" +
    "        <div ng-if=\"view.pendingRequests > 0\" class=\"loadingbar-content\">\n" +
    "            <span class=\"loadingbar-expand\"></span>\n" +
    "        </div>\n" +
    "        <div ng-controller=\"CubesViewerViewsCubeChartSunburstController\">\n" +
    "            <div ng-include=\"'views/cube/chart/chart-common.html'\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('views/cube/cube-menu-drilldown.html',
    "  <button class=\"btn btn-primary btn-sm dropdown-toggle drilldownbutton\" ng-disabled=\"view.params.mode == 'facts'\" type=\"button\" data-toggle=\"dropdown\" data-submenu>\n" +
    "    <i class=\"fa fa-fw fa-arrow-down\"></i> <span class=\"hidden-xs\" ng-class=\"{ 'hidden-sm hidden-md': cvOptions.studioTwoColumn }\">Drilldown</span> <span class=\"caret\"></span>\n" +
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
    "            <li ng-repeat=\"level in dimension.default_hierarchy().levels\" ng-click=\"selectDrill(dimension.name + '@' + dimension.default_hierarchy().name + ':' + level.name, true)\"><a href=\"\">{{ level.label }}</a></li>\n" +
    "        </ul>\n" +
    "\n" +
    "      </li>\n" +
    "\n" +
    "      <div class=\"divider\"></div>\n" +
    "\n" +
    "      <li ng-class=\"{ 'disabled': view.params.drilldown.length == 0 }\" ng-click=\"selectDrill('')\"><a href=\"\"><i class=\"fa fa-fw fa-close\"></i> None</a></li>\n" +
    "\n" +
    "  </ul>\n" +
    "\n"
  );


  $templateCache.put('views/cube/cube-menu-filter.html',
    "  <button class=\"btn btn-primary btn-sm dropdown-toggle cutbutton\" type=\"button\" data-toggle=\"dropdown\" data-submenu>\n" +
    "    <i class=\"fa fa-fw fa-filter\"></i> <span class=\"hidden-xs\" ng-class=\"{ 'hidden-sm hidden-md': cvOptions.studioTwoColumn }\">Filter</span> <span class=\"caret\"></span>\n" +
    "  </button>\n" +
    "\n" +
    "  <ul class=\"dropdown-menu dropdown-menu-right cv-view-menu cv-view-menu-cut\">\n" +
    "\n" +
    "    <li ng-show=\"view.params.mode == 'explore'\" ng-click=\"filterSelected()\" ng-class=\"{ 'disabled': view.params.drilldown.length != 1 }\"><a href=\"\"><i class=\"fa fa-fw fa-filter\"></i> Filter selected rows</a></li>\n" +
    "    <div ng-show=\"view.params.mode == 'explore'\" class=\"divider\"></div>\n" +
    "\n" +
    "    <li class=\"dropdown-submenu\">\n" +
    "        <a tabindex=\"0\"><i class=\"fa fa-fw fa-bars\"></i> Dimension filter</a>\n" +
    "        <ul class=\"dropdown-menu\">\n" +
    "\n" +
    "          <li on-repeat-done ng-repeat-start=\"dimension in view.cube.dimensions\" ng-if=\"dimension.levels.length == 1\" ng-click=\"showDimensionFilter(dimension.name);\">\n" +
    "            <a href=\"\">{{ dimension.label }}</a>\n" +
    "          </li>\n" +
    "          <li ng-repeat-end ng-if=\"dimension.levels.length != 1\" class=\"dropdown-submenu\">\n" +
    "            <a tabindex=\"0\">{{ dimension.label }}</a>\n" +
    "\n" +
    "            <ul ng-if=\"dimension.hierarchies_count() != 1\" class=\"dropdown-menu\">\n" +
    "                <li ng-repeat=\"(hikey,hi) in dimension.hierarchies\" class=\"dropdown-submenu\">\n" +
    "                    <a tabindex=\"0\" href=\"\" onclick=\"return false;\">{{ hi.label }}</a>\n" +
    "                    <ul class=\"dropdown-menu\">\n" +
    "                        <!-- ng-click=\"selectDrill(dimension.name + '@' + hi.name + ':' + level.name, true)\"  -->\n" +
    "                        <li ng-repeat=\"level in hi.levels\" ng-click=\"showDimensionFilter(dimension.name + '@' + hi.name + ':' + level.name )\"><a href=\"\">{{ level.label }}</a></li>\n" +
    "                    </ul>\n" +
    "                </li>\n" +
    "            </ul>\n" +
    "\n" +
    "            <ul ng-if=\"dimension.hierarchies_count() == 1\" class=\"dropdown-menu\">\n" +
    "                <!--  selectDrill(dimension.name + ':' + level.name, true) -->\n" +
    "                <li ng-repeat=\"level in dimension.default_hierarchy().levels\" ng-click=\"showDimensionFilter(dimension.name + '@' + dimension.default_hierarchy().name + ':' + level.name);\"><a href=\"\">{{ level.label }}</a></li>\n" +
    "            </ul>\n" +
    "\n" +
    "          </li>\n" +
    "\n" +
    "        </ul>\n" +
    "    </li>\n" +
    "\n" +
    "    <li class=\"dropdown-submenu\">\n" +
    "        <a tabindex=\"0\"><i class=\"fa fa-fw fa-calendar\"></i> Date filter</a>\n" +
    "        <ul class=\"dropdown-menu\">\n" +
    "          <li ng-repeat=\"dimension in view.cube.dimensions\" ng-if=\"dimension.isDateDimension()\">\n" +
    "            <a href=\"\" ng-click=\"selectDateFilter(dimension.name + ((dimension.info['cv-datefilter-hierarchy']) ? '@' + dimension.info['cv-datefilter-hierarchy'] : ''), true)\">\n" +
    "                {{ dimension.label + ((dimension.hierarchy(dimension.info[\"cv-datefilter-hierarchy\"])) ? \" / \" + dimension.hierarchy(dimension.info[\"cv-datefilter-hierarchy\"]).label : \"\") }}\n" +
    "            </a>\n" +
    "          </li>\n" +
    "          <li ng-if=\"view.cube.dateDimensions().length == 0\" class=\"disabled\">\n" +
    "            <a href=\"\" ng-click=\"\"><i>No date filters defined for this cube.</i></a>\n" +
    "          </li>\n" +
    "\n" +
    "        </ul>\n" +
    "    </li>\n" +
    "\n" +
    "    <!--\n" +
    "    <li class=\"dropdown-submenu\">\n" +
    "        <a tabindex=\"0\"><i class=\"fa fa-fw fa-arrows-h\"></i> Range filter</a>\n" +
    "        <ul class=\"dropdown-menu\">\n" +
    "\n" +
    "          <li on-repeat-done ng-repeat-start=\"dimension in view.cube.dimensions\" ng-if=\"dimension.levels.length == 1\" ng-click=\"showDimensionFilter(dimension.name);\">\n" +
    "            <a href=\"\">{{ dimension.label }}</a>\n" +
    "          </li>\n" +
    "          <li ng-repeat-end ng-if=\"dimension.levels.length != 1\" class=\"dropdown-submenu\">\n" +
    "            <a tabindex=\"0\">{{ dimension.label }}</a>\n" +
    "\n" +
    "            <ul ng-if=\"dimension.hierarchies_count() != 1\" class=\"dropdown-menu\">\n" +
    "                <li ng-repeat=\"(hikey,hi) in dimension.hierarchies\" class=\"dropdown-submenu\">\n" +
    "                    <a tabindex=\"0\" href=\"\" onclick=\"return false;\">{{ hi.label }}</a>\n" +
    "                    <ul class=\"dropdown-menu\">\n" +
    "                        <li ng-repeat=\"level in hi.levels\" ng-click=\"showDimensionFilter(dimension.name + '@' + hi.name + ':' + level.name )\"><a href=\"\">{{ level.label }}</a></li>\n" +
    "                    </ul>\n" +
    "                </li>\n" +
    "            </ul>\n" +
    "\n" +
    "            <ul ng-if=\"dimension.hierarchies_count() == 1\" class=\"dropdown-menu\">\n" +
    "                <li ng-repeat=\"level in dimension.default_hierarchy().levels\" ng-click=\"showDimensionFilter(level);\"><a href=\"\">{{ level.label }}</a></li>\n" +
    "            </ul>\n" +
    "\n" +
    "          </li>\n" +
    "\n" +
    "        </ul>\n" +
    "    </li>\n" +
    "     -->\n" +
    "\n" +
    "    <div class=\"divider\"></div>\n" +
    "\n" +
    "    <li ng-class=\"{ 'disabled': view.params.cuts.length == 0 && view.params.datefilters.length == 0 }\" ng-click=\"clearFilters()\"><a href=\"\"><i class=\"fa fa-fw fa-trash\"></i> Clear filters</a></li>\n" +
    "\n" +
    "  </ul>\n"
  );


  $templateCache.put('views/cube/cube-menu-panel.html',
    "  <button class=\"btn btn-primary btn-sm dropdown-toggle\" type=\"button\" data-toggle=\"dropdown\" data-submenu>\n" +
    "    <i class=\"fa fa-fw fa-file\"></i> <span class=\"hidden-xs\" ng-class=\"{ 'hidden-sm hidden-md': cvOptions.studioTwoColumn }\">Panel</span> <span class=\"caret\"></span>\n" +
    "  </button>\n" +
    "\n" +
    "  <ul class=\"dropdown-menu dropdown-menu-right cv-view-menu cv-view-menu-view\">\n" +
    "\n" +
    "    <li ng-click=\"viewsService.studioViewsService.studioScope.showRenameView(view)\"><a><i class=\"fa fa-fw fa-pencil\"></i> Rename...</a></li>\n" +
    "    <li ng-click=\"viewsService.studioViewsService.studioScope.cloneView(view)\"><a><i class=\"fa fa-fw fa-clone\"></i> Clone</a></li>\n" +
    "\n" +
    "    <div ng-if=\"cvOptions.backendUrl\" class=\"divider\"></div>\n" +
    "    <li ng-if=\"cvOptions.backendUrl\" ng-click=\"reststoreService.saveView(view)\"><a><i class=\"fa fa-fw fa-save\"></i> Save</a></li>\n" +
    "    <li ng-if=\"cvOptions.backendUrl\" ng-click=\"reststoreService.shareView(view, ! view.shared)\"><a><i class=\"fa fa-fw fa-share\"></i> {{ view.shared ? \"Unshare\" : \"Share\" }}</a></li>\n" +
    "    <li ng-if=\"cvOptions.backendUrl\" ng-click=\"reststoreService.deleteView(view)\"><a><i class=\"fa fa-fw fa-trash-o\"></i> Delete...</a></li>\n" +
    "\n" +
    "    <div class=\"divider\"></div>\n" +
    "    <li ng-click=\"viewsService.studioViewsService.studioScope.showSerializeView(view)\"><a><i class=\"fa fa-fw fa-code\"></i> Serialize...</a></li>\n" +
    "    <div class=\"divider\"></div>\n" +
    "    <li ng-click=\"viewsService.studioViewsService.closeView(view)\"><a><i class=\"fa fa-fw fa-close\"></i> Close</a></li>\n" +
    "  </ul>\n"
  );


  $templateCache.put('views/cube/cube-menu-view.html',
    "  <button class=\"btn btn-primary btn-sm dropdown-toggle\" type=\"button\" data-toggle=\"dropdown\" data-submenu>\n" +
    "    <i class=\"fa fa-fw fa-cogs\"></i> <span class=\"hidden-xs\" ng-class=\"{ 'hidden-sm hidden-md': cvOptions.studioTwoColumn }\">View</span> <span class=\"caret\"></span>\n" +
    "  </button>\n" +
    "\n" +
    "  <ul class=\"dropdown-menu dropdown-menu-right cv-view-menu cv-view-menu-view\">\n" +
    "\n" +
    "    <li ng-show=\"view.params.mode == 'chart'\" class=\"dropdown-submenu\">\n" +
    "        <a tabindex=\"0\" ><i class=\"fa fa-fw fa-area-chart\"></i> Chart type</a>\n" +
    "        <ul class=\"dropdown-menu\">\n" +
    "          <li ng-click=\"selectChartType('pie')\"><a href=\"\"><i class=\"fa fa-fw fa-pie-chart\"></i> Pie</a></li>\n" +
    "          <li ng-click=\"selectChartType('bars-vertical')\"><a href=\"\"><i class=\"fa fa-fw fa-bar-chart\"></i> Bars Vertical</a></li>\n" +
    "          <li ng-click=\"selectChartType('bars-horizontal')\"><a href=\"\"><i class=\"fa fa-fw fa-rotate-270 fa-bar-chart\"></i> Bars Horizontal</a></li>\n" +
    "          <li ng-click=\"selectChartType('lines')\"><a href=\"\"><i class=\"fa fa-fw fa-line-chart\"></i> Lines</a></li>\n" +
    "          <li ng-click=\"selectChartType('lines-stacked')\"><a href=\"\"><i class=\"fa fa-fw fa-area-chart\"></i> Areas</a></li>\n" +
    "          <li ng-click=\"selectChartType('radar')\"><a href=\"\"><i class=\"fa fa-fw fa-bullseye\"></i> Radar</a></li>\n" +
    "\n" +
    "          <!-- <div class=\"divider\"></div>  -->\n" +
    "\n" +
    "          <!--\n" +
    "          <li><a href=\"\"><i class=\"fa fa-fw fa-dot-circle-o\"></i> Bubbles</a></li>\n" +
    "          <li><a href=\"\"><i class=\"fa fa-fw fa-square\"></i> Treemap</a></li>\n" +
    "          <li ng-click=\"selectChartType('sunburst')\"><a href=\"\"><i class=\"fa fa-fw fa-sun-o\"></i> Sunburst</a></li>\n" +
    "          -->\n" +
    "\n" +
    "          <!--\n" +
    "          <div class=\"divider\"></div>\n" +
    "\n" +
    "          <li><a href=\"\"><i class=\"fa fa-fw fa-globe\"></i> Map</a></li>\n" +
    "           -->\n" +
    "\n" +
    "        </ul>\n" +
    "    </li>\n" +
    "\n" +
    "    <!--\n" +
    "    <li ng-show=\"view.params.mode == 'chart' && (view.params.charttype == 'lines-stacked' || view.params.charttype == 'lines' || view.params.charttype == 'bars-horizontal')\" class=\"dropdown-submenu\">\n" +
    "        <a tabindex=\"0\" ><i class=\"fa fa-fw fa-sliders\"></i> Chart options</a>\n" +
    "        <ul class=\"dropdown-menu\">\n" +
    "    -->\n" +
    "        <li class=\"dropdown-submenu\" ng-show=\"view.params.mode == 'chart' && (view.params.charttype == 'lines-stacked' || view.params.charttype == 'lines')\">\n" +
    "            <a href=\"\"><i class=\"fa fa-fw fa-angle-up\"></i> Curve type</a>\n" +
    "            <ul class=\"dropdown-menu\">\n" +
    "                <li ng-class=\"{'active': view.params.chartoptions.lineInterpolation == 'linear'}\" ng-click=\"view.params.chartoptions.lineInterpolation = 'linear'; refreshView();\"><a href=\"\"> Linear</a></li>\n" +
    "                <li ng-class=\"{'active': view.params.chartoptions.lineInterpolation == 'monotone'}\" ng-click=\"view.params.chartoptions.lineInterpolation = 'monotone'; refreshView();\"><a href=\"\"> Smooth</a></li>\n" +
    "                <!-- <li ng-class=\"{'active': view.params.chartoptions.lineInterpolation == 'cardinal'}\" ng-click=\"view.params.chartoptions.lineInterpolation = 'cardinal'; refreshView();\"><a href=\"\"> Smooth (Cardinal)</a></li>  -->\n" +
    "            </ul>\n" +
    "        </li>\n" +
    "\n" +
    "        <li ng-class=\"{'disabled': view.grid.data.length != 2 }\" ng-show=\"view.params.mode == 'chart' && view.params.charttype == 'bars-horizontal'\" ng-click=\"view.params.chartoptions.mirrorSerie2 = !view.params.chartoptions.mirrorSerie2; refreshView();\">\n" +
    "            <a><i class=\"fa fa-fw fa-arrows-h\"></i> Invert 2nd series\n" +
    "                <span style=\"margin-left: 5px;\" class=\"label label-default\" ng-class=\"{ 'label-success': view.params.chartoptions.mirrorSerie2 }\">{{ view.params.chartoptions.mirrorSerie2 ? \"ON\" : \"OFF\" }}</span>\n" +
    "            </a>\n" +
    "        </li>\n" +
    "\n" +
    "    <!--\n" +
    "        </ul>\n" +
    "    </li>\n" +
    "     -->\n" +
    "\n" +
    "    <li ng-show=\"view.params.mode == 'chart'\" ng-click=\"view.params.chartoptions.showLegend = !view.params.chartoptions.showLegend; refreshView();\">\n" +
    "        <a><i class=\"fa fa-fw\" ng-class=\"{'fa-toggle-on': view.params.chartoptions.showLegend, 'fa-toggle-off': ! view.params.chartoptions.showLegend }\"></i> Toggle legend\n" +
    "            <span style=\"margin-left: 5px;\" class=\"label label-default\" ng-class=\"{ 'label-success': view.params.chartoptions.showLegend }\">{{ view.params.chartoptions.showLegend ? \"ON\" : \"OFF\" }}</span>\n" +
    "        </a>\n" +
    "    </li>\n" +
    "\n" +
    "    <div ng-show=\"view.params.mode == 'chart'\" class=\"divider\"></div>\n" +
    "\n" +
    "    <li ng-show=\"view.params.mode == 'series' || view.params.mode == 'chart'\" class=\"dropdown-submenu\">\n" +
    "        <a tabindex=\"0\"><i class=\"fa fa-fw fa-long-arrow-right\"></i> Horizontal dimension</a>\n" +
    "        <ul class=\"dropdown-menu\">\n" +
    "\n" +
    "          <li on-repeat-done ng-repeat-start=\"dimension in view.cube.dimensions\" ng-if=\"dimension.levels.length == 1\" ng-click=\"selectXAxis(dimension.name)\">\n" +
    "            <a href=\"\">{{ dimension.label }}</a>\n" +
    "          </li>\n" +
    "          <li ng-repeat-end ng-if=\"dimension.levels.length != 1\" class=\"dropdown-submenu\">\n" +
    "            <a tabindex=\"0\">{{ dimension.label }}</a>\n" +
    "\n" +
    "            <ul ng-if=\"dimension.hierarchies_count() != 1\" class=\"dropdown-menu\">\n" +
    "                <li ng-repeat=\"(hikey,hi) in dimension.hierarchies\" class=\"dropdown-submenu\">\n" +
    "                    <a tabindex=\"0\" href=\"\" onclick=\"return false;\">{{ hi.label }}</a>\n" +
    "                    <ul class=\"dropdown-menu\">\n" +
    "                        <!-- ng-click=\"selectDrill(dimension.name + '@' + hi.name + ':' + level.name, true)\"  -->\n" +
    "                        <li ng-repeat=\"level in hi.levels\" ng-click=\"selectXAxis(dimension.name + '@' + hi.name + ':' + level.name )\"><a href=\"\">{{ level.label }}</a></li>\n" +
    "                    </ul>\n" +
    "                </li>\n" +
    "            </ul>\n" +
    "\n" +
    "            <ul ng-if=\"dimension.hierarchies_count() == 1\" class=\"dropdown-menu\">\n" +
    "                <!--  selectDrill(dimension.name + ':' + level.name, true) -->\n" +
    "                <li ng-repeat=\"level in dimension.default_hierarchy().levels\" ng-click=\"selectXAxis(dimension.name + ':' + level.name);\"><a href=\"\">{{ level.label }}</a></li>\n" +
    "            </ul>\n" +
    "\n" +
    "          </li>\n" +
    "\n" +
    "          <div class=\"divider\"></div>\n" +
    "\n" +
    "          <li ng-click=\"selectXAxis(null);\"><a href=\"\"><i class=\"fa fa-fw fa-close\"></i> None</a></li>\n" +
    "\n" +
    "        </ul>\n" +
    "    </li>\n" +
    "\n" +
    "    <li ng-show=\"view.params.mode == 'series' || view.params.mode == 'chart'\" class=\"dropdown-submenu\">\n" +
    "        <a tabindex=\"0\"><i class=\"fa fa-fw fa-crosshairs\"></i> Measure</a>\n" +
    "        <ul class=\"dropdown-menu\">\n" +
    "\n" +
    "          <li ng-repeat=\"measure in view.cube.measures\" ng-if=\"view.cube.measureAggregates(measure.name).length > 0\" class=\"dropdown-submenu\">\n" +
    "            <a href=\"\">{{ measure.label }}</a>\n" +
    "            <ul class=\"dropdown-menu\">\n" +
    "                <li ng-repeat=\"aggregate in view.cube.measureAggregates(measure.name)\" >\n" +
    "                    <a href=\"\" ng-click=\"selectMeasure(aggregate.ref)\">{{ aggregate.label }}</a>\n" +
    "                </li>\n" +
    "            </ul>\n" +
    "          </li>\n" +
    "\n" +
    "          <div class=\"divider\" ng-if=\"view.cube.measureAggregates(null).length > 0\"></div>\n" +
    "          <li ng-repeat=\"aggregate in view.cube.measureAggregates(null)\" ng-if=\"view.cube.measureAggregates(null).length > 0\" >\n" +
    "            <a href=\"\" ng-click=\"selectMeasure(aggregate.ref)\">{{ aggregate.label }}</a>\n" +
    "          </li>\n" +
    "\n" +
    "        </ul>\n" +
    "    </li>\n" +
    "\n" +
    "    <div ng-show=\"cvOptions.seriesOperationsEnabled && (view.params.mode == 'series' || view.params.mode == 'chart')\" class=\"divider\"></div>\n" +
    "\n" +
    "    <li ng-show=\"cvOptions.seriesOperationsEnabled && (view.params.mode == 'series' || view.params.mode == 'chart')\" class=\"dropdown-submenu\">\n" +
    "        <a tabindex=\"0\" ><i class=\"fa fa-fw fa-calculator\"></i> Series operations</a>\n" +
    "        <ul class=\"dropdown-menu\">\n" +
    "          <li ng-click=\"selectOperation('difference')\"><a href=\"\"><i class=\"fa fa-fw fa-line-chart\"></i> Difference</a></li>\n" +
    "          <li ng-click=\"selectOperation('percentage')\"><a href=\"\"><i class=\"fa fa-fw fa-percent\"></i> Change rate</a></li>\n" +
    "          <!--\n" +
    "          <li ng-click=\"selectOperation('accum')\"><a href=\"\"><i class=\"fa fa-fw\">&sum;</i> Accumulated</a></li>\n" +
    "          <div class=\"divider\"></div>\n" +
    "          <li ng-click=\"selectOperation('fill-zeros')\"><a href=\"\"><i class=\"fa fa-fw\">0</i> Replace blanks with zeroes</a></li>\n" +
    "           -->\n" +
    "          <div class=\"divider\"></div>\n" +
    "          <li ng-click=\"selectOperation(null)\"><a href=\"\"><i class=\"fa fa-fw fa-times\"></i> Clear operations</a></li>\n" +
    "        </ul>\n" +
    "    </li>\n" +
    "\n" +
    "    <div ng-show=\"view.params.mode == 'series' || view.params.mode == 'chart'\" class=\"divider\"></div>\n" +
    "\n" +
    "    <li ng-show=\"view.params.mode != 'chart'\" ng-click=\"exportService.exportGridAsCsv(view)\"><a><i class=\"fa fa-fw fa-table\"></i> Export table</a></li>\n" +
    "    <li ng-show=\"view.params.mode == 'chart' && view.params.charttype != 'radar' \" ng-click=\"view.exportChartAsPNG()\"><a><i class=\"fa fa-fw fa-picture-o\"></i> Export figure</a></li>\n" +
    "    <li ng-click=\"exportService.exportFacts(view)\"><a><i class=\"fa fa-fw fa-th\"></i> Export facts</a></li>\n" +
    "\n" +
    "  </ul>\n" +
    "\n"
  );


  $templateCache.put('views/cube/cube.html',
    "<div class=\"cv-view-panel\" ng-controller=\"CubesViewerViewsCubeController as cubeView\" >\n" +
    "\n" +
    "    <div ng-if=\"view.state == 3\">\n" +
    "        <div class=\"alert alert-danger\" style=\"margin: 0px;\">\n" +
    "            <p>An error occurred. Cannot present view.</p>\n" +
    "            <p ng-if=\"cubesService.state != 3\">{{ view.error }}</p>\n" +
    "            <p ng-if=\"cubesService.state == 3\">Could not connect to data server: {{ cubesService.stateText }}</p>\n" +
    "            <p>Please try again and contact your administrator if the problem persists.</p>\n" +
    "            <p class=\"text-right\">\n" +
    "                <a class=\"alert-link\" href=\"http://jjmontesl.github.io/cubesviewer/\" target=\"_blank\">CubesViewer Data Visualizer</a>\n" +
    "            </p>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div>\n" +
    "        <h2 ng-show=\"view.getControlsHidden()\" style=\"margin-top: 5px;\">\n" +
    "            <i class=\"fa fa-fw fa-file-o\"></i> {{ view.params.name }}\n" +
    "        </h2>\n" +
    "\n" +
    "        <div ng-include=\"'views/cube/alerts.html'\"></div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"view.state == 2\" style=\"min-height: 80px;\">\n" +
    "\n" +
    "        <div class=\"cv-view-viewmenu hidden-print\" ng-hide=\"view.getControlsHidden()\">\n" +
    "\n" +
    "            <div class=\"panel panel-primary pull-right\" style=\"padding: 3px; white-space: nowrap; margin-bottom: 6px; margin-left: 6px;\">\n" +
    "\n" +
    "                <div ng-if=\"cvOptions.undoEnabled\" class=\"btn-group\" role=\"group\" ng-controller=\"CubesViewerViewsUndoController\">\n" +
    "                  <button type=\"button\" ng-click=\"undo()\" ng-disabled=\"view.undoPos <= 0\" class=\"btn btn-default btn-sm\" title=\"Undo\"><i class=\"fa fa-fw fa-undo\"></i></button>\n" +
    "                  <button type=\"button\" ng-click=\"redo()\" ng-disabled=\"view.undoPos >= view.undoList.length - 1\" class=\"btn btn-default btn-sm\" title=\"Redo\"><i class=\"fa fa-fw fa-undo fa-flip-horizontal\"></i></button>\n" +
    "                </div>\n" +
    "\n" +
    "                <div class=\"btn-group\" role=\"group\" aria-label=\"...\" style=\"margin-left: 5px;\">\n" +
    "                  <button type=\"button\" ng-click=\"setViewMode('explore')\" ng-class=\"{'active': view.params.mode == 'explore'}\" class=\"btn btn-primary btn-sm explorebutton\" title=\"Explore\"><i class=\"fa fa-fw fa-arrow-circle-down\"></i></button>\n" +
    "                  <button type=\"button\" ng-click=\"setViewMode('facts')\" ng-class=\"{'active': view.params.mode == 'facts'}\" class=\"btn btn-primary btn-sm \" title=\"Facts\"><i class=\"fa fa-fw fa-th\"></i></button>\n" +
    "                  <button type=\"button\" ng-click=\"setViewMode('series')\" ng-class=\"{'active': view.params.mode == 'series'}\" class=\"btn btn-primary btn-sm \" title=\"Series\"><i class=\"fa fa-fw fa-clock-o\"></i></button>\n" +
    "                  <button type=\"button\" ng-click=\"setViewMode('chart')\" ng-class=\"{'active': view.params.mode == 'chart'}\" class=\"btn btn-primary btn-sm \" title=\"Charts\"><i class=\"fa fa-fw fa-area-chart\"></i></button>\n" +
    "                </div>\n" +
    "\n" +
    "                <div ng-include=\"'views/cube/cube-menu-drilldown.html'\" class=\"dropdown m-b\" style=\"display: inline-block; margin-left: 5px;\"></div>\n" +
    "\n" +
    "                <div ng-include=\"'views/cube/cube-menu-filter.html'\" class=\"dropdown m-b\" style=\"display: inline-block; margin-left: 2px;\"></div>\n" +
    "\n" +
    "                <div ng-include=\"'views/cube/cube-menu-view.html'\" class=\"dropdown m-b\" style=\"display: inline-block; margin-left: 5px;\"></div>\n" +
    "\n" +
    "                <div ng-if=\"cvOptions.container\" ng-include=\"'views/cube/cube-menu-panel.html'\" class=\"dropdown m-b\" style=\"display: inline-block; margin-left: 5px;\"></div>\n" +
    "\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"pull-right\" style=\"white-space: nowrap; padding-top: 4px; padding-bottom: 4px; margin-left: 6px; margin-bottom: 6px;\">\n" +
    "\n" +
    "            </div>\n" +
    "\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"cv-view-viewinfo\">\n" +
    "            <div>\n" +
    "                <div class=\"label label-secondary cv-infopiece cv-view-viewinfo-cubename\" style=\"color: white; background-color: black;\">\n" +
    "                    <span><i class=\"fa fa-fw fa-cube\" title=\"Cube\"></i> <b class=\"hidden-xs hidden-sm\">Cube:</b> {{ view.cube.label }}</span>\n" +
    "                    <button type=\"button\" class=\"btn btn-info btn-xs\" style=\"visibility: hidden;\"><i class=\"fa fa-fw fa-info\"></i></button>\n" +
    "                </div>\n" +
    "\n" +
    "                <div class=\"cv-view-viewinfo-drill\">\n" +
    "\n" +
    "\n" +
    "                    <div ng-repeat=\"drilldown in view.params.drilldown\" ng-init=\"parts = view.cube.dimensionParts(drilldown);\" ng-if=\"view.params.mode != 'facts'\" class=\"label label-secondary cv-infopiece cv-view-viewinfo-drill\" style=\"color: black; background-color: #ccffcc;\">\n" +
    "                        <span><i class=\"fa fa-fw fa-arrow-down\" title=\"Drilldown\"></i> <b class=\"hidden-xs hidden-sm\">Drilldown:</b> <span title=\"{{ view.cube.dimensionParts(drilldown).label }}\">{{ parts.labelShort }}</span></span>\n" +
    "                        <button type=\"button\" class=\"btn btn-info btn-xs\" style=\"visibility: hidden; margin-left: -20px;\"><i class=\"fa fa-fw fa-info\"></i></button>\n" +
    "\n" +
    "                        <button ng-hide=\"view.getControlsHidden() || parts.hierarchy.levels.length < 2\" ng-disabled=\"! parts.drilldownDimensionMinus\" type=\"button\" ng-click=\"selectDrill(parts.drilldownDimensionMinus, true)\" class=\"btn btn-secondary btn-xs hidden-print\" style=\"margin-left: 3px;\"><i class=\"fa fa-fw fa-minus\"></i></button>\n" +
    "                        <button ng-hide=\"view.getControlsHidden() || parts.hierarchy.levels.length < 2\" ng-disabled=\"! parts.drilldownDimensionPlus\" type=\"button\" ng-click=\"selectDrill(parts.drilldownDimensionPlus, true)\" class=\"btn btn-secondary btn-xs hidden-print\" style=\"margin-left: 0px;\"><i class=\"fa fa-fw fa-plus\"></i></button>\n" +
    "\n" +
    "                        <button ng-hide=\"view.getControlsHidden()\" type=\"button\" ng-click=\"showDimensionFilter(drilldown)\" class=\"btn btn-secondary btn-xs hidden-print\" style=\"margin-left: 3px;\"><i class=\"fa fa-fw fa-search\"></i></button>\n" +
    "                        <button ng-hide=\"view.getControlsHidden()\" type=\"button\" ng-click=\"selectDrill(drilldown, '')\" class=\"btn btn-danger btn-xs hidden-print\" style=\"margin-left: 1px;\"><i class=\"fa fa-fw fa-trash\"></i></button>\n" +
    "                    </div>\n" +
    "\n" +
    "                </div>\n" +
    "                <div class=\"cv-view-viewinfo-cut\">\n" +
    "                    <!--\n" +
    "                        var dimensionString = $(this).parents('.cv-view-infopiece-cut').first().attr('data-dimension');\n" +
    "                        var parts = view.cube.dimensionParts(dimensionString);\n" +
    "                        var depth = $(this).parents('.cv-view-infopiece-cut').first().attr('data-value').split(';')[0].split(\",\").length;\n" +
    "                        cubesviewer.views.cube.dimensionfilter.drawDimensionFilter(view, dimensionString + \":\" + parts.hierarchy.levels[depth - 1] );\n" +
    "                     -->\n" +
    "                    <div ng-repeat=\"cut in view.params.cuts\" ng-init=\"equality = cut.invert ? ' &ne; ' : ' = ';\" class=\"label label-secondary cv-infopiece cv-view-viewinfo-cut\" style=\"color: black; background-color: #ffcccc;\">\n" +
    "                        <span style=\"max-width: 480px;\"><i class=\"fa fa-fw fa-filter\" title=\"Filter\"></i> <b class=\"hidden-xs hidden-sm\">Filter:</b> <span title=\"{{ view.cube.dimensionPartsFromCut(cut).label }}\">{{ view.cube.dimensionPartsFromCut(cut).labelShort }}</span> <span ng-class=\"{ 'text-danger': cut.invert }\">{{ equality }}</span> <span title=\"{{ cut.value }}\">{{ cut.value }}</span></span>\n" +
    "                        <button type=\"button\" class=\"btn btn-info btn-xs\" style=\"visibility: hidden; margin-left: -20px;\"><i class=\"fa fa-fw fa-info\"></i></button>\n" +
    "                        <button ng-hide=\"view.getControlsHidden()\" type=\"button\" ng-click=\"showDimensionFilter(view.cube.dimensionPartsFromCut(cut).drilldownDimension)\" class=\"btn btn-secondary btn-xs hidden-print\" style=\"margin-left: 3px;\"><i class=\"fa fa-fw fa-search\"></i></button>\n" +
    "                        <button ng-hide=\"view.getControlsHidden()\" type=\"button\" ng-click=\"selectCut(cut.dimension, '', cut.invert)\" class=\"btn btn-danger btn-xs hidden-print\" style=\"margin-left: 1px;\"><i class=\"fa fa-fw fa-trash\"></i></button>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "\n" +
    "                <div ng-include=\"'views/cube/filter/datefilter.html'\"></div>\n" +
    "\n" +
    "                <div class=\"cv-view-viewinfo-extra\">\n" +
    "\n" +
    "                    <div ng-if=\"view.params.mode == 'series' || view.params.mode == 'chart'\" class=\"label label-secondary cv-infopiece cv-view-viewinfo-extra\" style=\"color: black; background-color: #ccccff;\">\n" +
    "                        <span style=\"max-width: 350px;\"><i class=\"fa fa-fw fa-crosshairs\" title=\"Measure\"></i> <b class=\"hidden-xs hidden-sm\">Measure:</b> {{ (view.params.yaxis != null) ? view.cube.aggregateFromName(view.params.yaxis).label : \"None\" }}</span>\n" +
    "                        <button type=\"button\" class=\"btn btn-info btn-xs\" style=\"visibility: hidden; margin-left: -20px;\"><i class=\"fa fa-fw fa-info\"></i></button>\n" +
    "                    </div>\n" +
    "\n" +
    "                    <div ng-if=\"view.params.mode == 'series' || view.params.mode == 'chart'\" class=\"label label-secondary cv-infopiece cv-view-viewinfo-extra\" style=\"color: black; background-color: #ccddff;\">\n" +
    "                        <span style=\"max-width: 350px;\"><i class=\"fa fa-fw fa-long-arrow-right\" title=\"Horizontal dimension\"></i> <b class=\"hidden-xs hidden-sm\">Horizontal dimension:</b> {{ (view.params.xaxis != null) ? view.cube.dimensionParts(view.params.xaxis).labelShort : \"None\" }}</span>\n" +
    "                        <button type=\"button\" class=\"btn btn-info btn-xs\" style=\"visibility: hidden; margin-left: -20px;\"><i class=\"fa fa-fw fa-info\"></i></button>\n" +
    "\n" +
    "                        <button ng-hide=\"view.getControlsHidden() || !view.params.xaxis || view.cube.dimensionParts(view.params.xaxis).hierarchy.levels.length < 2\" ng-disabled=\"! view.cube.dimensionParts(view.params.xaxis).drilldownDimensionMinus\" type=\"button\" ng-click=\"selectXAxis(view.cube.dimensionParts(view.params.xaxis).drilldownDimensionMinus, true)\" class=\"btn btn-secondary btn-xs hidden-print\" style=\"margin-left: 3px;\"><i class=\"fa fa-fw fa-minus\"></i></button>\n" +
    "                        <button ng-hide=\"view.getControlsHidden() || !view.params.xaxis || view.cube.dimensionParts(view.params.xaxis).hierarchy.levels.length < 2\" ng-disabled=\"! view.cube.dimensionParts(view.params.xaxis).drilldownDimensionPlus\" type=\"button\" ng-click=\"selectXAxis(view.cube.dimensionParts(view.params.xaxis).drilldownDimensionPlus, true)\" class=\"btn btn-secondary btn-xs hidden-print\" style=\"margin-left: 0px;\"><i class=\"fa fa-fw fa-plus\"></i></button>\n" +
    "\n" +
    "                        <!-- <button type=\"button\" ng-click=\"showDimensionFilter(view.params.xaxis)\" class=\"btn btn-secondary btn-xs\" style=\"margin-left: 3px;\"><i class=\"fa fa-fw fa-search\"></i></button>  -->\n" +
    "                        <!-- <button type=\"button\" ng-click=\"selectXAxis(null)\" class=\"btn btn-danger btn-xs\" style=\"margin-left: 1px;\"><i class=\"fa fa-fw fa-trash\"></i></button>  -->\n" +
    "                    </div>\n" +
    "\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"clearfix\"></div>\n" +
    "\n" +
    "        <div class=\"cv-view-viewdialogs\">\n" +
    "            <div ng-if=\"view.dimensionFilter\" ng-include=\"'views/cube/filter/dimension.html'\"></div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"cv-view-viewdata\">\n" +
    "\n" +
    "            <div ng-if=\"view.params.mode == 'explore'\" ng-include=\"'views/cube/explore/explore.html'\"></div>\n" +
    "            <div ng-if=\"view.params.mode == 'facts'\" ng-include=\"'views/cube/facts/facts.html'\"></div>\n" +
    "            <div ng-if=\"view.params.mode == 'series'\" ng-include=\"'views/cube/series/series.html'\"></div>\n" +
    "            <div ng-if=\"view.params.mode == 'chart'\" ng-include=\"'views/cube/chart/chart.html'\"></div>\n" +
    "\n" +
    "        </div>\n" +
    "        <div class=\"clearfix\"></div>\n" +
    "\n" +
    "        <div class=\"cv-view-viewfooter\"></div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('views/cube/explore/explore.html',
    "<div ng-controller=\"CubesViewerViewsCubeExploreController\">\n" +
    "\n" +
    "    <!-- ($(view.container).find('.cv-view-viewdata').children().size() == 0)  -->\n" +
    "    <h3><i class=\"fa fa-fw fa-arrow-circle-down\"></i> Aggregated data\n" +
    "        <i ng-show=\"view.pendingRequests > 0\" class=\"fa fa-circle-o-notch fa-spin fa-fw margin-bottom text-info pull-right\"></i>\n" +
    "    </h3>\n" +
    "\n" +
    "    <div ng-if=\"view.pendingRequests > 0\" class=\"loadingbar-content\">\n" +
    "        <span class=\"loadingbar-expand\"></span>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ui-grid=\"view.grid\"\n" +
    "         ui-grid-resize-columns ui-grid-move-columns ui-grid-selection ui-grid-auto-resize\n" +
    "         ui-grid-pagination ui-grid-pinning\n" +
    "         style=\"width: 100%;\" ng-style=\"{height: ((view.grid.data.length < 15 ? view.grid.data.length : 15) * 24) + 44 + 30 + 'px'}\">\n" +
    "    </div>\n" +
    "    <div style=\"height: 30px;\">&nbsp;</div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('views/cube/facts/facts.html',
    "<div ng-controller=\"CubesViewerViewsCubeFactsController\">\n" +
    "\n" +
    "    <!-- ($(view.container).find('.cv-view-viewdata').children().size() == 0)  -->\n" +
    "    <h3><i class=\"fa fa-fw fa-th\"></i> Facts data\n" +
    "        <i ng-show=\"view.pendingRequests > 0\" class=\"fa fa-circle-o-notch fa-spin fa-fw margin-bottom text-info pull-right\"></i>\n" +
    "    </h3>\n" +
    "\n" +
    "    <div ng-if=\"view.pendingRequests > 0\" class=\"loadingbar-content\">\n" +
    "        <span class=\"loadingbar-expand\"></span>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"view.grid.data.length > 0\"\n" +
    "         ui-grid=\"view.grid\"\n" +
    "         ui-grid-resize-columns ui-grid-move-columns ui-grid-selection ui-grid-auto-resize\n" +
    "         ui-grid-pagination ui-grid-pinning\n" +
    "         style=\"width: 100%;\" ng-style=\"{height: ((view.grid.data.length < 15 ? view.grid.data.length : 15) * 24) + 44 + 30 + 'px'}\">\n" +
    "    </div>\n" +
    "    <div ng-if=\"view.grid.data.length > 0\" style=\"height: 30px;\">&nbsp;</div>\n" +
    "\n" +
    "    <div ng-if=\"viewController.view.pendingRequests == 0 && view.grid.data.length == 0\">No facts are returned by the current filtering combination.</div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('views/cube/filter/datefilter.html',
    "<div class=\"cv-view-viewinfo-date\">\n" +
    "    <div ng-repeat=\"datefilter in view.params.datefilters\" ng-controller=\"CubesViewerViewsCubeFilterDateController\" ng-init=\"dimparts = view.cube.dimensionParts(datefilter.dimension);\" class=\"label label-secondary cv-infopiece cv-view-viewinfo-cut text-left\" style=\"color: black; background-color: #ffdddd; text-align: left;\">\n" +
    "        <span style=\"max-width: 280px; white-space: nowrap;\"><i class=\"fa fa-fw fa-filter\"></i> <b class=\"hidden-xs hidden-sm\">Filter:</b> {{ dimparts.labelNoLevel }}:</span>\n" +
    "\n" +
    "        <!--\n" +
    "        <br class=\"hidden-sm hidden-md hidden-lg\" />\n" +
    "        <i class=\"fa fa-fw hidden-sm hidden-md hidden-lg\" />\n" +
    "         -->\n" +
    "\n" +
    "        <div class=\"cv-datefilter\" style=\"overflow: visible; display: inline-block;\">\n" +
    "\n" +
    "            <form class=\"form-inline\">\n" +
    "\n" +
    "                 <div class=\"form-group\" style=\"display: inline-block; margin: 0px;\">\n" +
    "                    <div class=\"dropdown\" style=\"display: inline-block;\">\n" +
    "                      <button ng-hide=\"view.getControlsHidden()\" style=\"height: 20px;\" class=\"btn btn-default btn-sm dropdown-toggle\" type=\"button\" data-toggle=\"dropdown\" data-submenu>\n" +
    "                        <i class=\"fa fa-fw fa-calendar\"></i> {{ datefilter.mode | datefilterMode }} <span class=\"caret\"></span>\n" +
    "                      </button>\n" +
    "                      <span ng-show=\"view.getControlsHidden()\"><i class=\"fa fa-fw fa-calendar\"></i> {{ datefilter.mode | datefilterMode }}</span>\n" +
    "\n" +
    "                      <ul class=\"dropdown-menu cv-view-menu cv-view-menu-view\">\n" +
    "                        <li ng-click=\"setMode('custom')\"><a><i class=\"fa fa-fw\"></i> Custom</a></li>\n" +
    "                        <div class=\"divider\"></div>\n" +
    "                        <li ng-click=\"setMode('auto-last1m')\"><a><i class=\"fa fa-fw\"></i> Last month</a></li>\n" +
    "                        <li ng-click=\"setMode('auto-last3m')\"><a><i class=\"fa fa-fw\"></i> Last 3 months</a></li>\n" +
    "                        <li ng-click=\"setMode('auto-last6m')\"><a><i class=\"fa fa-fw\"></i> Last 6 months</a></li>\n" +
    "                        <li ng-click=\"setMode('auto-last12m')\"><a><i class=\"fa fa-fw\"></i> Last year</a></li>\n" +
    "                        <li ng-click=\"setMode('auto-last24m')\"><a><i class=\"fa fa-fw\"></i> Last 2 years</a></li>\n" +
    "                        <li ng-click=\"setMode('auto-january1st')\"><a><i class=\"fa fa-fw\"></i> From January 1st</a></li>\n" +
    "                        <li ng-click=\"setMode('auto-yesterday')\"><a><i class=\"fa fa-fw\"></i> Yesterday</a></li>\n" +
    "                      </ul>\n" +
    "                  </div>\n" +
    "                 </div>\n" +
    "\n" +
    "            <div ng-show=\"datefilter.mode == 'custom'\" style=\"display: inline-block; margin: 0px;\">\n" +
    "\n" +
    "                 &rArr;\n" +
    "\n" +
    "                 <div class=\"form-group\" style=\"display: inline-block; margin: 0px;\">\n" +
    "                    <p class=\"input-group disabled\" style=\"margin: 0px; display: inline-block;\">\n" +
    "                      <input ng-disabled=\"view.getControlsHidden()\" autocomplete=\"off\" type=\"text\" style=\"height: 20px; width: 80px; display: inline-block;\" class=\"form-control input-sm\" uib-datepicker-popup=\"yyyy-MM-dd\" ng-model=\"dateStart.value\" is-open=\"dateStart.opened\" datepicker-options=\"dateStart.options\" ng-required=\"true\" close-text=\"Close\" />\n" +
    "                      <span ng-hide=\"view.getControlsHidden()\"  class=\"input-group-btn\" style=\"display: inline-block;\">\n" +
    "                        <button type=\"button\" style=\"height: 20px;\" class=\"btn btn-default\" ng-click=\"dateStartOpen()\"><i class=\"fa fa-fw fa-calendar\"></i></button>\n" +
    "                      </span>\n" +
    "                    </p>\n" +
    "                </div>\n" +
    "\n" +
    "                <span ng-hide=\"view.getControlsHidden()\" style=\"margin-left: 17px; margin-right: 0px;\">-</span>\n" +
    "                <span ng-show=\"view.getControlsHidden()\" style=\"margin-left: 0px; margin-right: 0px;\">-</span>\n" +
    "\n" +
    "                 <div class=\"form-group\" style=\"display: inline-block; margin: 0px;\">\n" +
    "                    <p class=\"input-group\" style=\"margin: 0px; display: inline-block;\">\n" +
    "                      <input ng-disabled=\"view.getControlsHidden()\" autocomplete=\"off\" type=\"text\" style=\"height: 20px; width: 80px; display: inline-block;\" class=\"form-control input-sm\" uib-datepicker-popup=\"yyyy-MM-dd\" ng-model=\"dateEnd.value\" is-open=\"dateEnd.opened\" datepicker-options=\"dateEnd.options\" ng-required=\"true\" close-text=\"Close\" />\n" +
    "                      <span ng-hide=\"view.getControlsHidden()\" class=\"input-group-btn\" style=\"display: inline-block;\">\n" +
    "                        <button type=\"button\" style=\"height: 20px;\" class=\"btn btn-default\" ng-click=\"dateEndOpen()\"><i class=\"fa fa-fw fa-calendar\"></i></button>\n" +
    "                      </span>\n" +
    "                    </p>\n" +
    "                </div>\n" +
    "\n" +
    "            </div>\n" +
    "\n" +
    "        </form>\n" +
    "\n" +
    "        </div>\n" +
    "\n" +
    "        <button type=\"button\" ng-hide=\"view.getControlsHidden()\" ng-click=\"selectDateFilter(datefilter.dimension, false)\" class=\"btn btn-danger btn-xs\" style=\"margin-left: 20px;\"><i class=\"fa fa-fw fa-trash\"></i></button>\n" +
    "        <button type=\"button\" class=\"btn btn-info btn-xs\" style=\"visibility: hidden; margin-left: -20px;\"><i class=\"fa fa-fw fa-info\"></i></button>\n" +
    "\n" +
    "\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n"
  );


  $templateCache.put('views/cube/filter/dimension.html',
    "<div ng-controller=\"CubesViewerViewsCubeFilterDimensionController\">\n" +
    "\n" +
    "    <div class=\"panel panel-default panel-outline hidden-print\" ng-hide=\"view.getControlsHidden()\" style=\"border-color: #ffcccc;\">\n" +
    "        <div class=\"panel-heading clearfix\" style=\"border-color: #ffcccc;\">\n" +
    "            <button class=\"btn btn-xs btn-danger pull-right\" ng-click=\"closeDimensionFilter()\"><i class=\"fa fa-fw fa-close\"></i></button>\n" +
    "            <h4 style=\"margin: 2px 0px 0px 0px;\"><i class=\"fa fa-fw fa-filter\"></i> Dimension filter: <b>{{ parts.label }}</b></h4>\n" +
    "        </div>\n" +
    "        <div class=\"panel-body\">\n" +
    "\n" +
    "            <div >\n" +
    "            <form >\n" +
    "\n" +
    "              <div class=\"form-group has-feedback\" style=\"display: inline-block; margin-bottom: 0; vertical-align: middle; margin-bottom: 2px;\">\n" +
    "                <!-- <label for=\"search\">Search:</label>  -->\n" +
    "                <input type=\"text\" class=\"form-control\" ng-model=\"searchString\" ng-model-options=\"{ debounce: 300 }\" placeholder=\"Search...\" style=\"width: 16em;\">\n" +
    "                <i class=\"fa fa-fw fa-times-circle form-control-feedback\" ng-click=\"searchString = ''\" style=\"cursor: pointer; pointer-events: inherit;\"></i>\n" +
    "              </div>\n" +
    "\n" +
    "              <div class=\"btn-group\" style=\"margin-left: 10px; display: inline-block; vertical-align: middle; margin-bottom: 2px; margin-right: 5px;\">\n" +
    "                    <button class=\"btn btn-default\" ng-click=\"selectAll();\" type=\"button\" title=\"Select all\"><i class=\"fa fa-fw fa-check-square-o\"></i></button>\n" +
    "                    <button class=\"btn btn-default\" ng-click=\"selectNone();\" type=\"button\" title=\"Select none\"><i class=\"fa fa-fw fa-square-o\"></i></button>\n" +
    "              </div>\n" +
    "\n" +
    "<!--               <div class=\"form-group\" style=\"display: inline-block; margin-bottom: 0; vertical-align: middle; margin-bottom: 2px;\"> -->\n" +
    "              <div class=\"btn-group\" style=\"display: inline-block; vertical-align: middle; margin-bottom: 2px; margin-right: 5px;\">\n" +
    "                    <button ng-hide=\"parts.hierarchy.levels.length < 2\" ng-disabled=\"! parts.drilldownDimensionMinus\"  class=\"btn btn-default\" ng-click=\"showDimensionFilter(parts.drilldownDimensionMinus)\" type=\"button\" title=\"Drilldown less\"><i class=\"fa fa-fw fa-minus\"></i></button>\n" +
    "                    <button ng-hide=\"parts.hierarchy.levels.length < 2\" ng-disabled=\"! parts.drilldownDimensionPlus\"  class=\"btn btn-default\" ng-click=\"showDimensionFilter(parts.drilldownDimensionPlus)\" type=\"button\" title=\"Drilldown more\"><i class=\"fa fa-fw fa-plus\"></i></button>\n" +
    "                    <button class=\"btn btn-default\" type=\"button\" title=\"Drilldown this\" ng-click=\"selectDrill(parts.drilldownDimension, true)\"><i class=\"fa fa-fw fa-arrow-down\"></i></button>\n" +
    "              </div>\n" +
    "\n" +
    "              <div class=\"form-group\" style=\"display: inline-block; margin-bottom: 0; vertical-align: middle; margin-bottom: 2px; margin-right: 5px;\">\n" +
    "                 <div class=\"btn btn-default\" ng-click=\"filterShowAll = ! filterShowAll\" ng-class=\"{ 'active': filterShowAll, 'btn-info': filterShowAll }\">\n" +
    "                    <i class=\"fa fa-fw fa-filter fa-rotate-180\"></i> Show all\n" +
    "                 </div>\n" +
    "              </div>\n" +
    "\n" +
    "              <div class=\"form-group\" style=\"display: inline-block; margin-bottom: 0; vertical-align: middle; margin-bottom: 2px; \">\n" +
    "\n" +
    "                  <div class=\"btn btn-default\" ng-click=\"filterInverted = !filterInverted\" ng-class=\"{ 'active': filterInverted, 'btn-danger': filterInverted }\">\n" +
    "                    <input type=\"checkbox\" ng-model=\"filterInverted\" style=\"pointer-events: none; margin: 0px; vertical-align: middle;\" ></input>\n" +
    "                    <b>&ne;</b> Invert\n" +
    "                  </div>\n" +
    "\n" +
    "              </div>\n" +
    "\n" +
    "                <div class=\"form-group\" style=\"display: inline-block; margin-bottom: 0; vertical-align: middle; margin-bottom: 2px;\">\n" +
    "                 <button ng-click=\"applyFilter()\" class=\"btn btn-success\" type=\"button\"><i class=\"fa fa-fw fa-filter\"></i> Apply</button>\n" +
    "              </div>\n" +
    "            </form>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"clearfix\"></div>\n" +
    "\n" +
    "            <div class=\"row\">\n" +
    "                <div class=\"col-xs-9 col-sm-6\">\n" +
    "                <div style=\"margin-top: 5px;\">\n" +
    "                    <div class=\"panel panel-default panel-outline\" style=\"margin-bottom: 0px; \"><div class=\"panel-body\" style=\"max-height: 180px; overflow-y: auto; overflow-x: hidden;\">\n" +
    "                        <div ng-show=\"loadingDimensionValues\" ><i class=\"fa fa-circle-o-notch fa-spin fa-fw\"></i> Loading...</div>\n" +
    "\n" +
    "                        <div ng-if=\"!loadingDimensionValues\">\n" +
    "                            <div ng-repeat=\"val in dimensionValues | filter:filterDimensionValue(searchString)\" style=\"overflow-x: hidden; text-overflow: ellipsis; white-space: nowrap;\">\n" +
    "                                <label style=\"font-weight: normal; margin-bottom: 2px;\">\n" +
    "                                    <input type=\"checkbox\" name=\"selectedValues[]\" ng-model=\"val.selected\" value=\"{{ ::val.value }}\" style=\"vertical-align: bottom;\" />\n" +
    "                                    <span title=\"{{ val.label }}\">{{ ::val.label }}</span>\n" +
    "                                </label>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "\n" +
    "                    </div></div>\n" +
    "\n" +
    "                    <div ng-if=\"!loadingDimensionValues\" class=\"\" style=\"margin-bottom: 0px; \">\n" +
    "                        <div class=\"text-right\">\n" +
    "                            {{ dimensionValues.length }} items\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "\n" +
    "                    <div ng-if=\"!loadingDimensionValues && dimensionValues.length >= cubesService.cubesserver.info.json_record_limit\" class=\"alert alert-warning\" style=\"margin-bottom: 0px;\">\n" +
    "                        <div style=\"display: inline-block;\"><i class=\"fa fa-exclamation\"></i></div>\n" +
    "                        <div style=\"display: inline-block; margin-left: 20px;\">\n" +
    "                            Limit of {{ cubesService.cubesserver.info.json_record_limit }} items has been hit. Dimension value list is <b>incomplete</b>.<br />\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "\n" +
    "                </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"clearfix\"></div>\n" +
    "\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('views/cube/series/series.html',
    "<div ng-controller=\"CubesViewerViewsCubeSeriesController\">\n" +
    "\n" +
    "    <!-- ($(view.container).find('.cv-view-viewdata').children().size() == 0)  -->\n" +
    "    <h3><i class=\"fa fa-fw fa-clock-o\"></i> Series table\n" +
    "        <i ng-show=\"view.pendingRequests > 0\" class=\"fa fa-circle-o-notch fa-spin fa-fw margin-bottom text-info pull-right\"></i>\n" +
    "    </h3>\n" +
    "\n" +
    "    <div ng-if=\"view.pendingRequests > 0\" class=\"loadingbar-content\">\n" +
    "        <span class=\"loadingbar-expand\"></span>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"view.grid.data.length > 0\"\n" +
    "         ui-grid=\"view.grid\"\n" +
    "         ui-grid-resize-columns ui-grid-move-columns ui-grid-selection ui-grid-auto-resize\n" +
    "         ui-grid-pagination ui-grid-pinning\n" +
    "         style=\"width: 100%;\" ng-style=\"{height: ((view.grid.data.length < 15 ? view.grid.data.length : 15) * 24) + 44 + 30 + 'px'}\">\n" +
    "    </div>\n" +
    "    <div ng-if=\"view.grid.data.length > 0\" style=\"height: 30px;\">&nbsp;</div>\n" +
    "\n" +
    "    <div ng-if=\"view.pendingRequests == 0 && view.params.yaxis == null\" class=\"alert alert-info\" style=\"margin-bottom: 0px;\">\n" +
    "        <p>\n" +
    "            Cannot present series table: no <b>measure</b> has been selected.\n" +
    "        </p>\n" +
    "        <p>\n" +
    "            Tip: use the <kbd><i class=\"fa fa-fw fa-cogs\"></i> View &gt; <i class=\"fa fa-fw fa-crosshairs\"></i> Measure</kbd> menu.\n" +
    "        </p>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=\"view.pendingRequests == 0 && view.params.yaxis != null && view.grid.data.length == 0\" class=\"alert alert-info\" style=\"margin-bottom: 0px;\">\n" +
    "        <p>\n" +
    "            Cannot present series table: <b>no rows</b> are returned by the current horizontal dimension, drilldown or filtering combination.\n" +
    "        </p>\n" +
    "        <p>\n" +
    "            Tip: use the <kbd><i class=\"fa fa-fw fa-cogs\"></i> View</kbd> menu to select an horizontal dimension.\n" +
    "        </p>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n"
  );

}]);
