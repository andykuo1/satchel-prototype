import { getInventoryStore } from '../InventoryStore.js';
import { getExistingInventory } from '../InventoryTransfer.js';
import { getItemByItemId } from '../InvItems.js';
import { getSlotCoordsByIndex, getSlotIndexByItemId } from '../InvSlots.js';
import { copyItem } from '../../satchel/item/Item.js';
import { getCursor } from './InventoryCursorElement.js';

/**
 * @typedef {import('./InventoryItemElement.js').InventoryItemElement} InventoryItemElement
 * @typedef {import('./InventoryGridElement.js').InventoryGridElement} InventoryGridElement
 */

export const DEFAULT_ITEM_UNIT_SIZE = 48;

/**
 * Perform pickup logic for item elements.
 *
 * @param {MouseEvent} mouseEvent The triggering mouse event.
 * @param {InventoryItemElement} itemElement The target element.
 * @param {number} unitSize The item unit size.
 * @returns {boolean} Whether to allow the event to propagate.
 */
export function itemMouseDownCallback(mouseEvent, itemElement, unitSize) {
  const containerElement = itemElement.container;
  if (containerElement.hasAttribute('nooutput')) {
    return;
  }
  const boundingRect = containerElement._container.getBoundingClientRect();
  const clientCoordX = getClientCoordX(
    boundingRect,
    mouseEvent.clientX,
    unitSize
  );
  const clientCoordY = getClientCoordY(
    boundingRect,
    mouseEvent.clientY,
    unitSize
  );
  let cursor = getCursor();
  let result;
  if (containerElement.hasAttribute('copyoutput')) {
    const itemId = itemElement.itemId;
    const invId = containerElement.invId;
    if (!itemId) {
      return;
    }
    if (cursor.hasHeldItem()) {
      // NOTE: Swapping is performed on putDown(), so ignore for pick up.
      return;
    }
    let store = getInventoryStore();
    let inv = getExistingInventory(store, invId);
    const slotIndex = getSlotIndexByItemId(inv, itemId);
    const [fromItemX, fromItemY] = getSlotCoordsByIndex(inv, slotIndex);
    const item = getItemByItemId(inv, itemId);
    let newItem = copyItem(item);
    cursor.setHeldItem(newItem, fromItemX - clientCoordX, fromItemY - clientCoordY);
    result = true;
  } else {
    result = cursor.pickUp(containerElement.invId, itemElement.itemId, clientCoordX, clientCoordY);
  }
  if (result) {
    // HACK: This should really grab focus to the item.
    document.activeElement.blur();
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    return false;
  }
}

/**
 * Perform pickup logic for container elements.
 *
 * @param {MouseEvent} mouseEvent The triggering mouse event.
 * @param {InventoryGridElement} containerElement The target container element.
 * @param {number} unitSize The item unit size.
 * @returns {boolean} Whether to allow the event to propagate.
 */
export function containerMouseUpCallback(
  mouseEvent,
  containerElement,
  unitSize
) {
  if (containerElement.hasAttribute('noinput')) {
    return;
  }
  const swappable = !containerElement.hasAttribute('nooutput');
  const boundingRect = containerElement._container.getBoundingClientRect();
  const clientCoordX = getClientCoordX(
    boundingRect,
    mouseEvent.clientX,
    unitSize
  );
  const clientCoordY = getClientCoordY(
    boundingRect,
    mouseEvent.clientY,
    unitSize
  );
  let cursor = getCursor();
  let result = cursor.putDown(containerElement.invId, clientCoordX, clientCoordY, swappable);
  if (result) {
    // HACK: This should really grab focus to the item.
    document.activeElement.blur();
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    return false;
  }
}

/**
 * @param {DOMRect} elementBoundingRect
 * @param {number} clientX
 * @param {number} unitSize
 * @returns {number}
 */
export function getClientCoordX(elementBoundingRect, clientX, unitSize) {
  return Math.trunc((clientX - elementBoundingRect.x) / unitSize);
}

/**
 * @param {DOMRect} elementBoundingRect
 * @param {number} clientY
 * @param {number} unitSize
 * @returns {number}
 */
export function getClientCoordY(elementBoundingRect, clientY, unitSize) {
  return Math.trunc((clientY - elementBoundingRect.y) / unitSize);
}
