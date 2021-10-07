export function upgradeProperty(element, propertyName) {
    if (Object.prototype.hasOwnProperty.call(element, propertyName)) {
        let value = element[propertyName];
        delete element[propertyName];
        element[propertyName] = value;
    }
}

export function distanceSquared(x1, y1, x2, y2) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    return dx * dx + dy * dy;
}

/**
 * Generates a uuid v4.
 * 
 * @param {number} a The placeholder (serves for recursion within function).
 * @returns {string} The universally unique id.
 */
export function uuid(a = undefined) {
    // https://gist.github.com/jed/982883
    return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,uuid);
}
