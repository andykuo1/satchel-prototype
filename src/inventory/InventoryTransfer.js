import {
  getInventory,
  dispatchInventoryChange,
} from './InventoryStore.js';
import { getSlotCoordsByIndex, getSlotIndexByItemId, isSlotCoordEmpty } from './InvSlots.js';
import * as InvItems from './InvItems.js';
import { getInventorySlotCount } from './Inv.js';

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
  InvItems.putItem(inv, item, coordX, coordY);
  dispatchInventoryChange(store, invId);
}

export function getItemSlotIndex(store, invId, itemId, startIndex = 0) {
  const inv = getExistingInventory(store, invId);
  return getSlotIndexByItemId(inv, itemId, startIndex);
}

export function getItemSlotCoords(store, inventoryId, itemId) {
  const inv = getExistingInventory(store, inventoryId);
  const slotIndex = getSlotIndexByItemId(inv, itemId, 0);
  return getSlotCoordsByIndex(inv, slotIndex);
}

/**
 * @param {InventoryStore} store
 * @param {ItemId} itemId
 * @param {InventoryId} invId
 * @returns {boolean}
 */
export function hasItem(store, itemId, invId) {
  let inv = getExistingInventory(store, invId);
  return InvItems.hasItem(inv, itemId);
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} inventoryId
 * @returns {boolean}
 */
export function isInventoryEmpty(store, inventoryId) {
  const inv = getExistingInventory(store, inventoryId);
  const length = getInventorySlotCount(inv);
  for (let i = 0; i < length; ++i) {
    let itemId = inv.slots[i];
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
  const inv = getExistingInventory(store, invId);
  if (isSlotCoordEmpty(inv, coordX, coordY)) {
    return null;
  }
  let itemId = InvItems.getItemIdBySlotCoords(inv, coordX, coordY);
  return InvItems.getItemByItemId(inv, itemId);
}

export function getInventoryItemIdAt(store, inventoryId, coordX, coordY) {
  const inv = getExistingInventory(store, inventoryId);
  return InvItems.getItemIdBySlotCoords(inv, coordX, coordY);
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
  const inv = getExistingInventory(store, inventoryId);
  const length = getInventorySlotCount(inv);
  let result = new Set();
  for (let i = 0; i < length; ++i) {
    let itemId = inv.slots[i];
    if (itemId) {
      result.add(itemId);
    }
  }
  return result;
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
