var mapPoints = [];
var mapLayer;
var d;
var spot;
var map;
var chart;
var zoom;
var spots;
var newPoint;
var popupText = [];
var metric=false;
var scale;
var pressed;

$(document).ready(function() {
	
	$( "#radio" ).buttonset();

	 $( "#gcontainer" ).hide();
	 
	 $( "#close").click(function () {
	 	$( "#gcontainer").hide('scale', { percent: 0 }, 500);
	 });
	 
	 $("#accordion").accordion({
	 	collapsible: true
	 });

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

    var myLatLng = new L.LatLng(39.828175,-95);
    
    var mapQuest = L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
          attribution: 'Data, imagery and map information provided by <a href="http://www.mapquest.com/" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a>'
    });

    var myOptions = {
        zoom: 5,
        center: myLatLng,
        layers: [mapQuest]
    };
    
    var formatDateDir = d3.time.format("%Y%m%d");
    
    var start = new Date();
    start.setDate(start.getDate()-1);
    var startstr = formatDateDir(start);
	 
    map = new L.map($('#map')[0], myOptions);
    zoom = map.getZoom();
    
    map.on('zoomend',function () {
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
    
    $( "input[type=radio]" ).click(function (e) {
	if (e.target.id=='radio1' && metric) {
		return;
	} else if (e.target.id=='radio2' && !metric) {
		return;
	}
    	if ($('#radio1').is(':checked')) {
	    	metric = true;
	} else if ($('#radio2').is(':checked')) {
	    	metric = false;
	}
	d3.select('#selected').text(WFO);
     d3.selectAll('g').remove();
    	d3.selectAll('svg').remove();
	$( "#gcontainer" ).hide();
    	$( "#pdetails" ).html('');
  	$( "#ptemp" ).html('');
  	$( "#prh" ).html('');
  	$( "#pwind" ).html('');
	reLoad(WFO);
    });
    
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
    	   $( "#gcontainer" ).hide();
    	   $( "#pdetails" ).html('');
  	   $( "#ptemp" ).html('');
  	   $( "#prh" ).html('');
  	   $( "#pwind" ).html('');
        reLoad(WFO);
    	}
    });
});

function smallMarkers() {
	var url;
	var icon;
	if (mapPoints.length>0){
		for (var i = 0; i < mapPoints.length; i++){
  			url = mapPoints[i].options.icon.options.iconUrl;
  			icon = new L.Icon({iconUrl: url.slice(0,-4)+'-small.png'});
  			if (icon.options.iconUrl.slice(-16,-4)=='-small-small') {
				icon.options.iconUrl = icon.options.iconUrl.slice(0,-10)+'.png';  			
  			}
  			mapPoints[i].setIcon(icon);
  		}
	}
}

function bigMarkers() {
	var url;
	var icon;
	if (mapPoints.length>0){
		for (var i = 0; i < mapPoints.length; i++){
  			url = mapPoints[i].options.icon.options.iconUrl;
  			icon = new L.Icon({iconUrl: url.slice(0,-10)+'.png'});
  			mapPoints[i].setIcon(icon);
  		}
	}
}

function units(value,wind) {
	if(metric){
		return value;
	} else {
		if (wind==0) {
			return  value*2.23693629; //mps to mph
		} else if (wind==1) {
			return value*1.8+32; //C to F
		} else if (wind==2) {
			return value*3.2808399; //meters to feet
		} else if (wind==3) {
			return value*0.62137119;	//km to miles
		}
	}
}

function reLoad(site) {
	
if(site==null){return false;}

if ($('#radio1').is(':checked')) {
    	metric = true;
} else if ($('#radio2').is(':checked')) {
    	metric = false;
}

// (It's CSV, but GitHub Pages only gzip's JSON at the moment.)
d = d3.csv("./jfsp/"+site+"/daily_spots.csv", function(error, spots) {
  if (spots.length<1) {
  	alert('No Analyzed Forecasts!');
  	return false;
  }
  // Various formatters.
  var formatNumber = d3.format(".0f"),
      formatPerc = d3.format(".2%"),
      formatChange = d3.format("+,d"),
      formatDate = d3.time.format("%B, %Y"),
      formatTime = d3.time.format("%B %d"),
      formatDatePlus = d3.time.format("%B %d, %Y"),
      formatDateDir = d3.time.format("%Y%m%d"),
      formatDiff = d3.format(".1f");

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
    if(d.elev){d.elev = units(+d.elev,2);}else{d.elev=9999;}
    if(d.distance){d.distance = units(+d.distance,3);}else{d.distance=-9999;}
    d.leadtime = +d.leadtime;
    d.spott = d3.round(units(+d.spott,1),1);
    d.spotrh = Math.floor(+d.spotrh);
    if(d.obt){d.obst = d3.round(units(+d.obt,1),1);}else{d.obst=-9999;}
    if(d.obrh){d.obsrh = Math.floor(+d.obrh);}else{d.obsrh=-9999;}
    if(d.ndfdt){d.ndfdt = d3.round(units(+d.ndfdt,1),1);}else{d.ndfdt=-9999;}
    if(d.ndfdrh){d.ndfdrh = Math.floor(+d.ndfdrh);}else{d.ndfdrh=-9999;}
    if(d.rtmat){d.rtmat = d3.round(units(+d.rtmat,1),1);}else{d.rtmat=-9999}
    if(d.rtmarh){d.rtmarh = Math.floor(+d.rtmarh);}else{d.rtmarh=-9999;}
    d.spotws = d3.round(units(+d.spotwmax,0),1);
    if(d.obwmax){d.obsws = d3.round(units(+d.obwmax,0),1)}else{d.obsws=-9999;}
    if(d.ndfdwmax){d.ndfdws = d3.round(units(+d.ndfdwmax,0),1);}else{d.ndfdws=-9999;}
    if(d.rtmawmax){d.rtmaws = d3.round(units(+d.rtmawmax,0),1);}else{d.rtmaws=-9999}
    if(d.obwmax){d.spotwserr = d.spotws-d.obsws;}else{d.spotwserr=-9999;}
    if(d.rtmawmax){d.rtmawserr = d.spotws-d.rtmaws;}else{d.rtmawserr=-9999;}
    if(d.ndfdwmax && d.obwmax){d.ndfdwserr = d.ndfdws-d.obsws;}else{d.ndfdwserr=-9999;}
    if(d.ndfdwmax){d.ndfdspotws = d.ndfdws-d.spotws;}else{d.ndfdspotws=-9999;}
    if(d.obst){d.spotterr = d.spott-d.obst;}else{d.spotterr=-9999;}
    if(d.spotrherr){d.spotrherr = +d.spotrherr;}else{d.spotrherr=-9999;}
    if(d.rtmat){d.rtmaterr = d.spott-d.rtmat;}else{d.rtmaterr=-9999;}
    if(d.rtmarherr){d.rtmarherr = +d.rtmarherr;}else{d.rtmarherr=-9999;}
    if(d.ndfdt && d.obst){d.ndfdterr = d.ndfdt-d.obst;}else{d.ndfdterr=-9999;}
    if(d.ndfdrherr){d.ndfdrherr = +d.ndfdrherr;}else{d.ndfdrherr=-9999;}
    if(d.ndfdt){d.ndfdspott = d.ndfdt-d.spott;}else{d.ndfdspott=-9999;}
    if(d.ndfdspotrh){d.ndfdspotrh = +d.ndfdspotrh;}else{d.ndfdspotrh=-9999}
    d.latitude = +d.lat;
    d.longitude = +d.lon;
    if(d.stnused){d.stn = d.stnused;}else{d.stn='';}
  });
  
  if (metric) {
  	scale = [2,4,30,2];
  } else {
  	scale = [4,8,100,2];
  }

  // Create the crossfilter for the relevant dimensions and groups.
  spot = crossfilter(spots),
      all = spot.groupAll(),
      date = spot.dimension(function(d) { return d.date; }),
      dates = date.group(d3.time.month),
      elev = spot.dimension(function(d) { return -d.elev; }),
      elevs = elev.group(function(d) {return Math.floor(d/scale[2]) * scale[2];}),
      distance = spot.dimension(function(d) { return d.distance; }),
      distances = distance.group(function(d) {return Math.floor(d/scale[3]) * scale[3];}),
      leadtime = spot.dimension(function(d) { return d.leadtime; }),
      leadtimes = leadtime.group(function(d) {return Math.floor(d/50) * 50;}),
      spott = spot.dimension(function(d) { return d.spott; }),
      spotts = spott.group(function(d) {return Math.floor(d/scale[1]) * scale[1];}),
      spotws = spot.dimension(function(d) { return d.spotws; }),
      spotwss = spotws.group(function(d) {return Math.floor(d/scale[0]) * scale[0];}),
    	 spotrh = spot.dimension(function(d) { return d.spotrh; }),
      spotrhs = spotrh.group(function(d) {return Math.floor(d/10) * 10;}),
    	 obst = spot.dimension(function(d) { return d.obst; }),
      obsts = obst.group(function(d) {return Math.floor(d/scale[1]) * scale[1];}),
      obsws = spot.dimension(function(d) { return d.obsws; }),
      obswss = obsws.group(function(d) {return Math.floor(d/scale[0]) * scale[0];}),
    	 obsrh = spot.dimension(function(d) { return d.obsrh; }),
      obsrhs = obsrh.group(function(d) {return Math.floor(d/10) * 10;}),
    	 ndfdt = spot.dimension(function(d) { return d.ndfdt; }),
      ndfdts = ndfdt.group(function(d) {return Math.floor(d/scale[1]) * scale[1];}),
      ndfdws = spot.dimension(function(d) { return d.ndfdws; }),
      ndfdwss = ndfdws.group(function(d) {return Math.floor(d/scale[0]) * scale[0];}),
    	 ndfdrh = spot.dimension(function(d) { return d.ndfdrh; }),
      ndfdrhs = ndfdrh.group(function(d) {return Math.floor(d/10) * 10;}),
    	 rtmat = spot.dimension(function(d) { return d.rtmat; }),
      rtmats = rtmat.group(function(d) {return Math.floor(d/scale[1]) * scale[1];}),
      rtmaws = spot.dimension(function(d) { return d.rtmaws; }),
      rtmawss = rtmaws.group(function(d) {return Math.floor(d/scale[0]) * scale[0];}),
    	 rtmarh = spot.dimension(function(d) { return d.rtmarh; }),
      rtmarhs = rtmarh.group(function(d) {return Math.floor(d/10) * 10;}),
      spotterr = spot.dimension(function(d) { return d.spotterr; }),
      spotterrs = spotterr.group(function(d) {return Math.floor(d/2) * 2;}),
	 spotwserr = spot.dimension(function(d) { return d.spotwserr; }),
      spotwserrs = spotwserr.group(function(d) {return Math.floor(d/2) * 2;}),
      spotrherr = spot.dimension(function(d) { return d.spotrherr; }),
      spotrherrs = spotrherr.group(function(d) {return Math.floor(d/4) * 4;}),
      ndfdterr = spot.dimension(function(d) { return d.ndfdterr; }),
      ndfdterrs = ndfdterr.group(function(d) {return Math.floor(d/2) * 2;}),
      ndfdwserr = spot.dimension(function(d) { return d.ndfdwserr; }),
      ndfdwserrs = ndfdwserr.group(function(d) {return Math.floor(d/2) * 2;}),
      ndfdrherr = spot.dimension(function(d) { return d.ndfdrherr; }),
      ndfdrherrs = ndfdrherr.group(function(d) {return Math.floor(d/4) * 4;}),
      rtmaterr = spot.dimension(function(d) { return d.rtmaterr; }),
      rtmaterrs = rtmaterr.group(function(d) {return Math.floor(d/2) * 2;}),
      rtmawserr = spot.dimension(function(d) { return d.rtmawserr; }),
      rtmawserrs = rtmawserr.group(function(d) {return Math.floor(d/2) * 2;}),
      rtmarherr = spot.dimension(function(d) { return d.rtmarherr; }),
      rtmarherrs = rtmarherr.group(function(d) {return Math.floor(d/4) * 4;}),
      ndfdspott = spot.dimension(function(d) { return d.ndfdspott; }),
      ndfdspotts = ndfdspott.group(function(d) {return Math.floor(d/2) * 2;}),
      ndfdspotws = spot.dimension(function(d) { return d.ndfdspotws; }),
      ndfdspotwss = ndfdspotws.group(function(d) {return Math.floor(d/2) * 2;}),
      ndfdspotrh = spot.dimension(function(d) { return d.ndfdspotrh; }),
      ndfdspotrhs = ndfdspotrh.group(function(d) {return Math.floor(d/4) * 4;}),
      rharr = leadtime.top(spot.size());
  
  var datsize = spot.size();

  var charts = [
  
   barChart()
        .dimension(spott)
        .group(spotts)
        .round(function(d) {return Math.floor(d/scale[0])*scale[0];})
      .x(d3.scale.linear()
        .domain([Math.floor(units(-20,1)), Math.floor(units(50,1))])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(spotts.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(spotrh)
        .group(spotrhs)
        .round(function(d) {return Math.floor(d/10) * 10;})
      .x(d3.scale.linear()
        .domain([0, 100])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(spotrhs.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(spotws)
        .group(spotwss)
        .round(function(d) {return Math.floor(d/scale[0]) * scale[0];})
      .x(d3.scale.linear()
        .domain([0, Math.floor(units(30,0))])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(spotwss.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(ndfdt)
        .group(ndfdts)
        .round(function(d) {return Math.floor(d/scale[0])*scale[0];})
      .x(d3.scale.linear()
        .domain([Math.floor(units(-20,1)), Math.floor(units(50,1))])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(ndfdts.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(ndfdrh)
        .group(ndfdrhs)
        .round(function(d) {return Math.floor(d/10) * 10;})
      .x(d3.scale.linear()
        .domain([0, 100])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(ndfdrhs.top(1)[0].value+10,15)])
        .rangeRound([250,0])),

   barChart()
        .dimension(ndfdws)
        .group(ndfdwss)
        .round(function(d) {return Math.floor(d/scale[0]) * scale[0];})
      .x(d3.scale.linear()
        .domain([0, Math.floor(units(30,0))])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(ndfdwss.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(obst)
        .group(obsts)
        .round(function(d) {return Math.floor(d/scale[0])*scale[0];})
      .x(d3.scale.linear()
        .domain([Math.floor(units(-20,1)), Math.floor(units(50,1))])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(obsts.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(obsrh)
        .group(obsrhs)
        .round(function(d) {return Math.floor(d/10) * 10;})
      .x(d3.scale.linear()
        .domain([0, 100])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(obsrhs.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(obsws)
        .group(obswss)
        .round(function(d) {return Math.floor(d/scale[0]) * scale[0];})
      .x(d3.scale.linear()
        .domain([0, Math.floor(units(30,0))])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(obswss.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(rtmat)
        .group(rtmats)
        .round(function(d) {return Math.floor(d/scale[0])*scale[0];})
      .x(d3.scale.linear()
        .domain([Math.floor(units(-20,1)), Math.floor(units(50,1))])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(rtmats.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(rtmarh)
        .group(rtmarhs)
        .round(function(d) {return Math.floor(d/10) * 10;})
      .x(d3.scale.linear()
        .domain([0, 100])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(rtmarhs.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(rtmaws)
        .group(rtmawss)
        .round(function(d) {return Math.floor(d/scale[0]) * scale[0];})
      .x(d3.scale.linear()
        .domain([0, Math.floor(units(30,0))])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(rtmawss.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
  
   barChart()
        .dimension(spotterr)
        .group(spotterrs)
        .round(function(d) {return Math.floor(d/2) * 2;})
      .x(d3.scale.linear()
        .domain([-20, 20])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(spotterrs.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(spotrherr)
        .group(spotrherrs)
        .round(function(d) {return Math.floor(d/4) * 4;})
      .x(d3.scale.linear()
        .domain([-40, 40])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(spotrherrs.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(spotwserr)
        .group(spotwserrs)
        .round(function(d) {return Math.floor(d/2) * 2;})
      .x(d3.scale.linear()
        .domain([-20, 20])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(spotwserrs.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(rtmaterr)
        .group(rtmaterrs)
        .round(function(d) {return Math.floor(d/2) * 2;})
      .x(d3.scale.linear()
        .domain([-20, 20])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(rtmaterrs.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(rtmarherr)
        .group(rtmarherrs)
        .round(function(d) {return Math.floor(d/4) * 4;})
      .x(d3.scale.linear()
        .domain([-40, 40])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(rtmarherrs.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(rtmawserr)
        .group(rtmawserrs)
        .round(function(d) {return Math.floor(d/2) * 2;})
      .x(d3.scale.linear()
        .domain([-20, 20])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(rtmawserrs.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(ndfdterr)
        .group(ndfdterrs)
        .round(function(d) {return Math.floor(d/2) * 2;})
      .x(d3.scale.linear()
        .domain([-20, 20])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(ndfdterrs.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(ndfdrherr)
        .group(ndfdrherrs)
        .round(function(d) {return Math.floor(d/4) * 4;})
      .x(d3.scale.linear()
        .domain([-40, 40])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(ndfdrherrs.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(ndfdwserr)
        .group(ndfdwserrs)
        .round(function(d) {return Math.floor(d/2) * 2;})
      .x(d3.scale.linear()
        .domain([-20, 20])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(ndfdwserrs.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
    barChart()
        .dimension(ndfdspott)
        .group(ndfdspotts)
        .round(function(d) {return Math.floor(d/2) * 2;})
      .x(d3.scale.linear()
        .domain([-20, 20])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(ndfdspotts.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
    barChart()
        .dimension(ndfdspotrh)
        .group(ndfdspotrhs)
        .round(function(d) {return Math.floor(d/4) * 4;})
      .x(d3.scale.linear()
        .domain([-40, 40])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(ndfdspotrhs.top(1)[0].value+10,15)])
        .rangeRound([250,0])),
        
   barChart()
        .dimension(ndfdspotws)
        .group(ndfdspotwss)
        .round(function(d) {return Math.floor(d/2) * 2;})
      .x(d3.scale.linear()
        .domain([-20, 20])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(ndfdspotwss.top(1)[0].value+10,15)])
        .rangeRound([250,0])),

    barChart()
        .dimension(elev)
        .group(elevs)
        .round(function(d) {return Math.floor(d/scale[2])*scale[2];})
      .x(d3.scale.linear()
        .domain([Math.floor(units(-350,2)), Math.floor(units(350,2))])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(elevs.top(1)[0].value+10,10)])
        .rangeRound([250,0])),

    barChart()
        .dimension(distance)
        .group(distances)
        .round(function(d) {return Math.floor(d/scale[3])*scale[3];})
      .x(d3.scale.linear()
        .domain([0, Math.floor(units(50,3))])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(distances.top(1)[0].value+10,10)])
        .rangeRound([250,0])),
        
    barChart()
        .dimension(leadtime)
        .group(leadtimes)
        .round(function(d) {return Math.floor(d/50) * 50;})
      .x(d3.scale.linear()
        .domain([0, 1000])
        .rangeRound([0, 250]))
      .y(d3.scale.linear()
        .domain([0,Math.max(leadtimes.top(1)[0].value+10,10)])
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
  		mapLayer.clearLayers();
  		popupText = [];
  	}
   mapPoints = [];
   //map.setZoom(6);
   var bounds = new L.LatLngBounds();
  	array.forEach(function(d){
  		var lat = d.latitude;
  		var lon = d.longitude;
  		var ll = new L.LatLng(lat,lon);
  		bounds.extend(ll);
  		var fire = d.file;
  		var date = formatDatePlus(d.date);
  		var dir = d.file.slice(8,16);
		if(d.elev>-9999){var elev = formatNumber(d.elev);}else{var elev = 'No Station';}
		if(d.distance>-9999){var distance = formatNumber(d.distance);}else{var distance = 'No Station';}
		var leadtime = d.leadtime;
		if(d.stn.length>0){
			var stn = d.stn;
			var stnref = 'Station Used: <a href="http://mesowest.utah.edu/cgi-bin/droman/meso_base.cgi?product=&past=1&stn='+stn+'&unit=0&time=LOCAL&day1='+dir.slice(6,8)+'&month1='+dir.slice(4,6)+'&year1='+dir.slice(0,4)+'&hour1=24" target="_blank">'+stn+'</a>';
		} else {
			var stn = d.stn;
			var stnref = '<a>No Station</a>';		
		}
		var spobst = formatDiff(d.spott);
		if(d.ndfdt>-9999){var rtobst = formatDiff(d.ndfdt);}else{var rtobst = 'No NDFD';}
		if(d.obst>-9999){var ndobst = formatDiff(d.obst);}else{var ndobst = 'No Station';}
		if(d.rtmat>-9999){var ndpott = formatDiff(d.rtmat);}else{var ndpott = 'No RTMA';}
		var spobsws = formatDiff(d.spotws);
		if(d.ndfdws>-9999){var rtobsws = formatDiff(d.ndfdws);}else{var rtobsws = 'No NDFD';}
		if(d.obsws>-9999){var ndobsws = formatDiff(d.obsws);}else{var ndobsws = 'No Station';}
		if(d.rtmaws>-9999){var ndpotws = formatDiff(d.rtmaws);}else{var ndpotws = 'No RTMA';}
		var spobsr = formatNumber(d.spotrh);
		if(d.ndfdrh>-9999){var rtobsr = formatNumber(d.ndfdrh);}else{var rtobsr = 'No NDFD';}
		if(d.obsrh>-9999){var ndobsr = formatNumber(d.obsrh);}else{var ndobsr = 'No Station';}
		if(d.rtmarh>-9999){var ndpotr = formatNumber(d.rtmarh);}else{var ndpotr = 'No RTMA';}
		if (d.obst>-9999 && metric) {
			if ((Math.abs(spobsws-ndobsws)>5)||(Math.abs(spobst-ndobst)>5)||(Math.abs(spobsr-ndobsr)>10)) {var icon = new L.Icon({iconUrl: './source/badfire-small.png'});} else {var icon = new L.Icon({iconUrl:'./source/fire-small.png'});}
		} else if (d.obst>-9999 && !metric) {
			if ((Math.abs(spobsws-ndobsws)>5)||(Math.abs(spobst-ndobst)>10)||(Math.abs(spobsr-ndobsr)>10)) {var icon = new L.Icon({iconUrl: './source/badfire-small.png'});} else {var icon = new L.Icon({iconUrl:'./source/fire-small.png'});}
		} else {
			var icon = new L.Icon({iconUrl:'./source/fire-small.png'});
		}
		if (metric) {
			popupText[fire] = [fire,date,'Elevation Difference: '+elev+' meters','Horizontal Distance: '+distance+' kilometers','Forecast Leadtime: '+leadtime+' minutes','Spot Forecast Max Temp: '+spobst+' C','NDFD Forecast Max Temp: '+rtobst+' C','Observed Max Temp: '+ndobst+' C','RTMA Max Temp: '+ndpott+' C','Spot Forecast Min RH: '+spobsr+'%','NDFD Forecast Min RH: '+rtobsr+'%','Observed Min RH: '+ndobsr+'%','RTMA Min RH: '+ndpotr+'%',stnref,'<a href="./jfsp/'+dir+'/'+fire+'.txt" target="_blank">Forecast</a>','Spot Forecast Max Wind: '+spobsws+' mps','NDFD Forecast Max Wind: '+rtobsws+' mps','Observed Max Wind: '+ndobsws+' mps','RTMA Max Wind: '+ndpotws+' mps'];
		} else {
			popupText[fire] = [fire,date,'Elevation Difference: '+elev+' feet','Horizontal Distance: '+distance+' miles','Forecast Leadtime: '+leadtime+' minutes','Spot Forecast Max Temp: '+spobst+' F','NDFD Forecast Max Temp: '+rtobst+' F','Observed Max Temp: '+ndobst+' F','RTMA Max Temp: '+ndpott+' F','Spot Forecast Min RH: '+spobsr+'%','NDFD Forecast Min RH: '+rtobsr+'%','Observed Min RH: '+ndobsr+'%','RTMA Min RH: '+ndpotr+'%',stnref,'<a href="./jfsp/'+dir+'/'+fire+'.txt" target="_blank">Forecast</a>','Spot Forecast Max Wind: '+spobsws+' mph','NDFD Forecast Max Wind: '+rtobsws+' mph','Observed Max Wind: '+ndobsws+' mph','RTMA Max Wind: '+ndpotws+' mph'];
		}
  		newPoint = new L.Marker(ll,{
  			title: fire,
  			riseOnHover: true,
  			icon: icon
		});
  		newPoint.on('click', function(e){
  			var t = e.target;
		  	runToggle(t);
  		});
  		mapPoints.push(newPoint);
  	});
  	mapLayer = L.layerGroup(mapPoints).addTo(map);
  	if (bounds && mapPoints.length>3){
  		map.fitBounds(bounds);
  	}
  }
  
  function runToggle(marker) {
  		var val = marker.options.title;
  		var txt = popupText[val];
  		$( "#pdetails" ).html(txt[0]+'<br>'+txt[1]+'<br>'+txt[13]+'<br>'+txt[2]+'<br>'+txt[3]+'<br>'+txt[4]+'<br>'+txt[14]);
  		$( "#ptemp" ).html(txt[5]+'<br>'+txt[6]+'<br>'+txt[7]+'<br>'+txt[8]);
  		$( "#prh" ).html(txt[9]+'<br>'+txt[10]+'<br>'+txt[11]+'<br>'+txt[12]);
  		$( "#pwind" ).html(txt[15]+'<br>'+txt[16]+'<br>'+txt[17]+'<br>'+txt[18]);
  		$( "#gcontainer" ).show( 'scale', { percent: 100 }, 500);
  		
	}

  function barChart() {
    if (!barChart.id) barChart.id = 0;

    var margin = {top: 10, right: 40, bottom: 20, left: 10},
        x,
        y,// = d3.scale.linear().range([250, 0]),
        id = barChart.id++,
        axis = d3.svg.axis().orient("bottom"),
        yaxis = d3.svg.axis().orient("right"),
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
