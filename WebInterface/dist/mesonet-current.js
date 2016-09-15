/*
 * MesonetJS - a Mesonet API JavaScript interface
 * @author MesoWest/SynopticLabs
 * @version 0.5.x
 * @class mesonet API interface
 */

function mesonet() {

    "use strict";

    /** Internal pointer to connect public & private functions */
    var _this = this;

    /**
     * Data containers & configuration objects used in the class
     */
    this.response = {
        tableOfContents: {},
        station: [],
        sensorStack: [],
        sensorLongNames: {},
        summary: {},
        units: {},
        qcFlags: {}, // Formerly QcTable
        qcFlagNames: [],
        qcEnabled: [],
        qcLongNames: {},
        queryParameters: {}
    };

    // @TODO: Need to be defaulted in functions
    this.config = {
        fetch: {
            service: "TimeSeries",
            apiToken: "not-set",
            longNames: true,
            qcTypes: true,
            notify: false
        },
        table: {
            //stid: "hol",
            //stidx: 67,
            qcFailClass: "qc-fail",
            htmlID: "tabular-data", // might be updated via the function call
            detached: "qc-codes",
            //detached: false,
            //detached: "inline",
            showUnits: true,
            descend: true
        },
        csv: {
            //stid: "hol",
            //stidx: 67,
        }
    };

    /**
     * @function getArgs
     * @summary  Gets the query paramters from the Url
     * @returns  getArgs {object} or "undefined"
     */
    var getArgs = function() {
        //"use strict";

        var a = {};
        var b = window.location.search.substring(1).split("&");
        var pair;
        var c;
        var l = b.length;

        if (window.location.search.substring(1).split("=") === 1) {
            return "undefined";
        } else {
            for (var i = 0; i < l; i++) {
                /* grab the values and add a key */
                pair = b[i].split("=");
                if (typeof a[pair[0]] === "undefined") {
                    a[pair[0]] = decodeURIComponent(pair[1]);
                    // if (pair[1].split(",").length > 1) {
                    //     a[pair[0]] = pair[1].split(",");
                    // }
                }
            }
            return a;
        }

    }();

    /**
     * @function getKeys
     * @summary  Returns the keys of a JSON stack
     *
     * @param    JSON/Object    {object}
     * @returns  Object keys    {array}
     */
    function getKeys(obj) {
        //"use strict";

        var keys = [];
        for (var i in obj) {
            keys.push(i);
        }
        return keys;
    }


    /**
     * Async process handler. Assumes `this.config.fetch` is configured
     * @private
     */

    function _fetch() {
        var deferred = $.Deferred();

        /* What service to use? */
        var p1;
        if (_this.config.fetch.service === "TimeSeries") {
            p1 = _fetchTimeSeries();
        } else if (_this.config.fetch.service === "Latest") {
            p1 = _fetchLatest();
        } else if (_this.config.fetch.service === "Metadata") {
            p1 = _fetchStationMetadata();
            _this.config.fetch.qcTypes = false;
        } else {
            return 1;
        }

        /* Use QC Types? */
        var p2;
        if (_this.config.fetch.qcTypes) {
            p2 = _fetchQcTypes();
        } else {
            p2 = dummyLoad();
        }

        /* For now we will always get the variable names */
        var p3;
        if (_this.config.fetch.longNames) {
            p3 = _fetchVariableNames();
        } else {
            p3 = dummyLoad();
        }

        /* Wait for both async processes to complete */
        $.when(p1, p2, p3).done(function() {
            deferred.resolve();
        });
        return deferred.promise();

        /* We just need the promise back */
        function dummyLoad() {
            var deferred = $.Deferred();
            deferred.resolve();
            return deferred.promise();
        }
    }

    /**
     * Fetch the latest obs from API
     * @summary  Fetch the QC names from the /latest service
     * @returns  async promise {promise}
     */
    function _fetchStationMetadata() {

        var deferred = $.Deferred();

        /* Get the API response */
        try {
            callAPI();
        } catch (err) {
            console.log("fetchStationMetadata\n" + this.url + "\ner1");
        }

        /* Call the Mesonet API */
        function callAPI() {

            /* !! For dev only */
            var baseURL;
            if (getArgs.dev !== undefined) {
                baseURL = "http://dev2.mesowest.net:" + getArgs.dev + "/";
                console.log("fetchStationMetadata -> Dev Port: " + getArgs.dev);
            } else {
                baseURL = "http://api.mesowest.net/v2/";
            }
            /* !! */

            var wsURL = baseURL + "stations/metadata?callback=?";
            $.ajax({
                url: wsURL,
                type: 'GET',
                dataType: 'JSON',
                data: _this.response.queryParameters,
                complete: function(data) {
                    deferred.notify(this.url);
                    haveResponse(data);
                    deferred.resolve();
                }
            });
        }

        /* Deal with the response */
        function haveResponse(data) {
            var dataJSON = {};
            try {
                dataJSON = data.responseJSON;
            } catch (err) {
                console.log("fetchStationMetadata.er2");
            }

            /*
             * We need to modify the response object to reflect the nature of this
             * query. Due to the nature of this beast we have to do it item
             * by item.
             */
            delete _this.response.qcEnabled;
            delete _this.response.qcFlags;
            delete _this.response.qcFlagNames;
            delete _this.response.qcLongNames;
            delete _this.response.summary;
            delete _this.response.units;

            _this.response.status = {};
            _this.response.mnetID = {};


            if (dataJSON['SUMMARY']['RESPONSE_CODE'] == 1) {
                for (var i = 0; i < dataJSON['STATION'].length; i++) {

                    /* !!! If we are here then we theortically have good data to work with */
                    _this.response.tableOfContents[dataJSON['STATION'][i]['STID']] = i;
                    _this.response.sensorStack[i] = getKeys(dataJSON['STATION'][i]['SENSOR_VARIABLES']);
                    _this.response.station[i] = dataJSON['STATION'][i];

                    _this.response.status[dataJSON['STATION'][i]['STID']] = dataJSON['STATION'][i]['STATUS'];
                    _this.response.mnetID[dataJSON['STATION'][i]['STID']] = dataJSON['STATION'][i]['MNET_ID'];
                }
            } else {
                console.log("fetchStationMetadata.er3");
                console.log(dataJSON['SUMMARY']);
            }
        }
        return deferred.promise();
    }

    /**
     * @function fetchQcTypes
     * @summary  Fetch the QC names from the /qctypes service
     * @returns  async promise {promise}
     */
    function _fetchQcTypes() {

        var deferred = $.Deferred();

        /* Get the API response */
        try {
            callAPI();
        } catch (err) {
            alert("fetchQcTypes.callAPI\n\n", this.url);
            return false;
        }

        /* Call the Mesonet API */
        function callAPI() {

            /* !! For dev only */
            var baseURL;
            if (getArgs.dev !== undefined) {
                baseURL = "http://dev2.mesowest.net:" + getArgs.dev + "/";
                console.log("fetchQcTypes -> Dev Port: " + getArgs.dev);
            } else {
                baseURL = "http://api.mesowest.net/v2/";
            }
            /* !! */

            var wsURL = baseURL + "qctypes?callback=?";
            var _QueryParameters = {
                token: _this.config.fetch.apiToken
            };
            $.ajax({
                url: wsURL,
                type: 'GET',
                dataType: 'JSON',
                data: _QueryParameters,
                complete: function(obj) {
                    haveResponse(obj);
                    deferred.resolve();
                }
            });
        }

        /* Deal with the response */
        function haveResponse(obj) {
            var dataJSON = obj.responseJSON;
            if (dataJSON['SUMMARY']['RESPONSE_CODE'] == 1) {
                _this.response.qcLongNames = dataJSON['QCTYPES'];
            } else {
                return;
            }
        }
        return deferred.promise();
    }

    /**
     * @function fetchTimeSeries
     * @summary  Fetch Observations from /timeseries service
     * @returns  async promise {promise}
     */
    function _fetchTimeSeries() {

        var deferred = $.Deferred();

        /* Get the API response */
        try {
            callAPI();
        } catch (err) {
            console.log("fetchTimeSeries.er1");
        }
        /* Call the Mesonet API */
        function callAPI() {

            /* !! For dev only */
            var baseURL;
            if (getArgs.dev !== undefined) {
                baseURL = "http://dev2.mesowest.net:" + getArgs.dev + "/";
                console.log("fetchTimeSeries -> Dev Port: " + getArgs.dev);
            } else {
                baseURL = "http://api.mesowest.net/v2/";
            }
            /* !! */

            var wsURL = baseURL + "stations/timeseries?callback=?";
            $.ajax({
                url: wsURL,
                type: 'GET',
                dataType: 'JSON',
                data: _this.response.queryParameters,
                complete: function(data) {
                    deferred.notify(this.url);
                    haveResponse(data);
                    deferred.resolve();
                }
            });
        }

        /* Do something with the response */
        function haveResponse(data) {
            var dataJSON = {};
            try {
                dataJSON = data.responseJSON;
            } catch (err) {
                console.log("fetchTimeSeries.er2");
            }

            /* By defualt have qcEnabled eq false */
            _this.response.qcEnabled.push(false);
            if (dataJSON['SUMMARY']['RESPONSE_CODE'] == 1) {
                for (var i = 0; i < dataJSON['STATION'].length; i++) {

                    /* !!! If we are here then we theortically have good data to work with */
                    _this.response.sensorStack[i] = getKeys(dataJSON['STATION'][i]['OBSERVATIONS']);
                    _this.response.qcEnabled[i] = dataJSON['STATION'][i]['QC_FLAGGED'];
                    _this.response.station[i] = dataJSON['STATION'][i];
                    _this.response.units = dataJSON['UNITS'];
                    _this.response.summary = dataJSON['SUMMARY'];
                    _this.response.tableOfContents[dataJSON['STATION'][i]['STID']] = i;

                    /* Deal with the QC Flags */
                    if (_this.response.qcEnabled) {
                        _this.response.qcFlagNames[i] = getKeys(dataJSON['STATION'][i]['QC']);
                        _this.response.qcFlags[i] = dataJSON['STATION'][i]['QC'];
                    } else {
                        // do something w/o the qc flags
                    }
                }
            } else {
                console.log("fetchTimeSeries.er3");
                console.log(dataJSON['SUMMARY']);
            }
        }
        return deferred.promise();
    }

    /**
     * @function fetchVariableNames
     * @summary  Fetch the station variables from /variables service
     * @returns  async promise {promise}
     */
    function _fetchVariableNames() {

        var deferred = $.Deferred();

        /* Get the API response */
        try {
            callAPI();
        } catch (err) {
            alert("fetchVariableNames.er1\n\n", _this.url);
            return 1;
        }

        /* Call the Mesonet API */
        function callAPI() {

            /* !! For dev only */
            var baseURL;
            if (getArgs.dev !== undefined) {
                baseURL = "http://dev2.mesowest.net:" + getArgs.dev + "/";
                console.log("fetchVariableNames -> Dev Port: " + getArgs.dev);
            } else {
                baseURL = "http://api.mesowest.net/v2/";
            }
            /* !! */

            var wsURL = baseURL + "variables?callback=?";
            var _QueryParameters = {
                token: _this.config.fetch.apiToken
            };
            $.ajax({
                url: wsURL,
                type: 'GET',
                dataType: 'JSON',
                data: _QueryParameters,
                complete: function(obj) {
                    haveResponse(obj);
                    deferred.resolve();
                }
            });
        }

        /* Handle the response */
        function haveResponse(obj) {
            var dataJSON = obj.responseJSON;
            if (dataJSON['SUMMARY']['RESPONSE_CODE'] == 1) {

                _this.response.sensorLongNames = dataJSON['VARIABLES'];

                /**
                 * Proposed option!
                 * Rebase the object to make it searchable
                 * - If accepted should be moved to a method.
                 */
                //var tmp = dataJSON['VARIABLES'];
                // var i = 0;
                // //console.log(tmp);
                // for (i = 0; i < tmp.length; i++) {
                //     _this.response.sensorLongNames[getKeys(tmp[i])] = tmp[i][getKeys(tmp[i])];
                // }

            } else {
                return;
            }
        }

        return deferred.promise();
    }


    /**
     * Create a HTML table and pass via DOM. Assumes that a config block has been
     * prepared/stored in `this.config.table`
     * @function makeTimeSeriesTable
     * @summary  Create a HTML table from data object
     * @private
     */
    function _makeTimeSeriesTable() {

        /*
         * How to handle what station to use. `obj` is the date object from the
         * API response.
         */
        var obj = {};
        var idx = 0;
        var tmp;
        if (typeof _this.config.table.stid !== "undefined") {
            idx = _this.response.tableOfContents[_this.config.table.stid.toUpperCase()];
        } else {
            idx = 0;
        }

        obj = _this.response.station[idx].OBSERVATIONS;

        /* Set up truth table */
        var detachFlag = false;
        var slimFlag = false;
        var lnFlag = false;
        var qcFlag = false;
        var inlineFlag = false;

        if (typeof _this.config.table.detached != "undefined") {

            if (_this.config.table.detached && typeof _this.config.table.detached !== "undefined") {
                detachFlag = true;
            }
            if (!_this.config.table.detached && typeof _this.config.table.detached !== "undefined") {
                slimFlag = true;
            }

            if (_this.response.qcLongNames[0] !== null) {
                lnFlag = true;
            }

            if (_this.response.qcFlags[idx] !== undefined) {
                qcFlag = true;
            }

            if (_this.config.table.detached === "inline") {
                inlineFlag = true;
            }

        } else {
            slimFlag = true;
        }


        /* Counters and limits */
        var i = 0;
        var j = 0;
        var k = 0;
        var li = 0;
        var lj = 0;

        /* Determine if the user wants the table in descending order */
        if (_this.config.table.descend) {
            var stack = getKeys(obj);
            li = stack.length;
            for (i = 0; i < li; i++) {
                obj[stack[i]] = obj[stack[i]].reverse();
            }
        }

        /* As we work thru the variables we want to append them to stack */
        var sensorStack = ["date_time"];
        var sensorStackLN = ["Time"];
        var sensorStackUnits = [""];

        li = _this.response.sensorLongNames.length;
        for (i = 0; i < li; i++) {

            lj = getKeys(_this.response.station[idx].SENSOR_VARIABLES).length;
            for (j = 0; j < lj; j++) {

                try {
                    var a = getKeys(_this.response.sensorLongNames[i])[0];
                    var b = getKeys(_this.response.station[idx].SENSOR_VARIABLES)[j];

                    if (a === b) {

                        var nKeys = getKeys(_this.response.station[idx].SENSOR_VARIABLES[b]).length;

                        var stackName;
                        for (k = 0; k < nKeys; k++) {

                            var tmp1 = [];
                            var tmp2 = [];
                            if (nKeys > 1) {
                                for (k = 0; k < nKeys; k++) {

                                    /* Test for multiples in the sensor stack and reverse the order in the stack */
                                    tmp1.push(getKeys(_this.response.station[idx].SENSOR_VARIABLES[b])[k]);
                                    stackName = getKeys(_this.response.station[idx].SENSOR_VARIABLES)[j];
                                    tmp2.push(_this.response.sensorLongNames[i][stackName].long_name + " (" + (k + 1) + ")");
                                    sensorStackUnits.push(_this.response.units[stackName]);

                                    /* We've got a full sub stack, now we can sort multiples */
                                    if ((k + 1) == nKeys) {
                                        tmp1.sort();

                                        var kk = 0;
                                        for (kk = 0; kk < nKeys; kk++) {
                                            sensorStack.push(tmp1[kk]);
                                            sensorStackLN.push(tmp2[kk]);
                                        }
                                        tmp1 = [];
                                        tmp2 = [];
                                    }
                                }
                            } else {
                                sensorStack.push(getKeys(_this.response.station[idx].SENSOR_VARIABLES[b])[k]);
                                stackName = getKeys(_this.response.station[idx].SENSOR_VARIABLES)[j];
                                sensorStackLN.push(_this.response.sensorLongNames[i][stackName].long_name);
                                sensorStackUnits.push(_this.response.units[stackName]);
                            }

                        }
                    }
                } catch (err) {
                    console.log("Rut rho! makeTimeSeriesTable.er1");
                }
            }
        }

        /*
         * While this is probably not the best way to do this, we will scan the
         * long name array for duplicates and then append a number after the value
         * to let the user know the sensor number.
         */

        /* Now build this city ... */
        var qcStack = [];
        var table = document.createElement("TABLE");
        table.setAttribute("id", _this.config.table.tableID);
        table.setAttribute("class", "table table-responsive");

        document.getElementById(_this.config.table.tableID + "-container").appendChild(table);
        li = obj.date_time.length + 1;
        for (i = 0; i < li; i++) {

            var tableRow = document.createElement("TR");
            tableRow.setAttribute("id", "time-row-" + i);
            document.getElementById(_this.config.table.tableID).appendChild(tableRow);

            var tableTD, tableCell;

            lj = sensorStack.length;
            if (i === 0) {
                /* Write table header */
                for (j = 0; j < lj; j++) {
                    tableTD = document.createElement("TH");
                    tableCell = document.createTextNode(sensorStackLN[j]);
                    tableTD.appendChild(tableCell);
                    tableRow.appendChild(tableTD);
                }
                document.getElementById("time-row-" + i).appendChild(tableTD);

            } else {
                /* Write table body */
                for (j = 0; j < lj; j++) {

                    tableTD = document.createElement("TD");
                    tableCell = document.createTextNode("");

                    if ((qcFlag && sensorStack[j] in _this.response.qcFlags[idx]) &&
                        !slimFlag && _this.response.qcFlags[idx][sensorStack[j]][i - 1] !== null) {

                        /* Handle table types */
                        //if (lnFlag && !detachFlag && !slimFlag) {
                        if (lnFlag && !slimFlag && inlineFlag) {
                            /* Long names */
                            tableTD.setAttribute("class", _this.config.table.qcFailClass);
                            tableCell.nodeValue =
                                obj[sensorStack[j]][i - 1] + " (" +
                                _this.response.qcLongNames[_this.response.qcFlags[idx][sensorStack[j]][i - 1]]['NAME'] + ")";

                        } else {
                            /* Codes only used in conjuction with config.detached */
                            if (obj[sensorStack[j]][i - 1] === null) {
                                tableTD.setAttribute("class", _this.config.table.qcFailClass);
                                tableCell.nodeValue = "";
                            } else {
                                tableTD.setAttribute("class", _this.config.table.qcFailClass);
                                tableCell.nodeValue =
                                    obj[sensorStack[j]][i - 1] +
                                    " (" + _this.response.qcFlags[idx][sensorStack[j]][i - 1] + ")";
                            }

                            /* Push to qcStack */
                            for (k = 0; k < _this.response.qcFlags[idx][sensorStack[j]][i - 1].length; k++) {
                                if (qcStack.indexOf(_this.response.qcFlags[idx][sensorStack[j]][i - 1][k]) == -1) {
                                    qcStack.push(_this.response.qcFlags[idx][sensorStack[j]][i - 1][k]);
                                }
                            }

                        }
                    } else {
                        /* slim table */
                        if (obj[sensorStack[j]][i - 1] === null) {
                            tableCell.nodeValue = "";
                        } else {
                            tableCell.nodeValue = obj[sensorStack[j]][i - 1];
                        }

                    }

                    tableTD.appendChild(tableCell);
                    document.getElementById("time-row-" + i).appendChild(tableTD);

                } // End [j]
            }
        }

        /* Insert the units (if wanted) */
        if (_this.config.table.showUnits) {
            var row = table.insertRow(1);
            i = 0;
            li = sensorStack.length;
            for (i = 0; i < li; i++) {
                var cell = row.insertCell(i);
                cell.innerHTML = sensorStackUnits[i];
            }
        }

        /* Print qcStack list to screen */
        var qcObj;
        if (qcStack.length > 0) {
            var detachedList = document.getElementById(_this.config.table.detached);
            for (i = 0; i < qcStack.length; i++) {
                var listItem = document.createElement("LI");

                qcObj = findQCLongName(qcStack[i]);
                var listItemText = document.createTextNode(qcStack[i] + " : " + qcObj[0].NAME);
                listItem.appendChild(listItemText);
                document.getElementById(_this.config.table.detached).appendChild(listItem);
            }
        }

        return 0;

        /* Local function to find a value in the JSON object */
        function findQCLongName(code) {

            return _this.response.qcLongNames.filter(
                function(data) {
                    return data['ID'] == code;
                }
            );
        }

    }

    /**
     * We use this to keep tabs on the async processes
     * @method
     * @memberof mesonet
     */
    var activeRequest;
    mesonet.prototype.async = function() {
        $.when(activeRequest).done(function() {
            // do nothing
        });
        return activeRequest;
    };

    /**
     * Configure HTML table generator .table()
     * @method
     * @memberof mesonet
     */
    mesonet.prototype.configureTable = function(obj) {
        var i = 0;
        for (i = 0; i < getKeys(obj).length; i++) {
            this.config.table[getKeys(obj)[i]] = obj[getKeys(obj)[i]];
        }
    };

    /**
     * Manages API calls and data processing
     * @method
     * @memberof mesonet
     */
    mesonet.prototype.fetch = function(_queryParameters) {

        var keys;
        var i = 0;
        if (_queryParameters === 0) {
            keys = getKeys(getArgs);
            for (i = 0; i < keys.length; i++) {
                this.response.queryParameters[keys[i]] = getArgs[keys[i]];
            }
        } else {
            keys = getKeys(_queryParameters);
            for (i = 0; i < keys.length; i++) {
                this.response.queryParameters[keys[i]] = _queryParameters[keys[i]];
            }
        }

        /* We need to send/recieve an async call */
        activeRequest = _fetch();
        $.when(activeRequest).done(function() {
            // Hello Denzians!
        });
        return this.response;
    };

    /**
     * Configures API token
     * @method
     * @memberof mesonet
     */
    mesonet.prototype.setApiToken = function(token) {
        this.config.fetch.apiToken = token;
        this.response.queryParameters.token = token;
        return 0;
    };

    /**
     * Sets the API service
     * @method
     * @memberof mesonet
     */
    mesonet.prototype.setService = function(string) {
        try {
            this.config.fetch.service = string;
        } catch (err) {
            return 1;
        }
        return 0;
    };

    /**
     * Prints mesonet.response (API Results) to console
     * @method
     * @memberof mesonet
     */
    mesonet.prototype.showResponse = function() {
        $.when(activeRequest).done(function() {
            console.log(_this.response);
        });
        return 0;
    };

    /**
     * Handles HTML generator
     * @method
     * @memberof mesonet
     */
    mesonet.prototype.table = function() {
        /** @todo Should be able to pass HTML ID */
        $.when(activeRequest).done(function() {
            _makeTimeSeriesTable();
        });
        return 0;
    };

    /**
     * Returns the URL arguments
     * @method
     * @memberof mesonet
     */
    mesonet.prototype.windowArgs = function() {
        return getArgs;
    };

}
