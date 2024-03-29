import * as InvItems from './InvItems.js';
import { getInventorySlotCount } from './Inv.js';
import { cloneItem } from '../item/Item.js';
import { dispatchItemChange } from '../../events/ItemEvents.js';
import { dispatchInventoryChange } from '../../events/InvEvents.js';
import { getInvInStore, isInvInStore } from '../../store/InvStore.js';

/**
 * @typedef {import('../item/Item.js').Item} Item
 * @typedef {import('../item/Item.js').ItemId} ItemId
 * @typedef {import('../../store/SatchelStore.js').SatchelStore} SatchelStore
 * @typedef {import('./Inv.js').Inventory} Inventory
 * @typedef {import('./Inv.js').InvId} InvId
 * @typedef {import('./Inv.js').InventoryType} InventoryType
 */

/**
 * @param {SatchelStore} store
 * @param {InvId} invId
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
 * @param {SatchelStore} store
 * @param {InvId} invId
 * @param {ItemId} itemId
 * @returns {boolean}
 */
export function removeItemFromInventory(store, invId, itemId) {
  let inv = getExistingInventory(store, invId);
  if (InvItems.hasItem(inv, itemId)) {
    InvItems.removeItem(inv, itemId);
    dispatchInventoryChange(store, invId);
    return true;
  }
  return false;
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
  return new Set(inv.slots.filter((itemId) => typeof itemId === 'string'));
}

/**
 * @param {SatchelStore} store
 * @param {InvId} invId
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
 * @param {SatchelStore} store
 * @param {InvId} invId
 * @returns {Inventory}
 */
export function getExistingInventory(store, invId) {
  if (isInvInStore(store, invId)) {
    return getInvInStore(store, invId);
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
