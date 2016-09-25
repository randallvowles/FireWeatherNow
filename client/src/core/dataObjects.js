/**
 * Data containers & configuration objects used in the class
 */
this.response = {
    tableOfContents: {},
    station: [],
    sensorStack: [],
    sensorLongNames: {},
    summary: {},
    units: {},
    qcFlags: {}, // Formerly QcTable
    qcFlagNames: [],
    qcEnabled: [],
    qcLongNames: {},
    queryParameters: {}
};

// @TODO: Need to be defaulted in functions
this.config = {
    fetch: {
        service: "TimeSeries",
        apiToken: "not-set",
        longNames: true,
        qcTypes: true,
        notify: false
    },
    table: {
        //stid: "hol",
        //stidx: 67,
        qcFailClass: "qc-fail",
        htmlID: "tabular-data", // might be updated via the function call
        detached: "qc-codes",
        //detached: false,
        //detached: "inline",
        showUnits: true,
        descend: true
    },
    csv: {
        //stid: "hol",
        //stidx: 67,
    }
};
