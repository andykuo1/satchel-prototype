import { clearSlots, clearSlotsOfSlottedId, getNextAvailableSlottedId, getSlotCoordsByIndex, getSlotIndexByCoords, getSlotIndexBySlottedId, getSlottedIdByItemId, setSlots } from './InvSlots.js';

/**
 * @typedef {import('./Inv.js').Inventory} Inventory
 * @typedef {import('./Item.js').ItemId} ItemId
 * @typedef {import('./Item.js').Item} Item
 */

/**
 * @param {Inventory} inv 
 * @param {ItemId} itemId 
 * @returns {boolean}
 */
export function hasItem(inv, itemId) {
  for(let item of Object.values(inv.items)) {
    if (item.itemId === itemId) {
      return true;
    }
  }
  return false;
}

/**
 * @param {Inventory} inv 
 * @param {Item} item 
 * @param {number} coordX 
 * @param {number} coordY 
 * @returns {boolean} Whether item was placed into inventory.
 */
export function putItem(inv, item, coordX, coordY) {
  if (!inv) {
    throw new Error('Cannot put item to non-existant inventory.');
  }
  if (!item) {
    throw new Error('Cannot put null item.');
  }
  if (hasItem(inv, item.itemId)) {
    throw new Error(`Cannot put item '${item.itemId}' that already exists in inventory '${inv.invId}'.`);
  }
  let slottedId = getNextAvailableSlottedId(inv);
  let result = setSlots(inv, coordX, coordY, coordX + item.width - 1, coordY + item.height - 1, slottedId);
  if (result) {
    inv.items[slottedId] = item;
    return true;
  } else {
    return false;
  }
}

/**
 * @param {Inventory} inv 
 * @param {ItemId} itemId
 * @returns {boolean} Whether item was removed from invenetory.
 */
export function removeItem(inv, itemId) {
  if (!inv) {
    throw new Error('Cannot remove item from non-existant inventory.');
  }
  if (!hasItem(inv, itemId)) {
    throw new Error(`Cannot remove item '${itemId}' that does not exist in inventory '${inv.invId}'.`);
  }
  const slottedId = getSlottedIdByItemId(inv, itemId);
  if (!slottedId) {
    throw new Error(`Failed to remove item '${itemId}' - missing slotted id in inventory '${inv.invId}'.`);
  }
  const slotIndex = getSlotIndexBySlottedId(inv, slottedId);
  if (slotIndex >= 0) {
    let item = getItemByItemId(inv, itemId);
    let [fromX, fromY] = getSlotCoordsByIndex(inv, slotIndex);
    let toX = fromX + item.width - 1;
    let toY = fromY + item.height - 1;
    clearSlotsOfSlottedId(inv, fromX, fromY, toX, toY, slottedId);
  } else {
    // No slot index exists for item. Just remove the item.
  }
  delete inv.items[slottedId];
  return true;
}

/**
 * @param {Inventory} inv 
 */
export function clearItems(inv) {
  inv.slots.fill(0);
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
  let slotValue = inv.slots[slotIndex];
  if (slotValue) {
    return inv.items[slotValue].itemId;
  } else {
    return null;
  }
}

/**
 * @param {Inventory} inv 
 * @param {ItemId} itemId
 * @returns {Item}
 */
 export function getItemByItemId(inv, itemId) {
  for(let item of Object.values(inv.items)) {
    if (item.itemId === itemId) {
      return item;
    }
  }
  return null;
}

/**
 * @param {Inventory} inv 
 * @returns {Array<ItemId>}
 */
export function getItemIds(inv) {
  return Object.values(inv.items).map(item => item.itemId);
}

/**
 * @param {Inventory} inv 
 * @returns {Array<Item>}
 */
export function getItems(inv) {
  return Object.values(inv.items);
}
