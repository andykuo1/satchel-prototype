/**
 * @typedef CursorContext
 * @property {HTMLElement} ground
 */

const CURSOR_CONTEXT = {
  ground: null,
};

/** @returns {CursorContext} */
export function getCursorContext() {
  return CURSOR_CONTEXT;
}
