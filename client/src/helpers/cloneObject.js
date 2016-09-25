/**
 * @function cloneObject
 * @constructor module:mesonet~cloneObject
 * @summary  Creates a clone of an object, non-attached in memmory
 * @param    {object} obj - Object to clone
 * @returns  {object} clone of object passed in
 */
function cloneObject(obj) {
    //"use strict";

    if (obj === null || typeof(obj) !== 'object' || 'isActiveClone' in obj) {
        return obj;
    }

    var temp;
    if (obj instanceof Date) {
        temp = new obj.constructor();
    } else {
        temp = obj.constructor();
    }

    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            obj.isActiveClone = null;
            /* I know this is recursive!! Please don't hate me */
            temp[key] = cloneObject(obj[key]);
            delete obj.isActiveClone;
        }
    }

    return temp;
}
