/**
 * @typedef {import('./Item.js').ItemId} ItemId
 */

/**
 * @typedef {string} InventoryId
 * @typedef {'grid'|'socket'} InventoryType
 *
 * @typedef Inventory
 * @property {string} name
 * @property {InventoryId} invId
 * @property {InventoryType} type
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
    invId, // TODO: Not used yet.
    name: invId,
    type: invType,
    items: {}, // TODO: Not used yet.
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
