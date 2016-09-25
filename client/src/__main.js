/* jshint strict: true */
/* jshint -W069 */
/* jslint plusplus: true */

/*
 * MesonetJS - a Mesonet API JavaScript interface
 * @author MesoWest/SynopticLabs
 * @version 0.5.x
 * @class mesonet API interface
 */

function mesonet() {
    /* jshint validthis: true */
    "use strict";

    /** Internal pointer to connect public & private functions */
    var _this = this;

    @import "core/dataObjects.js"
    @import "helpers/getArgs.js"
    @import "helpers/getKeys.js"

    @import "core/fetch.js"
    @import "core/fetchStationMetadata.js"
    @import "core/fetchQcTypes.js"
    @import "core/fetchTimeSeries.js"
    @import "core/fetchVariableNames.js"

    @import "periphery/makeTimeSeriesTable.js"
    @import "methods/async.js"
    @import "methods/configureTable.js"
    @import "methods/fetchHandler.js"
    @import "methods/setApiToken.js"
    @import "methods/setService.js"
    @import "methods/showResponse.js"
    @import "methods/tableHandler.js"
    @import "methods/windowArgs.js"
}
