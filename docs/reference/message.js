var websocket_everstarted = false;
var websocket_triedstarting = false;

function init() {
    raw_table.startTable();
    showFilters();
    // and start the socket using the refresh interval
    // this also pings the websocket to make sure our ELB connection is never closed!
    setInterval(function() {
        if (ws && ws.readyState == ws.OPEN) { //reconnect == true
            ws.send(JSON.stringify({
                ping: "keepalive"
            }));
            //
        } else {
            // try to start one IF we have never tried before, or if we have successfully started once.
            websocket_triedstarting = true;
            wsocket.start_socket(raw_table.addRow, raw_table.reStartButton);
        }
    }, 3000);

}

$(init);

var myFilters = {
    showLevels: {
        debug: false,
        info: false,
        warning: true,
        error: true,
        critical: true
    },
    origin: false,
};

function showFilters() {
    var elem = $(".js-filterbox").empty().html("<hr>Display Levels -  ");
    for (f in myFilters.showLevels) {
        var on = myFilters.showLevels[f];
        var l = $("<label>").appendTo(elem);
        $("<input type='checkbox'>")
            .change({
                l: f
            }, function(e) {
                myFilters.showLevels[e.data.l] = $(this).prop("checked");
                raw_table.rewrite_table();
            })
            .prop("checked", on)
            .appendTo(l);
        l.append(" " + f)
        elem.append(" :: ");
    }
    // show origin filter
    elem.append("<hr>Filter Origin - <input type='text' size='35' class='js-originfiltertext'>  - ")
    $(" <button>").html("Update Origin Filter").click(function(e) {
        var filters = $(".js-originfiltertext").val().toLowerCase().split(",");
        if (!filters) myFilters.origin = false;
        else myFilters.origin = filters;
        raw_table.rewrite_table();
    }).appendTo(elem)
    elem.append(" <i>Comma separate multiple filters. Case invariant.</i>")
}

var count = 0;
var obs = [];
var reconnect = false;
var ws;
var is_initiated = false;


var wsocket = {
    history: [],
    event_listeners: [],
    start_socket: function(onmsg, oncls) {
        if (ws) {
            console.log(ws.readyState, ws)
            if (ws.readyState != ws.OPEN) {
                console.log("starting again!?")
                ws = new WebSocket('wss://admin.synopticlabs.org/sockets/message');
            } else if (ws.readyState == ws.OPEN) {
                return;
            }
        } else {
            ws = new WebSocket('wss://admin.synopticlabs.org/sockets/message');

        }
        ws.onopen = function(evt) {
            // request only logging message types.
            wsocket.callAPI("configureStream", {
                "setOrigins": "ALL",
                "setMessageTypes": "logging,info,warning,debug,error,critical"
            });
            if (!is_initiated) {
                is_initiated = true;
                wsocket.callAPI("recentMessages", {
                    "limit": 200
                });
            }
        }
        ws.onmessage = function(evt) {

            data = JSON.parse(evt.data);
            // call any registered output listeners
            if (wsocket.event_listeners.length > 0) {
                // evaluate if anything is on the queue
                for (l in wsocket.event_listeners) {
                    if (data['call_id'] && data['call_id'] == wsocket.event_listeners[l].trigger) {
                        wsocket.event_listeners[l].func(data)
                            // and remove it from the listeners
                        wsocket.event_listeners.splice(l, 1);
                    }
                }
            }
            if (data.messageType != "logging" && data.messageType != "warning" && data.messageType != "info" && data.messageType != "debug" && data.messageType != "critical" && data.messageType != "error") return;
            wsocket.history.push(data);
            onmsg(data);
        }

        ws.onclose = function(evt) {
            if (oncls) {
                oncls(evt)
            } else {
                wsocket.onclose(evt)
            }
        }
    },
    addEventListener: function(trigger, func) {
        // add a single event listener (todo - update to handle multiple receipts of the same response)
        wsocket.event_listeners.push({
            "trigger": trigger,
            "func": func
        });
        // that's it
        return;
    },
    callAPI: function(func, args, callback) {
        /*
         *   A wrapper for calling the API services of the system. set a callback if desired.
         *
         *   func:      the string name of the API function you want to call.
         *   args:      a dictionary of key-value pairs passed to the API
         *   callback:  a function that is called with the JSON data structure returned.
         *
         */
        if (callback) {
            // they have a callback, so we should add an event listner and code
            call_code = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
            wsocket.addEventListener(call_code, callback)
            args['call_id'] = call_code;
        }
        args['apiFunction'] = func
            // and call the webscoket API
        if (ws && ws.readyState == ws.OPEN) {
            ws.send(JSON.stringify(args));
        } else {
            callback({
                "erorr": "API Disconnected"
            });
        }


    },
    onclose: function(evt) {
        alert('lost connection');
    },
};

function paint_td(level) {
    clr = '#DDD';
    if (level == 'DEBUG') clr = '#334D5C'; // blue
    else if (level == 'INFO') clr = '#45B29D'; // green
    else if (level == 'WARNING') clr = '#EFC94C'; // yellow
    else if (level == 'ERROR') clr = '#E27A3F'; // orange
    else if (level == 'CRITICAL') clr = '#DF5A49'; // red
    return "<td class='w10' valign='top' style='background-color:" + clr + ";color:#000;padding:3px;width:110px;'>" + level + "</td>"
}
var raw_table = {
    limits: {
        level: [],
        origin: [],
        description: [],
        debug: [],
    },
    init: function() {
        this.startTable();
        wsocket.start_socket(raw_table.addRow, raw_table.reStartButton)

    },
    startTable: function() {
        /*
         * create the table AND OPTIONS in the contents menu
         */


        str = '<table style="width:100%" id="rawtable_header"><thead><tr><th class="w10">Level</th>\
            <th class="w20">Origin</th><th class="w50">Description</th><th class="w20">Timestamp</th></tr></thead><tbody></tbody><table>'

        $('#contents').html(str)
    },
    reStartButton: function(d) {
        return 0;

    },
    updateLimits: function() {
        /*
         * edit the limits
         */

    },
    rewrite_table: function(d) {
        // sure, it's gross, but it does work.
        // small potential for issues
        raw_table.startTable();
        for (x in wsocket.history) {
            raw_table.addRow(wsocket.history[x]);
            if (x > 1000) break; // for safety -- ERR, this could actually be a problem, since these are out of order.
        }
    },
    addRow: function(d) {
        // if we are supposed to show this row, then show it
        if (!myFilters.showLevels[d.data.level.toLowerCase()]) return;
        else if (myFilters.origin !== false) {
            var found = false;
            for (f in myFilters.origin) {
                if (d.origin.toLowerCase().indexOf(myFilters.origin[f]) > -1) {
                    found = true;
                    break;
                }
            }
            if (found == false) return;
        }
        id2 = makeid(); // random string
        var row = "<div id='row_" + id2 + "'><table style='width:100%'><tr class='rawtablerow' id='tr_" + d.logid + id2 + "'>" + paint_td(d.data.level) + "<td class='w20'>" +
            d.origin + "</td><td class='w50'>";
        row += "<span class='desc_" + d.data.level + "'>";

        if (d.logid) {

            row += "<a href='javascript:raw_table.describe(" + d.logid + ",\"" + id2 + "\");'>";
        }
        if (d.data.level == 'DEBUG') {
            row += d.data.description + " <code>" + d.data.cat + "</code>";
        } else {
            row += d.data.description;
        }
        if (d.logid) {
            row += "</a>";
        }
        row += "</span>";
        ts = new Date(d.data.timestamp * 1000);
        row += "</td>" +
            "<td class='w20'>" + dformat(ts, 'D o Y h:m:s') + "  </td></tr></table></div>";
        $(row).insertAfter('#rawtable_header')
    },
    calcElapsed: function() {
        /*
         * calculate the elapsed time for every row..?
         */

    },
    describe: function(id, id2) {
        /*
         * describe a specific log entry, using a get request
         */

        if ($('#moreinfo_' + id + id2).length != 0) {
            this.closedesc(id, id2)
            return;
        }

        // and call the webscoket API
        wsocket.callAPI("readItem", {
            itemKey: id
        }, function(msg) {
            // when the websocket replies with our request
            console.log(msg)

            evt = msg.data.data;
            str = "<tr id='moreinfo_" + id + id2 + "'><td colspan='3'><div class='close'>\
                <a href='javascript:raw_table.closedesc(" + id + ",\"" + id2 + "\")'>X</a></div>\
                <table class='highlight'><tr><th>Parameter</th><th>Value</th></tr>";
            for (d in evt) {
                val = ("" + evt[d]).replace(/\|/g, '<br />');
                str += "<tr><td><b>" + d + "</b></td><td><pre style='font-size:1em'>" + val + "</pre></td></tr>"
            }
            str += "</table></td></tr>"
                // make the level column have a rowspan of 2
            $('#tr_' + id + id2 + ">td").first().attr('rowspan', '2')
            $(str).insertAfter($("#tr_" + id + id2))

        })


    },
    closedesc: function(id, id2) {
        $('#tr_' + id + id2 + ">td").first().attr('rowspan', '1')
        $('#moreinfo_' + id + id2).remove()
    },
    disp: {
        record: {
            'OTHER': true,
            'DEBUG': true,
            'INFO': true,
            'WARNING': true,
            'ERROR': true,
            'CRITICAL': true
        },
        drawHideBtn: function(name) {
            str = "<span class='button_" + (this.record[name] ? 'on' : 'off') + "'>" + name + '</span>';
            return str
        },
        drawAllBtns: function() {
            str = "";
            for (n in this.record) {
                str += this.drawHideBtn(n);
            }
            return str;

        },

    },
}

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function ago(now, time) {
    var secs = Math.round(now - time)
        //var d = Math.floor(secs / 86400);
        //secs = secs % 86400;
    var h = Math.floor(secs / 3600);
    secs = secs % 3600;
    var m = Math.floor(secs / 60);
    var s = secs % 60;

    return twodigit(h) + ":" + twodigit(m) + ":" + twodigit(s);
}

function twodigit(n) {
    if (n < 10) return "0" + n;
    return n

}


window.addEventListener("load", raw_table.init(), false);

function dformat(date, fmt) {
    // take simple string formatting, and return the formatted string
    // LOCALTIME, this can be rewritten for UTC
    k = 0
    str = ""
    months = ["January", 'February', 'March', 'April', 'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ]
    while (k < fmt.length) {
        K = fmt.charAt(k)
        k += 1
        switch (K) {
            case "Y":
                str += date.getFullYear()
                break;
            case "y":
                str += ("" + date.getFullYear()).substr(2)
                break;
            case "M":
                str += date.getMonth()
                break;
            case "O":
                str += months[date.getMonth()]
                break;
            case "o":
                str += months[date.getMonth()].substr(0, 3)
                break;
            case "D":
                str += date.getDate();
                break;
            case "H":
                str += twodigit(date.getHours());
                break;
            case "h":
                str += twodigit(date.getHours());
                break // convert to 12 hour... someday
            case "m":
                str += twodigit(date.getMinutes());
                break;
            case "s":
                str += twodigit(date.getSeconds());
                break;
            default:
                str += K

        }

    }
    return str

}
