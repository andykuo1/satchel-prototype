import { uuid } from '../util/uuid.js';
import { getCursorContext } from './CursorHelper.js';
import { getCursor } from './element/InventoryCursorElement.js';
import { createSocketInventoryInStore, getInventoryStore } from './InventoryStore.js';
import { clearItems, putItem } from './InventoryTransfer.js';
import { createTemporaryInventoryView } from './InventoryView.js';

/** @typedef {import('./element/InventoryGridElement.js').InventoryGridElement} InventoryGridElement */

/**
 * @param ground
 */
export function setGroundContainer(ground) {
  const ctx = getCursorContext();
  if (ctx.ground) {
    document.removeEventListener('mouseup', onMouseUp);
  }
  if (ground) {
    ctx.ground = ground;
    document.addEventListener('mouseup', onMouseUp);
  }
}

/**
 * @param {MouseEvent} e
 */
function onMouseUp(e) {
  const cursor = getCursor();
  const item = cursor.getHeldItem();
  if (!item) {
    return;
  }
  cursor.clearHeldItem();
  dropOnGround(item);
}

export function getGroundContainer() {
  return getCursorContext().ground;
}

/**
 * @param freedItem
 */
export function dropOnGround(freedItem) {
  const ground = getGroundContainer();
  const inventory = createSocketInventoryInStore(getInventoryStore(), uuid());
  putItem(getInventoryStore(), inventory.invId, freedItem, 0, 0);
  const invElement = createTemporaryInventoryView(getInventoryStore(), inventory.invId);
  ground.append(invElement);
}

export function clearGround() {
  const ground = getGroundContainer();
  const invs = /** @type {NodeListOf<InventoryGridElement>} */ (ground.querySelectorAll('inventory-grid'));
  for (const grid of invs) {
    clearItems(getInventoryStore(), grid.invId);
  }
}
