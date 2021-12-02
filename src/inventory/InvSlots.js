import { getInventorySlotCount } from '../inv/Inv.js';

/**
 * @typedef {import('../inv/Inv.js').Inventory} Inventory
 * @typedef {import('../item/Item.js').ItemId} ItemId
 */

/**
 * @param {Inventory} inv
 * @param {number} coordX
 * @param {number} coordY
 * @returns {boolean}
 */
export function isSlotCoordEmpty(inv, coordX, coordY) {
  let slotIndex = getSlotIndexByCoords(inv, coordX, coordY);
  return isSlotIndexEmpty(inv, slotIndex);
}

/**
 * @param {Inventory} inv
 * @param {number} slotIndex
 * @returns {boolean}
 */
export function isSlotIndexEmpty(inv, slotIndex) {
  let itemId = inv.slots[slotIndex];
  if (itemId) {
    return false;
  } else {
    return true;
  }
}

/**
 * @param {Inventory} inv
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 * @param {ItemId} itemId
 */
export function setSlots(inv, fromX, fromY, toX, toY, itemId) {
  for (let x = fromX; x <= toX; ++x) {
    for (let y = fromY; y <= toY; ++y) {
      let slotIndex = getSlotIndexByCoords(inv, x, y);
      if (slotIndex < 0) {
        continue;
      }
      inv.slots[slotIndex] = itemId;
    }
  }
}

/**
 * @param {Inventory} inv
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 */
export function clearSlots(inv, fromX, fromY, toX, toY) {
  for (let x = fromX; x <= toX; ++x) {
    for (let y = fromY; y <= toY; ++y) {
      let slotIndex = getSlotIndexByCoords(inv, x, y);
      if (slotIndex < 0) {
        continue;
      }
      inv.slots[slotIndex] = null;
    }
  }
}

/**
 * @param {Inventory} inv
 * @param {number} coordX
 * @param {number} coordY
 * @returns {number}
 */
export function getSlotIndexByCoords(inv, coordX, coordY) {
  if (coordX < 0 || coordY < 0) {
    return -1;
  }
  switch (inv.type) {
    case 'socket':
    case 'grid': {
      const width = inv.width;
      const height = inv.height;
      if (coordX >= width || coordY >= height) {
        return -1;
      }
      return Math.floor(coordX) + Math.floor(coordY) * width;
    }
    default:
      throw new Error('Unsupported inventory type for slot coords.');
  }
}

/**
 * @param {Inventory} inv
 * @param {number} slotIndex
 * @returns {[number, number]}
 */
export function getSlotCoordsByIndex(inv, slotIndex) {
  if (slotIndex < 0) {
    return [-1, -1];
  }
  switch (inv.type) {
    case 'socket':
    case 'grid': {
      const width = inv.width;
      return [slotIndex % width, Math.floor(slotIndex / width)];
    }
    default:
      throw new Error('Unsupported inventory type for slot coords.');
  }
}

export function getSlotIndexByItemId(inv, itemId, startIndex = 0) {
  const length = getInventorySlotCount(inv);
  for(let i = startIndex; i < length; ++i) {
    let invItemId = inv.slots[i];
    if (invItemId && invItemId === itemId) {
      return i;
    }
  }
  return -1;
}
