/**
 * Created by deep on 7/30/17.
 */

/**
 *  Method that removes an element from the array
 *
 *  usage removeElement(array, element1, element2, ... , elementN)
 *
 *  @param array - the array
 *
 *  @return (Array) the array without the element
 */
exports.removeElement = function (array) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && array.length) {
        what = a[--L];
        while ((ax = array.indexOf(what)) != -1) {
            array.splice(ax, 1);
        }
    }
    return array;
};

/**
 * Adds an element to the end of the array if you can add an element to the end of the array
 *
 * @param array - the array to add the element to
 * @param value - the value to add to the end of the array
 *
 * @return the array with the element added
 * */
exports.addElement = function (array, value) {
    if (!array) array = [];

    if (array.indexOf(value) === -1) {
        array.push(value);
    }

    return array;
};