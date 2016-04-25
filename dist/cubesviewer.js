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
 * If your version of the Software supports interaction with it remotely through
 * a computer network, the above copyright notice and this permission notice
 * shall be accessible to all users.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


/* 'use strict'; */


angular.module('bootstrapSubmenu', []).directive("submenu", ['$timeout', function($timeout) {
	return {
		restrict: 'A',
		link: function(scope, iElement, iAttrs) {
			// FIXME: This is not a proper way of waiting for the menu to be constructed.
			$timeout(function() {
				$(iElement).submenupicker();
			}, 250);
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
    	cubeinfos = $.grep(this._cube_list, function (ci) { return ci.name == cubename });
    	if (cubeinfos.length != 1) throw "Found " + cubeinfos.length + " cubes with name '" + cubename + "' in the cube list";
    	return cubeinfos[0];
    };
    
    cubes.Server.prototype.ajaxRequest = function(settings) {
        throw "Must implement ajaxRequest for server to process jquery-style $.ajax settings object";
    };

    cubes.Server.prototype.query = function(query, cube, args, callback, errCallback, completeCallback) {
        var params = {dataType : 'json', type : "GET"};

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
            callback(this._cubes[name]);
            return null;
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
        the_attr = _.find(this.attributes, function(a) { return a.name === key; });
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
        if ( this._order_attribute ) {
          the_attr = _.find(this.attributes, function(a) { a.name === this.__order_attribute; });
        }
        return the_attr || this.key();
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
 * Copyright (c) 2012-2015 Jose Juan Montes, see AUTHORS for more details
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
 * If your version of the Software supports interaction with it remotely through
 * a computer network, the above copyright notice and this permission notice
 * shall be accessible to all users.
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
	for (hiename in this.hierarchies) {
		if (this.hierarchies.hasOwnProperty(hiename)) {
			count++;
		}
	}
	return count;
};
cubes.Dimension.prototype.default_hierarchy = function()  {
	return this.hierarchies[this.default_hierarchy_name];
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
cubes.Cube.prototype.cvdim_parts = function(dimensionString) {
	// Get a dimension info by name. Accepts dimension hierarchy and level in the input string.

	var dim = this.cvdim_dim(dimensionString);
	var hie = dim.default_hierarchy();

	if (dimensionString.indexOf("@") > 0) {
		var hierarchyName = dimensionString.split("@")[1].split(":")[0];
		hie = dim.hierarchy(hierarchyName);
	}

	var lev = null;
	if (dimensionString.indexOf(":") > 0) {
		var levelname = dimensionString.split(":")[1];
		lev = dim.level(levelname);
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
		depth: depth,
		hierarchy: hie,
		label: dim.label + ( hie.name != "default" ? (" / " + hie.label) : "" ) + ( hie.levels.length > 1 ? (": " + lev.label) : "" ),
		labelNoLevel: dim.label + ( hie.name != "default" ? (" / " + hie.label) : "" ),
		fullDrilldownValue: dim.name + ( hie.name != "default" ? ("@" + hie.name) : "" ) + ":" + lev.name
	};

};
/*
 * Processes a cell and returns an object with a stable information:
 * o.key
 * o.label
 * o.info[]
 */
cubes.Level.prototype.readCell = function(cell) {

	if (!(this.key().ref in cell)) return null;

	var result = {};
	result.key = cell[this.key().ref];
	result.label = cell[this.label_attribute().ref];
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
		info = level.readCell(cell);
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
 * Copyright (c) 2012-2015 Jose Juan Montes, see AUTHORS for more details
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
 * If your version of the Software supports interaction with it remotely through
 * a computer network, the above copyright notice and this permission notice
 * shall be accessible to all users.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

angular.module('cv.cubes', []);

angular.module('cv.cubes').service("cubesService", ['$rootScope', 'cvOptions',
                                                    function ($rootScope, cvOptions) {

	var cubesService = this;

	this.cubesserver = null;

	this.initialize = function() {
	};

	/**
	 * Connects this service to the Cubes server.
	 */
	this.connect = function() {
		// Initialize Cubes client library
		this.cubesserver = new cubes.Server(cubesService.cubesAjaxHandler);
		console.debug("Cubes client connecting to: " + cvOptions.cubesUrl);
		this.cubesserver.connect (cvOptions.cubesUrl, function() {
			console.debug('Cubes client initialized (server version: ' + cubesService.cubesserver.server_version + ')');
			//$(document).trigger ("cubesviewerInitialized", [ this ]);
			$rootScope.$apply();
		} );
	};


	/*
	 * Ajax handler for cubes library
	 */
	this.cubesAjaxHandler = function (settings) {
		return cubesService.cubesRequest(settings.url, settings.data || [], settings.success);
	};


	/*
	 * Cubes centralized request
	 */
	this.cubesRequest = function(path, params, successCallback) {

		// TODO: normalize how URLs are used (full URL shall come from client code)
		if (path.charAt(0) == '/') path = cvOptions.cubesUrl + path;

		var jqxhr = $.get(path, params, cubesService._cubesRequestCallback(successCallback), cvOptions.jsonRequestType);

		jqxhr.fail(cubesService.defaultRequestErrorHandler);

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
		// TODO: These alerts are not acceptable.
		if (xhr.status == 401) {
			cubesviewer.alert("Unauthorized.");
		} else if (xhr.status == 403) {
			cubesviewer.alert("Forbidden.");
		} else if (xhr.status == 400) {
			cubesviewer.alert($.parseJSON(xhr.responseText).message);
		} else {
			console.debug(xhr);
			cubesviewer.showInfoMessage("CubesViewer: An error occurred while accessing the data server.\n\n" +
										"Please try again or contact the application administrator if the problem persists.\n");
		}
		//$('.ajaxloader').hide();
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
				drilldowns[i] = cubes.drilldown_from_string(view.cube, view.cube.cvdim_parts(drilldowns[i]).fullDrilldownValue);
			}

			// Include drilldown array
			if (drilldowns.length > 0)
				args.drilldown = cubes.drilldowns_to_string(drilldowns);
		}

		// Cuts
		var cuts = this.buildQueryCuts(view);
		if (cuts.length > 0) args.cut = new cubes.Cell(view.cube, cuts);

		return args;

	}

	/*
	 * Builds Query Cuts
	 */
	this.buildQueryCuts = function(view) {

		// Include cuts
		var cuts = [];
		$(view.params.cuts).each(function(idx, e) {
			var invert = e.invert ? "!" : "";
			cuts.push(cubes.cut_from_string (view.cube, invert + e.dimension + ":" + e.value));
		});

		return cuts;
	};


	this.initialize();

}]);


;/*
 * CubesViewer
 * Copyright (c) 2012-2015 Jose Juan Montes, see AUTHORS for more details
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
 * If your version of the Software supports interaction with it remotely through
 * a computer network, the above copyright notice and this permission notice
 * shall be accessible to all users.
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
 * Main cubesviewer object. It is created by the library and made
 * available as the global "cubesviewer" variable.
 */
function cubesviewerOLD() {

	// Alerts component
	this._alerts = null;

	// Current alerts
	this.alerts = [];


	/*
	 * Show a global alert
	 */
	this.alert = function (message) {
		alert ("CubesViewer " + this.version + "\n\n" + message);
	}

	/*
	 * Refresh
	 */
	this.refresh = function() {
		$(document).trigger("cubesviewerRefresh");
	}

  /*
   * Save typing while debugging - get a view object with: cubesviewer.getView(1)
   */

  this.getView = function(id) {
    var viewid = id.toString();
    viewid = viewid.indexOf('view') === 0 ? viewid : 'view' + viewid;
    viewid = viewid[0] === '#' ? viewid : '#' + viewid;

    return $(viewid + ' .cv-gui-viewcontent').data('cubesviewer-view');
  };


	/*
	 * Change language for Cubes operations
	 * (locale must be one of the possible languages for the model).
	 */
	this.changeCubesLang = function(lang) {

		this.options.cubesLang = (lang == "" ? null : lang);

		// Reinitialize system
		this.refresh();

	};

	/*
	 * Show quick tip message.
	 */
	this.showInfoMessage = function(message, delay) {

		if (this._alerts == null) {

			this._alerts = new Ractive({
				el: $("body")[0],
				append: true,
				template: cvtemplates.alerts,
				partials: cvtemplates,
				data: { 'cv': this }
			});
		}

		if (delay == undefined) delay = 5000;

		this.alerts.push({ 'text': message });
		this._alerts.reset({ 'cv': this });

	};

};

// Main CubesViewer angular module
angular.module('cv', ['bootstrapSubmenu', 'ui.grid', 'ui.grid.resizeColumns', 'ui.grid.selection',
                      'cv.cubes', 'cv.views']);

// Configure moment.js
angular.module('cv').constant('angularMomentConfig', {
	// preprocess: 'unix', // optional
	// timezone: 'Europe/London' // optional
});

angular.module('cv').run([ '$timeout', 'cvOptions', 'cubesService', /* 'editableOptions', 'editableThemes', */
                           function($timeout, cvOptions, cubesService /*, editableOptions, editableThemes */) {

	//console.debug("Bootstrapping CubesViewer.");

    var defaultOptions = {
            cubesUrl : null,
            cubesLang : null,
            pagingOptions: [15, 30, 100, 250],
            datepickerShowWeek: true,
            datepickerFirstDay: 1,
            tableResizeHackMinWidth: 350 ,
            jsonRequestType: "json" // "json | jsonp"
    };
	$.extend(defaultOptions, cvOptions);
	$.extend(cvOptions, defaultOptions);

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

	// Initialize Cubes service
	cubesService.connect();

}]);


// Cubesviewer Javascript entry point
var cubesviewer = {

	// CubesViewer version
	version: "2.0.1-devel",

	VIEW_STATE_INITIALIZING: 1,
	VIEW_STATE_INITIALIZED: 2,
	VIEW_STATE_ERROR: 3,

	_configure: function(options) {
		angular.module('cv').constant('cvOptions', options);
	},

	init: function(options) {
		this._configure(options);
		angular.element(document).ready(function() {
			angular.bootstrap(document, ['cv']);
		});
	}

};



;/*
 * CubesViewer
 * Copyright (c) 2012-2015 Jose Juan Montes, see AUTHORS for more details
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
 * If your version of the Software supports interaction with it remotely through
 * a computer network, the above copyright notice and this permission notice
 * shall be accessible to all users.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


'use strict';


angular.module('cv.views', ['cv.views.cube']);

angular.module('cv.views').service("viewsService", ['$rootScope', 'cvOptions', 'cubesService',
                                                    function ($rootScope, cvOptions, cubesService) {

	this.views = [];

	/**
	 * Adds a new clean view for a cube.
	 * This accepts parameters as an object or as a serialized string.
	 */
	this.createView = function(id, type, data) {

		// Create view

		var params = {};

		if (typeof data == "string") {
			try {
				params = $.parseJSON(data);
			} catch (err) {
				alert ('Error: could not process serialized data (JSON parse error).');
				params["name"] = "Undefined view";
			}
		} else {
			params = data;
		}

		var view = {
			"id": id,
			"type": type,
			"state": cubesviewer.STATE_INITIALIZING,
			"params": {}
		};

		$.extend(view.params, params);
		$(document).trigger("cubesviewerViewCreate", [ view ] );
		$.extend(view.params, params);


		if (view.state == cubesviewer.STATE_INITIALIZING) view.state = cubesviewer.STATE_INITIALIZED;

		return view;
	};


}]);


/**
 * cvView directive. This is the core CubesViewer directive, which shows
 * a configured view.
 */
/* */


function cubesviewerViews () {

	/*
	 * Shows an error message on a view container.
	 */
	this.showFatal = function (container, message) {
		container.empty().append (
				'<div class="ui-widget">' +
				'<div class="ui-state-error ui-corner-all" style="padding: 0 .7em;">' +
				'<p><span class="ui-icon ui-icon-alert" style="float: left; margin-right: .3em;"></span>' +
				'<strong>Error</strong><br/><br/>' + message +
				'</p></div></div>'
		);
	}



	/**
	 * Destroys a view
	 */
	this.destroyView = function(view) {

		// Do cleanup

		// Trigger destroyed event
		$(document).trigger("cubesviewerViewDestroyed", [ view ] );

	};

	/*
	 * Locates a view object walking up the parents chain of an element.
	 */
	this.getParentView = function(node) {
		var view = null;
		$(node).parents().each(function(idx, el) {
			if (($(el).data("cubesviewer-view") != undefined) && (view == null)) {
				view = $(el).data("cubesviewer-view");
			}
		});
		return view;
	}

	/*
	 * Block the view interface.
	 */
	this.blockView = function (view, message) {
		if (message == "undef") message = null;
		$(view.container).block({
			"message": message,
			"fadeOut": 200,
			"onUnblock": function() {
				// Fix conflict with jqBlock which makes menus to not overflow off the view (makes menus innacessible)
				$(view.container).css("position", "inherit");
			}
		});
	}

	/*
	 * Block the view interface with a loading message
	 */
	this.blockViewLoading = function (view) {
		this.blockView (view, '<span class="ajaxloader" title="Loading..." >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Loading</span>');
	}

	/*
	 * Unblock the view interface.
	 */
	this.unblockView = function (view) {

		$(view.container).unblock();

	}


	/*
	 * Triggers redraw for a given view.
	 */
	this.redrawView = function (view) {
		// TODO: Review if if below is needed
		//if (view == null) return;
		$(document).trigger ("cubesviewerViewDraw", [ view ]);
	}

	/*
	 * Updates view when the view is refreshed.
	 */
	this.onViewDraw = function (event, view) {

		if (view.state == cubesviewer.views.STATE_ERROR) {
			cubesviewer.views.showFatal (view.container, 'An error has occurred. Cannot present view.');
			event.stopImmediatePropagation();
			return;
		}

	}

	/*
	 * Serialize view data.
	 */
	this.serialize = function (view) {
		return JSON.stringify(view.params);
	};

};

;/*
 * CubesViewer
 * Copyright (c) 2012-2015 Jose Juan Montes, see AUTHORS for more details
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
 * If your version of the Software supports interaction with it remotely through
 * a computer network, the above copyright notice and this permission notice
 * shall be accessible to all users.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

/**
 * CubesViewer view module.
 */
angular.module('cv.views.cube', []);


/**
 * cvViewCube directive and controller.
 */
angular.module('cv.views.cube').controller("CubesViewerViewsCubeController", ['$rootScope', '$scope', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, cvOptions, cubesService, viewsService) {

	$scope.view._cubeDataUpdated = false;

	/**
	 * Define view mode ('explore', 'series', 'facts', 'chart').
	 */
	$scope.setViewMode = function(mode) {
		$scope.view.params.mode = mode;
	};


	$scope.initCube = function() {

		$scope.view.cube = null;

		// Apply default cube view parameters
		var cubeViewDefaultParams = {
			"mode" : "explore",
			"drilldown" : [],
			"cuts" : []
		};
		$scope.view.params = $.extend(true, {}, cubeViewDefaultParams, $scope.view.params);

		var jqxhr = cubesService.cubesserver.get_cube($scope.view.params.cubename, function(cube) {

			$scope.view.cube = cube;

			// Apply parameters if cube metadata contains specific cv-view-params
			// TODO: Don't do this if this was a saved or pre-initialized view, only for new views
			if ('cv-view-params' in $scope.view.cube.info) $.extend($scope.view.params, $scope.view.cube.info['cv-view-params']);

			$scope.view._cubeDataUpdated = true;

			$rootScope.$apply();

		});
		if (jqxhr) {
			jqxhr.fail(function() {
				$scope.view.state = cubesviewer.STATE_ERROR;
				$rootScope.$apply();
			});
		}
	};

	/**
	 * Adds a drilldown level.
	 * Dimension is encoded using Cubes notation: dimension[@hierarchy][:level]
	 */
	$scope.selectDrill = function(dimension, value) {

		var cube = $scope.view.cube;

		// view.params.drilldown = (drilldown == "" ? null : drilldown);
		if (dimension == "") {
			$scope.view.params.drilldown = [];
		} else {
			$scope.removeDrill(dimension);
			if (value == true) {
				$scope.view.params.drilldown.push(dimension);
			}
		}

		$scope.view._cubeDataUpdated = true;
	};

	/**
	 * Removes a level from the view.
	 */
	$scope.removeDrill = function(drilldown) {

		var drilldowndim = drilldown.split(':')[0];

		for ( var i = 0; i < $scope.view.params.drilldown.length; i++) {
			if ($scope.view.params.drilldown[i].split(':')[0] == drilldowndim) {
				$scope.view.params.drilldown.splice(i, 1);
				break;
			}
		}

		$scope.view._cubeDataUpdated = true;
	};

	/**
	 * Accepts an aggregation or a measure and returns the formatter function.
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
			measure = $.grep(view.cube.measures, function(item, idx) { return item.ref == agmes.measure })[0];
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


	var intString = Math.floor(value).toString();
	for (var i = 0; i < intString.length; i++) {
		result = result + intString[i];
		var invPos = (intString.length - i - 1);
		if (invPos > 0 && invPos % 3 == 0) result = result + thousandsSeparator;
	}
	if (decimalPlaces > 0) {
		result = result + parseFloat(value - Math.floor(value)).toFixed(decimalPlaces).toString().replace(".", decimalSeparator).substring(1);
	}

	return result;
};

;/*
 * CubesViewer
 * Copyright (c) 2012-2015 Jose Juan Montes, see AUTHORS for more details
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
 * If your version of the Software supports interaction with it remotely through
 * a computer network, the above copyright notice and this permission notice
 * shall be accessible to all users.
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
 * cvViewCube directive and controller.
 */
angular.module('cv.views.cube').controller("CubesViewerViewsCubeExploreController", ['$rootScope', '$scope', 'cvOptions', 'cubesService', 'viewsService',
                                                     function ($rootScope, $scope, cvOptions, cubesService, viewsService) {

	$scope.gridData = [];
	$scope.gridOptions = {};

	$scope.initialize = function() {
	};

	$scope.$watch("view._cubeDataUpdated", function(newVal) {
		if (newVal) {
			$scope.view._cubeDataUpdated = false;
			$scope.loadData();
		}
	});

	$scope.loadData = function() {

		//$scope.view.cubesviewer.views.blockViewLoading(view);
		var browser_args = cubesService.buildBrowserArgs($scope.view, false, false);
		var browser = new cubes.Browser(cubesService.cubesserver, $scope.view.cube);
		var jqxhr = browser.aggregate(browser_args, $scope._loadDataCallback);
		jqxhr.always(function() {
			//view.cubesviewer.views.unblockView(view);
		});

	};

	$scope._loadDataCallback = function(data, status) {
		$scope.processData(data);
		$rootScope.$apply();
	};

	$scope.processData = function(data) {

		var view = $scope.view;

		$scope.gridData = [];
		$scope.gridFormatters = {};

	    // Configure grid
	    $scope.gridOptions = {
    		data: $scope.gridData,
    		enableColumnResizing: true,
    		showColumnFooter: true,
    		enableRowSelection: true,
    		multiSelect: true,
    		//selectionRowHeaderWidth: 20,
    		//rowHeight: 50,
    		columnDefs: []
	    };

		$(view.cube.aggregates).each(function(idx, ag) {
			var col = {
				title: ag.label,
				field: ag.ref,
				index : ag.ref,
				cellClass : "text-right",
				//sorttype : "number",
				//width : view.cube.explore.defineColumnWidth(view, ag.ref, 95),
				cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP">{{ col.colDef.formatter(COL_FIELD, row, col) }}</div>',
				formatter: $scope.columnFormatFunction(ag)
				//formatoptions: {},
				//cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
			};
			$scope.gridOptions.columnDefs.push(col);

			//if (data.summary) dataTotals[ag.ref] = data.summary[ag.ref];
		});

		// If there are cells, show them
		$scope._sortData($scope.view, data.cells, false);
		$scope._addRows($scope.view, $scope.gridData, data);

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
			var parts = view.cube.cvdim_parts(view.params.drilldown[i]);
			var cutDimension = parts.dimension.name + ( parts.hierarchy.name != "default" ? "@" + parts.hierarchy.name : "" );

			//nid.push(drilldown_level_values.join("-"));

			$scope.gridOptions.columnDefs.splice(i, 0, {
				title: label[i],
				field: "key" + i,
				index: "key" + i,
				cutDimension: cutDimension,
				//width: cubesviewer.views.cube.explore.defineColumnWidth(view, "key" + i, 130)
				cellTemplate: '<div class="ui-grid-cell-contents" title="TOOLTIP"><a href="" ng-click="selectCut(col.colDef.cutDimension, COL_FIELD.cutValue, false)">{{ COL_FIELD.title }}</a></div>',
				/*
				key.push('<a href="" class="cv-grid-link" onclick="' + "cubesviewer.views.cube.explore.selectCut(cubesviewer.views.getParentView(this), $(this).attr('data-dimension'), $(this).attr('data-value'), $(this).attr('data-invert')); return false;" +
						 '" class="selectCut" data-dimension="' + cutDimension + '" ' +
						 'data-value="' + drilldown_level_values.join(",") + '">' +
						 drilldown_level_labels.join(" / ") + '</a>');
				*/

			});
		}

		if (view.params.drilldown.length == 0) {
			$scope.gridOptions.columnDefs.splice(0, 0, {
				name: view.cube.label,
				field: "key" + 0,
				index: "key" + 0,
				align: "left",
				//width: cubesviewer.views.cube.explore.defineColumnWidth(view, "key" + 0, 110)
			});
		}


	};

	/*
	 * Show received summary
	 */
	this.drawSummary = function(view, data) {

		dataTotals["key0"] = (cubesviewer.views.cube.buildQueryCuts(view).length == 0) ? "<b>Summary</b>"
				: "<b>Summary <i>(Filtered)</i></b>";

		$('#summaryTable-' + view.id).get(0).updateIdsOfSelectedRows = function(
				id, isSelected) {
			var index = $.inArray(id,
					$('#summaryTable-' + view.id).get(0).idsOfSelectedRows);
			if (!isSelected && index >= 0) {
				$('#summaryTable-' + view.id).get(0).idsOfSelectedRows.splice(
						index, 1); // remove id from the list
			} else if (index < 0) {
				$('#summaryTable-' + view.id).get(0).idsOfSelectedRows.push(id);
			}
		};

		$('#summaryTable-' + view.id).get(0).idsOfSelectedRows = [];
		$('#summaryTable-' + view.id)
				.jqGrid(
						{
							data : dataRows,
							userData : (data.summary ? dataTotals : null),
							datatype : "local",
							height : 'auto',
							rowNum : cubesviewer.options.pagingOptions[0],
							rowList : cubesviewer.options.pagingOptions,
							colNames : colNames,
							colModel : colModel,
							pager : "#summaryPager-" + view.id,
							sortname : cubesviewer.views.cube.explore.defineColumnSort(view, ["key", "desc"])[0],
							viewrecords : true,
							sortorder : cubesviewer.views.cube.explore.defineColumnSort(view, ["key", "desc"])[1],
							footerrow : true,
							userDataOnFooter : true,
							forceFit : false,
							shrinkToFit : false,
							width: cubesviewer.options.tableResizeHackMinWidth,
							// autowidth: true,
							multiselect : true,
							multiboxonly : true,

							// caption: "Current selection data" ,
							// beforeSelectRow : function () { return false; }

							onSelectRow : $('#summaryTable-' + view.id).get(0).updateIdsOfSelectedRows,
							onSelectAll : function(aRowids, isSelected) {
								var i, count, id;
								for (i = 0, count = aRowids.length; i < count; i++) {
									id = aRowids[i];
									$('#summaryTable-' + view.id).get(0)
											.updateIdsOfSelectedRows(id,
													isSelected);
								}
							},
							loadComplete : function() {
								var i, count;
								for (
										i = 0,
										count = $('#summaryTable-' + view.id)
												.get(0).idsOfSelectedRows.length; i < count; i++) {
									$(this)
											.jqGrid(
													'setSelection',
													$('#summaryTable-' + view.id)
															.get(0).idsOfSelectedRows[i],
													false);
								}
								// Call hook
								view.cubesviewer.views.cube.explore.onTableLoaded (view);
							},
							resizeStop: view.cubesviewer.views.cube.explore._onTableResize (view),
							onSortCol: view.cubesviewer.views.cube.explore._onTableSort (view),

						});

		this.cubesviewer.views.cube._adjustGridSize(); // remember to copy also the window.bind-resize init


	};

	$scope._addRows = function(view, rows, data) {

		$(data.cells).each( function(idx, e) {

			var nid = [];
			var row = {};
			var key = [];

			// For each drilldown level
			for ( var i = 0; i < view.params.drilldown.length; i++) {

				// Get dimension
				var dim = view.cube.cvdim_dim(view.params.drilldown[i]);

				var parts = view.cube.cvdim_parts(view.params.drilldown[i]);
				var infos = parts.hierarchy.readCell(e, parts.level);

				// Values and Labels
				var drilldown_level_values = [];
				var drilldown_level_labels = [];

				$(infos).each(function(idx, info) {
					drilldown_level_values.push (info.key);
					drilldown_level_labels.push (info.label);
				});

				nid.push(drilldown_level_values.join("-"));

				var cutDimension = parts.dimension.name + ( parts.hierarchy.name != "default" ? "@" + parts.hierarchy.name : "" );
				key.push({ cutValue: drilldown_level_values.join(","), title: drilldown_level_labels.join(" / ")});
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
			rows.push(row);
		});

		// Copy summary if there's no data
		// This allows a scrollbar to appear in jqGrid when only the summary row is shown.
		if ((rows.length == 0) && (data.summary)) {
			var row = {};
			row["key0"] = "Summary";

			$(view.cube.aggregates).each(function(idx, ag) {
				row[ag.ref] = data.summary[ag.ref];
			});

			rows.push(row);
		}

	};

	// Sort data according to current view
	$scope._sortData = function(view, data, includeXAxis) {
		//data.sort(cubesviewer._drilldownSortFunction(view.id, includeXAxis));
	};

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



	this._onTableSort = function (view) {
		return function (index, iCol, sortorder) {
			view.cubesviewer.views.cube.explore.onTableSort (view, index, iCol, sortorder);
		}
	}

	this._onTableResize = function (view) {
		return function(width, index) {
			view.cubesviewer.views.cube.explore.onTableResize (view, width, index);
		};
	};

	this.onTableResize = function (view, width, index) {
		// Empty implementation, to be overrided
		//alert("resize column " + index + " to " + width + " pixels");
	};
	this.onTableLoaded = function (view) {
		// Empty implementation, to be overrided
	};
	this.onTableSort = function (view, key, index, iCol, sortorder) {
		// Empty implementation, to be overrided
	};

	this.defineColumnWidth = function (view, column, vdefault) {
		// Simple implementation. Overrided by the columns plugin.
		return vdefault;
	};
	this.defineColumnSort = function (view, vdefault) {
		// Simple implementation. Overrided by the columns plugin.
		return vdefault;
	};


	this.drawInfoPiece = function(selector, color, maxwidth, readonly, content) {

		var maxwidthStyle = "";
		if (maxwidth != null) {
			maxwidthStyle = "max-width: " + maxwidth + "px;";
		}
		selector.append(
			'<div class="infopiece" style="background-color: ' + color + '; white-space: nowrap;">' +
			'<div style="white-space: nowrap; overflow: hidden; display: inline-block; vertical-align: middle; ' + maxwidthStyle + '">' +
			content + '</div>' +
			( ! readonly ? ' <button style="display: inline-block; vertical-align: middle;" class="cv-view-infopiece-close"><span class="ui-icon ui-icon-close"></span></button></div>' : '' )
		);

		selector.children().last().addClass('ui-widget').css('margin', '2px').css('padding', '3px').css('display', 'inline-block').addClass('ui-corner-all');
		selector.children().last().find('button').button().find('span').css('padding', '0px');

		return selector.children().last();
	};

	// Draw information bubbles
	this.drawInfo = function(view, readonly) {

		$(view.params.cuts).each(function(idx, e) {
			var dimparts = view.cube.cvdim_parts(e.dimension.replace(":",  "@"));
			var equality = e.invert ? ' != ' : ' = ';
			var piece = cubesviewer.views.cube.explore.drawInfoPiece(
				$(view.container).find('.cv-view-viewinfo-cut'), "#ffcccc", 480, readonly,
				'<span class="ui-icon ui-icon-zoomin"></span> <span><b>Filter: </b> ' + dimparts.label  + equality + '</span>' +
				'<span title="' + e.value + '">' + e.value + '</span>'
			);
			piece.addClass("cv-view-infopiece-cut");
			piece.attr("data-dimension", e.dimension);
			piece.attr("data-value", e.value);
			piece.attr("data-invert", e.invert || false);
			piece.find('.cv-view-infopiece-close').click(function() {
				view.cubesviewer.views.cube.explore.selectCut(view, e.dimension, "", e.invert);
			});
		});

		if (readonly) {
			$(view.container).find('.infopiece').find('.ui-icon-close')
					.parent().remove();
		}

	};


	/*
	 * Filters current selection
	 */
	this.filterSelected = function(view) {

		if (view.params.drilldown.length != 1) {
			view.cubesviewer.alert('Can only filter multiple values in a view with one level of drilldown.');
			return;
		}
		if ($('#summaryTable-' + view.id).get(0).idsOfSelectedRows.length <= 0) {
			view.cubesviewer.alert('Cannot filter. No rows are selected.');
			return;
		}

		var dom = null;
		var filterValues = [];
		var idsOfSelectedRows = $('#summaryTable-' + view.id).get(0).idsOfSelectedRows;
		var filterData = $.grep($('#summaryTable-' + view.id).jqGrid('getGridParam','data'), function (gd) {
			return ($.inArray(gd.id, idsOfSelectedRows) != -1);
		} );
		$(filterData).each( function(idx, gd) {
			dom = $(gd["key0"]);
			filterValues.push($(dom).attr("data-value"));
		});

		var invert = false;
		this.selectCut(view, $(dom).attr("data-dimension"), filterValues.join(";"), invert);

	};

	// Select a cut
	this.selectCut = function(view, dimension, value, invert) {

		if (dimension != "") {
			if (value != "") {
				/*
				var existing_cut = $.grep(view.params.cuts, function(e) {
					return e.dimension == dimension;
				});
				if (existing_cut.length > 0) {
					//view.cubesviewer.alert("Cannot cut dataset. Dimension '" + dimension + "' is already filtered.");
					//return;
				} else {*/
					view.params.cuts = $.grep(view.params.cuts, function(e) {
						return e.dimension == dimension;
					}, true);
					view.params.cuts.push({
						"dimension" : dimension,
						"value" : value,
						"invert" : invert
					});
				/*}*/
			} else {
				view.params.cuts = $.grep(view.params.cuts, function(e) {
					return e.dimension == dimension;
				}, true);
			}
		} else {
			view.params.cuts = [];
		}

		view.cubesviewer.views.redrawView (view);

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
 * If your version of the Software supports interaction with it remotely through
 * a computer network, the above copyright notice and this permission notice
 * shall be accessible to all users.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


angular.module('cv.studio', ['ui.bootstrap', 'cv' /*'ui.bootstrap-slider', 'ui.validate', 'ngAnimate', */
                             /*'angularMoment', 'smart-table', 'angular-confirm', 'debounce', 'xeditable',
                             'nvd3' */ ]);


angular.module('cv.studio').service("studioViewsService", ['$rootScope', 'cvOptions', 'cubesService', 'viewsService',
                                                            function ($rootScope, cvOptions, cubesService, viewsService) {

	this.views = [];

	this.lastViewId = 0;

	/**
	 * Adds a new clean view for a cube
	 */
	this.addViewCube = function(cubename) {

		this.lastViewId++;
		var viewId = "view" + this.lastViewId;


		// Find cube name
		var cubeinfo = cubesService.cubesserver.cubeinfo(cubename);

		//var container = this.createContainer(viewId);
		//$('.cv-gui-viewcontent', container),

		var view = viewsService.createView(viewId, "cube", { "cubename": cubename, "name": cubeinfo.label + " (" + this.lastViewId + ")" });
		this.views.push(view);

		return view;
	};

	/**
	 * Closes the panel of the given view.
	 */
	this.closeView = function(view) {
		var viewIndex = this.views.indexOf(view);
		if (viewIndex >= 0) {
			this.views.splice(viewIndex, 1);
		}
	};

}]);


/**
 * cvStudioView directive. Shows a Studio panel containing the corresponding view.
 */
angular.module('cv.studio').controller("CubesViewerStudioViewController", ['$rootScope', '$scope', 'cvOptions', 'cubesService', 'studioViewsService',
                                                     function ($rootScope, $scope, cvOptions, cubesService, studioViewsService) {

	$scope.studioViewsService = studioViewsService;

}]).directive("cvStudioView", function() {
	return {
		restrict: 'A',
		templateUrl: 'studio/panel.html',
		scope: {
			view: "="
		}

	};
});



angular.module('cv.studio').controller("CubesViewerStudioController", ['$rootScope', '$scope', 'cvOptions', 'cubesService', 'studioViewsService',
                                                                       function ($rootScope, $scope, cvOptions, cubesService, studioViewsService) {

	$scope.cvVersion = cubesviewer.version;
	$scope.cvOptions = cvOptions;
	$scope.cubesService = cubesService;
	$scope.studioViewsService = studioViewsService;

	// Current views array
	this.views = [];

	// View counter (used to assign different ids to each spawned view)
	this.lastViewId = 0;


	/**
	 * Closes a view.
	 */
	$scope.closeView = function(view) {
		for ( var i = 0; (i < this.views.length) && (this.views[i].id != view.id); i++) ;

		$('#' + view.id).remove();
		this.views.splice(i, 1);

		cubesviewer.views.destroyView (view);
	};



	/*
	 * Adds a view given its params descriptor.
	 */
	$scope.addViewObject = function(data) {

		this.lastViewId++;
		var viewId = "view" + this.lastViewId;

		var container = this.createContainer(viewId);
		var view = this.cubesviewer.views.createView(viewId, $('.cv-gui-viewcontent', container), "cube", data);
		this.views.push (view);

		// Bind close button
		$(container).find('.cv-gui-closeview').click(function() {
			cubesviewer.gui.closeView(view);
			return false;
		});

		return view;

	};

	/*
	 * Creates a container for a view.
	 */
	this.createContainer = function(viewId) {

		// Configure collapsible
		/*
		$('#' + viewId + " .cv-gui-cubesview").accordion({
			collapsible : true,
			autoHeight : false
		});
		$('#' + viewId + " .cv-gui-viewcontent").css({
			"height": ""
		});
		$('#' + viewId + " .cv-gui-cubesview").on("accordionbeforeactivate", function (evt, ui) {
			if (cubesviewer.gui._sorting == true) {
				evt.preventDefault();
				evt.stopImmediatePropagation();
			}
		});
		*/

		return $('#' + viewId);
	};

	/*
	 * Updates view information in the container when a view is refreshed
	 */
	this.onViewDraw = function (event, view) {

		var container = $(view.container).parents('.cv-gui-cubesview');
		$('.cv-gui-container-name', container).empty().text(view.params.name);

		view.cubesviewer.gui.drawMenu(view);
	}

	/*
	 * Draw cube view menu
	 */
	this.drawMenu = function(view) {

		// Add panel menu options button
		$(view.container).find('.cv-view-toolbar').append(
			'<button class="panelbutton" title="Panel">Panel</button>'
		);

		$(view.container).find('.cv-view-viewmenu').append(
			'<ul class="cv-view-menu cv-view-menu-panel" style="float: right; width: 180px;"></ul>'
		);

		// Buttonize
		$(view.container).find('.panelbutton').button();


		var menu = $(".cv-view-menu-panel", $(view.container));
		menu.append(
			'<li><a class="cv-gui-cloneview" href="#"><span class="ui-icon ui-icon-copy"></span>Clone</a></li>' +
			'<li><a class="cv-gui-renameview" href="#"><span class="ui-icon ui-icon-pencil"></span>Rename...</a></li>' +
			'<div></div>' +
			'<li><a class="cv-gui-closeview" href="#"><span class="ui-icon ui-icon-close"></span>Close</a></li>'
		);

		// Menu functionality
		view.cubesviewer.views.cube._initMenu(view, '.panelbutton', '.cv-view-menu-panel');

		$(view.container).find('.cv-gui-closeview').unbind("click").click(function() {
			cubesviewer.gui.closeView(view);
			return false;
		});
		$(view.container).find('.cv-gui-renameview').unbind("click").click(function() {
			cubesviewer.gui.renameView(view);
			return false;
		});
		$('#' + view.id).find('.cv-gui-container-name').unbind("dblclick").dblclick(function() {
			cubesviewer.gui.renameView(view);
			return false;
		});
		$(view.container).find('.cv-gui-cloneview').unbind("click").click(function() {
			cubesviewer.gui.cloneView(view);
			return false;
		});


	}

	/*
	 * Renames a view (this is the user-defined label that is shown in the GUI header).
	 */
	this.renameView = function(view) {

		var newname = prompt("Enter new view name:", view.params.name);

		// TODO: Validate name

		if ((newname != null) && (newname != "")) {
			view.params.name = newname;
			cubesviewer.views.redrawView(view);
		}

	};

	/*
	 * Clones a view.
	 * This uses the serialization facility.
	 */
	this.cloneView = function(view) {

		viewobject = $.parseJSON(view.cubesviewer.views.serialize(view));
		viewobject.name = "Clone of " + viewobject.name;

		var view = this.addViewObject(viewobject);

		// TODO: These belong to plugins
		view.savedId = 0;
		view.owner = this.options.user;
		view.shared = false;

		this.cubesviewer.views.redrawView (view);
	};

	// Model Loaded Event (redraws cubes list)
	this.onCubesViewerInitialized = function() {
		cubesviewer.gui.drawCubesList();
	};


	this.drawCubesList = function() {

		// Add handlers for clicks
		$('.cv-gui-cubeslist-menu', $(cubesviewer.gui.options.container)).find('.cv-gui-addviewcube').click(function() {
			var view = cubesviewer.gui.addViewCube(  $(this).attr('data-cubename') );
			//view.cubesviewer.showAboutviews.redrawView (view);
			return false;
		});

		// Redraw views
		$(cubesviewer.gui.views).each(function(idx, view) {
			view.cubesviewer.views.redrawView(view);
		});

	};

	/*
	 * Render initial (constant) elements for the GUI
	 */
	this.onGuiDraw = function(event, gui) {

		$('[data-submenu]', gui.options.container).submenupicker();


		// Configure sortable panel
		/*
		$(gui.options.container).children('.cv-gui-workspace').sortable({
			placeholder : "ui-state-highlight",
			// containment: "parent",
			distance : 15,
			delay : 300,
			handle : ".sorthandle",

			start : function(evt, ui) {
				cubesviewer.gui._sorting = true;
			},
			stop : function(evt, ui) {
				setTimeout(function() {
					cubesviewer.gui._sorting = false;
				}, 200);

			}
		// forcePlaceholderSize: true,
		// forceHlperSize: true,
		});
		*/

	}

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
        showAbout: true
    };
	$.extend(defaultOptions, cvOptions);
	$.extend(cvOptions, defaultOptions);;

    // Get main template from template cache and compile it
	$http.get( "studio/studio.html", { cache: $templateCache } ).then(function(response) {

		var scope = angular.element(cvOptions.container).scope();

		var templateScope = scope.$new();
		$(cvOptions.container).html(response.data);

		//templateCtrl = $controller("CubesViewerStudioController", { $scope: templateScope } );
		//$(cvOptions.container).children().data('$ngControllerController', templateCtrl);

		$compile($(cvOptions.container).contents())(scope);
	});

}]);


/**
 * CubesViewer Studio entry point.
 */
cubesviewer.studio = {

	_configure: function(options) {
		cubesviewer._configure(options);
	},

	init: function(options) {
		this._configure(options);
   		angular.element(document).ready(function() {
   			angular.bootstrap(options.container, ['cv.studio']);
   		});
	}

};
;angular.module('cv').run(['$templateCache', function($templateCache) {
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
    "            <button type=\"button\" class=\"btn btn-primary btn-xs\" style=\"margin-right: 10px;\"><i class=\"fa fa-fw fa-caret-up\"></i></button>\n" +
    "            <span class=\"cv-gui-title\">{{ view.params.name }}</span>\n" +
    "\n" +
    "\n" +
    "            <span class=\"badge badge-primary pull-right cv-gui-container-state\" style=\"margin-right: 10px;\">Test</span>\n" +
    "\n" +
    "        </div>\n" +
    "        <div class=\"panel-body\">\n" +
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
    "              <button type=\"button\" ng-click=\"setViewMode('explore')\" ng-class=\"{'active': view.params.mode == 'explore'}\" class=\"btn btn-primary btn-sm explorebutton\"><i class=\"fa fa-arrow-circle-down\"></i></button>\n" +
    "            </div>\n" +
    "\n" +
    "           <div class=\"dropdown m-b\" style=\"display: inline-block; margin-left: 10px;\">\n" +
    "              <button class=\"btn btn-primary btn-sm dropdown-toggle drilldownbutton\" type=\"button\" data-toggle=\"dropdown\" data-submenu>\n" +
    "                <i class=\"fa fa-fw fa-arrow-down\"></i> Drilldown <span class=\"caret\"></span>\n" +
    "              </button>\n" +
    "\n" +
    "              <ul class=\"dropdown-menu dropdown-menu-right cv-view-menu-drilldown\">\n" +
    "\n" +
    "                  <!-- if ((grayout_drill) && ((($.grep(view.params.drilldown, function(ed) { return ed == dimension.name; })).length > 0))) { -->\n" +
    "                  <li on-repeat-done ng-repeat-start=\"dimension in view.cube.dimensions\" ng-if=\"dimension.levels.length == 1\" ng-click=\"selectDrill(dimension.name, true);\">\n" +
    "                    <a href=\"\">{{ dimension.label }}</a>\n" +
    "                  </li>\n" +
    "                  <li ng-repeat-end ng-if=\"dimension.levels.length != 1\" class=\"dropdown-submenu\">\n" +
    "                    <a tabindex=\"0\">{{ dimension.label }}</a>\n" +
    "\n" +
    "                    <ul ng-if=\"dimension.hierarchies_count() != 1\" class=\"dropdown-menu\">\n" +
    "                        <li ng-repeat=\"(hikey,hi) in dimension.hierarchies\" class=\"dropdown-submenu\">\n" +
    "                            <a tabindex=\"0\" href=\"\" onclick=\"return false;\">{{ hi.label }}</a>\n" +
    "                            <ul class=\"dropdown-menu\">\n" +
    "                                <li ng-repeat=\"level in hi.levels\" ng-click=\"selectDrill(dimension.name + '@' + hi.name + ':' + level.name, true)\"><a href=\"\">{{ level.label }}</a></li>\n" +
    "                            </ul>\n" +
    "                        </li>\n" +
    "                    </ul>\n" +
    "\n" +
    "                    <ul ng-if=\"dimension.hierarchies_count() == 1\" class=\"dropdown-menu\">\n" +
    "                        <li ng-repeat=\"level in dimension.default_hierarchy().levels\" ng-click=\"selectDrill(dimension.name + ':' + level.name, true)\"><a href=\"\">{{ level.label }}</a></li>\n" +
    "                    </ul>\n" +
    "\n" +
    "                  </li>\n" +
    "\n" +
    "                  <div class=\"divider\"></div>\n" +
    "                  <li ng-click=\"selectDrill(null)\"><a href=\"\"><i class=\"fa fa-fw fa-close\"></i> None</a></li>\n" +
    "\n" +
    "              </ul>\n" +
    "\n" +
    "            </div>\n" +
    "\n" +
    "\n" +
    "            <div class=\"dropdown m-b\" style=\"display: inline-block;\">\n" +
    "              <button class=\"btn btn-primary btn-sm dropdown-toggle cutbutton\" type=\"button\" data-toggle=\"dropdown\" data-submenu>\n" +
    "                <i class=\"fa fa-fw fa-search\"></i> Filter <span class=\"caret\"></span>\n" +
    "              </button>\n" +
    "\n" +
    "              <ul class=\"dropdown-menu dropdown-menu-right cv-view-menu cv-view-menu-cut\">\n" +
    "\n" +
    "                <li><a href=\"\"><i class=\"fa fa-fw fa-filter\"></i> Filter selected</a></li>\n" +
    "                <div class=\"divider\"></div>\n" +
    "\n" +
    "                <div class=\"divider\"></div>\n" +
    "                <li><a href=\"\"><i class=\"fa fa-fw fa-close\"></i> Clear filters</a></li>\n" +
    "\n" +
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
    "                <li ><a>Test 2</a></li>\n" +
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
    "                    <span><i class=\"fa fa-fw fa-cube\"></i><b>Cube:</b> {{ view.cube.label }}</span>\n" +
    "                </div>\n" +
    "\n" +
    "                <div ng-repeat=\"drilldown in view.params.drilldown\" class=\"label label-secondary cv-infopiece cv-view-viewinfo-drill\" style=\"color: black; background-color: #ccffcc;\">\n" +
    "                    <span><i class=\"fa fa-fw fa-arrow-down\"></i><b>Drilldown:</b> {{ view.cube.cvdim_parts(drilldown).label }}</span>\n" +
    "                    <button type=\"button\" ng-click=\"selectDrill(drilldown, \"\")\" class=\"btn btn-danger btn-xs\" style=\"margin-left: 5px;\"><i class=\"fa fa-fw fa-close\"></i></button>\n" +
    "                </div>\n" +
    "\n" +
    "            </div>\n" +
    "            <div class=\"cv-view-viewinfo-cut\"></div>\n" +
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
    "    <div ui-grid=\"gridOptions\" ui-grid-resize-columns ui-grid-move-columns ui-grid-selection style=\"width: 100%;\">\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n"
  );

}]);
