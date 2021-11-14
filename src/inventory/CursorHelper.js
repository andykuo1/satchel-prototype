/**
 * @typedef CursorContext
 * @property {import('./element/InventoryCursorElement.js').InventoryCursorElement} element
 * @property {HTMLElement} ground
 */

const CURSOR_CONTEXT = {
  element: null,
  ground: null,
};

/**
 * @param inventoryElement
 */
export function setCursorElement(inventoryElement) {
  const ctx = getCursorContext();
  if (ctx.element) {
    ctx.element = null;
  }

  if (inventoryElement) {
    ctx.element = inventoryElement;
  }
}

/** @returns {CursorContext} */
export function getCursorContext() {
  return CURSOR_CONTEXT;
}

/**
 * @param ctx
 * @returns {import('./element/InventoryCursorElement.js').InventoryCursorElement}
 */
export function getCursorElement(ctx) {
  return ctx.element;
}
