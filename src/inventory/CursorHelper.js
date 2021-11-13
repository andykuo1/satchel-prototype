import { getInventoryStore } from './InventoryStore.js';
import {
  clearItems,
  getInventoryItemAt,
  putItem,
} from './InventoryTransfer.js';

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

/**
 * @param ctx
 * @returns {import('./InventoryStore.js').Item}
 */
export function getCursorItem(ctx) {
  const cursorInventoryId = ctx.element.name;
  return getInventoryItemAt(getInventoryStore(), cursorInventoryId, 0, 0);
}

/**
 * @param {CursorContext} ctx
 * @param freedItem
 */
export function storeToCursor(ctx, freedItem) {
  if (!freedItem) {
    return;
  }
  const cursorInventoryId = ctx.element.name;
  putItem(getInventoryStore(), cursorInventoryId, freedItem, 0, 0);
  ctx.element.style.display = 'unset';
  ctx.element.startPlaceDownBuffer();
}

/**
 * @param {CursorContext} ctx
 */
export function freeFromCursor(ctx) {
  clearItems(getInventoryStore(), ctx.element.name);
  ctx.element.style.display = 'none';
  ctx.element.clearPlaceDownBuffer();
}
