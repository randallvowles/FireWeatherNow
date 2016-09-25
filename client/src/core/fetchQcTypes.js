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
