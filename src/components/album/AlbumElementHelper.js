import { addInventoryChangeListener, removeInventoryChangeListener } from '../../events/InvEvents.js';
import { addItemToInventory } from '../../satchel/inv/InventoryTransfer.js';
import { cloneItem } from '../../satchel/item/Item.js';
import {
  createSocketInvInStore,
  deleteInvInStore,
  getInvInStore,
  isInvInStore,
} from '../../store/InvStore.js';
import { uuid } from '../../util/uuid.js';

/**
 * @typedef {import('../invgrid/InvSocketElement.js').InvSocketElement} InvSocketElement
 * @typedef {import('../../satchel/item/Item.js').Item} Item
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 * @typedef {import('../../satchel/inv/Inv.js').InvId} InvId
 * @typedef {import('../../store/SatchelStore.js').SatchelStore} Store
 */

/**
 * @param {Item} a
 * @param {Item} b
 * @returns {number}
 */
export function itemAlphabeticalComparator(a, b) {
  return (a.displayName || '').localeCompare(b.displayName || '');
}

/**
 * @param {Store} store
 * @param {Item} readOnlyItem
 * @param {Record<InvId, ItemId>} itemInvMap
 * @param {() => void} invChangeCallback
 * @returns {InvSocketElement}
 */
export function setUpItemInvElement(store, readOnlyItem, itemInvMap, invChangeCallback) {
  let invId = uuid();
  createSocketInvInStore(store, invId);
  let newItem = cloneItem(readOnlyItem);
  addItemToInventory(store, invId, newItem, 0, 0);
  let invElement = /** @type {InvSocketElement} */ (document.createElement('inv-socket'));
  invElement.invId = invId;
  invElement.toggleAttribute('noinput', true);
  invElement.toggleAttribute('temp', true);
  itemInvMap[invId] = newItem.itemId;
  addInventoryChangeListener(store, invId, invChangeCallback);
  return invElement;
}

/**
 * @param {Store} store
 * @param {InvId} invId
 * @param {Record<InvId, ItemId>} itemInvMap
 * @param {() => void} invChangeCallback
 * @returns {ItemId}
 */
export function tearDownItemInvElement(store, invId, itemInvMap, invChangeCallback) {
  removeInventoryChangeListener(store, invId, invChangeCallback);
  let itemId = itemInvMap[invId];
  delete itemInvMap[invId];
  return itemId;
}

/**
 * @param {Store} store
 * @param {HTMLCollection} itemElements
 * @param {Record<InvId, ItemId>} itemInvMap
 * @param {() => void} invChangeCallback
 */
export function cleanUpItemInvElements(store, itemElements, itemInvMap, invChangeCallback) {
  // Remove all temp inv listeners
  const keys = Object.keys(itemInvMap);
  for (let invId of keys) {
    tearDownItemInvElement(store, invId, itemInvMap, invChangeCallback);
  }

  // Destroy all items
  let elements = [];
  const length = itemElements.length;
  for (let i = 0; i < length; ++i) {
    let element = /** @type {InvSocketElement} */ (itemElements.item(i));
    let invId = element.invId;
    if (isInvInStore(store, invId)) {
      let inv = getInvInStore(store, invId);
      deleteInvInStore(store, invId, inv);
    }
    elements.push(element);
  }
  for (let element of elements) {
    element.remove();
  }
}
