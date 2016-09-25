/**
 * Configure HTML table generator .table()
 * @method
 * @memberof mesonet
 */
mesonet.prototype.configureTable = function(obj) {
    var i = 0;
    for (i = 0; i < getKeys(obj).length; i++) {
        this.config.table[getKeys(obj)[i]] = obj[getKeys(obj)[i]];
    }
};
