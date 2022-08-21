import { uuid } from '../../util/uuid.js';
import { cloneItem, copyItem } from '../item/Item.js';

/**
 * @typedef {import('../item/Item.js').Item} Item
 * @typedef {import('../item/Item.js').ItemId} ItemId
 */

/**
 * @typedef {string} InvId
 * @typedef {'grid'|'socket'} InventoryType
 *
 * @typedef Inventory
 * @property {InvId} invId
 * @property {InventoryType} type
 * @property {Record<ItemId, Item>} items
 * @property {Array<ItemId>} slots
 * @property {number} width
 * @property {number} height
 * @property {number} length
 * @property {number} groundX
 * @property {number} groundY
 * @property {string} displayName
 * @property {object} metadata
 */

/**
 * Create an inventory.
 *
 * @param {InvId} invId
 * @param {InventoryType} invType
 * @param {number} slotCount
 * @param {number} maxCoordX
 * @param {number} maxCoordY
 * @returns {Inventory}
 */
export function createInventory(invId, invType, slotCount, maxCoordX, maxCoordY) {
  let inv = {
    invId,
    type: invType,
    items: {},
    slots: new Array(slotCount).fill(null),
    width: maxCoordX,
    height: maxCoordY,
    length: slotCount,
    groundX: 0,
    groundY: 0,
    displayName: '',
    metadata: {}, // TODO: Not used yet.
  };
  return inv;
}

/**
 * Create a grid inventory of given size.
 *
 * @param {InvId} invId
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
 * @param {InvId} invId
 * @returns {Inventory}
 */
export function createSocketInventory(invId) {
  // TODO: width, height = Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY
  return createInventory(invId, 'socket', 1, 1, 1);
}

/**
 * Copies the target inventory to destination as a new inventory. Unlike cloneInventory(),
 * the resultant inventory can be added to the store with its copy.
 * 
 * @param {Inventory} other
 * @param {Inventory} [dst]
 * @returns {Inventory}
 */
export function copyInventory(other, dst = undefined) {
  let result = cloneInventory(other, dst, { preserveItemId: false });
  if (result.invId === other.invId) {
    result.invId = uuid();
  }
  return result;
}

/**
 * Clones the target inventory to destination as a stored inventory. This is usually used
 * to store an exact replica of an inventory state, including ids. Unlike copyInventory(),
 * the resultant inventory CANNOT be added to the store with its clone. It must be replace
 * its clone.
 * 
 * @param {Inventory} other
 * @param {Inventory} [dst]
 * @param {object} [opts]
 * @param {boolean} [opts.preserveItemId]
 * @returns {Inventory}
 */
export function cloneInventory(other, dst = undefined, opts = {}) {
  const { preserveItemId = true } = opts;
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
  let overrideItemIds = {};
  if (typeof other.items === 'object') {
    if (preserveItemId) {
      for(let item of Object.values(other.items)) {
        let newItem = cloneItem(item);
        dst.items[newItem.itemId] = newItem;
      }
    } else {
      for(let item of Object.values(other.items)) {
        let newItem = copyItem(item);
        overrideItemIds[item.itemId] = newItem.itemId;
        dst.items[newItem.itemId] = newItem;
      }
    }
  }
  if (Array.isArray(other.slots)) {
    if (preserveItemId) {
      const length = Math.min(other.slots.length, dst.slots.length);
      for (let i = 0; i < length; ++i) {
        dst.slots[i] = other.slots[i];
      }
    } else {
      const length = Math.min(other.slots.length, dst.slots.length);
      for (let i = 0; i < length; ++i) {
        let otherItemId = other.slots[i];
        let newItemId = overrideItemIds[otherItemId];
        dst.slots[i] = newItemId || null;
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
