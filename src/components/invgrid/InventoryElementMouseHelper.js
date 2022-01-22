import { getSatchelStore } from '../../store/SatchelStore.js';
import { getItemByItemId } from '../../satchel/inv/InvItems.js';
import { getSlotCoordsByIndex, getSlotIndexByItemId } from '../../satchel/inv/InvSlots.js';
import { copyItem } from '../../satchel/item/Item.js';

import { getCursor } from '../cursor/index.js';
import { getInvInStore } from '../../store/InvStore.js';
import { dispatchItemChange } from '../../events/ItemEvents.js';

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
  const store = getSatchelStore();
  const itemId = itemElement.itemId;
  const invId = containerElement.invId;
  const inv = getInvInStore(store, invId);
  const item = getItemByItemId(inv, itemId);
  let cursor = getCursor();
  let result;
  if (containerElement.hasAttribute('copyoutput')) {
    if (!itemId) {
      return;
    }
    if (cursor.hasHeldItem()) {
      // NOTE: Swapping is performed on putDown(), so ignore for pick up.
      return;
    }
    let newItem = copyItem(item);
    // Try splitting the stack.
    if (mouseEvent.shiftKey && item.stackSize > 1) {
      newItem.stackSize = Math.floor(item.stackSize / 2);
    }
    const slotIndex = getSlotIndexByItemId(inv, itemId);
    const [fromItemX, fromItemY] = getSlotCoordsByIndex(inv, slotIndex);
    cursor.setHeldItem(newItem, fromItemX - clientCoordX, fromItemY - clientCoordY);
    result = true;
  } else {
    // Try splitting the stack.
    if (mouseEvent.shiftKey && !cursor.hasHeldItem() && item.stackSize > 1) {
      let newStackSize = Math.floor(item.stackSize / 2);
      let remaining = item.stackSize - newStackSize;
      let newItem = copyItem(item);
      newItem.stackSize = newStackSize;
      item.stackSize = remaining;
      dispatchItemChange(store, itemId);
      const slotIndex = getSlotIndexByItemId(inv, itemId);
      const [fromItemX, fromItemY] = getSlotCoordsByIndex(inv, slotIndex);
      cursor.setHeldItem(newItem, fromItemX - clientCoordX, fromItemY - clientCoordY);
      result = true;
    } else {
      result = cursor.pickUp(containerElement.invId, itemId, clientCoordX, clientCoordY);
    }
  }
  if (result) {
    // HACK: This should really grab focus to the item.
    let activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    return false;
  }
}

/**
 * Perform pickup logic for container elements.
 *
 * @param {MouseEvent} mouseEvent The triggering mouse event.
 * @param {HTMLElement & { _container: HTMLElement, invId: string }} containerElement The target container element.
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
  const mergable = !containerElement.hasAttribute('noinput');
  const shiftKey = mouseEvent.shiftKey;
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
  let result = cursor.putDown(containerElement.invId, clientCoordX, clientCoordY, swappable, mergable, shiftKey);
  if (result) {
    // HACK: This should really grab focus to the item.
    let activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
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
