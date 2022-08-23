/**
 * @template T
 * @typedef {import('./PropertyTypeParser.js').PropertyType<T>} PropertyType<T>
 */

/**
 * @typedef {Record<string, PropertyAttribute<?>>} Props
 */

/**
 * @template T
 * @typedef PropertyAttribute<T>
 * @property {string} name
 * @property {PropertyType<T>} type
 * @property {string} attribute
 * @property {boolean} observed
 * @property {PropertyDescriptor} descriptor
 * @property {Function} propertyChangedCallback
 */

/**
 * @param {string} name
 * @param {object} [opts]
 * @param {PropertyType<?>} [opts.type]
 * @param {string} [opts.attribute]
 * @param {PropertyDescriptor} [opts.descriptor]
 * @param {boolean} [opts.observed]
 * @param {Function} [opts.propertyChangedCallback]
 * @returns {PropertyAttribute<?>}
 */
export function createPropertyAttribute(name, opts = undefined) {
  const {
    type = String,
    attribute = name.toLowerCase(),
    descriptor = null,
    observed = true,
    propertyChangedCallback = null,
  } = opts || {};
  return {
    name,
    type,
    attribute,
    observed,
    descriptor,
    propertyChangedCallback,
  };
}

/**
 * 
 * @param {HTMLElement} el 
 * @param {Props} props 
 * @param {string} propName 
 * @returns {any}
 */
export function getPropertyAttribute(el, props, propName) {
  let prop = props[propName];
  return prop.descriptor.get.call(el);
}

/**
 * @param {HTMLElement} el 
 * @param {Props} props 
 * @param {string} propName 
 * @param {string} value
 */
export function setPropertyAttribute(el, props, propName, value) {
  props[propName].descriptor.set.call(el, value);
}

/**
 * @param {HTMLElement} el 
 * @param {Props} props 
 */
export function upgradePropertyAttributes(el, props) {
  for(let prop of Object.values(props)) {
    upgradeProperty(el, prop.name);
  }
}

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
