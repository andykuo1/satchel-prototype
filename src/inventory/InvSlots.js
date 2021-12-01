import { getInventorySlotCount } from './Inv.js';

/**
 * @typedef {import('./Inv.js').Inventory} Inventory
 * @typedef {import('./Item.js').ItemId} ItemId
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
  const slottedId = inv.slots[slotIndex];
  return slottedId <= 0;
}

/**
 * @param {Inventory} inv
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 * @param {number} slottedId
 * @returns {boolean} Whether any slots were set.
 */
export function setSlots(inv, fromX, fromY, toX, toY, slottedId) {
  let flag = false;
  const value = Number(slottedId);
  for (let x = fromX; x <= toX; ++x) {
    for (let y = fromY; y <= toY; ++y) {
      let slotIndex = getSlotIndexByCoords(inv, x, y);
      if (slotIndex < 0) {
        continue;
      }
      let prevSlotted = inv.slots[slotIndex];
      if (prevSlotted) {
        throw new Error('Cannot set non-empty slots.');
      }
      inv.slots[slotIndex] = value;
      flag = true;
    }
  }
  return flag;
}

/**
 * @param {Inventory} inv 
 * @returns {number}
 */
export function getNextAvailableSlottedId(inv) {
  let max = Number.NEGATIVE_INFINITY;
  for(let key of Object.keys(inv.items)) {
    let i = Number(key);
    max = Math.max(i, max);
  }
  if (Number.isFinite(max)) {
    return max + 1;
  } else {
    return 1;
  }
}

/**
 * @param {Inventory} inv 
 * @param {ItemId} itemId 
 * @returns {number}
 */
export function getSlottedIdByItemId(inv, itemId) {
  for(let [key, value] of Object.entries(inv.items)) {
    if (value.itemId === itemId) {
      return Number(key);
    }
  }
  return 0;
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
      inv.slots[slotIndex] = 0;
    }
  }
}

/**
 * @param {Inventory} inv
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 * @param {number} slottedId
 */
export function clearSlotsOfSlottedId(inv, fromX, fromY, toX, toY, slottedId) {
  const value = Number(slottedId);
  for (let x = fromX; x <= toX; ++x) {
    for (let y = fromY; y <= toY; ++y) {
      let slotIndex = getSlotIndexByCoords(inv, x, y);
      if (slotIndex < 0) {
        continue;
      }
      let slotValue = inv.slots[slotIndex];
      if (slotValue === value) {
        inv.slots[slotIndex] = 0;
      }
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

/**
 * @param {Inventory} inv 
 * @param {number} slottedId 
 * @param {number} [startIndex]
 * @returns {number}
 */
export function getSlotIndexBySlottedId(inv, slottedId, startIndex = 0) {
  const length = getInventorySlotCount(inv);
  const value = Number(slottedId);
  for(let i = startIndex; i < length; ++i) {
    let slotValue = inv.slots[i];
    if (slotValue === value) {
      return i;
    }
  }
  return -1;
}
