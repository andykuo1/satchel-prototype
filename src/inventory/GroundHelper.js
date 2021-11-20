import { uuid } from '../util/uuid.js';
import { getCursorContext } from './CursorHelper.js';
import { getCursor } from './element/InventoryCursorElement.js';
import { createSocketInventoryInStore, getInventoryStore } from './InventoryStore.js';
import { addItemToInventory, clearItemsInInventory } from './InventoryTransfer.js';
import { createTemporaryInventoryView } from './InvView.js';

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
 * Assumes the given item is not part of any inventory and that the itemId is unique!
 * 
 * @param freedItem 
 */
export function dropOnGround(freedItem) {
  let store = getInventoryStore();
  const ground = getGroundContainer();
  const inventory = createSocketInventoryInStore(store, uuid());
  addItemToInventory(store, inventory.invId, freedItem, 0, 0);
  const invElement = createTemporaryInventoryView(getInventoryStore(), inventory.invId);
  ground.append(invElement);
}

export function clearGround() {
  const ground = getGroundContainer();
  const invs = /** @type {NodeListOf<InventoryGridElement>} */ (ground.querySelectorAll('inventory-grid'));
  let store = getInventoryStore();
  for (const grid of invs) {
    clearItemsInInventory(store, grid.invId);
  }
}
