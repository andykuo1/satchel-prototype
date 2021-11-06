/**
 * Generates a number hash for the string. For an empty string, it will return 0.
 *
 * @param {string} [value=''] The string to hash.
 * @returns {number} A hash that uniquely identifies the string.
 */
export function stringHash(value = '') {
  let hash = 0;
  for (let i = 0, length = value.length; i < length; i++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }

  return hash;
}
