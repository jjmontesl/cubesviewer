/*
 * CubesViewer
 * Copyright (c) 2012-2014 Jose Juan Montes, see AUTHORS for more details
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
		var len = nv.graphs.length;
		while (len--) {
			if (! ($.contains(document.documentElement, nv.graphs[len].container))) {
			    // Element is detached, destroy graph
				nv.graphs.splice (len,1);
			}
		}
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
	  	
		/*
		menu.append(
	  	  '<div></div>' +
  		  '<li><a href="#" class="cv-view-chart-export"><span class="ui-icon ui-icon-script"></span>Export image</a></li>'
		);
		*/
		
		$(menu).menu( "refresh" );
		$(menu).addClass("ui-menu-icons");
		
		var serieschart = view.cubesviewer.views.cube.chart;
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
			'<div id="seriesChart-' + view.id + '" style="height: 400px;" ><div><svg style="height: 400px;" /></div></div>'
		);
		
		$(view.container).find('#seriesChart-' + view.id).resizable({
			 maxHeight: 800,
			 minHeight: 220,
			 //helper: "ui-resizable-helper",
			 resize: function(event, ui) {
		        ui.size.width = ui.originalSize.width;
		     },
		     alsoResize: '#seriesChart-' + view.id + '>div>svg'
		});
		
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
	    
	    nv.addGraph(function() {
	        var chart;
	        chart = nv.models.multiBarChart()
	          //.margin({bottom: 100})
	          .transitionDuration(300)
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

	        chart.yAxis.tickFormat(d3.format(',.2f'));

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
	    
	    if (view.params.charttype != "lines-stacked") {
	    
		    nv.addGraph(function() {
		    	var chart = nv.models.lineChart()
		    		.useInteractiveGuideline(true)
		    		.margin({left: 120})
		    		;
	
		    	chart.xAxis
		    		.axisLabel(xAxisLabel)
		    		.tickFormat(function(d,i) {
				                return (colNames[d]);
				     })	;
	
		    	chart.yAxis
		    		//.axisLabel("Y-axis Label")
		    		.tickFormat(d3.format(',.2f'));
		    		;
	
		    	d3.select(container)
		    		.datum(d)
		    		.transition().duration(500).call(chart);
	
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
	
	    	  chart.yAxis
	    	      .tickFormat(d3.format(',.2f'));
	
	    	  d3.select(container)
	    	    .datum(d)
	    	      .transition().duration(500).call(chart);
	
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
	    d.sort(function(a,b) { return a.key < b.key ? -1 : (a.key > b.key ? +1 : 0) });
	    
	    xticks = [];
	    for (var i = 1; i < colNames.length; i++) {
    		xticks.push([ i - 1, colNames[i] ]); 
	    }
	    
	    nv.addGraph(function() {

	        var chart = nv.models.pieChart()
	            .x(function(d) { return d.key })
	            .y(function(d) { return d.y })
	            //.color(d3.scale.category20().range())
	            //.width(width)
	            //.height(height)
	            .labelType("percent")
	            //.donut(true);

	        /*
		    chart.pie
		        .startAngle(function(d) { return d.startAngle/2 -Math.PI/2 })
		        .endAngle(function(d) { return d.endAngle/2 -Math.PI/2 });
		        */

	          d3.select(container)
	              .datum(d)
	            .transition().duration(1200)
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
