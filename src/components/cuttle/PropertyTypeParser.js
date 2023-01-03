/**
 * @template T
 * @typedef {(text: string) => T|Parser<T>} PropertyType
 */

/**
 * @template T
 * @typedef Parser<T>
 * @property {(text: string) => T} parse
 * @property {(value: T) => string} stringify
 */

/** @type {Map<PropertyType<?>, Parser<?>>} */
const PARSERS = new Map();
PARSERS.set(Number, {
  parse: Number,
  stringify: String,
});
PARSERS.set(Boolean, {
  parse: Boolean,
  stringify: String,
});
PARSERS.set(String, {
  parse: String,
  stringify: String,
});
PARSERS.set(Object, JSON);
PARSERS.set(Array, JSON);

/**
 * @template T
 * @param {PropertyType<T>} type
 * @returns {Parser<T>}
 */
export function getPropertyTypeParser(type) {
  if (PARSERS.has(type)) {
    return PARSERS.get(type);
  }
  let result;
  if ('parse' in type && 'stringify' in type) {
    result = /** @type {Parser<T>}*/ (/** @type {unknown}*/ (type));
  } else if (typeof type === 'function') {
    result = /** @type {Parser<T>}*/ ({
      parse: type,
      stringify: String,
    });
  } else {
    throw new Error('Unsupported property type.');
  }
  PARSERS.set(type, result);
  return result;
}
