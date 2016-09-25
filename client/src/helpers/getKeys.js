/**
 * @function getKeys
 * @summary  Returns the keys of a JSON stack
 *
 * @param    JSON/Object    {object}
 * @returns  Object keys    {array}
 */
function getKeys(obj) {
    //"use strict";

    var keys = [];
    for (var i in obj) {
        keys.push(i);
    }
    return keys;
}
