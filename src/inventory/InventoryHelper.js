import { dijkstra2d } from '../util/dijkstra2d.js';
import {
  freeFromCursor,
  getCursorContext,
  getCursorElement,
  getCursorItem,
  storeToCursor,
} from './CursorHelper.js';
import {
  getInventory,
  getInventoryList,
  getInventoryStore,
  getItems,
} from './InventoryStore.js';
import {
  getInventoryItemAt,
  getInventoryItems,
  getItemSlotCoords,
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
 * Pick up from target inventory to cursor.
 *
 * @param {ItemId} fromItemId
 * @param {InventoryId} fromInventoryId
 * @param {number} fromCoordX
 * @param {number} fromCoordY
 * @returns {boolean} Whether the transfer to cursor was successful.
 */
export function pickUpItem(
  fromItemId,
  fromInventoryId,
  fromCoordX,
  fromCoordY
) {
  const store = getInventoryStore();
  const ctx = getCursorContext();
  const element = getCursorElement(ctx);
  if (!element) {
    return false;
  }
  const cursorInventoryName = element.name;
  if (!isInventoryEmpty(store, cursorInventoryName)) {
    return false;
  }
  const [fromItemX, fromItemY] = getItemSlotCoords(store, fromInventoryId, fromItemId);
  const item = removeItem(store, fromItemId, fromInventoryId);
  storeToCursor(ctx, item);
  ctx.pickOffsetX = fromItemX - fromCoordX;
  ctx.pickOffsetY = fromItemY - fromCoordY;
  return true;
}

/**
 * Put down from cursor to destination.
 *
 * @param {InventoryId} toInventoryName
 * @param {number} toCoordX
 * @param {number} toCoordY
 * @param {boolean} allowSwap
 */
export function putDownItem(
  toInventoryName,
  toCoordX,
  toCoordY,
  allowSwap = true
) {
  const store = getInventoryStore();
  const ctx = getCursorContext();
  const item = getCursorItem(ctx);
  if (!item || !ctx.placeDownBuffer) {
    return false;
  }
  const toInventory = getInventory(store, toInventoryName);
  const invWidth = toInventory.width;
  const invHeight = toInventory.height;
  const itemWidth = item.w;
  const itemHeight = item.h;
  const coordX = toCoordX + ctx.pickOffsetX;
  const coordY = toCoordY + ctx.pickOffsetY;

  const maxCoordX = invWidth - itemWidth;
  const maxCoordY = invHeight - itemHeight;
  if (maxCoordX < 0 || maxCoordY < 0) {
    return false;
  }

  const targetCoordX = Math.min(Math.max(0, coordX), maxCoordX);
  const targetCoordY = Math.min(Math.max(0, coordY), maxCoordY);

  if (
    allowSwap &&
    canSwapAt(
      toInventory,
      coordX,
      coordY,
      targetCoordX,
      targetCoordY,
      itemWidth,
      itemHeight
    )
  ) {
    freeFromCursor(ctx);
    const storedItem = getInventoryItemAt(
      store,
      toInventoryName,
      coordX,
      coordY
    );
    const [prevX, prevY] = getItemSlotCoords(store, toInventoryName, storedItem.itemId);
    const result = pickUpItem(
      storedItem.itemId,
      toInventoryName,
      prevX,
      prevY
    );
    if (!result) {
      throw new Error('Failed to pick up item on swap.');
    }
    ctx.pickOffsetX = prevX - targetCoordX;
    ctx.pickOffsetY = prevY - targetCoordY;
    return putItem(
      getInventoryStore(),
      toInventory.name,
      item,
      targetCoordX,
      targetCoordY
    );
  }

  const [x, y] = findEmptyCoords(
    targetCoordX,
    targetCoordY,
    maxCoordX,
    maxCoordY,
    (x, y) => canPlaceAt(toInventory, x, y, itemWidth, itemHeight)
  );
  if (x >= 0 && y >= 0) {
    freeFromCursor(ctx);
    return putItem(getInventoryStore(), toInventory.name, item, x, y);
  }

  return false;
}

/**
 * @param fromInventory
 * @param filter
 */
export function extractOut(fromInventory, filter) {
  const result = [];
  const items = getInventoryItems(getInventoryStore(), fromInventory.name);
  for (const item of items) {
    if (filter(item, fromInventory)) {
      removeItem(getInventoryStore(), item.itemId, fromInventory.name);
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
    isInventoryEmpty(getInventoryStore(), toInventory.name)
  ) {
    return putItem(getInventoryStore(), toInventory.name, freedItem, 0, 0);
  }

  const ctx = getCursorContext();
  const invWidth = toInventory.width;
  const invHeight = toInventory.height;
  const itemWidth = freedItem.w;
  const itemHeight = freedItem.h;
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
    freeFromCursor(ctx);
    return putItem(getInventoryStore(), toInventory.name, freedItem, x, y);
  }

  return false;
}

/**
 * @param {Inventory} inv
 * @param coordX
 * @param coordY
 * @param itemX
 * @param itemY
 * @param itemWidth
 * @param itemHeight
 */
function canSwapAt(inv, coordX, coordY, itemX, itemY, itemWidth, itemHeight) {
  const item = getInventoryItemAt(
    getInventoryStore(),
    inv.name,
    coordX,
    coordY
  );
  return item && canPlaceAt(inv, itemX, itemY, itemWidth, itemHeight, item);
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
        inv.name,
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
    result += `\n\t${inventory.name}: ${inventoryToString(inventory)}\n`;
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

  return `[Item#${item.w}x${item.h}]`;
}
