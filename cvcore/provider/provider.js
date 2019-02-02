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



export class Provider {

	constructor(config) {
		//super()
		this.config = config;
		this.name = config.name;
		this.cubes = {};
	}

	/**
	 * This method returns a Promise.
	 */
	initialize() {
	}

	cubeinfo(name) {
	}

	items() {
	}

	aggregate() {
	}

}


export class ProviderManager {

	constructor() {
		this.providers = {};
		this.cubes = [];
	}

	add(provider) {
		console.debug("Adding CubesViewer provider: " + provider.config.url);
		this.providers[provider.name] = provider;
		provider.initialize().then(() => {
			console.debug("Initialized: " + provider.name);
			this.cubes.splice(0, this.cubes.length, ...this.cubes.concat(provider.cubes));
		});
	}

	get(providername) {
		return this.providers[providername];
	}

}


