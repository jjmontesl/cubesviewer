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


import {Provider} from '../provider'


export class CubesProvider extends Provider {

	initialize() {
		// Initialize Cubes service
		//this.cubesCacheService.initialize();
		console.debug("Initializing Cubes provider: ", this.config.name);
		this.cubesService = CubesService(this.config);
		var connectPromise = new Promise((resolve, reject) => {
			this.cubesService.connect().then(() => {
				this.cubes = this.cubesService.cubesclient._cube_list;
				for (var cube of this.cubes) cube.provider = this;
				resolve();
			});
		});
		return connectPromise;
	}

	cubeinfo(name) {
		console.debug(this.cubesService.cubesclient.cubeinfo(name));
		return this.cubesService.cubesclient.cubeinfo(name);
	}

	cubeschema(name) {
		var schemaPromise = new Promise((resolve, reject) => {
			var jqxhr = this.cubesService.cubesclient.get_cube(name, (schema) => {
				resolve(schema);
			});
			jqxhr.fail(function(req) {
				var data = req.responseJSON;
				console.debug(data);
				reject(data);
			});
		});

		return schemaPromise;
	}

	items(cube) {

	}

	aggregate(cubename, viewStateKey) {
		var browser_args = this.cubesService.buildBrowserArgs($scope.view, false, false);
		var browser = new cubes.Browser(this.cubesService.cubesserver, cubename);

		var cubesPromise = new Promise((resolve, reject) => {
			browser.aggregate(browser_args, () => $scope._loadDataCallback(viewStateKey));
		});

	}


}

