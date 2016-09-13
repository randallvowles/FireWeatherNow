var mapPoints = [];
var d;
var spot;
var map;
var chart;
var zoom;
var spots;

$(document).ready(function() {

	 $("#spot").accordion({
	 	collapsible: true
	 });
	 $("#ndfd").accordion({
	 	active: false,
	 	collapsible: true
	 });
	 $("#insitu").accordion({
	 	active: false,
	 	collapsible: true
	 });
	 $("#rtma").accordion({
	 	active: false,
	 	collapsible: true
	 });
	 $("#spotobs").accordion({
	 	active: false,
	 	collapsible: true
	 });
	 $("#spotrtma").accordion({
	 	active: false,
	 	collapsible: true
	 });
	 $("#ndfdobs").accordion({
	 	active: false,
	 	collapsible: true
	 });
	 $("#ndfdspot").accordion({
	 	active: false,
	 	collapsible: true
	 });
	 $("#other").accordion({
	 	active: false,
	 	collapsible: true
	 });

    var myLatLng = new google.maps.LatLng(39.828175,-95);

    var myOptions = {
        zoom: 5,
        center: myLatLng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    
    var formatDateDir = d3.time.format("%Y%m%d");
    
	 //var start = new Date();
	 //start.setDate(start.getDate()-1);
	 var start = new Date(2013, 10, 21);
	 var startstr = formatDateDir(start);
	 
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
    
    var WFO = startstr;
    d3.select('#selected').text(startstr);
    reLoad(WFO);
    
    $("#datepicker").datepicker({ 
    	minDate: new Date(2009, 3, 1), 
    	maxDate: start,
    	dateFormat: 'yymmdd',
    	defaultDate: start,
    	onSelect: function(date) {
    		WFO = date;
    	   d3.select('#selected').text(WFO);
         d3.selectAll('g').remove();
    	   d3.selectAll('svg').remove();
         reLoad(WFO);
    	}
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
d = d3.csv("./jfsp/"+site+"/daily_spots_wind.csv", function(error, spots) {
  if (spots.length<1) {
  	alert('No Analyzed Forecasts!');
  	return false;
  }
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
    d.elev = +d.elev;
    d.distance = +d.distance;
    d.leadtime = +d.leadtime;
    d.spott = +d.spotwmax;
    d.spotrh = +d.spotwmin;
    d.obst = +d.obwmax;
    d.obsrh = +d.obwmin;
    d.ndfdt = +d.ndfdwmax;
    d.ndfdrh = +d.ndfdwmin;
    d.rtmat = +d.rtmawmax;
    d.rtmarh = +d.rtmawmin;
    d.ndfdwmxmn = +d.ndfdwmaxmean;
    d.ndfdwmnmn = +d.ndfdwminmean;
    d.rtmawmxmn = +d.rtmawmaxmean;
    d.rtmawmnmn = +d.rtmawminmean;
    d.ndfdwmxsd = +d.ndfdwmaxstd;
    d.ndfdwmnsd = +d.ndfdwminstd;
    d.rtmawmxsd = +d.rtmawmaxstd;
    d.rtmawmnsd = +d.rtmawminstd;
    d.spotterr = +d.spotwmaxerr;
    d.spotrherr = +d.spotwminerr;
    d.rtmaterr = +d.rtmawmaxerr;
    d.rtmarherr = +d.rtmawminerr;
    d.ndfdterr = +d.ndfdwmaxerr;
    d.ndfdrherr = +d.ndfdwminerr;
    d.ndfdspott = +d.ndfdspotwmax;
    d.ndfdspotrh = +d.ndfdspotwmin;
    d.latitude = +d.lat;
    d.longitude = +d.lon;
    d.stn = d.stnused;
  });

  // Create the crossfilter for the relevant dimensions and groups.
  spot = crossfilter(spots),
      all = spot.groupAll(),
      date = spot.dimension(function(d) { return d.date; }),
      dates = date.group(d3.time.month),
      elev = spot.dimension(function(d) { return d.elev; }),
      elevs = elev.group(function(d) {return Math.floor(d/30) * 30;}),
//      delay = spot.dimension(function(d) { return Math.max(-60, Math.min(149, d.delay)); }),
//      delays = delay.group(function(d) { return Math.floor(d / 10) * 10; }),
      distance = spot.dimension(function(d) { return d.distance; }),
      distances = distance.group(function(d) {return Math.floor(d/2) * 2;}),
      leadtime = spot.dimension(function(d) { return d.leadtime; }),
      leadtimes = leadtime.group(function(d) {return Math.floor(d/50) * 50;}),
      spott = spot.dimension(function(d) { return d.spott; }),
      spotts = spott.group(function(d) {return Math.floor(d/1) * 1;}),
    	spotrh = spot.dimension(function(d) { return d.spotrh; }),
      spotrhs = spotrh.group(function(d) {return Math.floor(d/1) * 1;}),
    	obst = spot.dimension(function(d) { return d.obst; }),
      obsts = obst.group(function(d) {return Math.floor(d/1) * 1;}),
    	obsrh = spot.dimension(function(d) { return d.obsrh; }),
      obsrhs = obsrh.group(function(d) {return Math.floor(d/1) * 1;}),
    	ndfdt = spot.dimension(function(d) { return d.ndfdt; }),
     	ndfdts = ndfdt.group(function(d) {return Math.floor(d/1) * 1;}),
    	ndfdrh = spot.dimension(function(d) { return d.ndfdrh; }),
      ndfdrhs = ndfdrh.group(function(d) {return Math.floor(d/1) * 1;}),
    	rtmat = spot.dimension(function(d) { return d.rtmat; }),
     	rtmats = rtmat.group(function(d) {return Math.floor(d/1) * 1;}),
    	rtmarh = spot.dimension(function(d) { return d.rtmarh; }),
      rtmarhs = rtmarh.group(function(d) {return Math.floor(d/1) * 1;}),
      spotterr = spot.dimension(function(d) { return d.spotterr; }),
      spotterrs = spotterr.group(function(d) {return Math.floor(d/1) * 1;}),
      spotrherr = spot.dimension(function(d) { return d.spotrherr; }),
      spotrherrs = spotrherr.group(function(d) {return Math.floor(d/1) * 1;}),
      ndfdterr = spot.dimension(function(d) { return d.ndfdterr; }),
      ndfdterrs = ndfdterr.group(function(d) {return Math.floor(d/1) * 1;}),
      ndfdrherr = spot.dimension(function(d) { return d.ndfdrherr; }),
      ndfdrherrs = ndfdrherr.group(function(d) {return Math.floor(d/1) * 1;}),
      rtmaterr = spot.dimension(function(d) { return d.rtmaterr; }),
      rtmaterrs = rtmaterr.group(function(d) {return Math.floor(d/1) * 1;}),
      rtmarherr = spot.dimension(function(d) { return d.rtmarherr; }),
      rtmarherrs = rtmarherr.group(function(d) {return Math.floor(d/1) * 1;}),
      ndfdspott = spot.dimension(function(d) { return d.ndfdspott; }),
      ndfdspotts = ndfdspott.group(Math.floor),
      ndfdspotrh = spot.dimension(function(d) { return d.ndfdspotrh; }),
      ndfdspotrhs = ndfdspotrh.group(function(d) {return Math.floor(d/2) * 1;}),
      rharr = spotrh.top(spot.size());
  
  var datsize = spot.size();

  var charts = [
  
   barChart()
        .dimension(spott)
        .group(spotts)
        .round(function(d) {return Math.floor(d/1) * 1;})
      .x(d3.scale.linear()
        .domain([0, 40])
        .rangeRound([0, 430]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(spotrh)
        .group(spotrhs)
        .round(function(d) {return Math.floor(d/1) * 1;})
      .x(d3.scale.linear()
        .domain([0, 40])
        .rangeRound([0, 430]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(ndfdt)
        .group(ndfdts)
        .round(function(d) {return Math.floor(d/1) * 1;})
      .x(d3.scale.linear()
        .domain([0, 40])
        .rangeRound([0, 430]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(ndfdrh)
        .group(ndfdrhs)
        .round(function(d) {return Math.floor(d/1) * 1;})
      .x(d3.scale.linear()
        .domain([0, 40])
        .rangeRound([0, 430]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(obst)
        .group(obsts)
        .round(function(d) {return Math.floor(d/1) * 1;})
      .x(d3.scale.linear()
        .domain([0, 40])
        .rangeRound([0, 430]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(obsrh)
        .group(obsrhs)
        .round(function(d) {return Math.floor(d/1) * 1;})
      .x(d3.scale.linear()
        .domain([0, 40])
        .rangeRound([0, 430]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(rtmat)
        .group(rtmats)
        .round(function(d) {return Math.floor(d/1) * 1;})
      .x(d3.scale.linear()
        .domain([0, 40])
        .rangeRound([0, 430]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(rtmarh)
        .group(rtmarhs)
        .round(function(d) {return Math.floor(d/1) * 1;})
      .x(d3.scale.linear()
        .domain([0, 40])
        .rangeRound([0, 430]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),15)])
        .rangeRound([250,0])),
  
  	barChart()
        .dimension(spotterr)
        .group(spotterrs)
        .round(function(d) {return Math.floor(d/1) * 1;})
      .x(d3.scale.linear()
        .domain([-20, 20])
        .rangeRound([0, 430]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(spotrherr)
        .group(spotrherrs)
        .round(function(d) {return Math.floor(d/1) * 1;})
      .x(d3.scale.linear()
        .domain([-20, 20])
        .rangeRound([0, 430]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(rtmaterr)
        .group(rtmaterrs)
        .round(function(d) {return Math.floor(d/1) * 1;})
      .x(d3.scale.linear()
        .domain([-20, 20])
        .rangeRound([0, 430]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(rtmarherr)
        .group(rtmarherrs)
        .round(function(d) {return Math.floor(d/1) * 1;})
      .x(d3.scale.linear()
        .domain([-20, 20])
        .rangeRound([0, 430]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(ndfdterr)
        .group(ndfdterrs)
        .round(function(d) {return Math.floor(d/1) * 1;})
      .x(d3.scale.linear()
        .domain([-20, 20])
        .rangeRound([0, 430]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(ndfdrherr)
        .group(ndfdrherrs)
        .round(function(d) {return Math.floor(d/1) * 1;})
      .x(d3.scale.linear()
        .domain([-20, 20])
        .rangeRound([0, 430]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),15)])
        .rangeRound([250,0])),
        
    barChart()
        .dimension(ndfdspott)
        .group(ndfdspotts)
        .round(Math.floor)
      .x(d3.scale.linear()
        .domain([-20, 20])
        .rangeRound([0, 430]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),15)])
        .rangeRound([250,0])),
        
    barChart()
        .dimension(ndfdspotrh)
        .group(ndfdspotrhs)
        .round(function(d) {return Math.floor(d/1) * 1;})
      .x(d3.scale.linear()
        .domain([-20, 20])
        .rangeRound([0, 430]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),15)])
        .rangeRound([250,0])),

    barChart()
        .dimension(elev)
        .group(elevs)
        .round(function(d) {return Math.floor(d/30) * 30;})
      .x(d3.scale.linear()
        .domain([-350, 350])
        .rangeRound([0, 280]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),10)])
        .rangeRound([250,0])),

    barChart()
        .dimension(distance)
        .group(distances)
        .round(function(d) {return Math.floor(d/2) * 2;})
      .x(d3.scale.linear()
        .domain([0, 50])
        .rangeRound([0, 280]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/2),10)])
        .rangeRound([250,0])),
        
    barChart()
        .dimension(leadtime)
        .group(leadtimes)
        .round(function(d) {return Math.floor(d/50) * 50;})
      .x(d3.scale.linear()
        .domain([0, 1000])
        .rangeRound([0, 280]))
      .y(d3.scale.linear()
        .domain([0,Math.max(Math.floor(datsize/1),10)])
        .rangeRound([250,0]))
  ];

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
  
//  function pause(milliseconds) {
//	 var dt = new Date();
//	 while ((new Date()) - dt <= milliseconds) { /* Do nothing */ }
//  }

  // Whenever the brush moves, re-rendering everything.
  function renderAll() {
    chart.each(render);
	 rharr = spotrh.top(spot.size());
    d3.select("#active").text(formatNumber(all.value()));
	 mapPlot(rharr);
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
  			mapPoints[i].setMap();
  		}
  	}
   mapPoints = [];
   //map.setZoom(6);
   var bounds = new google.maps.LatLngBounds();
  	array.forEach(function(d){
  		var lat = d.latitude;
  		var lon = d.longitude;
  		var ll = new google.maps.LatLng(lat,lon);
  		bounds.extend(ll);
  		var fire = d.file;
  		var date = formatDatePlus(d.date);
  		var dir = d.file.slice(8,16);
		var elev = d.elev;
		var distance = d.distance;
		var leadtime = d.leadtime;
		var stn = d.stn;
		var spobst = d.spott;
		var rtobst = d.ndfdt;
		var ndobst = d.obst;
		var ndpott = d.rtmat;
		var spobsr = d.spotrh;
		var rtobsr = d.ndfdrh;
		var ndobsr = d.obsrh;
		var ndpotr = d.rtmarh;
		var ndfdwmxmn = d.ndfdwmxmn;
    	var ndfdwmnmn = d.ndfdwmnmn;
    	var rtmawmxmn = d.rtmawmxmn;
    	var rtmawmnmn = d.rtmawmnmn;
    	var ndfdwmxsd = d.ndfdwmxsd;
    	var ndfdwmnsd = d.ndfdwmnsd;
    	var rtmawmxsd = d.rtmawmxsd;
    	var rtmawmnsd = d.rtmawmnsd;
		if ((Math.abs(spobst-ndobst)>5)||(Math.abs(spobsr-ndobsr)>5)) {var icon = './source/badfire-small.png';} else {var icon = './source/prfire-small.png';}
		var contentString = '<div id="content"><b>'+fire+'</b><br />'+date+'<br />Elevation Difference: '+elev+' meters<br />Horizontal Distance: '+distance+' kilometers<br />Forecast Leadtime: '+leadtime+' minutes<br />Spot Forecast Max Wind Speed: '+formatDiff(spobst)+' mph<br />NDFD Forecast Max Wind Speed: '+formatDiff(rtobst)+' mph<br />NDFD Forecast Max Wind Speed Mean: '+formatDiff(ndfdwmxmn)+' mph<br />NDFD Forecast Max Wind Speed Standard Deviation: '+formatDiff(ndfdwmxsd)+' mph<br />Observed Max Wind Speed: '+formatDiff(ndobst)+' mph<br />RTMA Max Wind Speed: '+formatDiff(ndpott)+' mph<br />RTMA Max Wind Speed Mean: '+formatDiff(rtmawmxmn)+' mph<br />RTMA Max Wind Speed Standard Deviation: '+formatDiff(rtmawmxsd)+' mph<br />Spot Forecast Min Wind Speed: '+formatDiff(spobsr)+' mph<br />NDFD Forecast Min Wind Speed: '+formatDiff(rtobsr)+' mph<br />NDFD Forecast Min Wind Speed Mean: '+formatDiff(ndfdwmnmn)+' mph<br />NDFD Forecast Min Wind Speed Standard Deviation: '+formatDiff(ndfdwmnsd)+' mph<br />Observed Min Wind Speed: '+formatDiff(ndobsr)+' mph<br />RTMA Min Wind Speed: '+formatDiff(ndpotr)+' mph<br />RTMA Min Wind Speed Mean: '+formatDiff(rtmawmnmn)+' mph<br />RTMA Min Wind Speed Standard Deviation: '+formatDiff(rtmawmnsd)+' mph<br />Station Used: <a href="http://mesowest.utah.edu/cgi-bin/droman/meso_base.cgi?product=&past=1&stn='+stn+'&unit=0&time=LOCAL&day1='+dir.slice(6,8)+'&month1='+dir.slice(4,6)+'&year1='+dir.slice(0,4)+'&hour1=24" target="_blank">'+stn+'</a><br /><a href="./jfsp/'+dir+'/'+fire+'.txt" target="_blank">Forecast</a></div>';
  		var infowindow = new google.maps.InfoWindow({
  			content: contentString
  		});
  		var newPoint = new google.maps.Marker({
  			position: ll,
  			map: map,
			icon: icon
  		});
  		google.maps.event.addListener(newPoint, 'click', function(){
  			infowindow.open(map,newPoint);
  		});
  		mapPoints.push(newPoint);
  	});
  	if (bounds && mapPoints.length>3){
  		map.fitBounds(bounds);
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
