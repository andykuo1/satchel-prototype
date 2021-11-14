import {
  getInventory,
  dispatchInventoryChange,
  deleteItemFromStore,
  isItemInStore,
  addItemToStore,
  getItemInStore,
  dispatchItemChange,
} from './InventoryStore.js';
import { getSlotCoordsByIndex, getSlotIndexByCoords, isSlotCoordEmpty } from './InvSlots.js';
import * as InvItems from './InvItems.js';

/**
 * @typedef {import('./InventoryStore.js').Item} Item
 * @typedef {import('./InventoryStore.js').ItemId} ItemId
 * @typedef {import('./InventoryStore.js').InventoryStore} InventoryStore
 * @typedef {import('./InventoryStore.js').Inventory} Inventory
 * @typedef {import('./InventoryStore.js').InventoryId} InventoryId
 * @typedef {import('./InventoryStore.js').InventoryType} InventoryType
 */

/**
 * Remove and delete item from inventory.
 *
 * @param {InventoryStore} store
 * @param {ItemId} itemId
 * @param {InventoryId} invId
 * @returns {Item} The removed item.
 */
export function removeItem(store, itemId, invId) {
  let inv = getExistingInventory(store, invId);
  if (InvItems.hasItem(inv, itemId)) {
    let item = InvItems.getItemByItemId(inv, itemId);
    InvItems.removeItem(inv, itemId);
    dispatchInventoryChange(store, invId);
    deleteItemFromStore(store, itemId, item);
    return item;
  } else {
    return null;
  }
}

/**
 * Clear items from inventory.
 *
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 * @returns {Array<Item>} The cleared items.
 */
export function clearItems(store, invId) {
  let inv = getExistingInventory(store, invId);
  let items = InvItems.getItems(inv);
  InvItems.clearItems(inv);
  for(let item of items) {
    deleteItemFromStore(store, item.itemId, item);
  }
  dispatchInventoryChange(store, invId);
  return items;
}

/**
 * Put and create item in inventory. Will throw if unable to.
 *
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 * @param {Item} item
 * @param {number} coordX
 * @param {number} coordY
 */
export function putItem(store, invId, item, coordX, coordY) {
  let inv = getExistingInventory(store, invId);
  const itemId = item.itemId;
  // TODO: Since items are kept globally, create it here
  if (!isItemInStore(store, itemId)) {
    addItemToStore(store, itemId, item);
    dispatchItemChange(store, itemId);
  }
  // Put in slots
  InvItems.putItem(inv, item, coordX, coordY);
  dispatchInventoryChange(store, invId);
}

export function getItemSlotIndex(store, inventoryId, itemId, startIndex = 0) {
  const inventory = getExistingInventory(store, inventoryId);
  const length = getInventorySlotCount(store, inventoryId, inventory);
  for (let i = startIndex; i < length; ++i) {
    let invItemId = inventory.slots[i];
    if (invItemId && invItemId === itemId) {
      return i;
    }
  }
  return -1;
}

export function getItemSlotCoords(store, inventoryId, itemId) {
  let slotIndex = getItemSlotIndex(store, inventoryId, itemId);
  return getInventorySlotCoords(store, inventoryId, slotIndex);
}

/**
 * @param {InventoryStore} store
 * @param {ItemId} itemId
 * @param {InventoryId} inventoryId
 * @returns {boolean}
 */
export function hasItem(store, itemId, inventoryId) {
  return getItemSlotIndex(store, inventoryId, itemId) >= 0;
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} inventoryId
 * @returns {boolean}
 */
export function isInventoryEmpty(store, inventoryId) {
  const inventory = getExistingInventory(store, inventoryId);
  const length = getInventorySlotCount(store, inventoryId, inventory);
  for (let i = 0; i < length; ++i) {
    let itemId = inventory.slots[i];
    if (itemId) {
      return false;
    }
  }
  return true;
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 * @param {number} coordX
 * @param {number} coordY
 * @returns {Item}
 */
export function getInventoryItemAt(store, invId, coordX, coordY) {
  const inventory = getExistingInventory(store, invId);
  const slotIndex = getInventorySlotIndexByCoords(store, invId, coordX, coordY);
  if (slotIndex < 0) {
    return null;
  }
  const itemId = inventory.slots[slotIndex];
  if (!itemId) {
    return null;
  }
  const item = getItemInStore(store, itemId);
  return item;
}

export function getInventoryItemIdAt(store, inventoryId, coordX, coordY) {
  let slotIndex = getInventorySlotIndexByCoords(store, inventoryId, coordX, coordY);
  const inventory = getExistingInventory(store, inventoryId);
  return inventory.slots[slotIndex];
}

export function isInventorySlotEmpty(store, inventoryId, coordX, coordY) {
  const inventory = getExistingInventory(store, inventoryId);
  return isSlotCoordEmpty(inventory, coordX, coordY);
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} inventoryId
 * @returns {Iterable<ItemId>}
 */
export function getInventoryItemIds(store, inventoryId) {
  const inventory = getExistingInventory(store, inventoryId);
  const length = getInventorySlotCount(store, inventoryId, inventory);
  let result = new Set();
  for (let i = 0; i < length; ++i) {
    let itemId = inventory.slots[i];
    if (itemId) {
      result.add(itemId);
    }
  }
  return result;
}

export function getInventoryItems(store, invId) {
  let result = [];
  for (let itemId of getInventoryItemIds(store, invId)) {
    result.push(getItemInStore(store, itemId));
  }
  return result;
}

export function getInventorySlotCoords(store, invId, slotIndex) {
  let inv = getExistingInventory(store, invId);
  return getSlotCoordsByIndex(inv, slotIndex);
}

export function getInventorySlotIndexByCoords(store, inventoryId, slotX, slotY) {
  const inventory = getExistingInventory(store, inventoryId);
  return getSlotIndexByCoords(inventory, slotX, slotY);
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} inventoryId
 * @param {Inventory} inventory
 * @returns {InventoryType}
 */
export function getInventoryType(store, inventoryId, inventory) {
  return inventory.type;
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} inventoryId
 * @param {Inventory} inventory
 * @returns {number}
 */
export function getInventorySlotCount(store, inventoryId, inventory) {
  return inventory.length;
}

/**
 * Get an existing inventory. Will throw if it does not exist.
 *
 * @param {InventoryStore} store
 * @param {InventoryId} inventoryId
 * @returns {Inventory}
 */
export function getExistingInventory(store, inventoryId) {
  const inventory = getInventory(store, inventoryId);
  if (!inventory) {
    throw new Error(`Cannot get non-existant inventory '${inventoryId}'.`);
  }
  return inventory;
}
