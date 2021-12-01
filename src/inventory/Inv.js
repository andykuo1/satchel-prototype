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
 * @property {Array<number>} slots
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
  if (dst === other) {
    throw new Error('Cannot copy inventory into itself.');
  }
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
    if (Array.isArray(dst.slots)) {
      dst.slots.fill(0);
    } else {
      dst.slots = new Array(length);
    }
    dst.items = {};
  }
  if (Array.isArray(other.slots) && typeof other.items === 'object') {
    const otherLength = getInventorySlotCount(other);
    const dstLength = getInventorySlotCount(dst);
    const minLength = Math.min(otherLength, dstLength);
    for (let i = 0; i < minLength; ++i) {
      let slotValue = other.slots[i];
      if (slotValue) {
        dst.slots[i] = slotValue;
        dst.items[slotValue] = copyItem(other.items[slotValue]);
      }
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
