/**
 * @function getArgs
 * @summary  Gets the query paramters from the Url
 * @returns  getArgs {object} or "undefined"
 */
var getArgs = function() {
    //"use strict";

    var a = {};
    var b = window.location.search.substring(1).split("&");
    var pair;
    var c;
    var l = b.length;

    if (window.location.search.substring(1).split("=") === 1) {
        return "undefined";
    } else {
        for (var i = 0; i < l; i++) {
            /* grab the values and add a key */
            pair = b[i].split("=");
            if (typeof a[pair[0]] === "undefined") {
                a[pair[0]] = decodeURIComponent(pair[1]);
                // if (pair[1].split(",").length > 1) {
                //     a[pair[0]] = pair[1].split(",");
                // }
            }
        }
        return a;
    }

}();
