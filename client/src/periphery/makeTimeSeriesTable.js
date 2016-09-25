/**
 * Create a HTML table and pass via DOM. Assumes that a config block has been
 * prepared/stored in `this.config.table`
 * @function makeTimeSeriesTable
 * @summary  Create a HTML table from data object
 * @private
 */
function _makeTimeSeriesTable() {

    /*
     * How to handle what station to use. `obj` is the date object from the
     * API response.
     */
    var obj = {};
    var idx = 0;
    var tmp;
    if (typeof _this.config.table.stid !== "undefined") {
        idx = _this.response.tableOfContents[_this.config.table.stid.toUpperCase()];
    } else {
        idx = 0;
    }

    obj = _this.response.station[idx].OBSERVATIONS;

    /* Set up truth table */
    var detachFlag = false;
    var slimFlag = false;
    var lnFlag = false;
    var qcFlag = false;
    var inlineFlag = false;

    if (typeof _this.config.table.detached != "undefined") {

        if (_this.config.table.detached && typeof _this.config.table.detached !== "undefined") {
            detachFlag = true;
        }
        if (!_this.config.table.detached && typeof _this.config.table.detached !== "undefined") {
            slimFlag = true;
        }

        if (_this.response.qcLongNames[0] !== null) {
            lnFlag = true;
        }

        if (_this.response.qcFlags[idx] !== undefined) {
            qcFlag = true;
        }

        if (_this.config.table.detached === "inline") {
            inlineFlag = true;
        }

    } else {
        slimFlag = true;
    }


    /* Counters and limits */
    var i = 0;
    var j = 0;
    var k = 0;
    var li = 0;
    var lj = 0;

    /* Determine if the user wants the table in descending order */
    if (_this.config.table.descend) {
        var stack = getKeys(obj);
        li = stack.length;
        for (i = 0; i < li; i++) {
            obj[stack[i]] = obj[stack[i]].reverse();
        }
    }

    /* As we work thru the variables we want to append them to stack */
    var sensorStack = ["date_time"];
    var sensorStackLN = ["Time"];
    var sensorStackUnits = [""];

    li = _this.response.sensorLongNames.length;
    for (i = 0; i < li; i++) {

        lj = getKeys(_this.response.station[idx].SENSOR_VARIABLES).length;
        for (j = 0; j < lj; j++) {

            try {
                var a = getKeys(_this.response.sensorLongNames[i])[0];
                var b = getKeys(_this.response.station[idx].SENSOR_VARIABLES)[j];

                if (a === b) {

                    var nKeys = getKeys(_this.response.station[idx].SENSOR_VARIABLES[b]).length;

                    var stackName;
                    for (k = 0; k < nKeys; k++) {

                        var tmp1 = [];
                        var tmp2 = [];
                        if (nKeys > 1) {
                            for (k = 0; k < nKeys; k++) {

                                /* Test for multiples in the sensor stack and reverse the order in the stack */
                                tmp1.push(getKeys(_this.response.station[idx].SENSOR_VARIABLES[b])[k]);
                                stackName = getKeys(_this.response.station[idx].SENSOR_VARIABLES)[j];
                                tmp2.push(_this.response.sensorLongNames[i][stackName].long_name + " (" + (k + 1) + ")");
                                sensorStackUnits.push(_this.response.units[stackName]);

                                /* We've got a full sub stack, now we can sort multiples */
                                if ((k + 1) == nKeys) {
                                    tmp1.sort();

                                    var kk = 0;
                                    for (kk = 0; kk < nKeys; kk++) {
                                        sensorStack.push(tmp1[kk]);
                                        sensorStackLN.push(tmp2[kk]);
                                    }
                                    tmp1 = [];
                                    tmp2 = [];
                                }
                            }
                        } else {
                            sensorStack.push(getKeys(_this.response.station[idx].SENSOR_VARIABLES[b])[k]);
                            stackName = getKeys(_this.response.station[idx].SENSOR_VARIABLES)[j];
                            sensorStackLN.push(_this.response.sensorLongNames[i][stackName].long_name);
                            sensorStackUnits.push(_this.response.units[stackName]);
                        }

                    }
                }
            } catch (err) {
                console.log("Rut rho! makeTimeSeriesTable.er1");
            }
        }
    }

    /*
     * While this is probably not the best way to do this, we will scan the
     * long name array for duplicates and then append a number after the value
     * to let the user know the sensor number.
     */

    /* Now build this city ... */
    var qcStack = [];
    var table = document.createElement("TABLE");
    table.setAttribute("id", _this.config.table.tableID);
    table.setAttribute("class", "table table-responsive");

    document.getElementById(_this.config.table.tableID + "-container").appendChild(table);
    li = obj.date_time.length + 1;
    for (i = 0; i < li; i++) {

        var tableRow = document.createElement("TR");
        tableRow.setAttribute("id", "time-row-" + i);
        document.getElementById(_this.config.table.tableID).appendChild(tableRow);

        var tableTD, tableCell;

        lj = sensorStack.length;
        if (i === 0) {
            /* Write table header */
            for (j = 0; j < lj; j++) {
                tableTD = document.createElement("TH");
                tableCell = document.createTextNode(sensorStackLN[j]);
                tableTD.appendChild(tableCell);
                tableRow.appendChild(tableTD);
            }
            document.getElementById("time-row-" + i).appendChild(tableTD);

        } else {
            /* Write table body */
            for (j = 0; j < lj; j++) {

                tableTD = document.createElement("TD");
                tableCell = document.createTextNode("");

                if ((qcFlag && sensorStack[j] in _this.response.qcFlags[idx]) &&
                    !slimFlag && _this.response.qcFlags[idx][sensorStack[j]][i - 1] !== null) {

                    /* Handle table types */
                    //if (lnFlag && !detachFlag && !slimFlag) {
                    if (lnFlag && !slimFlag && inlineFlag) {
                        /* Long names */
                        tableTD.setAttribute("class", _this.config.table.qcFailClass);
                        tableCell.nodeValue =
                            obj[sensorStack[j]][i - 1] + " (" +
                            _this.response.qcLongNames[_this.response.qcFlags[idx][sensorStack[j]][i - 1]]['NAME'] + ")";

                    } else {
                        /* Codes only used in conjuction with config.detached */
                        if (obj[sensorStack[j]][i - 1] === null) {
                            tableTD.setAttribute("class", _this.config.table.qcFailClass);
                            tableCell.nodeValue = "";
                        } else {
                            tableTD.setAttribute("class", _this.config.table.qcFailClass);
                            tableCell.nodeValue =
                                obj[sensorStack[j]][i - 1] +
                                " (" + _this.response.qcFlags[idx][sensorStack[j]][i - 1] + ")";
                        }

                        /* Push to qcStack */
                        for (k = 0; k < _this.response.qcFlags[idx][sensorStack[j]][i - 1].length; k++) {
                            if (qcStack.indexOf(_this.response.qcFlags[idx][sensorStack[j]][i - 1][k]) == -1) {
                                qcStack.push(_this.response.qcFlags[idx][sensorStack[j]][i - 1][k]);
                            }
                        }

                    }
                } else {
                    /* slim table */
                    if (obj[sensorStack[j]][i - 1] === null) {
                        tableCell.nodeValue = "";
                    } else {
                        tableCell.nodeValue = obj[sensorStack[j]][i - 1];
                    }

                }

                tableTD.appendChild(tableCell);
                document.getElementById("time-row-" + i).appendChild(tableTD);

            } // End [j]
        }
    }

    /* Insert the units (if wanted) */
    if (_this.config.table.showUnits) {
        var row = table.insertRow(1);
        i = 0;
        li = sensorStack.length;
        for (i = 0; i < li; i++) {
            var cell = row.insertCell(i);
            cell.innerHTML = sensorStackUnits[i];
        }
    }

    /* Print qcStack list to screen */
    var qcObj;
    if (qcStack.length > 0) {
        var detachedList = document.getElementById(_this.config.table.detached);
        for (i = 0; i < qcStack.length; i++) {
            var listItem = document.createElement("LI");

            qcObj = findQCLongName(qcStack[i]);
            var listItemText = document.createTextNode(qcStack[i] + " : " + qcObj[0].NAME);
            listItem.appendChild(listItemText);
            document.getElementById(_this.config.table.detached).appendChild(listItem);
        }
    }

    return 0;

    /* Local function to find a value in the JSON object */
    function findQCLongName(code) {

        return _this.response.qcLongNames.filter(
            function(data) {
                return data['ID'] == code;
            }
        );
    }

}
