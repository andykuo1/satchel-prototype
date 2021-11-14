import { uuid } from '../util/uuid.js';
import {
  getCursorContext,
  getCursorElement,
} from './CursorHelper.js';
import { insertIn } from './InventoryHelper.js';
import { createSocketInventoryInStore, getInventoryStore } from './InventoryStore.js';
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
  const element = getCursorElement(ctx);
  const item = element.getHeldItem();
  if (!item) {
    return;
  }
  element.releaseItem();
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
