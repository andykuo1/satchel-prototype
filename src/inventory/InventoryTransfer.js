import {
  isInventoryInStore,
  getInventoryInStore,
  dispatchInventoryChange,
  dispatchItemChange,
} from './InventoryStore.js';
import * as InvItems from './InvItems.js';
import { getInventorySlotCount } from './Inv.js';
import { copyItem } from './Item.js';

/**
 * @typedef {import('./InventoryStore.js').Item} Item
 * @typedef {import('./InventoryStore.js').ItemId} ItemId
 * @typedef {import('./InventoryStore.js').InventoryStore} InventoryStore
 * @typedef {import('./InventoryStore.js').Inventory} Inventory
 * @typedef {import('./InventoryStore.js').InventoryId} InventoryId
 * @typedef {import('./InventoryStore.js').InventoryType} InventoryType
 */

/**
 * @param {InventoryStore} store 
 * @param {InventoryId} invId 
 * @param {Item} item 
 * @param {number} coordX 
 * @param {number} coordY
 * @returns {boolean}
 */
export function addItemToInventory(store, invId, item, coordX, coordY) {
  let inv = getExistingInventory(store, invId);
  let result = InvItems.putItem(inv, item, coordX, coordY);
  if (result) {
    dispatchInventoryChange(store, invId);
    return true;
  }
  return false;
}

/**
 * @param {InventoryStore} store 
 * @param {InventoryId} invId 
 * @param {ItemId} itemId
 * @returns {boolean}
 */
export function removeItemFromInventory(store, invId, itemId) {
  let inv = getExistingInventory(store, invId);
  if (InvItems.hasItem(inv, itemId)) {
    let result = InvItems.removeItem(inv, itemId);
    if (result) {
      dispatchInventoryChange(store, invId);
      return true;
    }
  }
  return false;
}

/**
 * @param {InventoryStore} store 
 * @param {InventoryId} invId
 * @returns {boolean}
 */
export function clearItemsInInventory(store, invId) {
  let inv = getExistingInventory(store, invId);
  if (!isInventoryEmpty(store, invId)) {
    InvItems.clearItems(inv);
    dispatchInventoryChange(store, invId);
    return true;
  }
  return false;
}

/**
 * @param {InventoryStore} store 
 * @param {InventoryId} invId
 * @param {ItemId} itemId
 * @returns {boolean}
 */
export function hasItemInInventory(store, invId, itemId) {
  let inv = getExistingInventory(store, invId);
  return InvItems.hasItem(inv, itemId);
}

export function getItemAtSlotIndex(store, invId, slotIndex) {
  let inv = getExistingInventory(store, invId);
  let itemId = InvItems.getItemIdBySlotIndex(inv, slotIndex);
  return InvItems.getItemByItemId(inv, itemId);
}

export function getItemAtSlotCoords(store, invId, coordX, coordY) {
  let inv = getExistingInventory(store, invId);
  let itemId = InvItems.getItemIdBySlotCoords(inv, coordX, coordY);
  return InvItems.getItemByItemId(inv, itemId);
}

export function getItemIdAtSlotCoords(store, invId, coordX, coordY) {
  let inv = getExistingInventory(store, invId);
  return InvItems.getItemIdBySlotCoords(inv, coordX, coordY);
}

export function getItemIdsInSlots(store, invId) {
  let inv = getExistingInventory(store, invId);
  let result = new Set();
  for(let slotValue of inv.slots) {
    if (slotValue) {
      result.add(inv.items[slotValue].itemId);
    }
  }
  return result;
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 * @returns {boolean}
 */
export function isInventoryEmpty(store, invId) {
  const inv = getExistingInventory(store, invId);
  for(let slotValue of inv.slots) {
    if (slotValue) {
      return false;
    }
  }
  return true;
}

/**
 * Get an existing inventory. Will throw if it does not exist.
 *
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 * @returns {Inventory}
 */
export function getExistingInventory(store, invId) {
  if (isInventoryInStore(store, invId)) {
    return getInventoryInStore(store, invId);
  } else {
    throw new Error(`Cannot get non-existant inventory '${invId}'.`);
  }
}

/**
 * @param store
 * @param itemId
 * @param state
 */
 export function updateItem(store, invId, itemId, state) {
  let inv = getExistingInventory(store, invId);
  let item = InvItems.getItemByItemId(inv, itemId);
  if (!item) {
    throw new Error('Cannot update null item.');
  }
  copyItem(state, item);
  dispatchItemChange(store, itemId);
}
