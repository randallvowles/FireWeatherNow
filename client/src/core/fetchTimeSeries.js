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
