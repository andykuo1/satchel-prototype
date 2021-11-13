import { uuid } from '../util/uuid.js';
import {
  freeFromCursor,
  getCursorContext,
  getCursorItem,
} from './CursorHelper.js';
import { insertIn } from './InventoryHelper.js';
import { addInventoryToStore, createSocketInventory, getInventoryStore } from './InventoryStore.js';
import { clearItems } from './InventoryTransfer.js';
import { createTemporaryInventoryView } from './InventoryView.js';

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
  const ctx = getCursorContext();
  const item = getCursorItem(ctx);
  if (item && ctx.placeDownBuffer) {
    freeFromCursor(ctx);
    dropOnGround(item);
  }
}

export function getGroundContainer() {
  return getCursorContext().ground;
}

/**
 * @param freedItem
 */
export function dropOnGround(freedItem) {
  const ground = getGroundContainer();
  const inventory = createSocketInventory(uuid());
  addInventoryToStore(getInventoryStore(), inventory.invId, inventory);
  insertIn(inventory, freedItem);

  const invElement = createTemporaryInventoryView(
    getInventoryStore(),
    inventory.name
  );
  ground.append(invElement);
}

export function clearGround() {
  const ground = getGroundContainer();
  for (const grid of ground.querySelectorAll('inventory-grid')) {
    clearItems(getInventoryStore(), grid.name);
  }
}
