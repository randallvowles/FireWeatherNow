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
