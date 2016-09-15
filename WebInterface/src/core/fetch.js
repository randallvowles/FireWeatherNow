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
