import {
  getItem,
  deleteItem,
  getInventory,
  dispatchInventoryChange,
  resolveItem,
} from './InventoryStore.js';

/**
 * @typedef {import('./InventoryStore.js').Item} Item
 * @typedef {import('./InventoryStore.js').ItemId} ItemId
 * @typedef {import('./InventoryStore.js').InventoryStore} InventoryStore
 * @typedef {import('./InventoryStore.js').Inventory} Inventory
 * @typedef {import('./InventoryStore.js').InventoryId} InventoryId
 * @typedef {import('./InventoryStore.js').InventoryType} InventoryType
 */

/**
 * Remove and delete item from inventory.
 *
 * @param {InventoryStore} store
 * @param {ItemId} itemId
 * @param {InventoryId} inventoryId
 * @returns {Item} The removed item.
 */
export function removeItem(store, itemId, inventoryId) {
  let slotIndex = getItemSlotIndex(store, inventoryId, itemId);
  if (slotIndex >= 0) {
    let item = getItem(store, itemId);
    let [fromX, fromY] = getInventorySlotCoords(store, inventoryId, slotIndex);
    let toX = fromX + item.w - 1;
    let toY = fromY + item.h - 1;
    clearSlots(store, inventoryId, fromX, fromY, toX, toY);
    dispatchInventoryChange(store, inventoryId);
    deleteItem(store, itemId);
    return item;
  }
  return null;
}

/**
 * @param {InventoryStore} store 
 * @param {InventoryId} inventoryId 
 * @param {number} fromX 
 * @param {number} fromY 
 * @param {number} toX 
 * @param {number} toY 
 * @param {ItemId} itemId 
 */
function setSlots(store, inventoryId, fromX, fromY, toX, toY, itemId) {
  let inventory = getExistingInventory(store, inventoryId);
  for(let x = fromX; x <= toX; ++x) {
    for(let y = fromY; y <= toY; ++y) {
      let slotIndex = getInventorySlotIndexByCoords(store, inventoryId, x, y);
      if (slotIndex < 0) {
        continue;
      }
      inventory.slots[slotIndex] = itemId;
    }
  }
}

function clearSlots(store, inventoryId, fromX, fromY, toX, toY) {
  let inventory = getExistingInventory(store, inventoryId);
  for(let x = fromX; x <= toX; ++x) {
    for(let y = fromY; y <= toY; ++y) {
      let slotIndex = getInventorySlotIndexByCoords(store, inventoryId, x, y);
      if (slotIndex < 0) {
        continue;
      }
      inventory.slots[slotIndex] = null;
    }
  }
}

/**
 * Clear items from inventory.
 *
 * @param {InventoryStore} store
 * @param {InventoryId} inventoryId
 * @returns {Array<Item>} The cleared items.
 */
export function clearItems(store, inventoryId) {
  let inventory = getExistingInventory(store, inventoryId);
  const length = getInventorySlotCount(store, inventoryId, inventory);
  let keys = new Set();
  for (let i = 0; i < length; ++i) {
    let itemId = inventory.slots[i];
    if (itemId && !keys.has(itemId)) {
      keys.add(itemId);
    }
    inventory.slots[i] = null;
  }
  let result = [];
  for (let itemId of keys) {
    let item = getItem(store, itemId);
    result.push(item);
    deleteItem(store, itemId);
  }
  dispatchInventoryChange(store, inventoryId);
  return result;
}

/**
 * Put and create item in inventory.
 *
 * @param {InventoryStore} store
 * @param {InventoryId} inventoryId
 * @param {Item} item
 * @param {number} coordX
 * @param {number} coordY
 * @returns {boolean} Whether the item placed successfully.
 */
export function putItem(store, inventoryId, item, coordX, coordY) {
  const itemId = item.itemId;
  // TODO: Since items are kept globally, create it here
  resolveItem(store, itemId, item);
  // Put in slots
  setSlots(store, inventoryId, coordX, coordY, coordX + item.w - 1, coordY + item.h - 1, itemId);
  dispatchInventoryChange(store, inventoryId);
  return true;
}

export function getItemSlotIndex(store, inventoryId, itemId, startIndex = 0) {
  const inventory = getExistingInventory(store, inventoryId);
  const length = getInventorySlotCount(store, inventoryId, inventory);
  for (let i = startIndex; i < length; ++i) {
    let invItemId = inventory.slots[i];
    if (invItemId && invItemId === itemId) {
      return i;
    }
  }
  return -1;
}

export function getItemSlotCoords(store, inventoryId, itemId) {
  let slotIndex = getItemSlotIndex(store, inventoryId, itemId);
  return getInventorySlotCoords(store, inventoryId, slotIndex);
}

/**
 * @param {InventoryStore} store 
 * @param {ItemId} itemId 
 * @param {InventoryId} inventoryId 
 * @returns {boolean}
 */
export function hasItem(store, itemId, inventoryId) {
  return getItemSlotIndex(store, inventoryId, itemId) >= 0;
}

/**
 * @param {InventoryStore} store 
 * @param {InventoryId} inventoryId 
 * @returns {boolean}
 */
export function isInventoryEmpty(store, inventoryId) {
  const inventory = getExistingInventory(store, inventoryId);
  const length = getInventorySlotCount(store, inventoryId, inventory);
  for(let i = 0; i < length; ++i) {
    let itemId = inventory.slots[i];
    if (itemId) {
      return false;
    }
  }
  return true;
}

/**
 * @param {InventoryStore} store 
 * @param {InventoryId} inventoryId 
 * @param {number} coordX 
 * @param {number} coordY 
 * @returns {Item}
 */
export function getInventoryItemAt(store, inventoryId, coordX, coordY) {
  const inventory = getExistingInventory(store, inventoryId);
  const slotIndex = getInventorySlotIndexByCoords(store, inventoryId, coordX, coordY);
  if (slotIndex < 0) {
    return null;
  }
  const itemId = inventory.slots[slotIndex];
  if (!itemId) {
    return null;
  }
  const item = getItem(store, itemId);
  return item;
}

/**
 * @param {InventoryStore} store 
 * @param {InventoryId} inventoryId 
 * @returns {Iterable<ItemId>}
 */
export function getInventoryItemIds(store, inventoryId) {
  const inventory = getExistingInventory(store, inventoryId);
  const length = getInventorySlotCount(store, inventoryId, inventory);
  let result = new Set();
  for (let i = 0; i < length; ++i) {
    let itemId = inventory.slots[i];
    if (itemId) {
      result.add(itemId);
    }
  }
  return result;
}

export function getInventoryItems(store, inventoryName) {
  let result = [];
  for (let itemId of getInventoryItemIds(store, inventoryName)) {
    result.push(getItem(store, itemId));
  }
  return result;
}

export function getInventorySlotCoords(store, inventoryId, slotIndex) {
  if (slotIndex < 0) {
    return [-1, -1];
  }
  const inventory = getExistingInventory(store, inventoryId);
  switch(getInventoryType(store, inventoryId, inventory)) {
    case 'socket':
    case 'grid': {
      const width = inventory.width;
      return [
        slotIndex % width,
        Math.floor(slotIndex / width)
      ];
    }
    default:
      throw new Error('Unsupported inventory type for slot coords.');
  }
}

export function getInventorySlotIndexByCoords(store, inventoryId, slotX, slotY) {
  if (slotX < 0 || slotY < 0) {
    return -1;
  }
  const inventory = getExistingInventory(store, inventoryId);
  switch(getInventoryType(store, inventoryId, inventory)) {
    case 'socket':
    case 'grid': {
      const width = inventory.width;
      const height = inventory.height;
      if (slotX >= width || slotY >= height) {
        return -1;
      }
      return Math.floor(slotX) + Math.floor(slotY) * width;
    }
    default:
      throw new Error('Unsupported inventory type for slot coords.');
  }
}

/**
 * @param {InventoryStore} store 
 * @param {InventoryId} inventoryId 
 * @param {Inventory} inventory 
 * @returns {InventoryType}
 */
export function getInventoryType(store, inventoryId, inventory) {
  return inventory.type;
}

/**
 * @param {InventoryStore} store 
 * @param {InventoryId} inventoryId 
 * @param {Inventory} inventory 
 * @returns {number}
 */
export function getInventorySlotCount(store, inventoryId, inventory) {
  return inventory.slots.length;
}

/**
 * Get an existing inventory. Will throw if it does not exist.
 * 
 * @param {InventoryStore} store 
 * @param {InventoryId} inventoryId 
 * @returns {Inventory}
 */
 export function getExistingInventory(store, inventoryId) {
  const inventory = getInventory(store, inventoryId);
  if (!inventory) {
    throw new Error(
      `Cannot get non-existant inventory '${inventoryId}'.`
    );
  }
  return inventory;
}
