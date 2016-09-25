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
