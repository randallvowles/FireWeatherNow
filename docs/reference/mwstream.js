var map, svg, g, data, obs, tooltip;
var totalObs = 0;
var fiveSecondsObs = 0;
var oneMinuteObs = 0;
var int1, int2
var lasttime = 0;
var bobby = 0;


function next() {
    return {
        active: 0,
        lat: 0,
        lon: 0,
        stid: '',
        mnet: '',
        latency: 0
    }
}

$(document).ready(init);

function init() {

    $(".explain").hide();
    $("#gbutton").click(function() {
        $(".explain").show('blind', 500)
    });
    $("#close").click(function() {
        $(".explain").hide('blind', 500);
    });

    var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/3eb45b95929d472d8fe4a2a5dafbd314/998/256/{z}/{x}/{y}.png',
        cloudmadeUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png',
        //cloudmadeUrl = 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/2402/256/{z}/{x}/{y}.png',
        subDomains = ['otile1', 'otile2', 'otile3', 'otile4'],
        //subDomains = ['a','b','c'],
        cloudmadeAttribution = 'Map data &copy; 2013 OpenStreetMap contributors, Imagery &copy; 2013 CloudMade',
        cloudmadeAttribution = 'Map data &copy; 2013 OpenStreetMap contributors, Imagery &copy; 2013 MapQuest',
        cloudmade = new L.TileLayer(cloudmadeUrl, {
            maxZoom: 18,
            attribution: cloudmadeAttribution,
            subdomains: subDomains,
            unloadInvisibleTiles: true,
            updateWhenIdle: false
        });

    map = new L.Map('map', {
        center: new L.LatLng(40.0, -90, 4),
        zoom: 4,
        layers: [cloudmade]
    });

    /* Initialize the SVG layer */
    map._initPathRoot();

    /* We simply pick up the SVG from the map object */
    var sv = d3.select("#map").select("svg");
    svg = sv.append("g");
    data = d3.range(10000).map(next);
    svg.selectAll("circle").data(data).enter().append("circle").attr('active', function(d) {
        return d.active
    });

    map.on("viewreset", updateDots);

    //updater.start();
    establishWS();
    //updater.poll();

    var d1 = new Date();
    var myTime = d1.toString().split(' GMT')[0];
    $("#myTime").html(myTime);
    ws = null;
    if (window.location.hash == "#bobby") {
        bobby = 1;
    }
    window.onhashchange = function() {
        if (window.location.hash == "#bobby") {
            bobby = 1;
        }
    };
}
var socket = null;

function establishWS() {
    var url = "ws://watch.mesowest.net/pointsocket";
    //alert(url);
    // but some web locations only allow for port 80 as web traffic, so apache redirects are complicated to websocket traffic
    //need to consider some longpoll options in this event, even if the browser is fine with ws!
    if ("WebSocket" in window) {
        socket = new WebSocket(url);
    } else if ("MozWebSocket" in window) {
        socket = new MozWebSocket(url);
    } else {
        socket = new Object();
        updater.poll();
        return;
        //alert('sorry your browser does not support Websockets. Running in a simulation mode.');
        //setInterval(simulateData,200);
    }
    socket.onmessage = plotData;
    socket.onerror = function(event) {
        //alert('error in WS');alert(event);
        socket = new Object();
        updater.poll();
        return;
    };
    socket.onclose = function(event) {};
}

function closeWS() {
    if (socket != null) {
        socket.close();
    }
    socket = null;
    establishWS();
}

var doti = 0;

function plotData(message) {
    //updateStats();
    totalObs++;
    fiveSecondsObs++;
    oneMinuteObs++;
    $("#totalObs").html(totalObs);
    $("#last5Seconds").html(fiveSecondsObs);
    $("#lastMinute").html(oneMinuteObs);

    if (typeof(message.data) != 'undefined') {
        message = JSON.parse(message.data);
    }
    if (message.lat == 'NULL' || message.lon == 'NULL') {
        return;
    }

    var ll = new L.LatLng(message.lat, message.lon);
    var myx = map.latLngToLayerPoint(ll).x;
    var myy = map.latLngToLayerPoint(ll).y;
    if (parseFloat(message.servertime) > lasttime) {
        lasttime = parseFloat(message.servertime)
    }
    //var f = svg.select("circle[active='0']")
    var f = svg.select("circle[active='0']")
        .attr('active', 1)
        .attr('cx', myx)
        .attr('cy', myy)
        .attr('stid', message.stid)
        .attr('lat', message.lat)
        .attr('lon', message.lon)
        .attr('r', 2); //.attr('fill','black')
    //.transition().attr('r',12).attr('active',0);
    //.attr('active',0);
    if (bobby == 1) {
        f.on("mouseover", function(d) {
            d3.select(this).transition().duration(1500).attr('r', 50).attr('class', 'circleBoom')
                .each("end", function() {
                    d3.select(this).attr('r', 0).attr('active', 0).attr('class', 'circle');
                })
        });
    }
    f.transition().attr('r', 12)
        .each("end", function() {
            //d3.select(this).attr('fill','red');
            d3.select(this).transition().ease('bounce').duration(5000).attr('r', 0)
                .each("end", function() {
                    //d3.select(this).remove();
                    d3.select(this).attr('active', 0);
                })
        });

    ll = null;
    myx = null;
    myy = null;
    message = null;
    f = null;


    //doti++;
}

function updateStats() {
    totalObs++;
    fiveSecondsObs++;
    oneMinuteObs++;
    //$("#totalObs").html(totalObs);
    //$("#last5Seconds").html(fiveSecondsObs);
    //$("#lastMinute").html(oneMinuteObs);
    //$("#out").html(svg.selectAll("circle").data().length);
}

//set timeout for testing of many hits
function simulateData() {
    var message = {
        lat: getRandomNum(20, 50),
        lon: getRandomNum(-125, -80),
        stid: 'ABD'
    };
    plotData(message);
    return;
}

function updateDots() {
    svg.selectAll("circle[active='1']").each(function(d, i) {
        //svg.selectAll("circle").each(function(d,i){
        this.LatLng = new L.LatLng(d3.select(this).attr('lat'), d3.select(this).attr('lon'));
        d3.select(this).attr('cx', function(d) {
            return map.latLngToLayerPoint(this.LatLng).x
        });
        d3.select(this).attr('cy', function(d) {
            return map.latLngToLayerPoint(this.LatLng).y
        });
    });
}

function getRandomNum(min, max) {
    return Math.random() * (max - min) + min;
}

function getLatLng() {
    var lat = getRandomNum(20, 50);
    var lon = getRandomNum(-125, -80);
    var ll = new L.LatLng(lat, lon);
    return {
        LatLng: ll
    };
}

setInterval(function() {
    $("#last5Seconds").html(fiveSecondsObs);
    fiveSecondsObs = 0;
}, 5000);

setInterval(function() {
    $("#lastMinute").html(oneMinuteObs);
    oneMinuteObs = 0;
}, 60000);

//setInterval(function (){
//	$("#totalObs").html(totalObs);
//	$("#last5Seconds").html(fiveSecondsObs);
//	$("#lastMinute").html(oneMinuteObs);
//},500);

//setInterval(closeWS,1000*60*60);


function getCookie(name) {
    var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
    return r ? r[1] : undefined;
}

var updater = {
    errorSleepTime: 500,
    aj: null,

    poll: function() {
        var args = {
            "_xsrf": getCookie("_xsrf"),
            "lasttime": lasttime
        };
        $("#out").html(lasttime);
        aj = $.ajax({
            url: '/pointlongpoll',
            data: $.param(args),
            type: "POST",
            dataType: "text",
            success: updater.onSuccess,
            error: updater.onError
        });
    },

    onSuccess: function(response) {
        try {
            //updater.newMessages(JSON.parse(response));
            updater.newMessages(eval("(" + response + ")"));
        } catch (e) {
            updater.onError();
            return;
        }
        //updater.errorSleepTime = 500;
        window.setTimeout(updater.poll, 500);
    },

    onError: function(response) {
        //updater.errorSleepTime *= 2;
        window.setTimeout(updater.poll, updater.errorSleepTime);
    },

    newMessages: function(response) {
        if (!response.messages) return;
        //updater.cursor = response.cursor;
        var messages = response.messages;
        //updater.cursor = messages[messages.length - 1].id;
        for (var i = 0; i < messages.length; i++) {
            updater.showMessage(messages[i]);
        }
    },

    showMessage: plotData

};
