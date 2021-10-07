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