import { dropOnGround } from '../inventory/GroundHelper.js';
import {
  getInventoryStore,
} from '../inventory/InventoryStore.js';
import { getExistingInventory, updateItem } from '../inventory/InventoryTransfer.js';
import { getItemByItemId } from '../inventory/InvItems.js';

/** @typedef {import('../inventory/Item.js').Item} Item */

/**
 * @param itemBuilderElement
 * @param invId
 * @param itemId
 */
export function openItemBuilder(itemBuilderElement, invId = undefined, itemId = undefined) {
  if (invId && itemId) {
    const inv = getExistingInventory(getInventoryStore(), invId);
    const item = getItemByItemId(inv, itemId);
    itemBuilderElement.fromItem(invId, itemId, item);
  } else {
    itemBuilderElement.fromNew();
  }
}

export function applyItemBuilder(target) {
  const item = target.toItem();
  let invId = target.getSourceInvId();
  let itemId = target.getSourceItemId();
  if (invId) {
    updateItem(getInventoryStore(), invId, itemId, {
      displayName: item.displayName,
      description: item.description,
      stackSize: item.stackSize,
    });
  } else {
    dropOnGround(item);
  }
}

export function resetItemBuilder(target) {
  target.reset();
}
