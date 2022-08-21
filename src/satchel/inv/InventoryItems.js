import { getExistingInvInStore } from '../../store/InvStore.js';
import { getItemByItemId, getItemIds, getItems, putItem, removeItem } from './InvItems.js';

export function putItemInInv(store, invId, item, coordX = 0, coordY = 0) {
  let inv = getExistingInvInStore(store, invId);
  putItem(inv, item, coordX, coordY);
}

export function removeItemFromInv(store, invId, itemId) {
  let inv = getExistingInvInStore(store, invId);
  return removeItem(inv, itemId);
}

export function hasItemInInv(store, invId, itemId) {
  let inv = getExistingInvInStore(store, invId);
  return itemId in inv.items;
}

export function getItemInInv(store, invId, itemId) {
  let inv = getExistingInvInStore(store, invId);
  return getItemByItemId(inv, itemId);
}

export function getItemIdsInInv(store, invId) {
  let inv = getExistingInvInStore(store, invId);
  return getItemIds(inv);
}

/**
 * @param {import('../../store/SatchelStore.js').SatchelStore} store 
 * @param {string} invId 
 * @returns {Array<import('../item/Item.js').Item>}
 */
export function getItemsInInv(store, invId) {
  let inv = getExistingInvInStore(store, invId);
  return getItems(inv);
}
