/*
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

/**
 * Extend model prototype to support datefilter dimensions.
 * Inform if a dimension is a date dimension and can be used as a date
 * filter (i.e. with date selection tool).
 * @returns Whether the dimension is a date dimension.
 */
cubes.Dimension.prototype.isDateDimension = function()  {
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


/**
 * Extend model prototype to support geographic dimensions.
 * @returns Whether the dimension level is a geographic dimension.
 */
cubes.Level.prototype.isGeoLevel = function() {
	return ((this.role == "geo") || ("cv-geo-source" in this.info));
};


/**
 * List date dimensions.
 *
 * @returns An array with the dimensions that are date dimensions (role: time).
 */
cubes.Cube.prototype.geoLevels = function() {
	var result = [];
	for (var index in this.dimensions) {
		var dimension = this.dimensions[index];
		for (var indexL in dimension.levels) {
			var level = dimension.levels[indexL];
			if (level.isGeoLevel()) result.push(level);
		}
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

