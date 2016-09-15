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
