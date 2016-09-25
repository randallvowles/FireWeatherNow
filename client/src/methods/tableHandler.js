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
