import { getPropertyTypeParser } from './PropertyTypeParser.js';

/**
 * @template T
 * @typedef {import('./PropertyTypeParser.js').PropertyType<T>} PropertyType<T>
 */

/**
 * @param {PropertyType<?>} type
 * @param {string} attribute
 * @returns {PropertyDescriptor}
 */
export function createPropertyTypeDescriptor(type, attribute) {
  return createReflectivePropertyDescriptor(type, attribute);
}

/**
 * @param {PropertyType<?>} type
 * @param {string} attribute
 * @returns {PropertyDescriptor}
 */
function createReflectivePropertyDescriptor(type, attribute) {
  switch (type) {
    case Boolean:
      return {
        /** @this {HTMLElement} */
        get() {
          return this.hasAttribute(attribute);
        },
        /** @this {HTMLElement} */
        set(value) {
          this.toggleAttribute(attribute, Boolean(value));
        },
      };
    case String:
      return {
        /** @this {HTMLElement} */
        get() {
          return this.getAttribute(attribute);
        },
        /** @this {HTMLElement} */
        set(value) {
          this.setAttribute(attribute, value);
        },
      };
    default:
      const parser = getPropertyTypeParser(type);
      return {
        /** @this {HTMLElement} */
        get() {
          return parser.parse(this.getAttribute(attribute));
        },
        /** @this {HTMLElement} */
        set(value) {
          this.setAttribute(attribute, parser.stringify(value));
        },
      };
  }
}
