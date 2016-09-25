// Copyright 2009 FriendFeed
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may
// not use this file except in compliance with the License. You may obtain
// a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.
var uid = '';

$(document).ready(function() {
    if (!window.console) window.console = {};
    if (!window.console.log) window.console.log = function() {};

    $("#messageform").on("submit", function() {
        newMessage($(this));
        return false;
    });
    $("#messageform").on("keypress", function(e) {
        if (e.keyCode == 13) {
            newMessage($(this));
            return false;
        }
    });
    $("#message").select();
    updater.start();
});

function fromFid(){
    var fid = 'someuidname';
    var filterO = {"fid":fid};
    updater.socket.send(JSON.stringify(filterO));
}

function newMessage(form) {
    //var message = form.formToDict();
    var result = $('#builder-basic').queryBuilder('getRules');
    var domain_rules = $('#builder-domain').queryBuilder('getRules');
    
    $("#inbox").html('');
    var node = $('<div class="report">Filter is set. Results will show for these conditions.</div>');
    node.hide();
    $("#inbox").append(node);
    node.slideDown();

    var domain = {};
    domain = makeDomain(domain,domain_rules,'OR');
    
    var filterO = { "domain": domain, "vids" : [], "vals" : [], "signs" : [], "ops_and" :[], "ops_or" : [] }
    
    
    filterO = makeFilter(filterO,result, 'AND');
    console.log(JSON.stringify(domain));
    //console.log(JSON.stringify(message));
    //console.log(JSON.stringify(filterO));
    updater.socket.send(JSON.stringify(filterO));
    form.find("input[type=text]").val("").select();
}

var operator_dict = {
    'greater' : '>',
    'greater_or_equal' : '>=',
    'equal' : '==',
    'less_or_equal' : '<=',
    'less' : '<',
    'not_equal' : '!='
}
    
function makeDomain(domain, d, cond){    
    if (d['condition'] != undefined){
        domain = makeDomain(domain,d['rules'], d['condition']);
    } else if (d.constructor === Array) {
        for (var i = 0; i < d.length; i++){
            domain = makeDomain(domain,d[i], cond);
        }
    } else { // must be object cond
        //if (domain[d['id']] == undefined){
        //    domain[d['id']] = []
        //}
        domain[d['id']] = d['value'];
        
    }
    return domain
}

function makeFilter(filter, d, cond){
    var n = filter['vids'].length - 1;
    
    if (d['condition'] != undefined){
        filter = makeFilter(filter,d['rules'], d['condition']);
    } else if (d.constructor === Array) {
        for (var i = 0; i < d.length; i++){
            filter = makeFilter(filter,d[i], cond);
        }
    } else { // must be object cond
        filter['vids'].push(d['id']);
        filter['vals'].push(d['value']);
        filter['signs'].push(operator_dict[d['operator']]);
        
        if (cond == 'AND'){
            filter['ops_and'].push([n+1]);
        } else {
            filter['ops_or'].push([n+1]);
        }
    }
    return filter
}

jQuery.fn.formToDict = function() {
    var fields = this.serializeArray();
    var json = {}
    for (var i = 0; i < fields.length; i++) {
        json[fields[i].name] = fields[i].value;
    }
    if (json.next) delete json.next;
    return json;
};

var updater = {
    socket: null,

    start: function() {
        var url = "ws://" + location.host + ":9501/alertsocket";
        //var url = "ws://alert-ws-qc-services-961673199.us-west-2.elb.amazonaws.com:9501/alertsocket";
        updater.socket = new WebSocket(url);
        updater.socket.onmessage = function(event) {
            updater.showMessage(JSON.parse(event.data));
        }
    },

    showMessage: function(message) {
        if (Object.keys(message).length == 0){return;}
        if (message.uid != undefined){
            uid = message.uid;
        } else if ((message.phrase != undefined)){
            $("#phrase").html(message.phrase);
        } else {
            console.log(message.match);
            //var existing = $("#m" + message.id);
            //if (existing.length > 0) return;
            var node = $('<div class="report">' + message.match + '</div>');//message.html
            node.hide();
            $("#inbox").append(node);
            node.slideDown();
        }
    }
};
