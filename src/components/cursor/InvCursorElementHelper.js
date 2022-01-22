import { dijkstra2d } from '../../util/dijkstra2d.js';
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
import { getInvInStore } from '../../store/InvStore.js';
import { dispatchItemChange } from '../../events/ItemEvents.js';
import { copyItem } from '../../satchel/item/Item.js';

/**
 * @typedef {import('../../satchel/inv/Inv.js').Inventory} Inventory
 * @typedef {import('../../satchel/inv/Inv.js').InvId} InvId
 * @typedef {import('../../store/SatchelStore.js').SatchelStore} SatchelStore
 *
 * @typedef {import('../../satchel/item/Item.js').Item} Item
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 *
 * @typedef {import('./InvCursorElement.js').InvCursorElement} InvCursorElement
 */

/**
 * @param {InvCursorElement} cursor
 * @param {SatchelStore} store
 * @param {InvId} toInvId
 * @param {number} coordX
 * @param {number} coordY
 * @param {boolean} swappable
 * @param {boolean} mergable
 * @param {boolean} shiftKey
 */
export function putDownToSocketInventory(
  cursor,
  store,
  toInvId,
  coordX,
  coordY,
  swappable,
  mergable,
  shiftKey
) {
  let heldItem = cursor.getHeldItem();
  let prevItem = getItemAtSlotIndex(store, toInvId, 0);
  let prevItemX = -1;
  let prevItemY = -1;
  if (prevItem) {
    if (swappable) {
      // Has an item to swap. So pick up this one for later.
      let inv = getExistingInventory(store, toInvId);
      let prevItemId = prevItem.itemId;
      let slotIndex = getSlotIndexByItemId(inv, prevItemId);
      let [x, y] = getSlotCoordsByIndex(inv, slotIndex);
      prevItemX = x;
      prevItemY = y;
      prevItem = getItemByItemId(inv, prevItemId);
      // If we can merge, do it now.
      if (tryMergeItems(store, cursor, prevItem, heldItem, mergable, shiftKey)) {
        return true;
      }
      // ...otherwise we continue with the swap.
      removeItemFromInventory(store, toInvId, prevItemId);
    } else {
      // Cannot swap. Exit early.
      return false;
    }
  } else if (tryDropPartialItem(store, toInvId, heldItem, mergable, shiftKey, 0, 0)) {
    // No item in the way and we want to partially drop singles.
    return true;
  }
  // Now there are no items in the way. Place it down!
  cursor.clearHeldItem();
  addItemToInventory(store, toInvId, heldItem, 0, 0);
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
 * @param {InvCursorElement} cursor
 * @param {SatchelStore} store
 * @param {InvId} toInvId
 * @param {number} itemX The root slot coordinates to place item (includes holding offset)
 * @param {number} itemY The root slot coordinates to place item (includes holding offset)
 * @param {boolean} swappable
 * @param {boolean} mergable
 * @param {boolean} shiftKey
 */
export function putDownToGridInventory(
  cursor,
  store,
  toInvId,
  itemX,
  itemY,
  swappable,
  mergable,
  shiftKey,
) {
  const toInventory = getInvInStore(store, toInvId);
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
        toInvId,
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
      // Has an item to swap or merge. So pick up this one for later.
      let inv = getInvInStore(store, toInvId);
      let slotIndex = getSlotIndexByItemId(inv, prevItemId);
      let [x, y] = getSlotCoordsByIndex(inv, slotIndex);
      prevItemX = x;
      prevItemY = y;
      prevItem = getItemByItemId(inv, prevItemId);
      // If we can merge, do it now.
      if (tryMergeItems(store, cursor, prevItem, heldItem, mergable, shiftKey)) {
        return true;
      }
      // ...otherwise we continue with the swap.
      removeItemFromInventory(store, toInvId, prevItemId);
    } else if (tryDropPartialItem(store, toInvId, heldItem, mergable, shiftKey, targetCoordX, targetCoordY)) {
      // No item in the way and we want to partially drop singles.
      return true;
    }
    // Now there are no items in the way. Place it down!
    cursor.clearHeldItem();
    addItemToInventory(store, toInvId, heldItem, targetCoordX, targetCoordY);
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
      (x, y) => canPlaceAt(store, toInvId, x, y, itemWidth, itemHeight)
    );
    if (x >= 0 && y >= 0) {
      cursor.clearHeldItem();
      addItemToInventory(store, toInvId, heldItem, x, y);
      return true;
    }
    // No can do :(
    return false;
  }
}

export function tryTakeOneItem(store, item) {
  if (item.stackSize > 1) {
    let amount = 1;
    let remaining = item.stackSize - amount;
    let newItem = copyItem(item);
    newItem.stackSize = amount;
    item.stackSize = remaining;
    dispatchItemChange(store, item.itemId);
    return newItem;
  } else {
    return null;
  }
}

function tryDropPartialItem(store, toInvId, heldItem, mergable, shiftKey, targetCoordX, targetCoordY) {
  if (mergable && shiftKey && heldItem.stackSize > 1) {
    // No item in the way and we want to partially drop singles.
    let amount = 1;
    let remaining = heldItem.stackSize - amount;
    let newItem = copyItem(heldItem);
    newItem.stackSize = amount;
    heldItem.stackSize = remaining;
    dispatchItemChange(store, heldItem.itemId);
    addItemToInventory(store, toInvId, newItem, targetCoordX, targetCoordY);
    return true;
  }
  return false;
}

function tryMergeItems(store, cursor, prevItem, heldItem, mergable, shiftKey) {
  // If we can merge, do it now.
  if (!mergable || !isMergableItems(prevItem, heldItem)) {
    return false;
  }
  // Full merge!
  if (!shiftKey) {
    mergeItems(prevItem, heldItem);
    dispatchItemChange(store, prevItem.itemId);
    // Merged successfully! Discard the held item.
    cursor.clearHeldItem();
    return true;
  }
  // If not enough items, stop here.
  if (heldItem.stackSize <= 1) {
    return true;
  }
  // Single merge!
  let amount = 1;
  let remaining = heldItem.stackSize - amount;
  prevItem.stackSize += amount;
  heldItem.stackSize = remaining;
  dispatchItemChange(store, prevItem.itemId);
  dispatchItemChange(store, heldItem.itemId);
  return true;
}

/**
 * @param {Item} item 
 * @param {Item} other 
 */
function mergeItems(item, other) {
  item.stackSize += other.stackSize;
  if (item.description !== other.description && other.description) {
    if (item.description) {
      item.description += '\n\n';
    }
    item.description += other.description;
  }
  if (other.metadata) {
    item.metadata = {
      ...item.metadata,
      ...other.metadata,
    };
  }
  return item;
}

/**
 * @param {Item} item 
 * @param {Item} other 
 */
function isMergableItems(item, other) {
  if (item.stackSize < 0 || other.stackSize < 0) {
    // Only merge if already stackable.
    return false;
  }
  if (item.imgSrc !== other.imgSrc) {
    return false;
  }
  if (item.displayName !== other.displayName) {
    return false;
  }
  if (item.width !== other.width || item.height !== other.height) {
    return false;
  }
  if (item.background !== other.background) {
    return false;
  }
  if (item.itemId === other.itemId) {
    // Cannot self merge.
    return false;
  }
  return true;
}

/**
 * @param {SatchelStore} store
 * @param {InvId} invId
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
