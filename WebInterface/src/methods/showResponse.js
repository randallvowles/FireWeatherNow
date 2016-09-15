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
