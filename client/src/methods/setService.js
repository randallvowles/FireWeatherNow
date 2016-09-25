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
