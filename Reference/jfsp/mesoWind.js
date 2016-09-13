var spots;
var markerText = {};
var toggleVal;
var state = 'ut';
var mapPoints = [];
var map;
var zoom;
var relh;
var relhs;
var newPoint;
$(document).ready(function() {
	 $( "#effect" ).hide();
    var myLatLng = new L.LatLng(39.828175,-95);
	 var mapQuest = L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
                attribution: 'Data, imagery and map information provided by <a href="http://www.mapquest.com/" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a>'
                });
    var myOptions = {
        zoom: 6,
        center: myLatLng,
        layers: [mapQuest]
    };

    map = new L.map($('#map')[0], myOptions);
    zoom = map.getZoom();
        
    $( "button" ).click( function () {
    	$( "#effect" ).hide('slide', 500);
    	$( "#effect" ).html('');
    	state = $( "#state" ).val().toLowerCase();
    	markerText = {};
    	d3.selectAll('g').remove()
    	d3.selectAll('svg').remove()
    	d3.selectAll('b').remove()
    	d3.selectAll('.reset').remove()
    	onClick();
    });
    
    onClick();
    
/*function smallMarkers() {
	var url;
	var icon;
	if (mapPoints.length>0){
		for (var i = 0; i < mapPoints.length; i++){
  			url = mapPoints[i].getIcon();
  			icon = url.slice(0,-4)+'-small.png';
  			mapPoints[i].setIcon(icon);
  		}
	}
}

function bigMarkers() {
	var url;
	var icon;
	if (mapPoints.length>0){
		for (var i = 0; i < mapPoints.length; i++){
  			url = mapPoints[i].getIcon();
  			icon = url.slice(0,-10)+'.png';
  			mapPoints[i].setIcon(icon);
  		}
	}
}*/
    //plotOverlay(map);
});

function onClick() {
	
  $.ajax({url: "http://api.mesowest.net/stations?state="+state+"&status=active&latestobs=1&within=60&jsonformat=2&token=1234567890&vars=air_temp,wind_speed,relative_humidity,wind_direction,wind_gust,road_temp",
  	dataType: 'jsonp',
  	success: function (d,s,xh) {
  	  spots = d.STATION;
	  // Various formatters.
	  var formatNumber = d3.format(",d"),
	      formatPerc = d3.format(".2%"),
	      formatChange = d3.format("+,d"),
	      formatDate = d3.time.format("%B, %Y"),
	      formatTime = d3.time.format("%B %d"),
	      formatDatePlus = d3.time.format("%B %d, %Y %H:%M"),
	      formatDateDir = d3.time.format("%Y%m%d"),
	      formatDiff = d3.format(".2f");
	
	  // A nest operator, for grouping the spot dist.
	  var nestByDist = d3.nest()
	      .key(function(d) { return formatNumber(d.dist); });
	
	  var nestByDate = d3.nest()
	      .key(function(d) { return d3.time.month(d.date); });
	
	  // A little coercion, since the CSV is untyped.
	  spots.forEach(function (d,i) {
	  	 d = spots[i];
	    d.index = i;
	    d.date = parseDate(d.OBSERVATIONS.date_time[0]);
	    d.elev = +parseInt(d.ELEVATION);
	    d.ethou = +(parseInt(d.ELEVATION)/1000);
	    if (d.OBSERVATIONS.air_temp){d.temp = +d.OBSERVATIONS.air_temp[1];} else {d.temp = -9999;}
		 if (d.OBSERVATIONS.road_temp){d.rtmp = +d.OBSERVATIONS.road_temp[1];} else {d.rtmp = -9999;}
	    if (d.OBSERVATIONS.relative_humidity){d.relh = +d.OBSERVATIONS.relative_humidity[1];} else {d.relh = -9999;}
	    if (d.OBSERVATIONS.wind_speed){d.wspd = +d.OBSERVATIONS.wind_speed[1];} else {d.wspd = -9999;}
		 if (d.OBSERVATIONS.wind_gust){d.wgst = +d.OBSERVATIONS.wind_gust[1];} else {d.wgst = -9999;}
		 if (d.OBSERVATIONS.wind_direction){d.wdir = +d.OBSERVATIONS.wind_direction[1];} else {d.wdir = -9999;}
	    d.latitude = +parseFloat(d.LATITUDE);
	    d.longitude = +parseFloat(d.LONGITUDE);
	    d.stn = d.STID;
	  });
	
	  // Create the crossfilter for the relevant dimensions and groups.
	  var spot = crossfilter(spots),
	      all = spot.groupAll(),
	      date = spot.dimension(function(d) { return d.date; }),
	      dates = date.group(d3.time.minute),
	      temp = spot.dimension(function(d) { return d.temp; }),
	      temps = temp.group(function(d) {return Math.floor(d/7) * 7;}),
	      wspd = spot.dimension(function(d) { return d.wspd; }),
	      wspds = wspd.group(function(d) {return Math.floor(d/3) * 3;}),
	      wgst = spot.dimension(function(d) { return d.wgst; }),
	      wgsts = wgst.group(function(d) {return Math.floor(d/3) * 3;}),
	      wdir = spot.dimension(function(d) { return d.wdir; }),
	      wdirs = wdir.group(function(d) {return Math.floor(d/20) * 20;}),
	      ethou = spot.dimension(function(d) { return d.ethou; }),
	      ethous = ethou.group(function(d) {return Math.floor(d/1) * 1;});
	      rtmp = spot.dimension(function(d) { return d.rtmp; }),
	      rtmps = rtmp.group(function(d) {return Math.floor(d/7) * 7;}),
	  relh = spot.dimension(function(d) { return d.relh; });
	  relhs = relh.group(function(d) {return Math.floor(d/5) * 5;});
	  var ctarr = relh.top(spot.size());
	      
	  var datsize = spot.size();
	
	  var charts = [
	
	    barChart()
	        .dimension(temp)
	        .group(temps)
	        .round(function(d) {return Math.floor(d/7) * 7;})
	      .x(d3.scale.linear()
	        .domain([-20, 120])
	        .rangeRound([0, 210]))
	      .y(d3.scale.linear()
	        .domain([0,Math.max(datsize,10)])
	        .rangeRound([200,0])),
	
	    barChart()
	        .dimension(relh)
	        .group(relhs)
	        .round(function(d) {return Math.floor(d/5) * 5;})
	      .x(d3.scale.linear()
	        .domain([0, 105])
	        .rangeRound([0, 210]))
	      .y(d3.scale.linear()
	        .domain([0,Math.max(datsize,10)])
	        .rangeRound([200,0])),
	        
	    barChart()
	        .dimension(wspd)
	        .group(wspds)
	        .round(function(d) {return Math.floor(d/3) * 3;})
	      .x(d3.scale.linear()
	        .domain([0, 60])
	        .rangeRound([0, 210]))
	      .y(d3.scale.linear()
	        .domain([0,Math.max(datsize,10)])
	        .rangeRound([200,0])),
	        
	    barChart()
	        .dimension(wgst)
	        .group(wgsts)
	        .round(function(d) {return Math.floor(d/3) * 3;})
	      .x(d3.scale.linear()
	        .domain([0, 60])
	        .rangeRound([0, 210]))
	      .y(d3.scale.linear()
	        .domain([0,Math.max(datsize,10)])
	        .rangeRound([200,0])),
	        
	    barChart()
	        .dimension(wdir)
	        .group(wdirs)
	        .round(function(d) {return Math.floor(d/20) * 20;})
	      .x(d3.scale.linear()
	        .domain([0, 360])
	        .rangeRound([0, 210]))
	      .y(d3.scale.linear()
	        .domain([0,Math.max(datsize,10)])
	        .rangeRound([200,0])),
	        
	    barChart()
	        .dimension(ethou)
	        .group(ethous)
	        .round(function(d) {return Math.floor(d/1) * 1;})
	      .x(d3.scale.linear()
	        .domain([-1, 15])
	        .rangeRound([0, 210]))
	      .y(d3.scale.linear()
	        .domain([0,Math.max(datsize,10)])
	        .rangeRound([200,0])),
	        
	    barChart()
	        .dimension(rtmp)
	        .group(rtmps)
	        .round(function(d) {return Math.floor(d/7) * 7;})
	      .x(d3.scale.linear()
	        .domain([-20, 120])
	        .rangeRound([0, 210]))
	      .y(d3.scale.linear()
	        .domain([0,Math.max(datsize,10)])
	        .rangeRound([200,0])),
	  ];
	
	  // Given our array of charts, which we assume are in the same order as the
	  // .chart elements in the DOM, bind the charts to the DOM and render them.
	  // We also listen to the chart's brush events to update the display.
	  var chart = d3.selectAll(".chart")
	      .data(charts)
	     // .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });
	      .each(function(chart) { chart.on("brushend", renderAll); });
	  // Render the total.
	  d3.selectAll("#total")
	      .text(formatNumber(spot.size()));
	
	  renderAll();
	
	  // Renders the specified chart or list.
	  function render(method) {
	    d3.select(this).call(method);
	  }
	  
	//  function pause(milliseconds) {
	//	 var dt = new Date();
	//	 while ((new Date()) - dt <= milliseconds) { /* Do nothing */ }
	//  }
	
	  // Whenever the brush moves, re-rendering everything.
	  function renderAll() {
	    chart.each(render);
	    ctarr = relh.top(spot.size());
	    d3.select("#active").text(formatNumber(all.value()));
		 mapPlot(ctarr);
	  }
	
	  // Like d3.time.format, but faster.
	  function parseDate(d) {
	    return new Date(d.substring(0, 4),
	        d.substring(5, 7) - 1,
	        d.substring(8, 10),
	        d.substring(11, 13),
	        d.substring(14,16));
	  }

	  function minMax (array,id) {
	  	var dt = id.substring(0,4);
	  	var keys = [];
	  	for (var i=0; i<array.length; i++) {
	  		var d = array[i];
	  		if (dt=='temp'){
				if (d.temp>-21 && d.temp<120){
					keys.push(d.temp);
				}
			} else if (dt=='relh') {
				if (d.relh>-1 && d.relh<101){
					keys.push(d.relh);
				}
			} else if (dt=='wspd') {
				if (d.wspd>-1 && d.wspd<101){
					keys.push(d.wspd);
				}
			} else if (dt=='wgst') {
				if (d.wgst>-1 && d.wgst<101){
					keys.push(d.wgst);
				}
			} else if (dt=='wdir') {
				if (d.wdir>-1 && d.wdir<361){
					keys.push(d.wdir);
				}
			} else if (dt=='rtmp') {
				if (d.rtmp>-21 && d.rtmp<120){
					keys.push(d.rtmp);
				}
			} else if (dt=='elev') {
				keys.push(d.elev);
			}
		}
		keys.sort(function (a,b) {return a-b});
		if (keys.length<1) {
			keys = [NaN,NaN]
		}
		return [keys[0],keys[keys.length-1]]  
	  }
	
	  window.filter = function(filters) {
	    filters.forEach(function(d, i) { charts[i].filter(d); });
	    renderAll();
	  };
	
	  window.reset = function(i) {
	    charts[i].filter(null);
	    renderAll();
	  };
	  
	  function counter(array,sml,temp) {
	  	if (sml){
	  		var count = [[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0]];
	  		if(temp){
	  			array.forEach(function(d){count[d.cist-1][1]++;});
	  		} else {
	  			array.forEach(function(d){count[d.cisrh-1][1]++;});
	  		}
	  		return count;
	  	} else {
	  		var count = [[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[13,0],[14,0],[15,0],[16,0],[17,0],[18,0],[19,0],[20,0],[21,0],[22,0],[23,0],[24,0],[25,0],[26,0],[27,0],[28,0],[29,0],[30,0],[31,0],[32,0]];
	  		if(temp){
	  			array.forEach(function(d){count[d.sist-1][1]++;});
	  		} else {
	  			array.forEach(function(d){count[d.sisrh-1][1]++;});
	  		}
	  		return count;
	  	}
	  }
	  
	  function mapPlot(array) {
	  	if (mapPoints.length>0){
	  		for (var i = 0; i < mapPoints.length; i++){
	  			map.removeLayer(mapPoints[i]);
	  		}
	  	}
	   mapPoints = [];
	  	array.forEach(function(d){
	  		var icount = 0;
	  		var lat = d.latitude;
	  		var lon = d.longitude;
	  		var pos = new L.LatLng(lat,lon);
	  		var date = formatDatePlus(d.date);
			var elev = d.elev;
			var stn = d.stn;
			var mc = 'cadetblue';
			if (d.temp==-9999) {var temp = "Temperature: No Observation";} else {var temp = 'Temperature: '+d.temp+' F';}
		   if (d.temp>=-50 && d.temp<-30) {
		   	mc = 'darkblue';
		   } else if (d.temp>=-30 && d.temp<-10) {
				mc = 'blue';		   
		   } else if (d.temp>=-10 && d.temp<10) {
				mc = 'darkgreen';		   
		   } else if (d.temp>=10 && d.temp<30) {
				mc = 'green';		   
		   } else if (d.temp>=30 && d.temp<50) {
				mc = 'orange';		   
		   } else if (d.temp>=50 && d.temp<70) {
				mc = 'red';		   
		   } else if (d.temp>=70 && d.temp<90) {
				mc = 'darkred';		   
		   } else if (d.temp>=90 && d.temp<110) {
				mc = 'darkpurple';		   
		   } else if (d.temp>=110 && d.temp<130) {
				mc = 'purple';		   
		   }
		   if (d.rtmp==-9999) {var rtmp = "Road Temperature: No Observation";} else {var rtmp = 'Road Temperature: '+d.rtmp+' F';}
			if (d.relh==-9999) {var relh = "Relative Humidity: No Observation";} else {var relh = 'Relative Humidity: '+d.relh+'%';}
			if (d.wspd==-9999) {var wspd = "Wind Speed: No Observation";} else {var wspd = 'Wind Speed: '+d.wspd+' Knots';}
			if (d.wspd==-9999) {
				var icon = new L.AwesomeMarkers.icon({
				icon: 'ban',
				prefix: 'fa',
				markerColor: mc
				});
			} else if (d.wspd<1) {
				var icon = new L.AwesomeMarkers.icon({
				icon: 'dot-circle-o',
				prefix: 'fa',
				markerColor: mc
				});
			} else if (d.wspd>30) {
				var icon = new L.AwesomeMarkers.icon({
				icon: 'location-arrow',
				prefix: 'fa',
				iconColor: 'red',
				rotate: d.wdir-225+360,
				markerColor: mc
				});
			} else {
				var icon = new L.AwesomeMarkers.icon({
				icon: 'location-arrow',
				prefix: 'fa',
				rotate: d.wdir-225+360,
				markerColor: mc		
				});
			}
			if (d.wgst==-9999) {var wgst = "Wind Gust: No Observation";} else {var wgst = 'Wind Gust: '+d.wgst+' Knots';}
			if (d.wdir==-9999) {var wdir = "Wind Direction: No Observation";} else {var wdir = 'Wind Direction: '+d.wdir+' Degrees';}
		   if (d.wdir==-9999) {var wdirnum = 0;} else {var wdirnum = d.wdir;}
			markerText[stn] = '<b>Station ID: '+stn+'</b><br />Station Location: '+lat+', '+lon+'<br />Station Elevation: '+elev+' feet<br />Observation Time: '+date+' UTC<br />'+temp+'<br />'+relh+'<br />'+wspd+'<br />'+wgst+'<br />'+wdir+'<br />'+rtmp+'<br />Mesowest Page: <a href="http://mesowest.utah.edu/cgi-bin/droman/meso_base.cgi?stn='+stn+'" target="_blank">'+stn+'</a>';
	  		newPoint = new L.Marker(pos,{
	  			title: stn,
	  			riseOnHover: true,
	  			icon: icon
	  		});
	  		newPoint.on('click', function(e){
	  			var t = e.target;
	  			runToggle(t);
	  		});
	  		newPoint.addTo(map);
	  		mapPoints.push(newPoint);
	  		ll = [lat,lon];  		
	  	});
	  	if (ll.length == 2){
  			map.setView(new L.LatLng(ll[0],ll[1]),6);
  		}
	  }

	  function runToggle(marker) {
	  		var ll = marker.getLatLng();
	  		var z = map.getZoom();
	  		if (z<10){
	  			map.setView(ll,10);
	  		} else {
	  			map.setView(ll,z);
	  		}
	  		var val = marker.options.title;
	  		if ( $( "#effect" ).is( ":hidden" ) ) {
	  			$( "#effect" ).html(markerText[val]);
	  			$( "#effect" ).show('slide', 500);
    			//$( "#effect" ).slideDown(500);
  			} 
  			else {
    			if (val!=toggleVal){
    				$( "#effect" ).hide('slide', 500,function () {
    				//$( "#effect" ).slideUp(500,function () {
    					$( "#effect" ).html(markerText[val]);
    					$( "#effect" ).show('slide', 500)
    					//$( "#effect" ).slideDown(500);
    				});
    			}
    			else {
    				map.setZoom(z);
					//$( "#effect" ).slideUp(500);
					$( "#effect" ).hide('slide', 500);
    			}
  			}
  			toggleVal = val;
	  }
	
	  function barChart() {
	    if (!barChart.id) barChart.id = 0;
	
	    var margin = {top: 10, right: 10, bottom: 20, left: 10},
	        x,
	        y,// = d3.scale.linear().range([250, 0]),
	        id = barChart.id++,
	        axis = d3.svg.axis().orient("bottom"),
	        yaxis = d3.svg.axis().orient("left"),
	        brush = d3.svg.brush(),
	        brushDirty,
	        dimension,
	        group,
	        round;
	
	    function chart(div) {
	      var width = x.range()[1],
	          height = y.range()[0];
	
	      //y.domain([0, group.top(1)[0].value]);
	
	      div.each(function() {
	        var div = d3.select(this),
	            g = div.select("g");
	
	        // Create the skeletal chart.
	        if (g.empty()) {
				 var did = div.attr('id');
				
	          div.select(".title").append("b")
	          	  .text(' '+minMax(dimension.top(dimension.groupAll().value()),did)[0]+'-'+minMax(dimension.top(dimension.groupAll().value()),did)[1]);	        	
	        	
	          div.select(".title").append("a")
	              .attr("href", "javascript:reset(" + id + ")")
	              .attr("class", "reset")
	              .text("reset")
	              .style("display", "none");
	
	          g = div.append("svg")
	              .attr("width", width + margin.left + margin.right)
	              .attr("height", height + margin.top + margin.bottom)
	            .append("g")
	              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	          g.append("clipPath")
	              .attr("id", "clip-" + id)
	            .append("rect")
	              .attr("width", width)
	              .attr("height", height);
	
	          g.selectAll(".bar")
	              .data(["background", "foreground"])
	            .enter().append("path")
	              .attr("class", function(d) { return d + " bar"; })
	              .datum(group.all());
	
	          g.selectAll(".foreground.bar")
	              .attr("clip-path", "url(#clip-" + id + ")");
	
	          g.append("g")
	              .attr("class", "axis")
	              .attr("transform", "translate(0," + height + ")")
	              .call(axis);
	              
	          g.append("g")
	          	  .attr("class","axis")
	          	  .attr("transform", "translate(" + width + ",0)")
	          	  .call(yaxis)
	
	          // Initialize the brush component with pretty resize handles.
	          var gBrush = g.append("g").attr("class", "brush").call(brush);
	          gBrush.selectAll("rect").attr("height", height);
	          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
	        }
	
	        // Only redraw the brush if set externally.
	        if (brushDirty) {
	          brushDirty = false;
	          g.selectAll(".brush").call(brush);
	          div.select(".title a").style("display", brush.empty() ? "none" : null);
	          var did = div.attr('id');
	          div.select(".title b").text(' '+minMax(dimension.top(dimension.groupAll().value()),did)[0]+'-'+minMax(dimension.top(dimension.groupAll().value()),did)[1]);
	          if (brush.empty()) {
	            g.selectAll("#clip-" + id + " rect")
	                .attr("x", 0)
	                .attr("width", width);
	          } else {
	            var extent = brush.extent();
	            g.selectAll("#clip-" + id + " rect")
	                .attr("x", x(extent[0]))
	                .attr("width", x(extent[1]) - x(extent[0]));
	          }
	        }
			  var did = div.attr('id');
	        div.select(".title b").text(' '+minMax(dimension.top(dimension.groupAll().value()),did)[0]+'-'+minMax(dimension.top(dimension.groupAll().value()),did)[1]);
	        g.selectAll(".bar").attr("d", barPath);
	      });
	
	      function barPath(groups) {
	        var path = [],
	            i = -1,
	            n = groups.length,
	            d;
	        while (++i < n) {
	          d = groups[i];
	          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
	        }
	        return path.join("");
	      }
	
	      function resizePath(d) {
	        var e = +(d == "e"),
	            x = e ? 1 : -1,
	            y = height / 3;
	        return "M" + (.5 * x) + "," + y
	            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
	            + "V" + (2 * y - 6)
	            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
	            + "Z"
	            + "M" + (2.5 * x) + "," + (y + 8)
	            + "V" + (2 * y - 8)
	            + "M" + (4.5 * x) + "," + (y + 8)
	            + "V" + (2 * y - 8);
	      }
	    }
	
	    brush.on("brushstart.chart", function() {
	      var div = d3.select(this.parentNode.parentNode.parentNode);
	      div.select(".title a").style("display", null);
	    });
	
	    brush.on("brush.chart", function() {
	      var g = d3.select(this.parentNode),
	          extent = brush.extent();
	      if (round) g.select(".brush")
	          .call(brush.extent(extent = extent.map(round)))
	        .selectAll(".resize")
	          .style("display", null);
	      g.select("#clip-" + id + " rect")
	          .attr("x", x(extent[0]))
	          .attr("width", x(extent[1]) - x(extent[0]));
	      dimension.filterRange(extent);
	    });
	
	    brush.on("brushend.chart", function() {
	      if (brush.empty()) {
	        var div = d3.select(this.parentNode.parentNode.parentNode);
	        var did = div.attr('id');
	        div.select(".title a").style("display", "none");
	        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
	        dimension.filterAll();
	        div.select(".title b").text(' '+minMax(dimension.top(dimension.groupAll().value()),did)[0]+'-'+minMax(dimension.top(dimension.groupAll().value()),did)[1]);
	      }
	    });
	
	    chart.margin = function(_) {
	      if (!arguments.length) return margin;
	      margin = _;
	      return chart;
	    };
	
	    chart.x = function(_) {
	      if (!arguments.length) return x;
	      x = _;
	      axis.scale(x);
	      brush.x(x);
	      return chart;
	    };
	
	    chart.y = function(_) {
	      if (!arguments.length) return y;
	      y = _;
	      yaxis.scale(y);
	      return chart;
	    };
	
	    chart.dimension = function(_) {
	      if (!arguments.length) return dimension;
	      dimension = _;
	      return chart;
	    };
	
	    chart.filter = function(_) {
	      if (_) {
	        brush.extent(_);
	        dimension.filterRange(_);
	      } else {
	        brush.clear();
	        dimension.filterAll();
	      }
	      brushDirty = true;
	      return chart;
	    };
	
	    chart.group = function(_) {
	      if (!arguments.length) return group;
	      group = _;
	      return chart;
	    };
	
	    chart.round = function(_) {
	      if (!arguments.length) return round;
	      round = _;
	      return chart;
	    };
	
	    return d3.rebind(chart, brush, "on");
	  }
}});
}
