import { dijkstra2d } from '../util/dijkstra2d.js';
import { getCursor } from './element/InventoryCursorElement.js';
import {
  getInventoryList,
  getInventoryStore,
  getItems,
} from './InventoryStore.js';
import {
  getInventoryItemAt,
  getInventoryItems,
  isInventoryEmpty,
  putItem,
  removeItem,
} from './InventoryTransfer.js';

/**
 * @typedef {import('./InventoryStore.js').Inventory} Inventory
 * @typedef {import('./InventoryStore.js').ItemId} ItemId
 * @typedef {import('./InventoryStore.js').InventoryId} InventoryId
 */


/**
 * @param fromInventory
 * @param filter
 */
export function extractOut(fromInventory, filter) {
  const result = [];
  const items = getInventoryItems(getInventoryStore(), fromInventory.invId);
  for (const item of items) {
    if (filter(item, fromInventory)) {
      removeItem(getInventoryStore(), item.itemId, fromInventory.invId);
      result.push(item);
    }
  }

  return result;
}

/**
 * @param toInventory
 * @param freedItem
 */
export function insertIn(toInventory, freedItem) {
  if (
    toInventory.type === 'socket' &&
    isInventoryEmpty(getInventoryStore(), toInventory.invId)
  ) {
    return putItem(getInventoryStore(), toInventory.invId, freedItem, 0, 0);
  }
  const cursor = getCursor();
  const invWidth = toInventory.width;
  const invHeight = toInventory.height;
  const itemWidth = freedItem.width;
  const itemHeight = freedItem.height;
  const maxCoordX = invWidth - itemWidth;
  const maxCoordY = invHeight - itemHeight;
  if (maxCoordX < 0 || maxCoordY < 0) {
    return false;
  }
  if (invWidth <= itemWidth || invHeight <= itemHeight) {
    return false;
  }
  const [x, y] = findEmptyCoords(0, 0, maxCoordX, maxCoordY, (x, y) =>
    canPlaceAt(toInventory, x, y, itemWidth, itemHeight)
  );
  if (x >= 0 && y >= 0) {
    cursor.clearHeldItem();
    return putItem(getInventoryStore(), toInventory.invId, freedItem, x, y);
  }

  return false;
}

/**
 * @param {Inventory} inv
 * @param coordX
 * @param coordY
 * @param itemWidth
 * @param itemHeight
 * @param exclude
 */
function canPlaceAt(
  inv,
  coordX,
  coordY,
  itemWidth,
  itemHeight,
  exclude = null
) {
  for (let y = 0; y < itemHeight; ++y) {
    for (let x = 0; x < itemWidth; ++x) {
      const item = getInventoryItemAt(
        getInventoryStore(),
        inv.invId,
        coordX + x,
        coordY + y
      );
      if (item && (!exclude || item !== exclude)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * @param coordX
 * @param coordY
 * @param maxCoordX
 * @param maxCoordY
 * @param isEmptyCallback
 */
function findEmptyCoords(
  coordX,
  coordY,
  maxCoordX,
  maxCoordY,
  isEmptyCallback = () => true
) {
  return dijkstra2d(
    coordX,
    coordY,
    0,
    0,
    maxCoordX,
    maxCoordY,
    isEmptyCallback,
    getNeighborsFromCoords,
    fromCoordsToNode,
    toCoordsFromNode
  );
}

/**
 * @param coordX
 * @param coordY
 */
function fromCoordsToNode(coordX, coordY) {
  return ((coordX & 0xff_ff) << 16) | (coordY & 0xff_ff);
}

/**
 * @param node
 * @param out
 */
function toCoordsFromNode(node, out) {
  out[0] = node >> 16;
  out[1] = node & 0xff_ff;
  return out;
}

/**
 * @param coordX
 * @param coordY
 * @param out
 */
function getNeighborsFromCoords(coordX, coordY, out) {
  out[0] = fromCoordsToNode(coordX - 1, coordY);
  out[1] = fromCoordsToNode(coordX, coordY - 1);
  out[2] = fromCoordsToNode(coordX + 1, coordY);
  out[3] = fromCoordsToNode(coordX, coordY + 1);
  return out;
}

/**
 * @param store
 */
export function storeToString(store) {
  let result = '';
  result += 'inventory:\n';
  for (const inventory of getInventoryList(store)) {
    result += `\n\t${inventory.invId}: ${inventoryToString(inventory)}\n`;
  }

  result += '\nitems:\n';
  for (const item of getItems(store)) {
    result += `\n\t${item.itemId}: ${itemToString(item)}\n`;
  }

  return result;
}

/**
 * @param inventory
 */
export function inventoryToString(inventory) {
  if (!inventory) {
    return '[Inventory#null::{}]';
  }

  return `[Inventory#${inventory.width}x${inventory.height}::{${inventory.slots}}]`;
}

/**
 * @param item
 */
export function itemToString(item) {
  if (!item) {
    return '[Item#null]';
  }

  return `[Item#${item.width}x${item.height}]`;
}
