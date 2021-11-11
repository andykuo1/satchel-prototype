import { updateCursorPosition } from './CursorHelper.js';
import { pickUp, putDown } from './InventoryHelper.js';
import { getInventory, getInventoryStore, getItem } from './InventoryStore.js';

/**
 * @typedef {import('./InventoryItem.js').InventoryItemElement} InventoryItemElement
 * @typedef {import('./InventoryGrid.js').InventoryGridElement} InventoryGridElement
 */

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
  const item = getItem(getInventoryStore(), itemElement.itemId);
  const inv = getInventory(getInventoryStore(), containerElement.name);
  const result = pickUp(
    item,
    inv,
    clientCoordX,
    clientCoordY
  );
  updateCursorPosition(mouseEvent.clientX, mouseEvent.clientY, unitSize);
  if (result) {
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
  const inventory = getInventory(getInventoryStore(), containerElement.name);
  const result = putDown(inventory, clientCoordX, clientCoordY);
  if (result) {
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
