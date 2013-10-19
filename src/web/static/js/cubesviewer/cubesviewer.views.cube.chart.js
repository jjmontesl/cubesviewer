/*
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
		
		view.flotrDraw = null;
		view.doExport = false;
	};	
	
	/*
	 * Exports chart.
	 */
	this.exportChart = function(view) {
		 
	     if (Flotr.isIE && Flotr.isIE < 9) {
            view.cubesviewer.alert("Your browser doesn't allow you to get a bitmap image from the plot.");
            return;
         }
	     
	     if (view.flotrDraw == null) {
	    	 view.cubesviewer.alert("Cannot export: there is no chart configured.");
	         return;
	     }

	     view.doExport = true;
	     view.cubesviewer.views.redrawView(view);
	     
	};

	/*
	 * Draw cube view structure.
	 */
	this.onViewDraw = function(event, view) {
		
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
			'<li><a href="#"><span class="ui-icon ui-icon-calculator"></span>Chart Type</a><ul style="width: 180px;">' +
	  		'<li><a href="#" class="cv-view-chart-settype" data-charttype="pie">Pie</a></li>' +
	  		'<li><a href="#" class="cv-view-chart-settype" data-charttype="bars-vertical">Bars Vertical</a></li>' +
	  		'<li><a href="#" class="cv-view-chart-settype" data-charttype="bars-vertical-stacked">Bars Vertical (Stacked)</a></li>' +
	  		'<li><a href="#" class="cv-view-chart-settype" data-charttype="lines">Lines</a></li>' +
	  		'<li><a href="#" class="cv-view-chart-settype" data-charttype="lines-stacked">Areas (Stacked)</a></li>' +
	  		'<li><a href="#" class="cv-view-chart-settype" data-charttype="radar">Radar</a></li>' +
	  	  '</ul></li>' +
  		  '<div></div>'
	  	);
	  	menu.append(
	  	  '<div></div>' +
  		  '<li><a href="#" class="cv-view-chart-export"><span class="ui-icon ui-icon-script"></span>Export image</a></li>'
		);
		
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
		var params = view.cubesviewer.views.cube.buildQueryParams(view, view.params.xaxis != null ? true : false, false);
		
		view.cubesviewer.views.blockViewLoading(view);
		
		view.cubesviewer.cubesRequest(
				"/cube/" + view.cube.name + "/aggregate",
				params,
				view.cubesviewer.views.cube.chart._loadDataCallback(view),
				function() {
					view.cubesviewer.views.unblockView(view);
				}
		);
		
		/*
		var jqxhr = $.get(view.cubesviewer.options.cubesUrl + "/cube/" + view.cube.name + "/aggregate", params, 
				view.cubesviewer.views.cube.chart._loadDataCallback(view), "json");
		jqxhr.complete (function() {
			view.cubesviewer.views.unblockView(view);
		});
		*/
		
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
			'<div id="seriesChart-' + view.id + '" style="height: 380px; "></div>'
		);
		
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
				for (i = 0; i < view.params.drilldown.length; i++) jointkey.push(e["key" + i]);
				e["key"] = jointkey.join(" / ");
			});
		}
		
		if (view.params.charttype == "bars-vertical") {
			view.cubesviewer.views.cube.chart.drawChartBarsVertical(view, colNames, dataRows, dataTotals);
		} else if (view.params.charttype == "bars-vertical-stacked") {
			view.cubesviewer.views.cube.chart.drawChartBarsVertical(view, colNames, dataRows, dataTotals);
		} else if (view.params.charttype == "lines") {
			view.cubesviewer.views.cube.chart.drawChartLines(view, colNames, dataRows, dataTotals);
		} else if (view.params.charttype == "pie") {
			view.cubesviewer.views.cube.chart.drawChartPie(view, colNames, dataRows, dataTotals);
		} else if (view.params.charttype == "lines-stacked") {
			view.cubesviewer.views.cube.chart.drawChartLines(view, colNames, dataRows, dataTotals);
		} else if (view.params.charttype == "radar") {
			view.cubesviewer.views.cube.chart.drawChartRadar(view, colNames, dataRows, dataTotals);
		}
		
	    if (view.doExport) {
	    	view.doExport = false;
	    	view.flotrDraw.download.saveImage("png");
	    }
		
		// Generic effects
	    $('.flotr-legend').hover(function() {
	    	$(this).stop().animate ({opacity: 0.10}, 1000);
	    	$('.flotr-legend-bg').stop().animate ({opacity: 0.10}, 1000);
	    }, function() {
	    	$(this).stop().animate ({opacity: 0.75}, 1000);
	    	$('.flotr-legend-bg').stop().animate ({opacity: 0.75}, 1000);
	    });
	    
	};

	/**
	 * Draws a vertical bars chart.
	 */
	this.drawChartBarsVertical = function (view, colNames, dataRows, dataTotals) {
		
		var container = $('#seriesChart-' + view.id).get(0);
		
	    var d = [];

	    numRows = dataRows.length;
	    $(dataRows).each(function(idx, e) {
	    	serie = [];
	    	for (i = 1; i < colNames.length; i++) {
	    		var value = e[colNames[i]];
	    		if (value != undefined) {
	    			serie.push( [ (view.params.charttype == "bars-vertical-stacked") ? (i * 10) : (i*10 + ((idx / numRows) * 9)), value] );
	    		}
	    	}
	    	d.push({ data: serie, label: e["key"] != "" ? e["key"] : "" });
	    });
	    d.sort(function(a,b) { return a.label < b.label ? -1 : (a.label > b.label ? +1 : 0) });
	    
	    xticks = [];
	    for (i = 1; i < colNames.length; i++) {
    		xticks.push([ i * 10, colNames[i] ]); 
	    }
	    
	    view.flotrDraw = Flotr.draw(container, d, {
	    	HtmlText: !view.doExport,
	    	shadowSize: 2,
	        bars: {
	            show: true,
	            horizontal: false,
	            shadowSize: 0,
	            barWidth: (view.params.charttype == "bars-vertical-stacked") ? 9 : (9 / numRows),
	            stacked: (view.params.charttype == "bars-vertical-stacked")
	        },
	        mouse: {
	            track: true,
	            relative: true,
            	trackFormatter:function(obj) {
            		return (obj.series.label + ' -> ' + obj.series.xaxis.ticks[(Math.floor(obj.x / 10)) - 1].label + " = " + parseFloat(obj.y));
            	}	            
	        },
	        yaxis: {
	            // TODO: Check if this is applying correctly (null seems to be taken as 0)
	        	min: (view.params.charttype == "bars-vertical-stacked" ? 0 : null),
	            autoscaleMargin: 1
	        },
	        legend: {
	            position: "nw",
	            backgroundColor: "#D2E8FF"
	        },
	        grid: {
	            verticalLines: false,
	            horizontalLines: true
	        },
	        xaxis: {
	            ticks: xticks
	        }	        
	        
	    });
	    
	}
	
	/**
	 * Draws a vertical bars chart.
	 */
	this.drawChartLines = function (view, colNames, dataRows, dataTotals) {
		
		var container = $('#seriesChart-' + view.id).get(0);
		
	    var d = [];

	    // TODO: Check there's only one value column
	    
	    numRows = dataRows.length;
	    $(dataRows).each(function(idx, e) {
	    	serie = [];
	    	for (i = 1; i < colNames.length; i++) {
	    		var value = e[colNames[i]];
	    		if (value != undefined) {
	    			serie.push( [i*10, value] );
	    		} else {
	    			serie.push( [i*10, 0] );
	    		}
	    	}
	    	d.push({ data: serie, label: e["key"] != "" ? e["key"] : view.params.yaxis });
	    	//d.push({ data: serie, label: e["key"], lines: { /*fill: (view.params.charttype == "lines-stacked")*/ } });
	    });
	    d.sort(function(a,b) { return a.label < b.label ? -1 : (a.label > b.label ? +1 : 0) });
	    
	    xticks = [];
	    for (i = 1; i < colNames.length; i++) {
    		xticks.push([ i * 10, colNames[i] ]); 
	    }
	    
	    view.flotrDraw = Flotr.draw(container, d, {
	    	HtmlText: ! view.doExport,
	    	shadowSize: 0,
	        yaxis: {
	        	autoscaleMargin: 1
	        },
	        lines: {
	        	lineWidth: 1, 
	        	shadow: false,
	        	stacked: (view.params.charttype == "lines-stacked"),
	        	fill: (view.params.charttype == "lines-stacked")
	        },
	        mouse: {
	            track: true,
	            relative: true,
            	trackFormatter:function(obj) {
            		return (obj.series.label + ' -> ' + obj.series.xaxis.ticks[(obj.x / 10) - 1].label + " = " + parseFloat(obj.y));
            	}
	        },
	        legend: {
	            position: "nw",
	            backgroundColor: "#D2E8FF"
	        },
	        xaxis: {
	            ticks: xticks
	        }
	    });
	    
	};	

	/**
	 * Draws a vertical bars chart.
	 */
	this.drawChartPie = function (view, colNames, dataRows, dataTotals) {
		
		var container = $('#seriesChart-' + view.id).get(0);
		
	    var d = [];

		// Check if we can produce a pie
		if (colNames.length > 2) {
			$('#' + view.id).find('.cv-view-viewdata').empty();
			$('#' + view.id).find('.cv-view-viewdata').append('<h3>Series Chart</h3><div><i>Cannot present a Pie Chart when more than one column is present.</i></div>');
			return;
		} 
	    
	    numRows = dataRows.length;
	    $(dataRows).each(function(idx, e) {
	    	serie = [];
	    	for (i = 1; i < colNames.length; i++) {
	    		var value = e[colNames[i]];
	    		if (value != undefined) {
	    			serie.push( [0, value] );
	    		}
	    	}
	    	d.push({ data: serie, label: e["key"] != "" ? e["key"] : colNames[0] });
	    });
	    d.sort(function(a,b) { return a.label < b.label ? -1 : (a.label > b.label ? +1 : 0) });
	    
	    xticks = [];
	    for (i = 1; i < colNames.length; i++) {
    		xticks.push([ i - 1, colNames[i] ]); 
	    }
	    
	    view.flotrDraw = Flotr.draw(container, d, {
	    	HtmlText: ! view.doExport,
            xaxis: {
                showLabels: false
            },
            yaxis: {
                showLabels: false
            }, 	        
            mouse: {
            	track: true,
            	relative: true,
            	trackFormatter:function(obj) {
            		return (obj.series.label + ' -> ' + colNames[1] + " = " + parseFloat(obj.y));
            	}
            },
	        grid: {
	            verticalLines: false,
	            horizontalLines: false
	        },
	        pie: {
	            show: true,
	            explode: 6
	        },		        
	        legend: {
	            position: "nw",
	            backgroundColor: "#D2E8FF"
	        }
	    });
	    
	};	
	
	/**
	 * Draws a vertical bars chart.
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
	    	for (i = 1; i < colNames.length; i++) {
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
	    for (i = 1; i < colNames.length; i++) {
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
$(document).bind("cubesviewerViewDraw", { }, cubesviewer.views.cube.chart.onViewDraw);
