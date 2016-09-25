/**
 * Configures API token
 * @method
 * @memberof mesonet
 */
mesonet.prototype.setApiToken = function(token) {
    this.config.fetch.apiToken = token;
    this.response.queryParameters.token = token;
    return 0;
};
