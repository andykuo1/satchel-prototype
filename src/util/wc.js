/**
 * Upgrade a property during connectedCallback() if property was set before
 * attaching to document. This should trigger attributeChangedCallback().
 *
 * @param {HTMLElement} element The element to upgrade the property for.
 * @param {string} propertyName The name of the property.
 */
export function upgradeProperty(element, propertyName) {
  if (Object.prototype.hasOwnProperty.call(element, propertyName)) {
    const value = element[propertyName];
    delete element[propertyName];
    element[propertyName] = value;
  }
}
