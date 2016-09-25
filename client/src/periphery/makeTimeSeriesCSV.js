/**
 * Create a CSV table and pass via DOM
 * @function makeTimeSeriesCSV
 * @summary  Create a CSV table from data object
 */
function _makeTimeSeriesCSV(obj, meta, dest) {
    //"use strict";

    var qcFlag = true;
    if (_M.QcTable === null) {
        alert("No QC table");
        qcFlag = false;
    }

    lnFlag = false;
    if (_M.QcLongNames[0] !== null) {
        //alert("QC Names loaded");
        lnFlag = true;
    }

    var s = "";
    var keyList = getKeys(obj);

    /* Write CSV header and determine the unique QC Flag codes*/
    var iLim = getKeys(QcTable).length;
    var jLim = 0;
    var qcStack = [];
    var i = 0;
    var j = 0;
    for (i = 0; i < iLim; i++) {
        jLim = (QcTable[getKeys(QcTable[0])[i]]).length;
        for (j = 0; j < jLim; j++) {
            if (qcStack.indexOf( QcTable[0][getKeys(QcTable[0])[i]][0][0] )) {
                qcStack.push( QcTable[0][getKeys(QcTable[0])[i]][0][0] );
            }
        }
    }
    //console.log(obj);
    s = "#\n# CSV data for " + meta['NAME'] + " (" + meta['STID'] + ")\n";
    if (qcStack.length !== 0) {
        s = s.concat("# QC Flags:\n");
        for (i = 0; i < qcStack.length; i++) {
            s = s.concat("#\t" + qcStack[i] + " : " + _M.QcLongNames[qcStack[i] - 1]['NAME'] + "\n");
        }
    }
    s = s.concat("#\n");

    var delim = "";
    for (i = 0; i < obj['date_time'].length + 1; i++) {
        if (i === 0) {
            /* Write column names */
            for (j = 0; j < keyList.length; j++) {
                if (j > 0) {
                    delim = ", ";
                }
                s = s.concat(delim, keyList[j]);
            }
            s = s.concat("\n");
        } else {
            /* Write table body */
            for (j = 0; j < keyList.length; j++) {
                if (j > 0) {
                    delim = ", ";
                }
                if (qcFlag && keyList[j] in QcTable) {
                    s = s.concat(delim, obj[keyList[j]][i - 1], ";", _M.QcTable[keyList[j]][i - 1]);
                } else {
                    s = s.concat(delim, obj[keyList[j]][i - 1]);
                }

            }
            s = s.concat("\n");
        }
    }

    document.getElementById(dest).innerHTML = s;
}
