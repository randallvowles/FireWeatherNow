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
