import { clearSlots, getSlotCoordsByIndex, getSlotIndexByCoords, getSlotIndexByItemId, setSlots } from './InvSlots.js';

/**
 * @typedef {import('./Inv.js').Inventory} Inventory
 * @typedef {import('../item/Item.js').ItemId} ItemId
 * @typedef {import('../item/Item.js').Item} Item
 */

/**
 * @param {Inventory} inv 
 * @param {ItemId} itemId 
 * @returns {boolean}
 */
export function hasItem(inv, itemId) {
  let item = inv.items[itemId];
  if (item) {
    return true;
  } else {
    return false;
  }
}

/**
 * @param {Inventory} inv 
 * @param {Item} item 
 * @param {number} coordX 
 * @param {number} coordY 
 */
export function putItem(inv, item, coordX, coordY) {
  if (!inv) {
    throw new Error('Cannot put item to non-existant inventory.');
  }
  if (!item) {
    throw new Error('Cannot put null item.');
  }
  const itemId = item.itemId;
  if (itemId in inv.items) {
    throw new Error(`Cannot put item '${itemId}' that already exists in inventory '${inv.invId}'.`);
  }
  inv.items[itemId] = item;
  setSlots(inv, coordX, coordY, coordX + item.width - 1, coordY + item.height - 1, itemId);
}

/**
 * @param {Inventory} inv 
 * @param {ItemId} itemId
 */
export function removeItem(inv, itemId) {
  if (!inv) {
    throw new Error('Cannot remove item from non-existant inventory.');
  }
  if (!(itemId in inv.items)) {
    throw new Error(`Cannot remove item '${itemId}' that does not exist in inventory '${inv.invId}'.`);
  }
  // If slots exist, then check it is in there.
  if (inv.slots.length > 0) {
    let slotIndex = getSlotIndexByItemId(inv, itemId);
    if (slotIndex < 0) {
      throw new Error(`Failed to remove item '${itemId}' - missing slot index for item.`);
    }
    let item = getItemByItemId(inv, itemId);
    let [fromX, fromY] = getSlotCoordsByIndex(inv, slotIndex);
    let toX = fromX + item.width - 1;
    let toY = fromY + item.height - 1;
    clearSlots(inv, fromX, fromY, toX, toY);
  }
  // And delete it regardless.
  delete inv.items[itemId];
  return true;
}

/**
 * @param {Inventory} inv 
 */
export function clearItems(inv) {
  clearSlots(inv, 0, 0, inv.width - 1, inv.height - 1);
  inv.items = {};
}

/**
 * @param {Inventory} inv 
 * @param {number} coordX 
 * @param {number} coordY 
 * @returns {ItemId}
 */
export function getItemIdBySlotCoords(inv, coordX, coordY) {
  let slotIndex = getSlotIndexByCoords(inv, coordX, coordY);
  return getItemIdBySlotIndex(inv, slotIndex);
}

/**
 * @param {Inventory} inv 
 * @param {number} slotIndex 
 * @returns {ItemId}
 */
export function getItemIdBySlotIndex(inv, slotIndex) {
  return inv.slots[slotIndex];
}

/**
 * @param {Inventory} inv 
 * @returns {Array<ItemId>}
 */
export function getItemIds(inv) {
  return Object.keys(inv.items);
}

/**
 * @param {Inventory} inv 
 * @param {ItemId} itemId
 * @returns {Item}
 */
export function getItemByItemId(inv, itemId) {
  return inv.items[itemId];
}

/**
 * @param {Inventory} inv 
 * @returns {Array<Item>}
 */
export function getItems(inv) {
  return Object.values(inv.items);
}
