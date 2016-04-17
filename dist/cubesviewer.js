/* Cubes.js
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


/*
 * Main cubesviewer object. It is created by the library and made
 * available as the global "cubesviewer" variable.
 */
function cubesviewer () {

	// CubesViewer version
	this.version = "1.2.1-devel";

	// Default options
	this.options = {
		cubesUrl : null,
		cubesLang : null,
		pagingOptions: [15, 30, 100, 250],
		datepickerShowWeek: true,
		datepickerFirstDay: 1,
		tableResizeHackMinWidth: 350 ,
		jsonRequestType: "json" // "json | jsonp"
	};

	// Cubes server.
	this.cubesserver = null;



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
	 * Ajax handler for cubes library
	 */
	this.cubesAjaxHandler = function (settings) {
		return cubesviewer.cubesRequest(settings.url, settings.data || [], settings.success);
	};

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
	 * Cubes centralized request
	 */
	this.cubesRequest = function(path, params, successCallback) {

		// TODO: normalize how URLs are used (full URL shall come from client code)
		if (path.charAt(0) == '/') path = this.options["cubesUrl"] + path;

		var jqxhr = $.get(path, params, this._cubesRequestCallback(successCallback), cubesviewer.options.jsonRequestType);

		jqxhr.fail (cubesviewer.defaultRequestErrorHandler);

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
			console.debug (xhr);
			cubesviewer.showInfoMessage("CubesViewer: An error occurred while accessing the data server.\n\n" +
										"Please try again or contact the application administrator if the problem persists.\n");
		}
		//$('.ajaxloader').hide();
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
	 * Initialize CubesViewer library.
	 */
	this.init = function (options) {

		$.extend(cubesviewer.options, options);

		// Avoid square brackets in serialized array params
		$.ajaxSetup({
			traditional : true
		});

		// Initialize Cubes client library
		cubesviewer.cubesserver = new cubes.Server(cubesviewer.cubesAjaxHandler);
		cubesviewer.cubesserver.connect (this.options["cubesUrl"], function() {
			cubesviewer.showInfoMessage ('Cubes client initialized (server version: ' + cubesviewer.cubesserver.server_version + ')');
			$(document).trigger ("cubesviewerInitialized", [ this ]);
		} );

	};

	/*
	 * Show quick tip message.
	 */
	this.showInfoMessage = function(message, delay) {

		if (delay == undefined) delay = 5000;

		if ($('#cv-cache-indicator').size() < 1) {

			$("body").append('<div id="cv-cache-indicator" class="cv-view-panel yui3-cssreset" style="display: none;"></div>')
			$('#cv-cache-indicator').qtip({
				   content: 'NO MESSAGE DEFINED',
				   position: {
					   my: 'bottom right',
					   at: 'bottom right',
					   target: $(window),
					   adjust: {
						   x: -10,
						   y: -10
					   }
				   },
				   style: {
					   classes: 'fixed',
					   tip: {
						   corner: false
					   }
				   },
				   show: {
					   delay: 0,
					   event: ''
				   },
				   hide: {
					   inactive: delay
				   }
			});
		}

		$('#cv-cache-indicator').qtip('option', 'content.text', message);
		$('#cv-cache-indicator').qtip('toggle', true);
	};

};


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


/*
 * Global cubesviewer variable.
 */
cubesviewer = new cubesviewer();


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

/*
 * Cache
 */
cubesviewer.cache = {};

/*
 * Override original cubesRequest
 */
cubesviewer._cacheOverridedCubesRequest = cubesviewer.cubesRequest;


cubesviewer.cubesRequest = function(path, params, successCallback) {

	// TODO: Check if cache is enabled

	var cacheNoticeAfterMinutes = 10;

	cubesviewer._cacheCleanup();

	var requestHash = path + "?" + $.param(params);
	var jqxhr = null;
	if (requestHash in this.cache) {

		// TODO: What is the correct ordering of success/complete callbacks?
		successCallback(this.cache[requestHash].data);

		// Warn that data comes from cache (QTip can do this?)
		var timediff = Math.round ((new Date().getTime() - this.cache[requestHash].time) / 1000 / 60);
		if (timediff > cubesviewer.options.cacheNoticeAfterMinutes) {
			cubesviewer.showInfoMessage("Data loaded from cache<br/>(" + timediff + " minutes old)", 1000);
		}

		jqxhr = $.Deferred().resolve().promise();


	} else {
		// Do request
		jqxhr = cubesviewer._cacheOverridedCubesRequest(path, params, this.cacheCubesRequestSuccess(successCallback, requestHash));
	}

	return jqxhr;
}

/*
 * Reviews the cache and removes old elements and oldest if too many
 */
cubesviewer._cacheCleanup = function() {

	var cacheMinutes = 30;
	var cacheSize = 32;

	if ("cacheMinutes" in cubesviewer.options) {
		cacheMinutes = cubesviewer.options.cacheMinutes;
	}
	if ("cacheSize" in cubesviewer.options) {
		cacheSize = cubesviewer.options.cacheSize;
	}

	var oldestTime = new Date().getTime() - (1000 * 60 * cacheMinutes);

	var elements = [];
	for (element in this.cache) {
		if (this.cache[element].time < oldestTime) {
			delete this.cache[element];
		} else {
			elements.push (element);
		}
	}

	elements.sort(function(a, b) {
		return (cubesviewer.cache[a].time - cubesviewer.cache[b].time);
	});
	if (elements.length >= cacheSize) {
		for (var i = 0; i < elements.length - cacheSize; i++) {
			delete this.cache[elements[i]];
		}
	}


}

cubesviewer.cacheCubesRequestSuccess = function(pCallback, pRequestHash) {
	var requestHash = pRequestHash;
	var callback = pCallback;
	return function(data) {
		// TODO: Check if cache is enabled
		cubesviewer.cache[pRequestHash] = {
			"time": new Date().getTime(),
			"data": data
		};
		pCallback(data);
	};
}
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

function cubesviewerViews () {

	this.STATE_INITIALIZING = 1;
	this.STATE_INITIALIZED = 2;
	this.STATE_ERROR = 3;
	
	/*
	 * Cubesviewer reference.
	 */
	this.cubesviewer = cubesviewer;
	
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
	
	/*
	 * Adds a new clean view for a cube. 
	 * This accepts parameters as an object or as a serialized string.
	 */
	this.createView = function(id, container, type, data) {

		// Check if system is initialized, otherwise
		// show a friendly error
		// TODO: Review if this code is needed or how
		/*
		if () {
			cubesviewer.views.showFatal (container, 'Cannot create CubesViewer view.<br />CubesViewer state is: <b>' + cubesviewer.state + '</b>.<br /><br />Try reloading or contact the administrator.</p>');
			return null;
		}
		*/
		
		// Create view
		
		var params = {};
		
		if (typeof data == "string") {
			try {
				params = $.parseJSON(data);
			} catch (err) {
				this.cubesviewer.alert ('Error: could not process serialized data (JSON parse error).');
				params["name"] = "Undefined view";
			}
		} else {
			params = data;
		}
		
		var view = {
			"id": id,
			"cubesviewer": this.cubesviewer,
			"type": type,
			"container": container,
			"state": cubesviewer.views.STATE_INITIALIZING,
			"params": {}
		};

		$.extend(view.params, params);
		$(document).trigger("cubesviewerViewCreate", [ view ] );
		$.extend(view.params, params);
		
		if (view.state == cubesviewer.views.STATE_INITIALIZING) view.state = cubesviewer.views.STATE_INITIALIZED;
		
		// Attach view to container
		$(container).data("cubesviewer-view", view);
		
		return view;
		
	};
	
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
		return JSON.stringify (view.params);
	};
	
};

/*
 * Create object.
 */
cubesviewer.views = new cubesviewerViews();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.onViewDraw);

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

/*
 * Cube view.
 */
function cubesviewerViewCube () {

	this.cubesviewer = cubesviewer;

	this.onViewCreate = function(event, view) {

		$.extend(view.params, {

			"mode" : "explore",

			"drilldown" : [],
			"cuts" : []

		});

		view.cube = null;

		var jqxhr = cubesviewer.cubesserver.get_cube(view.params.cubename, function(cube) {
			view.cube = cube;

			// Apply parameters if cube metadata contains specific cv-view-params
			if ('cv-view-params' in cube.info) $.extend(view.params, cube.info['cv-view-params']);

		    if (view.state == cubesviewer.views.STATE_INITIALIZED) cubesviewer.views.redrawView(view);
		});
		if (jqxhr) {
			jqxhr.fail(function() {
				view.state = cubesviewer.views.STATE_ERROR;
				cubesviewer.views.redrawView(view);
			});
		}

	};


	/*
	 * Draw cube view menu
	 */
	this.drawMenu = function(view) {

		// Add view menu options button
		$(view.container).find('.cv-view-toolbar').append(
			'<button class="viewbutton" title="View" style="margin-right: 5px;">View</button>'
		);

		$(view.container).find('.cv-view-viewmenu').append(
			'<ul class="cv-view-menu cv-view-menu-view" style="float: right; width: 180px;">' +
			//'<li><a href="#" class="aboutBox">About CubesViewer...</a></li>' +
			//'<div></div>' +
			'</ul>'
		);

		// Buttonize
		$(view.container).find('.viewbutton').button();

		// Menu functionality
		view.cubesviewer.views.cube._initMenu(view, '.viewbutton', '.cv-view-menu-view');

	}

	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {

		// Check if the model/cube is loaded.
		if (view.cube == null) {
			$(view.container).append("Loading...");
			event.stopImmediatePropagation();
			return;
		}


		if ($(".cv-view-viewdata", view.container).size() == 0) {

			$(view.container).empty();
			$(view.container).append(
					'<div class="cv-view-panel">' +
					'<div class="cv-view-viewmenu"></div>' +
					'<div class="cv-view-viewinfo"></div>' +
					'<div class="cv-view-viewdata" style="clear: both;"></div>' +
					'<div class="cv-view-viewfooter" style="clear: both;"></div>' +
					'</div>'
			);

		}

		// Check if the model/cube is loaded.
		// TODO: Review if this code is needed
		/*
		if (view.cube == null) {
			cubesviewer.views.showFatal (view.container, 'Cannot present cube view: could not load model or cube <b>' + view.params.cubename + '</b>.');
			return;
		}
		*/

		// Menu toolbar
		$(view.container).find('.cv-view-viewmenu').empty().append(
			'<div style="float: right; z-index: 9990; margin-bottom: 5px;"><div class="cv-view-toolbar ui-widget-header ui-corner-all" style="display: inline-block; padding: 2px;">' +
			'</div></div>'
		);

		// Draw menu
		view.cubesviewer.views.cube.drawMenu(view);

	};

	/*
	 * Helper to configure a context menu opening reaction.
	 */
	this._initMenu = function (view, buttonSelector, menuSelector) {
		//view.cubesviewer.views.initMenu('.panelbutton', '.cv-view-menu-panel');
		$('.cv-view-toolbar', $(view.container)).find(buttonSelector).on("click mouseenter", function(ev) {

			if (ev.type == "mouseenter") {
				if (! $('.cv-view-menu', view.container).is(":visible")) {
					// Only if a menu was open we allow mouseenter to open a menu
					return;
				}
			}

			if (ev.type == "click") {
				if ($('.cv-view-menu', view.container).is(":visible")) {
					// Hide the menu and return
					$('.cv-view-menu', view.container).hide();
					return;
				}
			}

			// Hide all menus (only one context menu open at once)
			$('.cv-view-menu').hide();

			var menu = $(menuSelector, $(view.container));

			menu.css("position", "absolute");
			menu.css("z-index", "9990");
			menu.show();

			menu.fadeIn().position({
				my : "right top",
				at : "right bottom",
				of : this
			});
			$(document).one("click", cubesviewer.views.cube._hideMenu(menu));

			return false;
		});

		$(menuSelector, $(view.container)).menu({}).hide();

	};

	/**
	 * Hide menus when mouse clicks outside them, but not when inside.
	 */
	this._hideMenu = function (menu) {
		return function(evt) {
			if ($(menu).find(evt.target).size() == 0) {
				menu.fadeOut();
			} else {
				$(document).one("click", cubesviewer.views.cube._hideMenu(menu));
			}
		}
	};

	/*
	 * Adjusts grids size
	 */
	this._adjustGridSize = function() {

		// TODO: use appropriate container width!
		//var newWidth = $(window).width() - 350;

		$(".cv-view-panel").each(function (idx, e) {

			$(".ui-jqgrid-btable", e).each(function(idx, el) {

				$(el).setGridWidth(cubesviewer.options.tableResizeHackMinWidth);

				var newWidth = $( e ).innerWidth() - 20;
				//var newWidth = $( el ).parents(".ui-jqgrid").first().innerWidth();
				if (newWidth < cubesviewer.options.tableResizeHackMinWidth) newWidth = cubesviewer.options.tableResizeHackMinWidth;

				$(el).setGridWidth(newWidth);

			});

		});

	};

	/*
	 * Builds Cubes Server query parameters based on current view values.
	 */
	this.buildBrowserArgs = function(view, includeXAxis, onlyCuts) {

		// "lang": view.cubesviewer.options.cubesLang

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
		var cuts = cubesviewer.views.cube.buildQueryCuts(view);
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

	/**
	 * Accepts an aggregation or a measure and returns the formatter function.
	 */
	this.columnFormatFunction = function(view, agmes) {

		var measure = agmes;
		if ('measure' in agmes) {
			measure = $.grep(view.cube.measures, function(item, idx) { return item.ref == agmes.measure })[0];
		}

		var formatterFunction = null;
		if (measure && ('cv-formatter' in measure.info)) {
			formatterFunction = function(value) {
				return eval(measure.info['cv-formatter']);
			};
		} else {
			formatterFunction = function(value) {
				return Math.formatnumber(value, (agmes.ref=="record_count" ? 0 : 2));
			};
		}

		return formatterFunction;
	};


};

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

/*
 * Create object.
 */
cubesviewer.views.cube = new cubesviewerViewCube();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.cube.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.onViewDraw);

// Resize grids as appropriate
$(window).bind('resize', function() {
	cubesviewer.views.cube._adjustGridSize();
}).trigger('resize');

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

function cubesviewerViewCubeExplore() {

	this.cubesviewer = cubesviewer;

	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {

		if (view.cube == null) return;

		// Add icon to toolbar
		$(view.container).find('.cv-view-toolbar').prepend(
			'<button class="explorebutton" title="Explore" style="margin-right: 10px;"><span class="ui-icon ui-icon-circle-arrow-s"></span></button>'
		);

		// Add view menu options button
		$(view.container).find('.viewbutton').before(
			'<button class="drilldownbutton" title="Drilldown" style="margin-right: 5px;"><span class="ui-icon ui-icon-arrowthick-1-s"></span> Drilldown</button>' +
			'<button class="cutbutton" title="Filter" style="margin-right: 15px;"><span class="ui-icon ui-icon-zoomin"></span> Filter</button>'
		);
		$(view.container).find('.cv-view-viewmenu').append(
			'<ul class="cv-view-menu cv-view-menu-drilldown" style="float: right; width: 180px;"></ul>'
		);
		$(view.container).find('.cv-view-viewmenu').append(
			'<ul class="cv-view-menu cv-view-menu-cut" style="float: right; width: 180px;"></ul>'
		);

		// Buttonize
		$(view.container).find('.drilldownbutton').button();
		$(view.container).find('.cutbutton').button();

		$(view.container).find('.explorebutton').button();
		$(view.container).find('.explorebutton').click(function() {
			view.cubesviewer.views.cube.explore.modeExplore(view);
			return false;
		});
		$(view.container).find('.explorebutton').mouseenter(function() {
			$('.cv-view-menu').hide();
		});

		// Explore menu
		view.cubesviewer.views.cube.explore.drawExploreMenu(view);

		// Draw minimum (explore) info pieces
		view.cubesviewer.views.cube.explore.drawInfo(view);

		if (view.params.mode != "explore") return;


		// Highlight
		$(view.container).find('.explorebutton').button("option", "disabled", "true").addClass('ui-state-active');

		// Only if data section is empty
		if ($(view.container).find('.cv-view-viewdata').children().size() == 0) {
			$(view.container).find('.cv-view-viewdata').append('<h3>Aggregated Data</h3>');
		}

		// Load data
		view.cubesviewer.views.cube.explore.loadData(view);

	};

	this.getDrillElementsList = function(view, cssclass, grayout_drill) {

		var menu = $(".cv-view-menu-drilldown", $(view.container));
		var cube = view.cube;

		var drillElements = "";

		$(cube.dimensions).each( function(idx, dimension) {

			if (dimension.levels.length == 1) {
				// Don't show drilldown option if dimension is
				// filtered (besides, this query causes a server error)
				// TODO: Handle this for non-flat dimensions too
				var disabled = "";
				if ((grayout_drill) && ((($.grep(view.params.drilldown, function(ed) { return ed == dimension.name; })).length > 0))) {
					disabled = "ui-state-disabled";
				}
				drillElements =
					drillElements +
					'<li><a href="#" class="' + cssclass + ' ' + disabled + '" data-dimension="' + dimension.name + '" data-value="1">' + dimension.label + '</a></li>';
			} else {
				drillElements = drillElements + '<li><a href="#" onclick="return false;">' + dimension.label +
					'</a><ul class="drillList" style="width: 170px; z-index: 9999;">';

				if (dimension.hierarchies_count() > 1) {
					for (var hikey in dimension.hierarchies) {
						var hi = dimension.hierarchies[hikey];
						drillElements = drillElements + '<li><a href="#" onclick="return false;">' + hi.label +
						'</a><ul class="drillList" style="width: 160px; z-index: 9999;">';
						$(hi.levels).each(function(idx, level) {
							drillElements = drillElements + '<li><a href="#" class="' + cssclass + '" data-dimension="' +
								dimension.name + '@' + hi.name + ':'+ level.name + '" data-value="1">' + level.label + '</a></li>';
						});
						drillElements = drillElements + '</ul></li>';
					}
				} else {
					$(dimension.default_hierarchy().levels).each(function(idx, level) {
						drillElements = drillElements + '<li><a href="#" class="' + cssclass + '" data-dimension="' + dimension.name + ':'+
						level.name + '" data-value="1">' + level.label + '</a></li>';
					});
				}

				drillElements = drillElements + '</ul></li>';
			}

		});

		return drillElements;

	}

	/*
	 * Builds the explore menu drilldown options.
	 */
	this.drawExploreMenuDrilldown = function(view) {

		var menu = $(".cv-view-menu-drilldown", $(view.container));
		var cube = view.cube;

		var drillElements = this.getDrillElementsList(view, "selectDrill", true);

		menu.append(
			'' +
			drillElements + '<div></div>' + '<li><a href="#" class="selectDrill" data-dimension=""><span class="ui-icon ui-icon-arrowthick-1-n" >' +
			'</span><i>None</i></a></li>' + ''
		);

		// Menu functionality
		view.cubesviewer.views.cube._initMenu(view, '.drilldownbutton', '.cv-view-menu-drilldown');

	}

	/*
	 * Builds the explore menu drilldown options.
	 */
	this.drawExploreMenuFilter = function(view) {

		var menu = $(".cv-view-menu-cut", $(view.container));
		var cube = view.cube;

		// Filter selected option (to filter in the values of the selected rows in the Explore table)
		if (view.params.mode == "explore") {
			menu.append('<li><a href="#" class="explore-filterselected" ><span class="ui-icon ui-icon-zoomin"></span>Filter selected</a></li>' +
							'<div></div>');
		}

		// Separator and "clear filters". The datefilter uses this class to place itself in the menu.
		menu.append(
				'<div class="ui-explore-cut-clearsep"></div>' +
				'<li><a href="#" class="selectCut" data-dimension="" data-value="" ><span class="ui-icon ui-icon-close"></span>Clear filters</a></li>'
		);

		// Menu functionality
		view.cubesviewer.views.cube._initMenu(view, '.cutbutton', '.cv-view-menu-cut');


	};

	/*
	 * Draw view options as appropriate.
	 */
	this.drawExploreMenu = function(view) {

		var menu = $(".cv-view-menu-view", $(view.container));
		var cube = view.cube;

		this.drawExploreMenuDrilldown (view);
		this.drawExploreMenuFilter (view);

		$(menu).menu("refresh");
		$(menu).addClass("ui-menu-icons");

		// Events
		$(view.container).find('.selectDrill').click( function() {
			cubesviewer.views.cube.explore.selectDrill(view, $(this).attr('data-dimension'), $(this).attr('data-value'));
			return false;
		});
		$(view.container).find('.explore-filterselected').click(function() {
			cubesviewer.views.cube.explore.filterSelected(view);
			return false;
		});
		$(view.container).find('.selectCut').click( function() {
			cubesviewer.views.cube.explore.selectCut(view, $(this).attr('data-dimension'), $(this).attr('data-value'), $(this).attr('data-invert'));
			return false;
		});

	};

	/*
	 * Change to explore mode.
	 */
	this.modeExplore = function(view) {
		view.params.mode = "explore";
		view.cubesviewer.views.redrawView(view);
	};

	/*
	 * Load and draw current data in explore mode.
	 */
	this.loadData = function(view) {

		view.cubesviewer.views.blockViewLoading(view);

		var browser_args = this.cubesviewer.views.cube.buildBrowserArgs(view, false, false);
		var browser = new cubes.Browser(view.cubesviewer.cubesserver, view.cube);
		var jqxhr = browser.aggregate(browser_args, view.cubesviewer.views.cube.explore._loadDataCallback(view));
		jqxhr.always(function() {
			view.cubesviewer.views.unblockView(view);
		});

	};

	/*
	 * Updates info after loading data.
	 */
	this._loadDataCallback = function(view) {
		var view = view;
		return function(data, status) {
			$(view.container).find('.cv-view-viewdata').empty();
			view.cubesviewer.views.cube.explore.drawSummary(view, data);
			//view.cubesviewer.views.cube._adjustGridSize();
		}

	};

	// Sort data according to current drilldown ordering
	this._sortData = function(view, data, includeXAxis) {
		//data.sort(cubesviewer._drilldownSortFunction(view.id, includeXAxis));
	};

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

	this._addRows = function(view, rows, data) {

		$(data.cells).each( function(idx, e) {

			var nid = [];
			var row = [];
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
				key.push('<a href="#" class="cv-grid-link" onclick="' + "cubesviewer.views.cube.explore.selectCut(cubesviewer.views.getParentView(this), $(this).attr('data-dimension'), $(this).attr('data-value'), $(this).attr('data-invert')); return false;" +
						 '" class="selectCut" data-dimension="' + cutDimension + '" ' +
						 'data-value="' + drilldown_level_values.join(",") + '">' +
						 drilldown_level_labels.join(" / ") + '</a>');
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
			var row = [];
			row["key0"] = "Summary";

			$(view.cube.aggregates).each(function(idx, ag) {
				row[ag.ref] = data.summary[ag.ref];
			});

			rows.push(row);
		}

	};

	this.columnTooltipAttr = function(column) {
		return function (rowId, val, rawObject) {
			return 'title="' + column + ' = ' + val + '"';
		};
	};

	/*
	 * Show received summary
	 */
	this.drawSummary = function(view, data) {

		var cubesviewer = view.cubesviewer;

		$(view.container).find('.cv-view-viewdata').empty();
		$(view.container).find('.cv-view-viewdata').append(
				'<h3>Aggregated Data</h3>' + '<table id="summaryTable-'
						+ view.id + '"></table>' + '<div id="summaryPager-'
						+ view.id + '"></div>');

		var colNames = [];
		var colModel = [];
		var dataRows = [];
		var dataTotals = [];

		$(view.cube.aggregates).each(function(idx, ag) {
			colNames.push(ag.label);

			var colFormatter = cubesviewer.views.cube.columnFormatFunction(view, ag);
			var col = {
				name : ag.ref,
				index : ag.ref,
				align : "right",
				sorttype : "number",
				width : cubesviewer.views.cube.explore.defineColumnWidth(view, ag.ref, 95),
				formatter: function(cellValue, options, rowObject) {
					return colFormatter(cellValue);
				},
				//formatoptions: {},
				cellattr: cubesviewer.views.cube.explore.columnTooltipAttr(ag.ref),
			};
			colModel.push(col);

			if (data.summary) dataTotals[ag.ref] = data.summary[ag.ref];
		});

		/*
		colNames.sort();
		colModel.sort(function(a, b) {
			return (a.name < b.name ? -1 : (a.name == b.name ? 0 : 1));
		});
		*/

		// If there are cells, show them
		cubesviewer.views.cube.explore._sortData(view, data.cells, false);
		cubesviewer.views.cube.explore._addRows(view, dataRows, data);

		var label = [];
		$(view.params.drilldown).each(function(idx, e) {
			label.push(view.cube.cvdim_dim(e).label);
		})
		for (var i = 0; i < view.params.drilldown.length; i++) {

			colNames.splice(i, 0, label[i]);

			colModel.splice(i, 0, {
				name : "key" + i,
				index : "key" + i,
				align : "left",
				width: cubesviewer.views.cube.explore.defineColumnWidth(view, "key" + i, 130)
			});
		}
		if (view.params.drilldown.length == 0) {
			colNames.splice(0, 0, "");
			colModel.splice(0, 0, {
				name : "key" + 0,
				index : "key" + 0,
				align : "left",
				width: cubesviewer.views.cube.explore.defineColumnWidth(view, "key" + 0, 110)
			});
		}

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

		$(view.container).find('.cv-view-viewinfo').empty();

		$(view.container).find('.cv-view-viewinfo').append(
			'<div><div class="cv-view-viewinfo-drill"></div>' +
			'<div class="cv-view-viewinfo-cut"></div>' +
			'<div class="cv-view-viewinfo-extra"></div></div>'
		);

		var piece = view.cubesviewer.views.cube.explore.drawInfoPiece(
			$(view.container).find('.cv-view-viewinfo-drill'), "#000000", 200, true,
			'<span class="ui-icon ui-icon-info"></span> <span style="color: white;" class="cv-view-viewinfo-cubename"><b>Cube:</b> ' + view.cube.label + '</span>'
		);

		$(view.params.drilldown).each(function(idx, e) {

			var dimparts = view.cube.cvdim_parts(e);
			var piece = cubesviewer.views.cube.explore.drawInfoPiece(
				$(view.container).find('.cv-view-viewinfo-drill'), "#ccffcc", 360, readonly,
				'<span class="ui-icon ui-icon-arrowthick-1-s"></span> <b>Drilldown:</b> ' + dimparts.label
			);
			piece.addClass("cv-view-infopiece-drilldown");
			piece.attr("data-dimension", e);
			piece.find('.cv-view-infopiece-close').click(function() {
				view.cubesviewer.views.cube.explore.selectDrill(view, e, "");
			});

		});

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

	// Select a drilldown
	this.selectDrill = function(view, dimension, value) {

		var cube = view.cube;

		// view.params.drilldown = (drilldown == "" ? null : drilldown);
		if (dimension == "") {
			view.params.drilldown = [];
		} else {
			cubesviewer.views.cube.explore.removeDrill(view, dimension);
			if (value == "1") {
				view.params.drilldown.push(dimension);
			}
		}

		view.cubesviewer.views.redrawView (view);

	};

	this.removeDrill = function(view, drilldown) {

		var drilldowndim = drilldown.split(':')[0];

		for ( var i = 0; i < view.params.drilldown.length; i++) {
			if (view.params.drilldown[i].split(':')[0] == drilldowndim) {
				view.params.drilldown.splice(i, 1);
				break;
			}
		}
	};

};


/*
 * Create object.
 */
cubesviewer.views.cube.explore = new cubesviewerViewCubeExplore();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.explore.onViewDraw);
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
 * Adds support for datefilters.
 *
 * This plugin requires that the model is configured
 * to declare which dimensions may use a datefilter,
 * and which fields of the dimension correspond to
 * calendar fields (year, quarter, month, day, week...).
 * (see integrator documentation for more information).
 *
 * This is an optional plugin.
 * Depends on the cube.explore plugin.
 */
function cubesviewerViewCubeDateFilter () {

	this.cubesviewer = cubesviewer;

	this._overridedbuildQueryCuts = null;

	this.onViewCreate = function(event, view) {

		$.extend(view.params, {

			"datefilters" : [],

		});

	}


	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {

		if (view.cube == null) return;
		var cube = view.cube;

		// Draw menu options (depending on mode)
		view.cubesviewer.views.cube.datefilter.drawFilterMenu(view);

		// Update info boxes to include edition
		view.cubesviewer.views.cube.datefilter.drawInfo(view);

	};



	/*
	 * Draw datefilter options in the cut menu.
	 */
	this.drawFilterMenu = function(view) {

		var cube = view.cube;
		var menu = $(".cv-view-menu-cut", $(view.container));

		var dateFilterElements = "";
		$(cube.dimensions).each( function(idx, dimension) {

			if (dimension.isDateDimension()) {

				var disabled = "";
				dateFilterElements = dateFilterElements + '<li><a href="#" class="selectDateFilter '  + disabled +
					'" data-dimension="' + dimension.name + ((dimension.info["cv-datefilter-hierarchy"]) ? "@" + dimension.info["cv-datefilter-hierarchy"] : "") +
				'" data-value="1">' + dimension.label + ((dimension.hierarchy(dimension.info["cv-datefilter-hierarchy"])) ? " / " + dimension.hierarchy(dimension.info["cv-datefilter-hierarchy"]).label : "") +
					'</a></li>';
			}

		});

		if (dateFilterElements == "") {
			dateFilterElements = dateFilterElements + '<li><a href="#" onclick="return false;"><i>No date filters defined</i></a></li>';
		}

		$(".ui-explore-cut-clearsep", menu).before(
				'<li><a href="#" onclick="return false;"><span class="ui-icon ui-icon-zoomin"></span>Date filter</a><ul class="dateFilterList" style="width: 180px;">' +
				dateFilterElements +
				'</ul></li>'
		);

		$(menu).menu("refresh");
		$(menu).addClass("ui-menu-icons");

		$(view.container).find('.selectDateFilter').click( function() {
			cubesviewer.views.cube.datefilter.selectDateFilter(view, $(this).attr('data-dimension'), $(this).attr('data-value'));
			return false;
		});

	};


	// Draw information bubbles
	this.drawInfo = function(view, readonly) {

		$(view.container).find('.cv-view-viewinfo-cut').after(
				'<div class="cv-view-viewinfo-date"></div>'
		);

		$(view.params.datefilters).each( function(idx, e) {
			var dimparts = view.cube.cvdim_parts(e.dimension);
			var piece = cubesviewer.views.cube.explore.drawInfoPiece(
					$(view.container).find('.cv-view-viewinfo-date'), "#ffdddd", null, readonly,
					'<span class="ui-icon ui-icon-zoomin"></span> <b>Filter: </b> ' +
					dimparts.labelNoLevel +
					': <span class="datefilter"></span>')
			var container = $('.datefilter', piece);
			view.cubesviewer.views.cube.datefilter.drawDateFilter(view, e, container);

			piece.find('.cv-view-infopiece-close').click(function() {
				view.cubesviewer.views.cube.datefilter.selectDateFilter(view, e.dimension, "0");
			});
		});

		if (readonly) {
			$(view.container).find('.infopiece').find('.ui-icon-close')
					.parent().remove();
		}

	};


	this.drawDateFilter = function(view, datefilter, container) {

		$(container)
				.append(
						' '
								+ '<select name="date_mode" >'
								+ '<option value="custom">Custom</option>'
								//+ '<option value="linked" disabled="true">Linked to main</option>'
								+ '<optgroup label="Auto">'
								+ '<option value="auto-last1m">Last month</option>'
								+ '<option value="auto-last3m">Last 3 months</option>'
								+ '<option value="auto-last6m">Last 6 months</option>'
								+ '<option value="auto-last12m">Last year</option>'
								+ '<option value="auto-last24m">Last 2 years</option>'
								+ '<option value="auto-january1st">From January 1st</option>'
								+ '<option value="auto-yesterday">Yesterday</option>'
								+ '</optgroup>' + '</select> ' + 'Range: '
								+ '<input name="date_start" /> - '
								+ '<input name="date_end" /> ');

		$("[name='date_start']", container).datepicker({
			changeMonth : true,
			changeYear : true,
			dateFormat : "yy-mm-dd",
			showWeek: cubesviewer.options.datepickerShowWeek,
		    firstDay: cubesviewer.options.datepickerFirstDay
		});
		$("[name='date_end']", container).datepicker({
			changeMonth : true,
			changeYear : true,
			dateFormat : "yy-mm-dd",
			showWeek: cubesviewer.options.datepickerShowWeek,
		    firstDay: cubesviewer.options.datepickerFirstDay
		});

		$("[name='date_start']", container).attr('autocomplete', 'off');
		$("[name='date_end']", container).attr('autocomplete', 'off');

		// Functionality
		$("input,select", container).change(function() {
			datefilter.mode = $("[name='date_mode']", container).val();
			datefilter.date_from = $("[name='date_start']", container).val();
			datefilter.date_to = $("[name='date_end']", container).val();
			view.cubesviewer.views.redrawView (view);
		});

		// Set initial values
		$("[name='date_mode']", container).val(datefilter.mode);
		$("[name='date_start']", container).val(datefilter.date_from);
		$("[name='date_end']", container).val(datefilter.date_to);
		if ($("[name='date_mode']", container).val() != "custom") {
			$("[name='date_start']", container).attr("disabled", "disabled");
			$("[name='date_end']", container).attr("disabled", "disabled");
		}

	};

	// Adds a date filter
	this.selectDateFilter = function(view, dimension, enabled) {

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

		view.cubesviewer.views.redrawView(view);

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
				datefiltervalue = datefiltervalue
						+ this._datefiltercell(view, datefilter, date_from);
			datefiltervalue = datefiltervalue + "-";
			if (date_to != null)
				datefiltervalue = datefiltervalue
						+ this._datefiltercell(view, datefilter, date_to);
			return datefiltervalue;
		} else {
			return null;
		}

	};

	this._datefiltercell = function(view, datefilter, tdate) {

		var values = [];

		var dimensionparts = view.cube.cvdim_parts(datefilter.dimension);
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
				cubesviewer.alert ("Wrong configuration of model: time role of level '" + level.name + "' is invalid.");
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

	/*
	 * Builds Query Cuts (overrides default cube cut build function).
	 */
	this.buildQueryCuts = function(view) {

		// Include cuts and datefilters
		var cuts = cubesviewer.views.cube.datefilter._overridedbuildQueryCuts(view);

		$(view.params.datefilters).each(function(idx, e) {
			var datefiltervalue = view.cubesviewer.views.cube.datefilter.datefilterValue(view, e);
			if (datefiltervalue != null) {
				cuts.push(cubes.cut_from_string (view.cube, e.dimension + ":" + datefiltervalue));
			}
		});

		return cuts;

	};

}

/*
 * Extend model prototype to support datefilter dimensions.
 */
cubes.Dimension.prototype.isDateDimension = function()  {

	// Inform if a dimension is a date dimension and can be used as a date
	// filter (i.e. with range selection tool).
	return ((this.role == "time") &&
			((! ("cv-datefilter" in this.info)) || (this.info["cv-datefilter"] == true)) );

};

/*
 * Create object.
 */
cubesviewer.views.cube.datefilter = new cubesviewerViewCubeDateFilter();

/*
 * Override original Cut generation function to add support for datefilters
 */
cubesviewer.views.cube.datefilter._overridedbuildQueryCuts = cubesviewer.views.cube.buildQueryCuts;
cubesviewer.views.cube.buildQueryCuts = cubesviewer.views.cube.datefilter.buildQueryCuts;

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.cube.datefilter.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.datefilter.onViewDraw);

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
 * Adds support for rangefilters.
 *
 * This plugin requires that the model is configured
 * to declare which dimensions may use a rangefilter
 * (see integrator documentation for more information).
 *
 * This is an optional plugin.
 * Depends on the cube.explore plugin.
 */
function cubesviewerViewCubeRangeFilter () {

	this.cubesviewer = cubesviewer;

	this._overridedbuildQueryCuts = null;

	this.onViewCreate = function(event, view) {

		$.extend(view.params, {

			"rangefilters" : [],

		});

	}


	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {

		if (view.cube == null) return;
		var cube = view.cube;

		// Draw menu options (depending on mode)
		view.cubesviewer.views.cube.rangefilter.drawFilterMenu(view);

		// Draw info boxes
		view.cubesviewer.views.cube.rangefilter.drawInfo(view);

	};



	/*
	 * Draw rangefilter options in the cut menu.
	 */
	this.drawFilterMenu = function(view) {

		var cube = view.cube;
		var menu = $(".cv-view-menu-cut", $(view.container));

		var rangeFilterElements = "";
		$(cube.dimensions).each( function(idx, dimension) {

			if (dimension.isRangeDimension()) {

				var disabled = "";
				rangeFilterElements = rangeFilterElements + '<li><a href="#" class="selectRangeFilter '  + disabled +
					'" data-dimension="' + dimension.name + '" data-value="1">' + dimension.label +
					'</a></li>';
			}

		});
		if (rangeFilterElements == "") {
			rangeFilterElements = rangeFilterElements + '<li><a href="#" onclick="return false;"><i>No range filters defined</i></a></li>';
		}

		$(".ui-explore-cut-clearsep", menu).before(
				'<li><a href="#" onclick="return false;"><span class="ui-icon ui-icon-zoomin"></span>Range filter</a><ul class="rangeFilterList" style="width: 180px;">' +
				rangeFilterElements +
				'</ul></li>'
		);

		$(menu).menu("refresh");
		$(menu).addClass("ui-menu-icons");

		$(view.container).find('.selectRangeFilter').click( function() {
			cubesviewer.views.cube.rangefilter.selectRangeFilter(view, $(this).attr('data-dimension'), $(this).attr('data-value'));
			return false;
		});

	};


	// Draw information bubbles
	this.drawInfo = function(view, readonly) {

		$(view.container).find('.cv-view-viewinfo-cut').after(
				'<div class="cv-view-viewinfo-range"></div>'
		);

		$(view.params.rangefilters).each( function(idx, e) {
			var dimparts = view.cube.cvdim_parts(e.dimension);
			var piece = cubesviewer.views.cube.explore.drawInfoPiece(
					$(view.container).find('.cv-view-viewinfo-range'), "#ffe8dd", null, readonly,
					'<span class="ui-icon ui-icon-zoomin"></span> <span><b>Filter: </b> ' +
					dimparts.labelNoLevel +
					': </span><span class="rangefilter"></span>')
			var container = $('.rangefilter', piece);
			view.cubesviewer.views.cube.rangefilter.drawRangeFilter(view, e, container);

			piece.find('.cv-view-infopiece-close').click(function() {
				view.cubesviewer.views.cube.rangefilter.selectRangeFilter(view, e.dimension, "0");
			});
		});

		if (readonly) {
			$(view.container).find('.infopiece').find('.ui-icon-close')
					.parent().remove();
		}

	};


	this.drawRangeFilter = function(view, rangefilter, container) {

		var dimparts = view.cube.cvdim_parts(rangefilter.dimension);

		$(container).append(
			'<input name="range_start" /> - '
			+ '<input name="range_end" /> '
		);

		var slider = dimparts.dimension.info["cv-rangefilter-slider"];
		if (slider != null) {
			$(container).append(
				'<div style="display: inline-block; margin-left: 8px; margin-right: 8px; vertical-align: middle;">' +
				'<span style="font-size: 70%;">' + slider.min + '</span>' +
				'<span class="slider-range" style="width: 180px; display: inline-block; margin-left: 6px; margin-right: 6px; vertical-align: middle;"></span>' +
				'<span style="font-size: 70%;">' + slider.max + '</span></div>'
			);
		}

		//$("[name='range_start']", container).attr('autocomplete', 'off');
		//$("[name='range_end']", container).attr('autocomplete', 'off');

		// Functionality
		$("input", container).change(function() {
			view.cubesviewer.views.cube.rangefilter._updateRangeFilter(view, rangefilter);
		});

		// Set initial values
		$("[name='range_start']", container).val(rangefilter.range_from);
		$("[name='range_end']", container).val(rangefilter.range_to);

		// Slider
		if (slider) {
			$(".slider-range", container).slider({
				range: true,
				min: slider.min ,
				max: slider.max ,
				step: slider.step ? slider.step : 1,
				values: [ rangefilter.range_from ? rangefilter.range_from : slider.min, rangefilter.range_to ? rangefilter.range_to : slider.max ],
				slide: function( event, ui ) {
					$("[name='range_start']", container).val(ui.values[ 0 ]);
					$("[name='range_end']", container).val(ui.values[ 1 ]);
				},
				stop: function(event, ui) {
					view.cubesviewer.views.cube.rangefilter._updateRangeFilter(view, rangefilter);
				}
			});
		}

	};

	this._updateRangeFilter = function (view, rangefilter) {
		var changed = false;
		var container = view.container;
		if (rangefilter.range_from != $("[name='range_start']", container).val()) {
			rangefilter.range_from = $("[name='range_start']", container).val();
			changed = true;
		}
		if (rangefilter.range_to != $("[name='range_end']", container).val()) {
			rangefilter.range_to = $("[name='range_end']", container).val();
			changed = true;
		}
		if (changed) view.cubesviewer.views.redrawView (view);
	};

	// Adds a date filter
	this.selectRangeFilter = function(view, dimension, enabled) {

		var cube = view.cube;

		// TODO: Show a notice if the dimension already has a date filter (? and cut filter)

		if (dimension != "") {
			if (enabled == "1") {
				view.params.rangefilters.push({
					"dimension" : dimension,
					"range_from" : null,
					"range_to" : null
				});
			} else {
				for ( var i = 0; i < view.params.rangefilters.length; i++) {
					if (view.params.rangefilters[i].dimension.split(':')[0] == dimension) {
						view.params.rangefilters.splice(i, 1);
						break;
					}
				}
			}
		} else {
			view.params.rangefilters = [];
		}

		view.cubesviewer.views.redrawView(view);

	};

	/*
	 * Composes a filter with appropriate syntax and time grain from a
	 * rangefilter
	 */
	this.rangefilterValue = function(rangefilter) {

		var range_from = rangefilter.range_from;
		var range_to = rangefilter.range_to;

		if ((range_from != null) || (range_to != null)) {
			var rangefiltervalue = "";
			if (range_from != null)
				rangefiltervalue = rangefiltervalue + range_from;
			rangefiltervalue = rangefiltervalue + "-";
			if (range_to != null)
				rangefiltervalue = rangefiltervalue + range_to;
			return rangefiltervalue;
		} else {
			return null;
		}

	};


	/*
	 * Builds Query Cuts (overrides default cube cut build function).
	 */
	this.buildQueryCuts = function(view) {

		// Include cuts and rangefilters
		var cuts = cubesviewer.views.cube.rangefilter._overridedbuildQueryCuts(view);

		$(view.params.rangefilters).each(function(idx, e) {
			var rangefiltervalue = view.cubesviewer.views.cube.rangefilter.rangefilterValue(e);
			if (rangefiltervalue != null) {
				cuts.push(e.dimension + ":" + rangefiltervalue);
			}
		});

		return cuts;

	};

}

/*
 * Extend model prototype to support rangefilter dimensions.
 */
cubes.Dimension.prototype.isRangeDimension = function() {

	return ("cv-rangefilter" in this.info && this.info["cv-rangefilter"] == true);

};

/*
 * Create object.
 */
cubesviewer.views.cube.rangefilter = new cubesviewerViewCubeRangeFilter();

/*
 * Override original Cut generation function to add support for rangefilters
 */
cubesviewer.views.cube.rangefilter._overridedbuildQueryCuts = cubesviewer.views.cube.buildQueryCuts;
cubesviewer.views.cube.buildQueryCuts = cubesviewer.views.cube.rangefilter.buildQueryCuts;

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.cube.rangefilter.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.rangefilter.onViewDraw);

;/*
 * CubesViewer
 * Copyright (c) 2012-2015 Jose Juan Montes, see AUTHORS for more details
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


/*
 * SeriesTable object. This is part of the "cube" view. Allows the user to select
 * a dimension to use as horizontal axis of a table. This is later used to generate
 * charts.
 */
function cubesviewerViewCubeSeries() {

	this.cubesviewer = cubesviewer;

	this.onViewCreate = function(event, view) {
		$.extend(view.params, {
			"xaxis" : null,
			"yaxis" : null
		});
	}

	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {

		if (view.cube == null) return;

		// Series Mode button
		$(view.container).find('.cv-view-toolbar').find(".explorebutton").after(
			'<button class="cv-view-button-series" title="Series Table" style="margin-right: 5px;"><span class="ui-icon ui-icon-clock"></span></button>'
		);

		// Buttonize and event
		$(view.container).find('.cv-view-button-series').button();
		$(view.container).find('.cv-view-button-series').click(function() {
			view.cubesviewer.views.cube.series.modeSeries(view);
			return false;
		});
		$(view.container).find('.cv-view-button-series').mouseenter(function() {
			$('.cv-view-menu').hide();
		});

		if (view.params.mode != "series") return;

		// Draw areas
		view.cubesviewer.views.cube.series.drawInfo(view);

		// Highlight
		$(view.container).find('.cv-view-button-series').button("option", "disabled", "true").addClass('ui-state-active');

		// Explore menu
		view.cubesviewer.views.cube.series.drawSeriesMenu(view);

		// Only if data is empty
		if ($(view.container).find('.cv-view-viewdata').children().size() == 0) {
			$(view.container).find('.cv-view-viewdata').empty().append('<h3>Series Table</h3>');
		}

		// Load data
		view.cubesviewer.views.cube.series.loadData(view);

	};

	/*
	 * Updates view options menus.
	 */
	this.drawSeriesMenu = function (view) {

		var menu = $(".cv-view-menu-view", $(view.container));
		var cube = view.cube;

		// Add drill menu

		var drillElements = cubesviewer.views.cube.explore.getDrillElementsList(view, "cv-view-series-setxaxis", true);

		// Add measures menu
		var measuresElements = "";
		var measuresNames = [];
		$(view.cube.measures).each(function(idx, e) {

			measuresNames.push(e.name);

			var aggregates = $.grep(view.cube.aggregates, function(ia) { return ia.measure == e.name; } );
			if (aggregates.length > 0) {
				measuresElements = measuresElements + '<li><a href="#" onclick="return false;">' + e.label + '</a><ul style="width: 220px; z-index: 9999;">';
				$(aggregates).each(function(idx, ea) {
					measuresElements = measuresElements + '<li><a href="#" class="cv-view-series-setyaxis" data-measure="' + ea.ref + '">' + ea.label + '</a></li>';
				});
                measuresElements = measuresElements + '</ul></li>';
			}

		});

		var aggregates = $.grep(view.cube.aggregates, function(ia) { return (! ia.measure) || ($.inArray(ia.measure, measuresNames) == -1 ); } );
		if (aggregates.length > 0) {
			measuresElements = measuresElements + '<div class="ui-series-measures-sep"></div>';
			$(aggregates).each(function(idx, ea) {
				measuresElements = measuresElements + '<li><a href="#" class="cv-view-series-setyaxis" data-measure="' + ea.ref + '">' + ea.label + '</a></li>';
			});
		}


		/*
		$(view.cube.aggregates).each(function(idx, e) {
            measuresElements = measuresElements + '<li><a href="#" class="cv-view-series-setyaxis" data-measure="' + e.name + '">' + e.label||e.name + '</a></li>';
		});
		*/

		menu.append(
		  '<li><a href="#" onclick="return false;"><span class="ui-icon ui-icon-arrowthick-1-s"></span>Horizontal Dimension</a><ul style="width: 180px;">' +
		  		drillElements +
		  		'<div></div>' +
		  		'<li><a href="#" class="cv-view-series-setxaxis" data-dimension="">None</a></li>' +
		  '</ul><li><a href="#" onclick="return false;"><span class="ui-icon ui-icon-zoomin"></span>Measure</a><ul style="min-width: 180px;">' +
	  	  		measuresElements +
	  	  '</ul></li>'
		);

		$(menu).menu( "refresh" );
		$(menu).addClass("ui-menu-icons");

		// Events
		$(view.container).find('.cv-view-series-setyaxis').click(function() {
			view.cubesviewer.views.cube.series.selectYAxis(view, $(this).attr('data-measure'));
			return false;
		});
		$(view.container).find('.cv-view-series-setxaxis').click(function() {
			view.cubesviewer.views.cube.series.selectXAxis(view, $(this).attr('data-dimension'));
			return false;
		});

	};

	/*
	 * Change to series mode.
	 */
	this.modeSeries = function(view) {
		view.params.mode = "series";
		view.cubesviewer.views.redrawView(view);
	};

	/*
	 * Selects measure axis
	 */
	this.selectYAxis = function(view, measure) {
		view.params.yaxis = measure;
		view.cubesviewer.views.redrawView(view);
	}

	/*
	 * Selects horizontal axis
	 */
	this.selectXAxis = function(view, dimension) {
		view.params.xaxis = (dimension == "" ? null : dimension);
		view.cubesviewer.views.redrawView(view);
	}

	/*
	 * Load and draw current data
	 */
	this.loadData = function(view) {

		// Check if we can produce a table
		if (view.params.yaxis == null) {
			$(view.container).find('.cv-view-viewdata').empty().append(
					'<h3>Series Table</h3><div><i>Cannot present series table: no <b>measure</b> has been selected.</i></div>'
			);
			return;
		}

		// Build params and include xaxis if present
		view.cubesviewer.views.blockViewLoading(view);

		var browser_args = this.cubesviewer.views.cube.buildBrowserArgs(view, view.params.xaxis != null ? true : false, false);
		var browser = new cubes.Browser(view.cubesviewer.cubesserver, view.cube);
		var jqxhr = browser.aggregate(browser_args, view.cubesviewer.views.cube.series._loadDataCallback(view));
		jqxhr.always(function() {
			view.cubesviewer.views.unblockView(view);
		});

	};

	this._loadDataCallback = function(view) {

		var view = view;

		return function (data, status) {
			$(view.container).find('.cv-view-viewdata').empty();
			view.cubesviewer.views.cube.series.drawTable(view, data);
		};

	};

	/*
	 * Draws series table information (axis).
	 * First calls drawInfo in explore table in order to draw slice info and container.
	 */
	this.drawInfo = function(view) {

		cubesviewer.views.cube.explore.drawInfoPiece(
			$(view.container).find('.cv-view-viewinfo-extra'), "#ccccff", 350, true,
			'<span class="ui-icon ui-icon-zoomin"></span> <b>Measure:</b> ' + ( (view.params.yaxis != null) ? view.params.yaxis : "<i>None</i>")
		);

		if (view.params.xaxis != null) {
			cubesviewer.views.cube.explore.drawInfoPiece(
				$(view.container).find('.cv-view-viewinfo-extra'), "#ccddff", 350, true,
				'<span class="ui-icon ui-icon-arrowthick-1-s"></span> <b>Horizontal dimension:</b> ' + ( (view.params.xaxis != null) ? view.cube.cvdim_parts(view.params.xaxis).label : "<i>None</i>")
			);
		}

	};

	/*
	 * Draws series table.
	 */
	this.drawTable = function(view, data) {

		$(view.container).find('.cv-view-viewdata').empty();

		if (data.cells.length == 0) {
			$(view.container).find('.cv-view-viewdata').append(
				'<h3>Series Table</h3>' +
				'<div>Cannot present series table as no rows are returned by the current filtering, horizontal dimension, and drilldown combination.</div>'
			);
			return;
		}

		$(view.container).find('.cv-view-viewdata').append(
			'<h3>Series Table</h3>' +
			'<table id="seriesTable-' + view.id + '"></table>' +
			'<div id="seriesPager-' + view.id + '"></div>'
		);

		var colNames = [];
		var colLabels = [];
		var colModel = [];
		var dataRows = [];
		var dataTotals = [];

		// Process cells
		view.cubesviewer.views.cube.explore._sortData (view, data.cells, view.params.xaxis != null ? true : false);
		view.cubesviewer.views.cube.series._addRows (view, dataRows, dataTotals, colNames, colModel, data);

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

		$('#seriesTable-' + view.id).jqGrid({
			data: dataRows,
			//userData: dataTotals,
			datatype: "local",
			height: 'auto',
			rowNum: cubesviewer.options.pagingOptions[0],
			rowList: cubesviewer.options.pagingOptions,
			colNames: colLabels,
			colModel: colModel,
			pager: "#seriesPager-" + view.id,
			sortname: cubesviewer.views.cube.explore.defineColumnSort(view, ["key", "desc"])[0],
			viewrecords: true,
			sortorder: cubesviewer.views.cube.explore.defineColumnSort(view, ["key", "desc"])[1],
			//footerrow: true,
			userDataOnFooter: true,
			forceFit: false,
			shrinkToFit: false,
			width: cubesviewer.options.tableResizeHackMinWidth,
			//multiselect: true,
			//multiboxonly: true,

			//caption: "Current selection data" ,
			beforeSelectRow : function () { return false; },

			loadComplete : function() {
				// Call hook
				view.cubesviewer.views.cube.explore.onTableLoaded (view);
			},

			resizeStop: view.cubesviewer.views.cube.explore._onTableResize (view),
			onSortCol: view.cubesviewer.views.cube.explore._onTableSort (view),

		} );

		this.cubesviewer.views.cube._adjustGridSize();

	};

	/*
	 * Adds rows. This case is particular because the first level of drilldown may be the
	 * horizontal dimension.
	 */
	this._addRows = function (view, rows, dataTotals, colNames, colModel, data) {

		// Copy drilldown as we'll modify it
		var drilldown = view.params.drilldown.slice(0);

		// Include X Axis if necessary
		if (view.params.xaxis != null) {
			drilldown.splice(0,0, view.params.xaxis);
		}
		var baseidx = ((view.params.xaxis == null) ? 0 : 1);

		$(data.cells).each(function (idx, e) {

			var row = [];
			var key = [];

			// For the drilldown level, if present
			for (var i = 0; i < drilldown.length; i++) {

				// Get dimension
				var parts = view.cube.cvdim_parts(drilldown[i]);
				var infos = parts.hierarchy.readCell(e, parts.level);

				// Values and Labels
				var drilldown_level_values = [];
				var drilldown_level_labels = [];

				$(infos).each(function(idx, info) {
					drilldown_level_values.push (info.key);
					drilldown_level_labels.push (info.label);
				});

				key.push (drilldown_level_labels.join(" / "));

			}

			// Set key
			var colKey = (view.params.xaxis == null) ? view.params.yaxis : key[0];
			var value = (e[view.params.yaxis]);
			var rowKey = (view.params.xaxis == null) ? key.join (' / ') : key.slice(1).join (' / ');

			// Search or introduce
			var row = $.grep(rows, function(ed) { return ed["key"] == rowKey; });
			if (row.length > 0) {
				row[0][colKey] = value;
			} else {
				var newrow = {};
				newrow["key"] = rowKey;
				newrow[colKey] = value;

				for (var i = baseidx ; i < key.length; i++) {
					newrow["key" + (i - baseidx)] = key[i];
				}

				rows.push ( newrow );
			}

			var ag = $.grep(view.cube.aggregates, function(ag) { return ag.ref == view.params.yaxis })[0];
			var colFormatter = cubesviewer.views.cube.columnFormatFunction(view, ag);

			if (colNames.indexOf(colKey) < 0) {
				colNames.push (colKey);
				var col = {
					name: colKey,
					index: colKey,
					align: "right",
					sorttype: "number",
					width: cubesviewer.views.cube.explore.defineColumnWidth(view, colKey, 75),
					formatter: function(cellValue, options, rowObject) {
						return colFormatter(cellValue);
					}
					//formatoptions: {},
				};

				colModel.push (col);
			}


		});

		//var label = [];
		$(view.params.drilldown).each (function (idx, e) {
			//label.push (view.cube.cvdim_dim(e).label);
			colNames.splice(idx, 0, view.cube.cvdim_dim(e).label);
			colModel.splice(idx, 0, { name: "key" + idx , index: "key" + idx , align: "left", width: cubesviewer.views.cube.explore.defineColumnWidth(view, "key" + idx, 190) });
		});

		dataTotals["key0"] = "<b>Summary</b>";

		if (view.params.drilldown.length == 0) {
			rows[0]["key0"] = view.params.yaxis;
			colNames.splice(0, 0, "Measure");
			colModel.splice(0, 0, { name: "key0", index: "key0", align: "left", width: cubesviewer.views.cube.explore.defineColumnWidth(view, "key0", 190) });
		}

	};

};

/*
 * Create object.
 */
cubesviewer.views.cube.series = new cubesviewerViewCubeSeries();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.cube.series.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.series.onViewDraw);
;/*
 * CubesViewer
 * Copyright (c) 2012-2015 Jose Juan Montes, see AUTHORS for more details
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

/*
 * Series chart object. Contains view functions for the 'chart' mode.
 * This is an optional component, part of the cube view.
 */
function cubesviewerViewCubeChart() {

	this.cubesviewer = cubesviewer;

	/*
	 * Prepares the view.
	 */
	this.onViewCreate = function(event, view) {

		$.extend(view.params, {
			"charttype" : "bars-vertical",
			"chartoptions": {
				showLegend: true,
			},
		});

	};

	/*
	 * View destroyed
	 */
	this.onViewDestroyed = function(event, view) {
		view.cubesviewer.views.cube.chart.cleanupNvd3();
	};

	/*
	 * Exports chart.
	 */
	this.exportChart = function(view) {

		cubesviewer.alert ("Not implemented");

	};

	this.cleanupNvd3 = function() {
		console.debug("WARNING! Cleanup function disabled: review.");
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

	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {

		// Cleanup nvd3 graphs
		view.cubesviewer.views.cube.chart.cleanupNvd3();

		if (view.cube == null) return;

		// Series Mode button
		$(view.container).find('.cv-view-toolbar').find(".cv-view-button-series").after(
			'<button class="cv-view-button-chart" title="Chart" style="margin-right: 15px;"><span class="ui-icon ui-icon-image"></span></button>'
		);

		// Buttonize and event
		$(view.container).find('.cv-view-button-chart').button();
		$(view.container).find('.cv-view-button-chart').click(function() {
			view.cubesviewer.views.cube.chart.modeChart(view);
			return false;
		});
		$(view.container).find('.cv-view-button-chart').mouseenter(function() {
			$('.cv-view-menu').hide();
		});

		if (view.params.mode != "chart") return;

		// Draw areas
		view.cubesviewer.views.cube.chart.drawInfo(view);

		// Highlight
		$(view.container).find('.cv-view-button-chart').button("option", "disabled", "true").addClass('ui-state-active');

		// Explore menu
		view.cubesviewer.views.cube.chart.drawChartMenu(view);

		// Only if data section is empty
		if ($(view.container).find('.cv-view-viewdata').children().size() == 0) {
			$(view.container).find('.cv-view-viewdata').append('<h3>Series Chart</h3>');
		}

		// Load data
		view.cubesviewer.views.cube.chart.loadData(view);

	};

	/*
	 * Updates view options menus.
	 */
	this.drawChartMenu = function (view) {

		this.cubesviewer.views.cube.series.drawSeriesMenu(view);

		var menu = $(".cv-view-menu-view", $(view.container));
		var cube = view.cube;

		menu.prepend(
			'<li><a href="#" onclick="return false;"><span class="ui-icon ui-icon-calculator"></span>Chart Type</a><ul style="width: 180px;">' +
	  		'<li><a href="#" class="cv-view-chart-settype" data-charttype="pie">Pie</a></li>' +
	  		'<li><a href="#" class="cv-view-chart-settype" data-charttype="bars-vertical">Bars Vertical</a></li>' +
	  		'<li><a href="#" class="cv-view-chart-settype" data-charttype="lines">Lines</a></li>' +
	  		//'<li><a href="#" class="cv-view-chart-settype" data-charttype="lines-cumulative">Cumulative lines</a></li>' +
	  		'<li><a href="#" class="cv-view-chart-settype" data-charttype="lines-stacked">Areas</a></li>' +
	  		'<li><a href="#" class="cv-view-chart-settype" data-charttype="radar">Radar</a></li>' +
	  	  '</ul></li>' +
  		  '<div></div>'
	  	);

		menu.append(
			'<div></div>' +
			'<li><a href="#" class="cv-view-chart-toggle-legend"><span class="ui-icon ui-icon-script"></span>Toggle Legend</a></li>'
		);

		/*
		menu.append(
	  	  '<div></div>' +
  		  '<li><a href="#" class="cv-view-chart-export"><span class="ui-icon ui-icon-script"></span>Export image</a></li>'
		);
		*/

		$(menu).menu( "refresh" );
		$(menu).addClass("ui-menu-icons");

		var serieschart = view.cubesviewer.views.cube.chart;
		$(view.container).find('.cv-view-chart-toggle-legend').click(function() {
			view.params.chartoptions.showLegend = !view.params.chartoptions.showLegend;
			view.cubesviewer.views.redrawView(view);
			return false;
		});
		$(view.container).find('.cv-view-chart-export').click(function() {
			view.cubesviewer.views.cube.chart.exportChart(view) ;
			return false;
		});
		$(view.container).find('.cv-view-chart-settype').click(function() {
			view.cubesviewer.views.cube.chart.selectChartType(view, $(this).attr('data-charttype'));
			return false;
		});
	};

	/*
	 * Change to chart mode.
	 */
	this.modeChart = function(view) {
		view.params.mode = "chart";
		view.cubesviewer.views.redrawView(view);
	};

	/*
	 * Selects chart type
	 */
	this.selectChartType = function(view, charttype) {
		view.params.charttype = charttype;
		view.cubesviewer.views.redrawView(view);
	};

	/*
	 * Draws series table information (axis).
	 * First calls drawInfo in explore table in order to draw slice info and container.
	 */
	this.drawInfo = function(view) {
		view.cubesviewer.views.cube.series.drawInfo(view);
	};

	/*
	 * Load and draw current data
	 */
	this.loadData = function(view) {

		// Check if we can produce a table
		if (view.params.yaxis == null) {
			$('#' + view.id).find('.cv-view-viewdata').empty().append(
					'<h3>Series Chart</h3><div><i>Cannot present chart: no <b>measure</b> has been selected.</i></div>'
			);
			return;
		}

		// Build params and include xaxis if present
		view.cubesviewer.views.blockViewLoading(view);

		var browser_args = this.cubesviewer.views.cube.buildBrowserArgs(view, view.params.xaxis != null ? true : false, false);
		var browser = new cubes.Browser(view.cubesviewer.cubesserver, view.cube);
		var jqxhr = browser.aggregate(browser_args, view.cubesviewer.views.cube.chart._loadDataCallback(view));
		jqxhr.always(function() {
			view.cubesviewer.views.unblockView(view);
		});

	};

	this._loadDataCallback = function(view) {

		var view = view;


		return function (data, status) {
			$(view.container).find('.cv-view-viewdata').empty();
			view.cubesviewer.views.cube.chart.drawChart(view, data);
		};

	};

	this.resizeChart = function(view, size) {
		$(view.container).find('#seriesChart-' + view.id).find('svg').height(size);
		$(view.container).find('#seriesChart-' + view.id).find('svg').resize();
	};

	/**
	 * Draws Series Chart.
	 */
	this.drawChart = function(view, data) {

		$(view.container).find('.cv-view-viewdata').empty();

		if (data.cells.length == 0) {
			$(view.container).find('.cv-view-viewdata').empty().append(
				'<h3>Series Chart</h3>' +
				'<div>Cannot present chart as no rows are returned by the current filtering, horizontal dimension, and drilldown combination.</div>'
			);
			return;
		}

		$(view.container).find('.cv-view-viewdata').css("width", "99%");
		$(view.container).find('.cv-view-viewdata').append(
			'<h3>Series Chart</h3>' +
			'<div id="seriesChart-' + view.id + '"  ><div><svg style="height: 400px;" /></div>' +
			'<div style="font-size: 8px; float: right;">' +
			'<a href="" class="cv-chart-height" data-chart-height="400" >Small</a> ' +
			'<a href="" class="cv-chart-height" data-chart-height="550" >Medium</a> ' +
			'<a href="" class="cv-chart-height" data-chart-height="700" >Tall</a>' +
			'</div></div>'
		);
		$(view.container).find('.cv-chart-height').click(function (e) {
			e.preventDefault();
			view.cubesviewer.views.cube.chart.resizeChart(view, $(this).attr('data-chart-height'));
		});

		/*
		$(view.container).find('#seriesChart-' + view.id).resizable({
			 maxHeight: 800,
			 minHeight: 220,
			 //helper: "ui-resizable-helper",
			 resize: function(event, ui) {
		        ui.size.width = ui.originalSize.width;
		     },
		     alsoResize: '#seriesChart-' + view.id + '>div>svg'
		});
		*/

		var colNames = [];
		var colModel = [];
		var dataRows = [];
		var dataTotals = [];

		// Process cells
		view.cubesviewer.views.cube.explore._sortData (view, data.cells, view.params.xaxis != null ? true : false);
		view.cubesviewer.views.cube.series._addRows (view, dataRows, dataTotals, colNames, colModel, data);

		// Join keys
		if (view.params.drilldown.length > 0) {
			colNames.splice (0, view.params.drilldown.length, "key");
			$(dataRows).each(function(idx, e) {
				var jointkey = [];
				for (var i = 0; i < view.params.drilldown.length; i++) jointkey.push(e["key" + i]);
				e["key"] = jointkey.join(" / ");
			});
		}

		if ((view.params.charttype == "bars-vertical") || (view.params.charttype == "bars-vertical-stacked")) {
			view.cubesviewer.views.cube.chart.drawChartBarsVertical(view, colNames, dataRows, dataTotals);
		} else if (view.params.charttype == "lines") {
			view.cubesviewer.views.cube.chart.drawChartLines(view, colNames, dataRows, dataTotals);
		} else if (view.params.charttype == "pie") {
			view.cubesviewer.views.cube.chart.drawChartPie(view, colNames, dataRows, dataTotals);
		} else if (view.params.charttype == "lines-stacked") {
			view.cubesviewer.views.cube.chart.drawChartLines(view, colNames, dataRows, dataTotals);
		} else if (view.params.charttype == "lines-cumulative") {
			view.cubesviewer.views.cube.chart.drawChartLinesCumulative(view, colNames, dataRows, dataTotals);
		} else if (view.params.charttype == "radar") {
			view.cubesviewer.views.cube.chart.drawChartRadar(view, colNames, dataRows, dataTotals);
		}

		// Generic effects

	};

	/**
	 * Draws a vertical bars chart.
	 */
	this.drawChartBarsVertical = function (view, colNames, dataRows, dataTotals) {

		var container = $('#seriesChart-' + view.id).find("svg").get(0);
		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.cvdim_parts(view.params.xaxis).label : "None")

	    var d = [];

	    var numRows = dataRows.length;
	    var serieCount = 0;
	    $(dataRows).each(function(idx, e) {
	    	serie = [];
	    	for (var i = 1; i < colNames.length; i++) {
	    		var value = e[colNames[i]];
	    		if (value != undefined) {
	    			serie.push( { "x": colNames[i], "y":  value } );
	    		} else {
	    			serie.push( { "x": colNames[i], "y":  0} );
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
    		xticks.push([ i * 10, colNames[i] ]);
	    }
	    */

	    chartOptions = {
	    	  //barColor: d3.scale.category20().range(),
	    	  delay: 1200,
	    	  groupSpacing: 0.1,
	    	  //reduceXTicks: false,
	    	  //staggerLabels: true
	    };

	    var ag = $.grep(view.cube.aggregates, function(ag) { return ag.ref == view.params.yaxis })[0];
		var colFormatter = cubesviewer.views.cube.columnFormatFunction(view, ag);

	    nv.addGraph(function() {
	        var chart;
	        chart = nv.models.multiBarChart()
	          //.margin({bottom: 100})
	          .options({duration: 300})
	          .showLegend(!!view.params.chartoptions.showLegend)
	          .margin({left: 120})
	          ;

	    	  if (	view.params["chart-barsvertical-stacked"] ) {
	    		  chart.stacked ( view.params["chart-barsvertical-stacked"] );
	    	  }

	        chart.options(chartOptions);
	        chart.multibar
	          .hideable(true);

	        chart.xAxis
	            .axisLabel(xAxisLabel)
	            .showMaxMin(true)
	            //.tickFormat(d3.format(',0f'))
	            ;

	        //chart.yAxis.tickFormat(d3.format(',.2f'));
	        chart.yAxis.tickFormat(function(d,i) {
	        	return colFormatter(d);
	        });

	        d3.select(container)
	            .datum(d)
	            .call(chart);

	        nv.utils.windowResize(chart.update);

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
	          });

	        //chart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });

	        return chart;
	    });

	}

	/**
	 */
	this.drawChartLines = function (view, colNames, dataRows, dataTotals) {

		var container = $('#seriesChart-' + view.id).find("svg").get(0);
		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.cvdim_parts(view.params.xaxis).label : "None")

	    var d = [];

	    // TODO: Check there's only one value column

	    var numRows = dataRows.length;
	    var serieCount = 0;
	    $(dataRows).each(function(idx, e) {
	    	serie = [];
	    	for (var i = 1; i < colNames.length; i++) {
	    		if (colNames[i] in e) {
	    			var value = e[colNames[i]];
	    			serie.push( { "x": i, "y": value } );
	    		} else {
	    			serie.push( { "x": i, "y": 0 } );
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
		var colFormatter = cubesviewer.views.cube.columnFormatFunction(view, ag);

	    if (view.params.charttype != "lines-stacked") {

		    nv.addGraph(function() {
		    	var chart = nv.models.lineChart()
		    		.useInteractiveGuideline(true)
		    		.showLegend(!!view.params.chartoptions.showLegend)
		    		.margin({left: 120})
		    		;

		    	chart.xAxis
		    		.axisLabel(xAxisLabel)
		    		.tickFormat(function(d,i) {
				                return (colNames[d]);
				     })	;

	    		chart.yAxis.tickFormat(function(d,i) {
		        	return colFormatter(d);
		        });

		    	d3.select(container)
		    		.datum(d)
		    		.options({duration: 300})
		    		.call(chart);

		    	nv.utils.windowResize(chart.update);

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


		    	return chart;
		    });

	    } else {

		    nv.addGraph(function() {
	    	  var chart = nv.models.stackedAreaChart()
	    	                //.x(function(d) { return d[0] })
	    	                //.y(function(d) { return d[1] })
	    	  				.showLegend(!!view.params.chartoptions.showLegend)
	    	  				.margin({left: 130})
	    	                .clipEdge(true)
	    	                .useInteractiveGuideline(true);

	    	  if (	view.params["chart-stackedarea-style"] ) {
	    		  chart.style ( view.params["chart-stackedarea-style"] );
	    	  }

	    	  chart.xAxis
	    	  	  .axisLabel(xAxisLabel)
	    	      .showMaxMin(false)
	    	      .tickFormat(function(d,i) {
			                return (colNames[d]);
			       })	;

	    	  chart.yAxis.tickFormat(function(d,i) {
	    		  return colFormatter(d);
	    	  });

	    	  d3.select(container)
	    	    .datum(d)
	    	      .options({duration: 300})
	    	      .call(chart);

	    	  nv.utils.windowResize(chart.update);

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
	          });

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

	/**
	 */
	this.drawChartPie = function (view, colNames, dataRows, dataTotals) {

		var container = $('#seriesChart-' + view.id).find("svg").get(0);
		var xAxisLabel = ( (view.params.xaxis != null) ? view.cube.cvdim_parts(view.params.xaxis).label : "None")

	    var d = [];

		// Check if we can produce a pie
		if (colNames.length > 2) {
			$('#' + view.id).find('.cv-view-viewdata').empty();
			$('#' + view.id).find('.cv-view-viewdata').append('<h3>Series Chart</h3><div><i>Cannot present a Pie Chart when more than one column is present.</i></div>');
			return;
		}

	    var numRows = dataRows.length;
	    var serieCount = 0;
	    $(dataRows).each(function(idx, e) {
	    	serie = [];
	    	var value = e[colNames[1]];
    		if ((value != undefined) && (value > 0)) {

    	    	var series = { "y": value, "key": e["key"] != "" ? e["key"] : colNames[0] };
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

	    xticks = [];
	    for (var i = 1; i < colNames.length; i++) {
    		xticks.push([ i - 1, colNames[i] ]);
	    }

	    var ag = $.grep(view.cube.aggregates, function(ag) { return ag.ref == view.params.yaxis })[0];
		var colFormatter = cubesviewer.views.cube.columnFormatFunction(view, ag);

	    nv.addGraph(function() {

	        var chart = nv.models.pieChart()
	            .x(function(d) { return d.key })
	            .y(function(d) { return d.y })
	            .showLegend(!!view.params.chartoptions.showLegend)
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
	              .options({duration: 300})
	              //.attr('width', width)
	              //.attr('height', height)
	              .call(chart);

	        nv.utils.windowResize(chart.update);

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

	        return chart;
	    });

	};

	/**
	 */
	this.drawChartRadar = function (view, colNames, dataRows, dataTotals) {

		var container = $('#seriesChart-' + view.id).get(0);

		// Check if we can produce a pie
		if (colNames.length < 4) {
			$('#' + view.id).find('.cv-view-viewdata').empty();
			$('#' + view.id).find('.cv-view-viewdata').append('<h3>Series Chart</h3><div><i>Cannot present a Radar Chart when less than 3 data columns are present.</i></div>');
			return;
		}

	    var d = [];

	    numRows = dataRows.length;
	    $(dataRows).each(function(idx, e) {
	    	serie = [];
	    	for (var i = 1; i < colNames.length; i++) {
	    		var value = e[colNames[i]];
	    		if (value != undefined) {
	    			serie.push( [i-1, value] );
	    		} else {
	    			serie.push( [i-1, 0] );
	    		}
	    	}
	    	d.push({ data: serie, label: e["key"] != "" ? e["key"] : view.params.yaxis });
	    });
	    d.sort(function(a,b) { return a.label < b.label ? -1 : (a.label > b.label ? +1 : 0) });

	    xticks = [];
	    for (var i = 1; i < colNames.length; i++) {
    		xticks.push([ i - 1, colNames[i] ]);
	    }

	    view.flotrDraw = Flotr.draw(container, d, {
	    	HtmlText: ! view.doExport,
	    	shadowSize: 2,
	        radar: {
	            show: true
	        },
	        mouse: {
	            track: true,
	            relative: true
	        },
	        grid: {
	            circular: true,
	            minorHorizontalLines: true
	        },
	        legend: {
	            position: "se",
	            backgroundColor: "#D2E8FF"
	        },
	        xaxis: {
	            ticks: xticks
	        },
	        yaxis: {
	        }
	    });

	};

};


/*
 * Create object.
 */
cubesviewer.views.cube.chart = new cubesviewerViewCubeChart();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.cube.chart.onViewCreate);
$(document).bind("cubesviewerViewDestroyed", { }, cubesviewer.views.cube.chart.onViewDestroyed);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.chart.onViewDraw);
;/*
 * CubesViewer
 * Copyright (c) 2012-2015 Jose Juan Montes, see AUTHORS for more details
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


/*
 * Facts table. Allows users to see the facts associated to current cut.
 */
function cubesviewerViewCubeFacts() {

	this.cubesviewer = cubesviewer;

	this.onViewCreate = function(event, view) {
		$.extend(view.params, {
		});
	}

	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {

		if (view.cube == null) return;

		// Facts Mode button
		$(view.container).find('.cv-view-toolbar').find(".explorebutton").css("margin-right", "5px").after(
			'<button class="cv-view-button-facts" title="Facts Table" style="margin-right: 10px;"><span class="ui-icon ui-icon-clipboard"></span></button>'
		);

		// Buttonize and event
		$(view.container).find('.cv-view-button-facts').button();
		$(view.container).find('.cv-view-button-facts').click(function() {
			view.cubesviewer.views.cube.facts.modeFacts(view);
			return false;
		});
		$(view.container).find('.cv-view-button-facts').mouseenter(function() {
			$('.cv-view-menu').hide();
		});

		if (view.params.mode != "facts") return;

		// Draw areas
		view.cubesviewer.views.cube.facts.drawInfo(view);

		// Highlight
		$(view.container).find('.cv-view-button-facts').button("option", "disabled", "true").addClass('ui-state-active');

		// Facts menu
		view.cubesviewer.views.cube.facts.drawFactsMenu(view);

		$(view.container).find('.drilldownbutton').button("disable");

		// Only if data is empty
		if ($(view.container).find('.cv-view-viewdata').children().size() == 0) {
			$(view.container).find('.cv-view-viewdata').empty().append('<h3>Facts Table</h3>');
		}

		// Load data
		view.cubesviewer.views.cube.facts.loadData(view);

	};

	/*
	 * Updates view options menus.
	 */
	this.drawFactsMenu = function (view) {

		var menu = $(".cv-view-menu-view", $(view.container));
		var cube = view.cube;


	};

	/*
	 * Change to facts mode.
	 */
	this.modeFacts = function(view) {
		view.params.mode = "facts";
		view.cubesviewer.views.redrawView(view);
	};


	/*
	 * Load and draw current data.
	 */
	this.loadData = function(view) {

		view.cubesviewer.views.blockViewLoading(view);

		var browser_args = this.cubesviewer.views.cube.buildBrowserArgs(view, false, false);
		var browser = new cubes.Browser(view.cubesviewer.cubesserver, view.cube);
		var jqxhr = browser.facts(browser_args, view.cubesviewer.views.cube.facts._loadDataCallback(view));
		jqxhr.always(function() {
			view.cubesviewer.views.unblockView(view);
		});

	};

	this._loadDataCallback = function(view) {

		var view = view;

		return function (data, status) {
			$(view.container).find('.cv-view-viewdata').empty();
			view.cubesviewer.views.cube.facts.drawTable(view, data);
		};

	};

	/*
	 * First calls drawInfo in explore table in order to draw slice info and container.
	 */
	this.drawInfo = function(view) {

	};


	/*
	 * Draws facts table.
	 */
	this.drawTable = function(view, data) {

		$(view.container).find('.cv-view-viewdata').empty();

		if (data.length == 0) {
			$(view.container).find('.cv-view-viewdata').append(
				'<h3>Facts Table</h3>' +
				'<div>No facts are returned by the current filtering combination.</div>'
			);
			return;
		}

		$(view.container).find('.cv-view-viewdata').append(
			'<h3>Facts Table</h3>' +
			'<table id="factsTable-' + view.id + '"></table>' +
			'<div id="factsPager-' + view.id + '"></div>'
		);

		var colNames = [];
		var colModel = [];
		var dataRows = [];
		var dataTotals = [];

		var dimensions = view.cube.dimensions;
		var measures = view.cube.measures;
        var details = view.cube.details;

		colNames.push("ID");
		colModel.push({
			name : "id",
			index : "id",
			align : "left",
			width : cubesviewer.views.cube.explore.defineColumnWidth(view, "id", 65),
			sorttype : "number",
		});

		for (var dimensionIndex in dimensions) {
			// Get dimension
			var dimension = dimensions[dimensionIndex];

			for (var i = 0; i < dimension.levels.length; i++) {
				var level = dimension.levels[i];

				colNames.push(level.label);
				colModel.push({
					name : level.key().ref,
					index : level.key().ref,
					align : "left",
					//sorttype : "number",
					width : cubesviewer.views.cube.explore.defineColumnWidth(view, level.key().ref, 85),
					//formatter: 'number',
					//cellattr: this.columnTooltipAttr(column),
					//formatoptions: { decimalSeparator:".", thousandsSeparator: " ", decimalPlaces: 2 }
				});
			}
		}

		for (var measureIndex in measures) {
			var measure = measures[measureIndex];

			colNames.push(measure.label);

			var colFormatter = cubesviewer.views.cube.columnFormatFunction(view, measure);
			var col = {
				name : measure.ref,
				index : measure.ref,
				align : "right",
				sorttype : "number",
				width : cubesviewer.views.cube.explore.defineColumnWidth(view, measure.ref, 75),
				formatter: function(cellValue, options, rowObject) {
					return colFormatter(cellValue);
				}
				//formatoptions: {}
			};
			colModel.push(col);
		}

        for (var detailIndex in details) {
            var detail = details[detailIndex];

            colNames.push(detail.name);
			colModel.push({
				name : detail.ref,
                index : detail.ref,
                align : "left",
                //sorttype : "number",
                width : cubesviewer.views.cube.explore.defineColumnWidth(view, level.key().ref, 85),
                //formatter: 'number',
                //cellattr: this.columnTooltipAttr(column),
                //formatoptions: { decimalSeparator:".", thousandsSeparator: " ", decimalPlaces: 2 }
			});
        }


		// Process cells
		view.cubesviewer.views.cube.facts._addRows(view, dataRows, data);

		$('#factsTable-' + view.id).jqGrid({
			data: dataRows,
			//userData: dataTotals,
			datatype: "local",
			height: 'auto',
			rowNum: cubesviewer.options.pagingOptions[0],
			rowList: cubesviewer.options.pagingOptions,
			colNames: colNames,
			colModel: colModel,
	        pager: "#factsPager-" + view.id,
	        sortname: cubesviewer.views.cube.explore.defineColumnSort(view, ["key", "desc"])[0],
	        viewrecords: true,
	        sortorder: cubesviewer.views.cube.explore.defineColumnSort(view, ["key", "desc"])[1],
	        //footerrow: true,
	        userDataOnFooter: true,
	        forceFit: false,
	        shrinkToFit: false,
	        width: cubesviewer.options.tableResizeHackMinWidth,
	        //multiselect: true,
	        //multiboxonly: true,

	        //caption: "Current selection data" ,
	        beforeSelectRow : function () { return false; },

			loadComplete : function() {
				// Call hook
				view.cubesviewer.views.cube.explore.onTableLoaded(view);
			},

	        resizeStop: view.cubesviewer.views.cube.explore._onTableResize (view),
			onSortCol: view.cubesviewer.views.cube.explore._onTableSort (view),

	    } );

		this.cubesviewer.views.cube._adjustGridSize();

	};

	/*
	 * Adds rows. This case is particular because the first level of drilldown may be the
	 * horizontal dimension.
	 */
	this._addRows = function(view, rows, data) {

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
					var levelData = level.readCell (e);

					row[level.key().ref] = levelData.label;

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

			rows.push(row);
		});


	};

};

/*
 * Create object.
 */
cubesviewer.views.cube.facts = new cubesviewerViewCubeFacts();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.cube.facts.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.facts.onViewDraw);
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
 * Adds support for filter dialogs for dimensions. Note that
 * filtering support is available from other plugins. Default filtering
 * features are included in the normal explore view (user
 * can select values after drilling down). This plugin adds
 * more flexibility.
 */
function cubesviewerViewCubeDimensionFilter () {

	this.cubesviewer = cubesviewer;

	this.onViewCreate = function(event, view) {

		/*
		$.extend(view.params, {

		});
		*/

		view.dimensionFilter = null;

	}


	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {

		if (view.cube == null) return;
		var cube = view.cube;

		// Draw menu options (depending on mode)
		view.cubesviewer.views.cube.dimensionfilter.drawFilterMenu(view);

		// Update info boxes to include edition
		view.cubesviewer.views.cube.dimensionfilter.addFilterLinksToInfo(view);

		if (view.dimensionFilter != null) {
			view.cubesviewer.views.cube.dimensionfilter.drawDimensionFilter(view, view.dimensionFilter);
		}

	};


	/*
	 * Draw view options as appropriate.
	 */
	this.drawFilterMenu = function(view) {

		var cube = view.cube;
		var menu = $(".cv-view-menu-cut", $(view.container));

		var dimensionFilterElements = cubesviewer.views.cube.explore.getDrillElementsList(view, "cv-view-show-dimensionfilter", false);

		$(".ui-explore-cut-clearsep", menu).before(
				'<li><a href="#" onclick="return false;"><span class="ui-icon ui-icon-zoomin"></span>Dimension filter</a><ul class="dimensionFilterList" style="width: 180px;">' +
				dimensionFilterElements +
				'</ul></li>'
		);

		$(menu).menu("refresh");
		$(menu).addClass("ui-menu-icons");

		// Events
		$(view.container).find('.cv-view-show-dimensionfilter').click( function() {
			cubesviewer.views.cube.dimensionfilter.drawDimensionFilter(view, $(this).attr('data-dimension'));
			return false;
		});

	};

	/**
	 * Adds edit icons to info boxes so filtering can be accessed quickly for existing filters.
	 */
	this.addFilterLinksToInfo = function (view) {

		// Cut pieces

		$(view.container).find('.cv-view-infopiece-cut').each (function (idx, e) {
			$(e).find('button').last().before(
				'<button style="display: inline-block;" class="cv-view-infopiece-cut-editcut"><span class="ui-icon ui-icon-zoomin"></span></button></div>'
			);
		});
		$(view.container).find('.cv-view-viewinfo-cut').find('button.cv-view-infopiece-cut-editcut').button().find('span').css('padding', '0px');
		$(view.container).find('.cv-view-viewinfo-cut').find('button.cv-view-infopiece-cut-editcut').click(function () {
			var dimensionString = $(this).parents('.cv-view-infopiece-cut').first().attr('data-dimension');
			var parts = view.cube.cvdim_parts(dimensionString);
			var depth = $(this).parents('.cv-view-infopiece-cut').first().attr('data-value').split(';')[0].split(",").length;
			cubesviewer.views.cube.dimensionfilter.drawDimensionFilter(view, dimensionString + ":" + parts.hierarchy.levels[depth - 1] );
		});

		// Drilldown pieces

		$(view.container).find('.cv-view-infopiece-drilldown').each (function (idx, e) {
			$(e).find('button').last().before(
				'<button style="display: inline-block;" class="cv-view-infopiece-drilldown-editcut"><span class="ui-icon ui-icon-zoomin"></span></button></div>'
			);
		});
		$(view.container).find('.cv-view-viewinfo-drill').find('button.cv-view-infopiece-drilldown-editcut').button().find('span').css('padding', '0px');
		$(view.container).find('.cv-view-viewinfo-drill').find('button.cv-view-infopiece-drilldown-editcut').click(function () {
			var dimensionString = $(this).parents('.cv-view-infopiece-drilldown').first().attr('data-dimension');
			cubesviewer.views.cube.dimensionfilter.drawDimensionFilter(view, dimensionString );
		});

	};

	/*
	 * Shows the dimension filter
	 */
	this.drawDimensionFilter = function (view, dimension) {

		var parts = view.cube.cvdim_parts(dimension);

		// Clean interface if a filter was already open
		$(view.container).find('.cv-view-dimensionfilter').remove();

		$(view.container).find(".cv-view-viewinfo").append('<div class="cv-view-dimensionfilter cv-view-info-panel infopiece ui-widget ui-corner-all" style="background-color: #ffcccc;"><h3>Dimension filter: ' + parts.label + '</h3><div class="cv-view-dimensionfilter-cont"></div></div>');

		// Draw value container

		$(view.container).find('.cv-view-dimensionfilter-cont').append (
				'<div class="filter-option">' +
				' Search: <input style="width: 270px;" name="dimensionfilter-list-search" />' +
				'</div>' +
				'<div class="filter-option">' +
				'<label>Invert: <input type="checkbox" class="invert-cut" /></label>' +
				'</div>' +
				'<div class="cv-view-dimensionfilter-list" style="max-height: 300px; overflow-x: hidden; overflow-y: auto; max-width: 580px; "><i>Loading...</i></div>'
		);
		$(view.container).find("[name=dimensionfilter-list-search]").on ("input", function() {
				view.cubesviewer.views.cube.dimensionfilter.searchDimensionValues( view, $(view.container).find("[name=dimensionfilter-list-search]").val() );
			}
		);

		$(view.container).find(".cv-view-dimensionfilter-cont").append (
				'<div style="margin-top: 10px;">' +
				'<button class="cv-views-dimensionfilter-apply">Apply</button>' +
				'<button class="cv-views-dimensionfilter-cancel">Close</button>' +
				'<div id="cv-views-dimensionfilter-cols-' + view.id + '" class="cv-views-dimensionfilter-cols" style="display: inline-block; margin-left: 15px; margin-right: 15px; padding: 0px;">' +
			    '<input type="radio" name="cv-views-dimensionfilter-col" id="cv-views-dimensionfilter-col1-' + view.id + '" /><label for="cv-views-dimensionfilter-col1-' + view.id + '">1 col</label>' +
			    '<input type="radio" name="cv-views-dimensionfilter-col" id="cv-views-dimensionfilter-col2-' + view.id + '" checked="checked" /><label for="cv-views-dimensionfilter-col2-' + view.id + '">2 cols</label>' +
			    '</div>' +
				'<button class="cv-views-dimensionfilter-selectall">Select All</button>' +
				'<button style="margin-right: 15px;" class="cv-views-dimensionfilter-selectnone">Select None</button>' +
				'<button class="cv-views-dimensionfilter-drill">Drilldown this</button>' +
				'</div>'
		);
		$(view.container).find(".cv-views-dimensionfilter-apply").button().click(function() {
			view.cubesviewer.views.cube.dimensionfilter.applyFilter( view, dimension );
		});
		$(view.container).find(".cv-views-dimensionfilter-cancel").button().click(function() {
			view.dimensionFilter = null;
			$(view.container).find('.cv-view-dimensionfilter').remove();
		});

		$(view.container).find("#cv-views-dimensionfilter-cols-" + view.id).buttonset();
		$(view.container).find("#cv-views-dimensionfilter-col1-" + view.id).click(function() {
			view.cubesviewer.views.cube.dimensionfilter.drawDimensionValuesCols( view, 1 );
		});
		$(view.container).find("#cv-views-dimensionfilter-col2-" + view.id).click(function() {
			view.cubesviewer.views.cube.dimensionfilter.drawDimensionValuesCols( view, 2 );
		});

		$(view.container).find(".cv-views-dimensionfilter-selectall").button().click(function() {
			// Clear previous selected items before applying new clicks
			$(view.container).find(".cv-view-dimensionfilter-list").find(":checkbox").filter(":checked").trigger('click');
			$(view.container).find(".cv-view-dimensionfilter-list").find(":checkbox:visible").trigger('click');
		});
		$(view.container).find(".cv-views-dimensionfilter-selectnone").button().click(function() {
			$(view.container).find(".cv-view-dimensionfilter-list").find(":checkbox").filter(":checked").trigger('click');
		});

		$(view.container).find(".cv-views-dimensionfilter-drill").button().click(function() {
			cubesviewer.views.cube.explore.selectDrill(view, parts.fullDrilldownValue, "1");
			return false;
		});

		// Obtain data
		view.cubesviewer.views.cube.dimensionfilter.loadDimensionValues(view, dimension);

	};


	/*
	 * Load and draw dimension values.
	 */
	this.loadDimensionValues = function(view, tdimension) {

		view.dimensionFilter = tdimension;

		var parts = view.cube.cvdim_parts(tdimension);

		var params = {
				"hierarchy": parts.hierarchy.name,
				"depth": parts.depth
		};

		//view.cubesviewer.views.blockViewLoading(view);

		view.cubesviewer.cubesRequest(
                // Doc says it's dimension, not members
				"/cube/" + view.cube.name + "/members/" + parts.dimension.name,
				params,
				view.cubesviewer.views.cube.dimensionfilter._loadDimensionValuesCallback(view, tdimension),
				function() {
					//view.cubesviewer.views.unblockView(view);
				}
		);

	};

	/*
	 * Updates info after loading data.
	 */
	this._loadDimensionValuesCallback = function(view, dimension) {

		var view = view;
		var dimension = dimension;

		return function(data, status) {
			// Draw dimension values for the filter
			view.cubesviewer.views.cube.dimensionfilter.drawDimensionValues(view, dimension, data);
		};

	};

	/*
	 * Shows the dimension filter
	 */
	this.drawDimensionValuesCols = function (view, cols) {

		$(view.container).find(".cv-view-dimensionfilter-list").find("input").each (function (idx, e) {
			if (cols == 1) {
				$(e).parents('.cv-view-dimensionfilter-item').first().css("display", "inline-block");
				$(e).parents('.cv-view-dimensionfilter-item').first().css("width", "98%");
			} else {
				$(e).parents('.cv-view-dimensionfilter-item').first().css("display", "inline-block");
				$(e).parents('.cv-view-dimensionfilter-item').first().css("width", "48%");
			}
		} );

		var search = $(view.container).find("[name=dimensionfilter-list-search]").val();
		view.cubesviewer.views.cube.dimensionfilter.searchDimensionValues(view, search);

	};

	/*
	 * Shows the dimension filter
	 */
	this.drawDimensionValues = function (view, tdimension, data) {

		$(view.container).find(".cv-view-dimensionfilter-list").empty();

		// Get dimension
		var dimension = view.cube.cvdim_dim(tdimension);

		$(data.data).each( function(idx, e) {

			// Get dimension
			var parts = view.cube.cvdim_parts(tdimension);
			var infos = parts.hierarchy.readCell(e, parts.level);

			// Values and Labels
			var drilldown_level_values = [];
			var drilldown_level_labels = [];

			$(infos).each(function(idx, info) {
				drilldown_level_values.push (info.key);
				drilldown_level_labels.push (info.label);
			});

			$(view.container).find(".cv-view-dimensionfilter-list").append(
				'<div class="cv-view-dimensionfilter-item"><label><input type="checkbox" style="vertical-align: middle;" value="' + drilldown_level_values.join (',') + '" /> ' +
				drilldown_level_labels.join(' / ') +
				'</label></div>'
			);

		});

		// Update selected
		view.cubesviewer.views.cube.dimensionfilter.updateFromCut(view, tdimension);

	};

	/*
	 * Searches labels by string and filters from view.
	 */
	this.searchDimensionValues = function(view, search) {

		$(view.container).find(".cv-view-dimensionfilter-list").find("input").each (function (idx, e) {
			if ((search == "") || ($(e).parent().text().toLowerCase().indexOf(search.toLowerCase()) >= 0)) {
				$(e).parents('.cv-view-dimensionfilter-item').first().show();
			} else {
				$(e).parents('.cv-view-dimensionfilter-item').first().hide();
			}
		} );

	};

	/*
	 * Updates selection after loading data.
	 */
	this.updateFromCut = function(view, dimensionString) {

		var parts = view.cube.cvdim_parts(dimensionString);
		var cutDimension = parts.dimension.name + ( parts.hierarchy.name != "default" ? "@" + parts.hierarchy.name : "" );

		var invert = false;
		var filterValues = [];
		for (var i = 0; i < view.params.cuts.length ; i++) {
			if (view.params.cuts[i].dimension == cutDimension) {
				invert = view.params.cuts[i].invert;
				filterValues = view.params.cuts[i].value.split(";");
				break;
			}
		}

		if (invert) {
			$(view.container).find(".cv-view-dimensionfilter-cont .invert-cut").attr("checked", "checked");
		}

		if (filterValues.length > 0) {
			$(view.container).find(".cv-view-dimensionfilter-list").find("input").each (function (idx, e) {
				for (var i = 0; i < filterValues.length; i++) {
					if ($(e).attr("value") == filterValues[i]) {
						$(e).attr("checked", "checked");
					}
				}
			} );
		}

	};

	/*
	 * Updates info after loading data.
	 */
	this.applyFilter = function(view, dimensionString) {

		var parts = view.cube.cvdim_parts(dimensionString);

		var checked = $(view.container).find(".cv-view-dimensionfilter-list").find("input:checked");

		// Empty selection would yield no result
		/*
		if (checked.size() == 0) {
			view.cubesviewer.alert('Cannot filter. No values are selected.');
			return;
		}
		*/

		var filterValues = [];
		// If all values are selected, the filter is empty and therefore removed by selectCut
		if (checked.size() < $(view.container).find(".cv-view-dimensionfilter-list").find("input").size()) {
			$(view.container).find(".cv-view-dimensionfilter-list").find("input:checked").each(function (idx, e) {
				filterValues.push( $(e).attr("value") );
			});
		}

		var invert = $(view.container).find(".cv-view-dimensionfilter .invert-cut").is(":checked");

		var cutDimension = parts.dimension.name + ( parts.hierarchy.name != "default" ? "@" + parts.hierarchy.name : "" );
		cubesviewer.views.cube.explore.selectCut(view, cutDimension, filterValues.join(";"), invert);

	};

}


/*
 * Create object.
 */
cubesviewer.views.cube.dimensionfilter = new cubesviewerViewCubeDimensionFilter();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.cube.dimensionfilter.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.dimensionfilter.onViewDraw);

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
 * Add columns control to view cube.
 * This adds support to memorize width and sorting for each view.
 * Also support to hide/show columns in Explorer mode.
 * This plugin can ideally be included before the export plugin.
 * 
 */
function cubesviewerViewCubeColumns () {

	this.cubesviewer = cubesviewer;

	this.onViewCreate = function(event, view) {
		
		$.extend(view.params, {
	
			columnHide: {},
			columnWidths: {},
			columnSort: {},
			
		});
		
	}
	
	
	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {
		
		if (view.cube == null) return;
		
		var menu = $(".cv-view-menu-view", $(view.container));
		var cube = view.cube;
		
		// Draw menu options (depending on mode)
		
		if ((view.params.mode == "explore")) {
			menu.append('<div></div>');
			menu.append('<li><a href="#" class="cv-view-hide-columns"><span class="ui-icon ui-icon-script"></span>Choose columns</a></li>');
		
			$(menu).menu( "refresh" );
			$(menu).addClass("ui-menu-icons");
		} else {
			$(view.container).find('.cv-view-columns-chooser').remove();
		}

		
		// Events
		$(view.container).find('.cv-view-hide-columns').click(function() {
			view.cubesviewer.views.cube.columns.showHideColumns(view);
			return false;
		});
		
	};
	
	this.showHideColumns = function (view) {

		$(view.container).find('.cv-view-columns-chooser').remove();
		
		var grid = $('#summaryTable-' + view.id);
		
		$(view.container).find(".cv-view-viewinfo").append('<div class="cv-view-columns-chooser cv-view-info-panel infopiece ui-widget ui-corner-all" style="background-color: #ddddff;"><h3>Column chooser</h3><div class="cv-view-columns-chooser-cols"></div></div>');
		
		
		// Add columns
		var measuresElements = "";
		var measuresNames = [];
		$(view.cube.measures).each(function(idx, e) {
			
			measuresNames.push(e.name);
			
			var aggregates = $.grep(view.cube.aggregates, function(ia) { return ia.measure == e.name; } );
			if (aggregates.length > 0) {
				$(view.container).find(".cv-view-columns-chooser-cols").append('<span style="float: left; min-width: 180px; margin-right: 20px;"><b>' + e.label + '</b>: </span>');
				$(aggregates).each(function(idx, ea) {
					var checkedon = (! view.cubesviewer.views.cube.columns.isColumnHidden (view, ea.ref)) ? 'checked="on"' : '';
					$(view.container).find(".cv-view-columns-chooser-cols").append (
						'<span style="margin-right: 15px;"><label ><input type="checkbox" ' + checkedon + ' style="vertical-align: middle;" data-col="' + ea.ref + '" class="cv-view-columns-chooser-col" /> ' + ea.label + '</label></span>'
					);
				});
				$(view.container).find(".cv-view-columns-chooser-cols").append('<br/>');
			}
			
		});
		
		var aggregates = $.grep(view.cube.aggregates, function(ia) { return (! ia.measure) || ($.inArray(ia.measure, measuresNames) == -1 ); } );
		if (aggregates.length > 0) {
			$(view.container).find(".cv-view-columns-chooser-cols").append('<span style="float: left; min-width: 180px; margin-right: 20px;"><b><i>Derived</i></b>: </span>'); 
			$(aggregates).each(function(idx, ea) {
				var checkedon = (! view.cubesviewer.views.cube.columns.isColumnHidden (view, ea.ref)) ? 'checked="on"' : '';
				$(view.container).find(".cv-view-columns-chooser-cols").append (
					'<span style="margin-right: 15px;"><label ><input type="checkbox" ' + checkedon + ' style="vertical-align: middle;" data-col="' + ea.ref + '" class="cv-view-columns-chooser-col" /> ' + ea.label + '</label></span>'
				);
			});
			$(view.container).find(".cv-view-columns-chooser-cols").append('<br/>');
		}
		
		
		// Event for checkboxes
		$(view.container).find(".cv-view-columns-chooser-cols").find(".cv-view-columns-chooser-col").click(function () {
			view.cubesviewer.views.cube.columns.toogleColumn (view, $(this).attr('data-col'));
		});
		
		
		$(view.container).find(".cv-view-columns-chooser-cols").append (
				'<div style="margin-top: 10px;">' +
				'<button class="cv-views-columns-chooser-close" style="margin-right: 15px;">Close Column Chooser</button>' +
				'<button class="cv-views-columns-chooser-selectall">Select All</button>' +
				'<button class="cv-views-columns-chooser-selectnone">Select None</button>' +
				'</div>'
		);
		$(view.container).find(".cv-views-columns-chooser-close").button().click(function() {
			$(this).parents('.cv-view-columns-chooser').remove();
		});
		$(view.container).find(".cv-views-columns-chooser-selectall").button().click(function() {
			$(view.container).find(".cv-view-columns-chooser-cols").find(":checkbox").not(":checked").trigger('click');;
		});
		$(view.container).find(".cv-views-columns-chooser-selectnone").button().click(function() {
			$(view.container).find(".cv-view-columns-chooser-cols").find(":checkbox").filter(":checked").trigger('click');
		});		
		
		
	};

	this.isColumnHidden = function (view, col) {
		var grid = $('#summaryTable-' + view.id);
		var colmod = $.grep(grid.jqGrid('getGridParam','colModel'), function(co) { return co.name == col })[0];
		return (colmod.hidden);
	};
	
	this.toogleColumn = function (view, col) {
		var grid = $('#summaryTable-' + view.id);
		var colmod = $.grep(grid.jqGrid('getGridParam','colModel'), function(co) { return co.name == col })[0];
		if (colmod.hidden == true) {
			grid.jqGrid('showCol', col);
		} else {
			grid.jqGrid('hideCol', col);
		}
		
		// Save (value has changed already)
		view.params.columnHide[col] = colmod.hidden;
	};
	
	
};

/*
 * Hooks for tables
 */
cubesviewer.views.cube.explore.onTableResize = function (view, width, index) {
	
	widths = {};
	
	if (view.params.mode == "explore") {
		var grid = $('#summaryTable-' + view.id);
	} else if (view.params.mode == "series") {
		var grid = $('#seriesTable-' + view.id);
	} else if (view.params.mode == "facts") {
		var grid = $('#factsTable-' + view.id);
	} else {
		return;
	}
	
	for (var i = ((view.params.mode == "explore") ? 1 : 0); i < grid.jqGrid('getGridParam','colNames').length; i++) {
		widths[ grid.jqGrid('getGridParam','colModel')[i].name ] = grid.jqGrid('getGridParam','colModel')[i].width;
	}
	
	// Merge arrays
	$.extend (view.params.columnWidths, widths);
	
};

cubesviewer.views.cube.explore.onTableSort = function (view, index, iCol, sortorder) {
	
	// Merge arrays
	data = {}
	data[view.params.mode] = [ index, sortorder ];
	$.extend (view.params.columnSort, data);
	
};

cubesviewer.views.cube.explore.defineColumnWidth = function(view, column, vdefault) {
	if (column in  view.params.columnWidths) {
		return view.params.columnWidths[column];
	} else {
		return vdefault;
	}
};

cubesviewer.views.cube.explore.defineColumnSort = function(view, vdefault) {
	if (view.params.mode in view.params.columnSort) {
		return view.params.columnSort[view.params.mode];
	} else {
		return vdefault;
	}
};

cubesviewer.views.cube.explore.onTableLoaded = function (view, width, index) {
	
	if (view.params.mode == "explore") {
		var grid = $('#summaryTable-' + view.id);
	} else if (view.params.mode == "series") {
		var grid = $('#seriesTable-' + view.id);
	} else if (view.params.mode == "facts") {
		var grid = $('#factsTable-' + view.id);
	} else {
		return;
	}
	
	// Hide columns as needed
	if (view.params.mode == "explore") {
		for (var i = ((view.params.mode == "explore") ? 1 : 0); i < grid.jqGrid('getGridParam','colNames').length; i++) {
			
			// Hide if necessary
			var colname = grid.jqGrid('getGridParam','colModel')[i].name;
	
			if (view.params.columnHide[colname] == true) {
				grid.jqGrid('hideCol', colname);
			}
		}
	}
	
};

/*
 * Create object.
 */
cubesviewer.views.cube.columns = new cubesviewerViewCubeColumns();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.cube.columns.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.columns.onViewDraw);

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

/*
 * This addon adds export to CSV capability to CubesViewer cube view.
 * It offers an "export facts" menu option for all cube view modes,
 * and a "export table" option in Explore and Series mode.
 */
function cubesviewerViewCubeExporter() {

	this.cubesviewer = cubesviewer;

	/*
	 * Draw export options.
	 */
	this.onViewDraw = function(event, view) {

		//if (view.params.mode != "explore") return;

		view.cubesviewer.views.cube.exporter.drawMenu(view);

	};

	/*
	 * Draw export menu options.
	 */
	this.drawMenu = function(view) {

		if (view.cube == null) return;

		var menu = $(".cv-view-menu-view", $(view.container));
		var cube = view.cube;

		// Draw menu options (depending on mode)

		menu.append('<div></div>');
		if ((view.params.mode == "explore") || (view.params.mode == "series")) {
			menu.append('<li><a href="#" class="cv-view-export-table"><span class="ui-icon ui-icon-script"></span>Export table</a></li>');
		}
		menu.append('<li><a href="#" class="cv-view-export-facts"><span class="ui-icon ui-icon-script"></span>Export facts</a></li>');

		$(menu).menu( "refresh" );
		$(menu).addClass("ui-menu-icons");

		// Events
		$(view.container).find('.cv-view-export-table').click(function() {
			view.cubesviewer.views.cube.exporter.exportCsv(view);
			return false;
		});
		$(view.container).find('.cv-view-export-facts').click(function() {
			view.cubesviewer.views.cube.exporter.exportFacts(view);
			return false;
		});


	};

	/*
	 * Download facts in CSV format from Cubes Server
	 */
	this.exportFacts = function(view) {

		var args = view.cubesviewer.views.cube.buildBrowserArgs(view, false, true);

        var http_args = {};
        http_args["format"] = "csv";

        if (args.cut) http_args.cut = args.cut.toString();
        if (args.order) http_args.order = args.order.toString();


		var url = view.cubesviewer.options.cubesUrl + "/cube/" + view.cube.name + "/facts?" + $.param(http_args);
		window.open(url, '_blank');
		window.focus();

	};

	/*
	 * Export a view (either in "explore" or "series" mode) in CSV format.
	 */
	this.exportCsv = function (view) {

		var content = "";

		if (view.params.mode == "explore") {
			var grid = $('#summaryTable-' + view.id);
		} else {
			var grid = $('#seriesTable-' + view.id);
		}

		var values = [];
		for (var i = ((view.params.mode == "explore") ? 1 : 0); i < grid.jqGrid('getGridParam','colNames').length; i++) {
			values.push ('"' + grid.jqGrid('getGridParam','colNames')[i] + '"');
		}
		content = content + (values.join(",")) + "\n";

		//var m = grid.getDataIDs();
		var m = grid.jqGrid('getGridParam', 'data');

		for (var i = 0; i < m.length; i++) {
		    var record = m[i];
		    values = [];
		    //values.push ('"' + $('<div>' + record.key + '</div>').text() + '"');
			//for (var j = ((view.params.mode == "explore") ? 2 : 1); j < grid.jqGrid('getGridParam','colNames').length; j++) {
		    for (var j = ((view.params.mode == "explore") ? 1 : 0); j < grid.jqGrid('getGridParam','colModel').length; j++) {
				var columnname = grid.jqGrid('getGridParam','colModel')[j].name;
				var colval = record[columnname];
				colval = $('<div>' + colval + '</div>').text();
				if (colval == undefined) colval = 0;
				values.push ('"' + colval + '"');
			}
		    content = content + (values.join(",")) + "\n";
		}

		var url = "data:text/csv;charset=utf-8," + encodeURIComponent(content);
		window.open (url, "_blank");
	};

};


/*
 * Create object.
 */
cubesviewer.views.cube.exporter = new cubesviewerViewCubeExporter();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.exporter.onViewDraw);
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

/*
 * Undo/Redo plugin.
 */
function cubesviewerViewsUndo () {

this.cubesviewer = cubesviewer; 
	
	this.maxUndo = 32;

	/*
	 * Prepares the view. 
	 */
	this.onViewCreate = function(event, view) {

		$.extend(view.params, {
			//"showUndo" : true,
		});
		
		view.undoList = [];
		view.undoPos = -1;
	};	
	
	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {
		
		if (view.cube == null) return;
		
		// Undo/Redo buttons
		$(view.container).find('.cv-view-toolbar').before(
			'<div style="margin-right: 15px; display: inline-block;">' + 
			'<button class="cv-view-undo cv-view-button-undo" title="Undo" style="margin-right: 5px;"><span class="ui-icon ui-icon-arrowreturnthick-1-w"></span></button>' +
			'<button class="cv-view-redo cv-view-button-redo" title="Redo" style=""><span class="ui-icon ui-icon-arrowreturnthick-1-e"></span></button>' +
			'</div>'
		);
		
		// Undo menu
		view.cubesviewer.views.undo.drawUndoMenu(view);		
		
		// Buttonize and events 
		$(view.container).find('.cv-view-button-undo').button();
		$(view.container).find('.cv-view-undo').click(function() { 
			view.cubesviewer.views.undo.undo(view);
			return false;
		});
		$(view.container).find('.cv-view-button-redo').button();
		$(view.container).find('.cv-view-redo').click(function() { 
			view.cubesviewer.views.undo.redo(view);
			return false;
		});

		// Process undo operations
		view.cubesviewer.views.undo._processDrawState(view);
		
		// Disable
		//$(view.container).find('.cv-view-button-chart').button("option", "disabled", "true").addClass('ui-state-active');
		if (view.undoPos <= 0) {
			$(view.container).find('.cv-view-button-undo').button("option", "disabled", "true")
			$(view.container).find('.cv-view-undo').addClass('disabled');
		}
		if (view.undoPos >= view.undoList.length - 1) {
			$(view.container).find('.cv-view-button-redo').button("option", "disabled", "true")
			$(view.container).find('.cv-view-redo').addClass('disabled');
		}		
		
		
		
	};	

	/*
	 * Updates view options menus.
	 */
	this.drawUndoMenu = function (view) {
		
		var menu = $(".cv-view-menu-view", $(view.container));
		var cube = view.cube;
		
		/*
		menu.append(
	  		'<div></div>' +
			'<li><a href="#" class="cv-view-undo"><span class="ui-icon ui-icon-arrowreturnthick-1-w"></span> Undo</a></li>' +
	  		'<li><a href="#" class="cv-view-redo"><span class="ui-icon ui-icon-arrowreturnthick-1-e"></span> Redo</a></li>'
	  	);
		
		$(menu).menu( "refresh" );
		$(menu).addClass("ui-menu-icons");
		*/

		// Events are added by the drawView method
		
	};
	
	this._processDrawState = function(view) {
		
		var drawn = view.cubesviewer.views.serialize(view);
		var current = this.getCurrentUndoState(view);
		 
		if (drawn != current) {
			this.pushUndo(view, drawn);
		}
		
	}
	
	this.pushUndo = function (view, state) {
		view.undoPos = view.undoPos + 1;
		if (view.undoPos + 1 <= view.undoList.length) {
			view.undoList.splice(view.undoPos, view.undoList.length - view.undoPos);
		}
		view.undoList.push(state);
		
		if (view.undoList.length > this.maxUndo) {
			view.undoList.splice(0, view.undoList.length - this.maxUndo);
			view.undoPos = view.undoList.length - 1;
		}
	}
	
	this.getCurrentUndoState = function (view) {
		if (view.undoList.length == 0) return "{}";
		return view.undoList[view.undoPos];
	};
	
	this.undo = function (view) {
		view.undoPos = view.undoPos - 1;
		if (view.undoPos < 0) view.undoPos = 0;
		this.applyCurrentUndoState (view);
	};
	
	this.redo = function (view) {
		view.undoPos = view.undoPos + 1;
		this.applyCurrentUndoState (view);
	};
	
	this.applyCurrentUndoState = function(view) {
		var current = this.getCurrentUndoState(view);
		view.params = $.parseJSON(current);
		view.cubesviewer.views.redrawView(view);
	};

	
};

/*
 * Create object.
 */
cubesviewer.views.undo = new cubesviewerViewsUndo();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewCreate", { }, cubesviewer.views.undo.onViewCreate);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.undo.onViewDraw);

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

/*
 * Cubes Viewer GUI
 */
function cubesviewerGui () {

	// Cubesviewer
	this.cubesviewer = cubesviewer;

	// Default options
	this.options = {
		container : null,
		user : null
	};

	// Current views array
	this.views = [];

	// View counter (used to assign different ids to each spawned view)
	this.lastViewId = 0;

	// Track sorting state
	this._sorting = false;

	this.onRefresh = function() {
		cubesviewer.gui.drawCubesList();
	};


	/*
	 * Closes a view.
	 */
	this.closeView = function(view) {
		for ( var i = 0; (i < this.views.length) && (this.views[i].id != view.id); i++) ;

		$('#' + view.id).remove();
		this.views.splice(i, 1);

		cubesviewer.views.destroyView (view);

	};

	// Adds a new clean view for a cube
	this.addViewCube = function(cubename) {

		this.lastViewId++;
		var viewId = "view" + this.lastViewId;

		var container = this.createContainer(viewId);

		// Find cube name
		var cubeinfo = cubesviewer.cubesserver.cubeinfo (cubename);

		var view = this.cubesviewer.views.createView(viewId, $('.cv-gui-viewcontent', container), "cube", { "cubename": cubename, "name": "Cube " + cubeinfo.label });
		this.views.push (view);

		// Bind close button
		$(container).find('.cv-gui-closeview').click(function() {
			cubesviewer.gui.closeView(view);
			return false;
		});

		return view;

	};

	/*
	 * Adds a view given its params descriptor.
	 */
	this.addViewObject = function(data) {

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

		$(this.options.container).children('.cv-gui-workspace').append(
			'<div id="'+ viewId + '" class="cv-gui-viewcontainer"></div>'
		);

		// Add view parts (header and body)
		$('#' + viewId).append(
			'<div class="cv-gui-cubesview" ><h3 class="sorthandle">' +
			'<span style="float: right; margin-left: 20px;" class="cv-gui-closeview ui-icon ui-icon-close"></span>' +
			'<span class="cv-gui-container-name" style="margin-left: 30px; margin-right: 20px;">' + /* view.name + */ '</span> <span style="float: right;" class="cv-gui-container-state"></span>' + /* viewstate + */
			'</h3><div class="cv-gui-viewcontent" style="overflow: hidden;"></div></div>'
		);

		// Configure collapsible

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

		// Clean list
		$('.cv-gui-cubeslist-menu', $(cubesviewer.gui.options.container)).empty();

		// Add cubes
		$(cubesviewer.cubesserver._cube_list).each(
			function(idx, cube) {
				$('.cv-gui-cubeslist-menu', $(cubesviewer.gui.options.container)).append(
						'<li><a href="#" data-cubename="' + cube.name + '" class="cv-gui-addviewcube">' + cube.label + '</a></li>'
				);
			}
		);
		$('.cv-gui-cubeslist-menu', $(cubesviewer.gui.options.container)).menu("refresh");

		// Add handlers for clicks
		$('.cv-gui-cubeslist-menu', $(cubesviewer.gui.options.container)).find('.cv-gui-addviewcube').click(function() {
			var view = cubesviewer.gui.addViewCube(  $(this).attr('data-cubename') );
			view.cubesviewer.views.redrawView (view);
			return false;
		});

		// Redraw views
		$(cubesviewer.gui.views).each(function(idx, view) {
			view.cubesviewer.views.redrawView(view);
		});

	};

	/*
	 * Draw About info box.
	 */
	this.showAbout = function() {
		this.cubesviewer.alert(
				"CubesViewer - Version " + this.cubesviewer.version + "\n" +
				"https://github.com/jjmontesl/cubesviewer/\n" +
				"\n" +
				"By José Juan Montes and others (see AUTHORS)\n" +
				"2012-2015\n"
		);
	};

	/*
	 * Draws a section in the main GUI menu.
	 */
	this.drawSection = function(gui, title, cssClass) {

		$(gui.options.container).children('.cv-gui-panel').append(
			'<button class="' + cssClass + '" title="' + title + '" style="margin-right: 15px;">' + title + '</button>' +
			'<ul class="' + cssClass + '-menu cv-view-menu"></ul>'
		);
		//$("." + cssClass + "-menu", gui.options.container).appendTo(document.body);
		$("." + cssClass, gui.options.container).button();
		$("." + cssClass, gui.options.container).click(function(ev) {

			// Hide all other menus
			$('.cv-view-menu').hide();

			$("." + cssClass + "-menu", gui.options.container).css("position", "absolute");
			$("." + cssClass + "-menu", gui.options.container).css("z-index", "9990");
			$("." + cssClass + "-menu", gui.options.container).show();
			$("." + cssClass + "-menu", gui.options.container).fadeIn().position({
				my : "left top",
				at : "left bottom",
				of : this
			});

			ev.stopPropagation();
			$(document).one("click", function () {
				$("." + cssClass + "-menu", gui.options.container).fadeOut();
			});

		});

		$("." + cssClass + "-menu", gui.options.container).menu({}).hide();

		// Menu functionality
		//view.cubesviewer.views.cube._initMenu(view, "." + cssClass, "." + cssClass + "-menu");

	};

	/*
	 * Render initial (constant) elements for the GUI
	 */
	this.onGuiDraw = function(event, gui) {

		// Draw cubes section
		gui.drawSection (gui, "Cubes", "cv-gui-cubeslist");
		gui.drawSection (gui, "Tools", "cv-gui-tools");


		if (! ((gui.options.showAbout != undefined) && (gui.options.showAbout == false))) {
			$(gui.options.container).find('.cv-gui-tools-menu').append(
				'<div></div>' +
				'<li><a href="#" class="cv-gui-about">About CubesViewer...</a></li>'
		    );
			$(gui.options.container).find('.cv-gui-tools-menu').menu('refresh');
			$('.cv-gui-about', gui.options.container).click(function() {
				gui.showAbout();
				return false;
			});
		}


		// Configure sortable panel
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



	}

	// Initialize Cubes Viewer GUI
	this.init = function(options) {

		$.extend(this.options, options);

		// Redraw
		$(document).trigger ("cubesviewerGuiDraw", [ this ]);

	}

};

/*
 * Create object.
 */
cubesviewer.gui = new cubesviewerGui();

/*
 * Bind events.
 */
$(document).bind("cubesviewerRefresh", { "gui": cubesviewer.gui }, cubesviewer.gui.onRefresh);
$(document).bind("cubesviewerGuiDraw", { "gui": cubesviewer.gui }, cubesviewer.gui.onGuiDraw);
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.gui.onViewDraw);
$(document).bind("cubesviewerInitialized", { }, cubesviewer.gui.onCubesViewerInitialized);
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

/*
 * View serialization inteface. This is an optional component.
 * Provides visual assistance for serializing views and instancing of views from
 * serialized data. Note that only the view parameters are serialized,
 * but not data. The Cubes Server still needs to be available to serve data.
 * This serialized strings can also be used to initialize different views from code,
 * which is handy when these are going to be instantiated from code later on
 * (ie. when embedding views on a web site).
 */
function cubesviewerGuiSerializing() {

	this.cubesviewer = cubesviewer;

	//this.urlLoaded = false;

	/*
	 * Draw GUI options
	 */
	this.onGuiDraw = function(event, gui) {

		$(gui.options.container).find('.cv-gui-tools-menu').prepend(
			'<li><a href="#" class="cv-gui-addserialized">Add view from JSON</a></li>'
		);
		$(gui.options.container).find('.cv-gui-tools-menu').menu('refresh');
		//$('.cv-gui-addserialized', gui.options.container).button();
		$('.cv-gui-addserialized', gui.options.container).click(function() {
			cubesviewer.gui.serializing.addSerializedView(gui);
			return false;
		});

	}

	/*
	 * Draw export options.
	 */
	this.onViewDraw = function(event, view) {

		view.cubesviewer.gui.serializing.drawMenu(view);

	};

	/*
	 * Draw export menu options.
	 */
	this.drawMenu = function(view) {

		var menu = $(".cv-view-menu-panel", $(view.container));
		var cube = view.cube;

		// Draw menu options (depending on mode)
		menu.find (".cv-gui-renameview").parent().after(
			'<li><a class="cv-gui-serializeview" href="#"><span class="ui-icon ui-icon-rss"></span> Serialize</a></li>'
		);

		$(menu).menu( "refresh" );
		$(menu).addClass("ui-menu-icons");

		// Events
		$(view.container).find('.cv-gui-serializeview').click(function() {
			view.cubesviewer.gui.serializing.serializeView(view);
			return false;
		});

	};

	/*
	 * Save a view.
	 */
	this.serializeView = function (view) {
		var serialized = view.cubesviewer.views.serialize(view);
		console.log(serialized);
		this.jqueryUiPopup(serialized);
	};

	this.jqueryUiPopup = function (text) {
		$('<p/>', {
			text: text
		}).dialog({
			buttons: [{
					text: "Close",
					click: function() {
						$(this).dialog("close");
					},
			}],
			open: function() {
				//autoselect text for copying
				window.getSelection().removeAllRanges();
				var range = document.createRange();
				range.selectNode($(this)[0]);
				window.getSelection().addRange(range);
			},
			create: function() {
				var dialog = $(this);
				var click_id = 'click.' + $(dialog).attr('id');

				$('div#body').bind(click_id, function() {
					$(dialog).dialog('close');
					$(this).unbind(click_id);
				});
			},
		});
	};

	/*
	 * Shows the dialog to add a serialized view.
	 * This is equivalent to other view adding methods in the cubesviewer.gui namespace,
	 * like "addViewObject", but this loads the view definition from
	 * the storage backend.
	 */
	this.addSerializedView = function (gui) {

		var serialized = prompt ("Enter serialized view data: ");

		if (serialized != null) {
			var view = cubesviewer.gui.addViewObject(serialized);
			this.cubesviewer.views.redrawView (view);
		}
	};

};

/*
 * Create object.
 */
cubesviewer.gui.serializing = new cubesviewerGuiSerializing();

/*
 * Bind events.
 */
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.gui.serializing.onViewDraw);
$(document).bind("cubesviewerGuiDraw", { }, cubesviewer.gui.serializing.onGuiDraw);

