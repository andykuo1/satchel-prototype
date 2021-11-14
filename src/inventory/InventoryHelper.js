import { dijkstra2d } from '../util/dijkstra2d.js';
import {
  getCursorContext,
  getCursorElement,
} from './CursorHelper.js';
import {
  getInventory,
  getInventoryInStore,
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
  getInventoryItemIdAt,
  getInventoryType
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
  const cursorInventoryId = element.name;
  if (!isInventoryEmpty(store, cursorInventoryId)) {
    return false;
  }
  const [fromItemX, fromItemY] = getItemSlotCoords(store, fromInventoryId, fromItemId);
  const item = removeItem(store, fromItemId, fromInventoryId);
  element.holdItem(item, fromItemX - fromCoordX, fromItemY - fromCoordY);
  return true;
}

/**
 * Put down from cursor to destination.
 *
 * @param {InventoryId} toInventoryId
 * @param {number} toCoordX
 * @param {number} toCoordY
 */
export function putDownItem(
  toInventoryId,
  toCoordX,
  toCoordY
) {
  const store = getInventoryStore();
  const ctx = getCursorContext();
  const element = getCursorElement(ctx);
  const heldItem = element.getHeldItem();
  if (!heldItem) {
    return false;
  }
  if (element.isPlaceDownBuffering()) {
    element.clearPlaceDownBuffer();
    return true;
  }
  const toInventory = getInventory(store, toInventoryId);
  const invType = getInventoryType(store, toInventoryId, toInventory);
  switch(invType) {
    case 'socket':
      return putDownItemInSocketInventory(store, toInventoryId, element, toCoordX, toCoordY);
    case 'grid':
      return putDownItemInGridInventory(store, toInventoryId, element, toCoordX, toCoordY);
    default:
      throw new Error('Unsupported inventory type.');
  }
}

function putDownItemInSocketInventory(store, toInventoryId, cursorElement, toCoordX, toCoordY) {
  return false; // TODO: Force fail placing items in sockets.
  /*
  let heldItem = cursorElement.getHeldItem();
  let prevItem = getInventoryItemAt(store, toInventoryId, 0, 0);
  let prevItemId = prevItem.itemId;
  let prevItemX = -1;
  let prevItemY = -1;
  if (prevItem) {
    // Has an item to swap. So pick up this one for later.
    let [x, y] = getItemSlotCoords(store, toInventoryId, prevItemId);
    prevItemX = x;
    prevItemY = y;
    prevItem = removeItem(store, prevItemId, toInventoryId);
  }
  // Now there are no items in the way. Place it down!
  cursorElement.releaseItem();
  putItem(store, toInventoryId, heldItem, 0, 0);
  // ...finally put the remaining item back now that there is space.
  if (prevItem) {
    cursorElement.holdItem(prevItem, Math.min(0, prevItemX - toCoordX), Math.min(0, prevItemY - toCoordY));
  }
  return true;
  */
}

function putDownItemInGridInventory(store, toInventoryId, cursorElement, toCoordX, toCoordY) {
  const toInventory = getInventoryInStore(store, toInventoryId);
  const heldItem = cursorElement.getHeldItem();
  const invWidth = toInventory.width;
  const invHeight = toInventory.height;
  const itemWidth = heldItem.width;
  const itemHeight = heldItem.height;
  const [pickOffsetX, pickOffsetY] = cursorElement.getPickOffset();
  const coordX = toCoordX + pickOffsetX;
  const coordY = toCoordY + pickOffsetY;
  const maxCoordX = invWidth - itemWidth;
  const maxCoordY = invHeight - itemHeight;
  if (maxCoordX < 0 || maxCoordY < 0) {
    return false;
  }
  const targetCoordX = Math.min(Math.max(0, coordX), maxCoordX);
  const targetCoordY = Math.min(Math.max(0, coordY), maxCoordY);

  let swappable = true;
  let prevItemId = null;
  for(let y = 0; y < itemHeight; ++y) {
    for(let x = 0; x < itemWidth; ++x) {
      let itemId = getInventoryItemIdAt(store, toInventoryId, targetCoordX + x, targetCoordY + y);
      if (itemId) {
        if (prevItemId) {
          if (itemId !== prevItemId) {
            swappable = false;
          } else {
            // It's the same item, keep going...
          }
        } else {
          prevItemId = itemId;
        }
      }
    }
  }

  if (swappable) {
    let prevItem = null;
    let prevItemX = -1;
    let prevItemY = -1;
    if (prevItemId) {
      // Has an item to swap. So pick up this one for later.
      let [x, y] = getItemSlotCoords(store, toInventoryId, prevItemId);
      prevItemX = x;
      prevItemY = y;
      prevItem = removeItem(store, prevItemId, toInventoryId);
    }
    // Now there are no items in the way. Place it down!
    cursorElement.releaseItem();
    putItem(getInventoryStore(), toInventoryId, heldItem, targetCoordX, targetCoordY);
    // ...finally put the remaining item back now that there is space.
    if (prevItem) {
      cursorElement.holdItem(prevItem, Math.min(0, prevItemX - targetCoordX), Math.min(0, prevItemY - targetCoordY));
    }
    return true;
  } else {
    // Cannot swap here. Find somehwere close?
    const [x, y] = findEmptyCoords(
      targetCoordX,
      targetCoordY,
      maxCoordX,
      maxCoordY,
      (x, y) => canPlaceAt(toInventory, x, y, itemWidth, itemHeight)
    );
    if (x >= 0 && y >= 0) {
      cursorElement.releaseItem();
      putItem(getInventoryStore(), toInventoryId, heldItem, x, y);
      return true;
    }
    // No can do :(
    return false;
  }
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
  const element = getCursorElement(ctx);
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
    element.releaseItem();
    return putItem(getInventoryStore(), toInventory.name, freedItem, x, y);
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

  return `[Item#${item.width}x${item.height}]`;
}
