/**
 * @typedef {import('./Item.js').Item} Item
 * @typedef {import('./Item.js').ItemId} ItemId
 */

import { uuid } from '../util/uuid.js';
import { copyItem } from './Item.js';

/**
 * @typedef {string} InventoryId
 * @typedef {'grid'|'socket'} InventoryType
 *
 * @typedef Inventory
 * @property {InventoryId} invId
 * @property {InventoryType} type
 * @property {Record<ItemId, Item>} items
 * @property {Array<ItemId>} slots
 * @property {number} width
 * @property {number} height
 * @property {number} length
 * @property {string} displayName
 * @property {object} metadata
 */

/**
 * Create an inventory.
 *
 * @param {InventoryId} invId
 * @param {InventoryType} invType
 * @param {number} slotCount
 * @param {number} maxCoordX
 * @param {number} maxCoordY
 * @returns {Inventory}
 */
function createInventory(invId, invType, slotCount, maxCoordX, maxCoordY) {
  let inv = {
    invId,
    type: invType,
    items: {},
    slots: new Array(slotCount),
    width: maxCoordX,
    height: maxCoordY,
    length: slotCount,
    displayName: '', // TODO: Not used yet.
    metadata: {}, // TODO: Not used yet.
  };
  return inv;
}

/**
 * Create a grid inventory of given size.
 *
 * @param {InventoryId} invId
 * @param {number} width
 * @param {number} height
 * @returns {Inventory}
 */
export function createGridInventory(invId, width, height) {
  return createInventory(invId, 'grid', width * height, width, height);
}

/**
 * Create a socket inventory.
 *
 * @param {InventoryId} invId
 * @returns {Inventory}
 */
export function createSocketInventory(invId) {
  // TODO: width, height = Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY
  return createInventory(invId, 'socket', 1, 1, 1);
}

/**
 * @param {Inventory} other
 * @param {Inventory} [dst]
 * @returns {Inventory}
 */
export function copyInventory(other, dst = undefined) {
  const invId = other.invId || uuid();
  const type = other.type || 'grid';
  const width = Number(other.width) || 1;
  const height = Number(other.height) || 1;
  const length = Number(other.length) || 1;
  if (!dst) {
    dst = createInventory(invId, type, length, width, height);
  } else {
    dst.invId = invId;
    dst.type = type;
    dst.width = width;
    dst.height = height;
    dst.length = length;
  }
  if (typeof other.items === 'object') {
    for (let item of Object.values(other.items)) {
      let newItem = copyItem(item);
      dst.items[newItem.itemId] = item;
    }
  }
  if (Array.isArray(other.slots)) {
    const length = Math.min(other.slots.length, dst.slots.length);
    for (let i = 0; i < length; ++i) {
      dst.slots[i] = other.slots[i];
    }
  }
  if (typeof other.displayName === 'string') {
    dst.displayName = other.displayName;
  }
  if (typeof other.metadata === 'object') {
    try {
      dst.metadata = JSON.parse(JSON.stringify(other.metadata));
    } catch (e) {
      dst.metadata = {};
    }
  }
  return dst;
}

export function getInventorySlotCount(inv) {
  return inv.length;
}
