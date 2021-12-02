import {
  isInventoryInStore,
  getInventoryInStore,
  dispatchInventoryChange,
} from './InventoryStore.js';
import * as InvItems from './InvItems.js';
import { getInventorySlotCount } from '../satchel/inv/Inv.js';
import { cloneItem } from '../satchel/item/Item.js';
import { dispatchItemChange } from '../satchel/item/ItemEvents.js';

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
 */
export function addItemToInventory(store, invId, item, coordX, coordY) {
  let inv = getExistingInventory(store, invId);
  InvItems.putItem(inv, item, coordX, coordY);
  dispatchInventoryChange(store, invId);
}

/**
 * @param {InventoryStore} store 
 * @param {InventoryId} invId 
 * @param {ItemId} itemId
 */
export function removeItemFromInventory(store, invId, itemId) {
  let inv = getExistingInventory(store, invId);
  if (InvItems.hasItem(inv, itemId)) {
    InvItems.removeItem(inv, itemId);
    dispatchInventoryChange(store, invId);
  }
}

export function clearItemsInInventory(store, invId) {
  let inv = getExistingInventory(store, invId);
  InvItems.clearItems(inv);
  dispatchInventoryChange(store, invId);
}

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
  return new Set(inv.slots.filter(itemId => typeof itemId === 'string'));
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 * @returns {boolean}
 */
export function isInventoryEmpty(store, invId) {
  const inv = getExistingInventory(store, invId);
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
  cloneItem(state, item);
  dispatchItemChange(store, itemId);
}
