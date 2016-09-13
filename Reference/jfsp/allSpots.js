var mapPoints = [];
var d;
var spot;
var map;
var chart;
var zoom;

$(document).ready(function() {
    $("#map").css({
        height: 750,
        width: 1000,
    });

    var myLatLng = new google.maps.LatLng(39.828175,-95);

    var myOptions = {
        zoom: 5,
        center: myLatLng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map($('#map')[0], myOptions);
    zoom = map.getZoom();
    
    google.maps.event.addListener(map,'zoom_changed',function () {
    	if (zoom>=9){
    		if (map.getZoom() <= 8) smallMarkers();
    		zoom = map.getZoom();
    	} else if (zoom <= 8) {
    		if (map.getZoom() >= 9) bigMarkers();
    		zoom = map.getZoom();
    	}
    });
    
    var WFO = 'SLC';
    d3.select('#selected').text(WFO);
    reLoad(WFO);
    
    $("#WFO").menu();
    $("#WFO").css({
        width: '300',
        position: 'relative',
        'z-index': '1',
        border: '3px solid #000'
    });
    $("#WFO").on("menuselect", function(event,ui){
        var WFO = ui.item.attr("id");
        d3.select('#selected').text(WFO);
        d3.selectAll('g').remove()
    	  d3.selectAll('svg').remove()
        reLoad(WFO);
    });
});

function smallMarkers() {
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
}

function reLoad(site) {
if(site==null){return false;}
// (It's CSV, but GitHub Pages only gzip's JSON at the moment.)
d = d3.csv("./source/spots-v4_"+site+"_ALL.csv", function(error, spots) {
  // Various formatters.
  var formatNumber = d3.format(",d"),
      formatPerc = d3.format(".2%"),
      formatChange = d3.format("+,d"),
      formatDate = d3.time.format("%B, %Y"),
      formatTime = d3.time.format("%B %d"),
      formatDatePlus = d3.time.format("%B %d, %Y"),
      formatDateDir = d3.time.format("%Y%m%d"),
      formatDiff = d3.format(".2f");

  // A nest operator, for grouping the spot dist.
  var nestByDist = d3.nest()
      .key(function(d) { return formatNumber(d.dist); });

  var nestByDate = d3.nest()
      .key(function(d) { return d3.time.month(d.date); });
      
  // A little coercion, since the CSV is untyped.
  spots.forEach(function(d, i) {
    d.index = i;
    d.date = parseDate(d.date);
    d.file = d.file;
    d.leadtime = +d.leadtime;
    d.reqtype = d.reqtype;
    d.latitude = +d.lat;
    d.longitude = +d.lon;
  });
  
  // Create the crossfilter for the relevant dimensions and groups.
  spot = crossfilter(spots),
      all = spot.groupAll(),
      date = spot.dimension(function(d) { return d.date; }),
      dates = date.group(d3.time.month),
      leadtime = spot.dimension(function(d) { return d.leadtime; }),
      leadtimes = leadtime.group(function(d) {return Math.floor(d/20) * 20;}),
      leadarr = leadtime.top(110000);
  
  var datsize = spot.size();

  var charts = [
  
	barChart()
        .dimension(leadtime)
        .group(leadtimes)
        .round(function(d) {return Math.floor(d/20) * 20;})
      .x(d3.scale.linear()
        .domain([0, 1800])
        .rangeRound([0, 900]))
      .y(d3.scale.linear()
        .domain([0,Math.max(datsize,10)])
        .rangeRound([250,0])),

    barChart()
        .dimension(date)
        .group(dates)
        .round(d3.time.month.round)
      .x(d3.time.scale()
        .domain([new Date(2009, 1), new Date(2013, 8)])
        .rangeRound([0, 900]))
        .filter([new Date(2009, 1), new Date(2013, 8)])
      .y(d3.scale.linear()
         .domain([0,Math.max(Math.floor(datsize/5),10)])
         .rangeRound([250,0]))  
  ]
  
  // Given our array of charts, which we assume are in the same order as the
  // .chart elements in the DOM, bind the charts to the DOM and render them.
  // We also listen to the chart's brush events to update the display.
  chart = d3.selectAll(".chart")
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
  
  // Whenever the brush moves, re-rendering everything.
  function renderAll() {
  	 leadarr = leadtime.top(110000);
    chart.each(render);
    d3.select("#active").text(formatNumber(all.value()));
    mapPlot(leadarr);
  }
  
  // Like d3.time.format, but faster.
  function parseDate(d) {
    return new Date(20 + d.substring(0, 2),
        d.substring(2, 4) - 1,
        d.substring(4, 6),
        d.substring(6, 8),
        d.substring(8,10));
  }

  window.filter = function(filters) {
    filters.forEach(function(d, i) { charts[i].filter(d); });
    renderAll();
  };

  window.reset = function(i) {
    charts[i].filter(null);
    renderAll();
  };
  
  function mapPlot(array) {
  	if (mapPoints.length>0){
  		for (var i = 0; i < mapPoints.length; i++){
  			mapPoints[i].setMap();
  		}
  	}
   mapPoints = [];
   map.setZoom(6);
   var ll = [];
  	array.forEach(function(d){
  		var lat = d.latitude;
  		var lon = d.longitude;
  		var fire = d.file;
  		var date = formatDatePlus(d.date);
  		var dir = d.file.slice(8,16);
		var leadtime = d.leadtime;
		var req = d.reqtype;
		var icon = './source/fire-small.png';
		if (req=='SAR' || req=='SEARCH AND RESCUE') {
			icon = './source/sar-small.png';
		}
		else if (req=='HAZMAT') {
			icon = './source/hazmat-small.png';
		}
	   else if (req=='PRESCRIBED') {
			icon = './source/prfire-small.png';	   
	   }
		var contentString = '<div id="content"><b>'+fire+'</b><br />'+date+'<br />Forecast Leadtime: '+leadtime+' minutes<br />Request Type: '+req+'</a><br /><a href="./jfsp/'+dir+'/'+fire+'.txt" target="_blank">Forecast</a></div>';
  		var infowindow = new google.maps.InfoWindow({
  			content: contentString
  		});
  		var newPoint = new google.maps.Marker({
  			position: new google.maps.LatLng(lat,lon),
  			map: map,
			icon: icon
  		});
  		google.maps.event.addListener(newPoint, 'click', function(){
  			infowindow.open(map,newPoint);
  		});
  		mapPoints.push(newPoint);
  		ll = [lat,lon];
  	});
  	if (ll.length == 2){
  		map.setCenter(new google.maps.LatLng(ll[0],ll[1]));
  	}
  	//alert(mapPoints.length);
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
        div.select(".title a").style("display", "none");
        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
        dimension.filterAll();
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
});
}