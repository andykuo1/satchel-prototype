import { dijkstra2d } from '../../util/dijkstra2d.js';
import { getInventoryInStore } from '../../store/SatchelStore.js';
import {
  addItemToInventory,
  getExistingInventory,
  getItemAtSlotCoords,
  getItemAtSlotIndex,
  getItemIdAtSlotCoords,
  removeItemFromInventory,
} from '../../satchel/inv/InventoryTransfer.js';
import { getItemByItemId } from '../../satchel/inv/InvItems.js';
import { getSlotCoordsByIndex, getSlotIndexByItemId } from '../../satchel/inv/InvSlots.js';

/**
 * @typedef {import('../../satchel/inv/Inv.js').Inventory} Inventory
 * @typedef {import('../../satchel/inv/Inv.js').InventoryId} InventoryId
 * @typedef {import('../../store/SatchelStore.js').InventoryStore} InventoryStore
 *
 * @typedef {import('../../satchel/item/Item.js').Item} Item
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 *
 * @typedef {import('./InventoryCursorElement.js').InventoryCursorElement} InventoryCursorElement
 */

/**
 * @param {InventoryCursorElement} cursor
 * @param {InventoryStore} store
 * @param {InventoryId} toInventoryId
 * @param {number} coordX
 * @param {number} coordY
 * @param {boolean} swappable
 */
export function putDownToSocketInventory(
  cursor,
  store,
  toInventoryId,
  coordX,
  coordY,
  swappable
) {
  let heldItem = cursor.getHeldItem();
  let prevItem = getItemAtSlotIndex(store, toInventoryId, 0);
  let prevItemX = -1;
  let prevItemY = -1;
  if (prevItem) {
    if (swappable) {
      // Has an item to swap. So pick up this one for later.
      let inv = getExistingInventory(store, toInventoryId);
      let prevItemId = prevItem.itemId;
      let slotIndex = getSlotIndexByItemId(inv, prevItemId);
      let [x, y] = getSlotCoordsByIndex(inv, slotIndex);
      prevItemX = x;
      prevItemY = y;
      prevItem = getItemByItemId(inv, prevItemId);
      removeItemFromInventory(store, toInventoryId, prevItemId);
    } else {
      // Cannot swap. Exit early.
      return false;
    }
  }
  // Now there are no items in the way. Place it down!
  cursor.clearHeldItem();
  addItemToInventory(store, toInventoryId, heldItem, 0, 0);
  // ...finally put the remaining item back now that there is space.
  if (prevItem) {
    cursor.setHeldItem(
      prevItem,
      Math.min(0, prevItemX - coordX),
      Math.min(0, prevItemY - coordY)
    );
  }
  return true;
}

/**
 * @param {InventoryCursorElement} cursor
 * @param {InventoryStore} store
 * @param {InventoryId} toInventoryId
 * @param {number} itemX The root slot coordinates to place item (includes holding offset)
 * @param {number} itemY The root slot coordinates to place item (includes holding offset)
 * @param {boolean} swappable
 */
export function putDownToGridInventory(
  cursor,
  store,
  toInventoryId,
  itemX,
  itemY,
  swappable
) {
  const toInventory = getInventoryInStore(store, toInventoryId);
  const heldItem = cursor.getHeldItem();
  const invWidth = toInventory.width;
  const invHeight = toInventory.height;
  const itemWidth = heldItem.width;
  const itemHeight = heldItem.height;
  const maxCoordX = invWidth - itemWidth;
  const maxCoordY = invHeight - itemHeight;
  if (maxCoordX < 0 || maxCoordY < 0) {
    return false;
  }
  const targetCoordX = Math.min(Math.max(0, itemX), maxCoordX);
  const targetCoordY = Math.min(Math.max(0, itemY), maxCoordY);
  
  let prevItemId = null;
  for (let y = 0; y < itemHeight; ++y) {
    for (let x = 0; x < itemWidth; ++x) {
      let itemId = getItemIdAtSlotCoords(
        store,
        toInventoryId,
        targetCoordX + x,
        targetCoordY + y
      );
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
      let inv = getExistingInventory(store, toInventoryId);
      let slotIndex = getSlotIndexByItemId(inv, prevItemId);
      let [x, y] = getSlotCoordsByIndex(inv, slotIndex);
      prevItemX = x;
      prevItemY = y;
      prevItem = getItemByItemId(inv, prevItemId);
      removeItemFromInventory(store, toInventoryId, prevItemId);
    }
    // Now there are no items in the way. Place it down!
    cursor.clearHeldItem();
    addItemToInventory(store, toInventoryId, heldItem, targetCoordX, targetCoordY);
    // ...finally put the remaining item back now that there is space.
    if (prevItem) {
      cursor.setHeldItem(
        prevItem,
        Math.min(0, prevItemX - targetCoordX),
        Math.min(0, prevItemY - targetCoordY)
      );
    }
    return true;
  } else {
    // Cannot swap here. Find somehwere close?
    const [x, y] = findEmptyCoords(
      targetCoordX,
      targetCoordY,
      maxCoordX,
      maxCoordY,
      (x, y) => canPlaceAt(store, toInventoryId, x, y, itemWidth, itemHeight)
    );
    if (x >= 0 && y >= 0) {
      cursor.clearHeldItem();
      addItemToInventory(store, toInventoryId, heldItem, x, y);
      return true;
    }
    // No can do :(
    return false;
  }
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 * @param coordX
 * @param coordY
 * @param itemWidth
 * @param itemHeight
 * @param exclude
 */
function canPlaceAt(
  store,
  invId,
  coordX,
  coordY,
  itemWidth,
  itemHeight,
  exclude = null
) {
  for (let y = 0; y < itemHeight; ++y) {
    for (let x = 0; x < itemWidth; ++x) {
      const item = getItemAtSlotCoords(store, invId, coordX + x, coordY + y);
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
