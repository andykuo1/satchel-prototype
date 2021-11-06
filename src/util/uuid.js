/**
 * Generates a uuid v4.
 *
 * @param {number} a The placeholder (serves for recursion within function).
 * @returns {string} The universally unique id string.
 */
export function uuid(a = undefined) {
  // https://gist.github.com/jed/982883
  return a
    ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid);
}
