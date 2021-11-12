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
 */

/**
 * Remove and delete item from inventory.
 *
 * @param {InventoryStore} store
 * @param {ItemId} fromItemId
 * @param {InventoryId} fromInventoryName
 * @returns {Item} The removed item.
 */
export function removeItem(store, fromItemId, fromInventoryName) {
  let inventory = getInventory(store, fromInventoryName);
  if (!inventory) {
    throw new Error(
      `Cannot remove item from non-existant inventory '${fromInventoryName}'.`
    );
  }
  if (typeof fromItemId !== 'string') {
    throw new Error(`Cannot remove item for invalid item id '${fromItemId}'.`);
  }
  for (let i = 0; i < inventory.items.length; ++i) {
    let itemId = inventory.items[i];
    if (fromItemId === itemId) {
      let item = getItem(store, fromItemId);
      inventory.items[i] = null;
      dispatchInventoryChange(store, fromInventoryName);
      deleteItem(store, fromItemId);
      return item;
    }
  }
  return null;
}

/**
 * Remove and delete items from inventory.
 *
 * @param {InventoryStore} store
 * @param {Array<ItemId>} fromItemIds
 * @param {InventoryId} fromInventoryName
 * @returns {Array<Item>} The removed items.
 */
export function removeItems(store, fromItemIds, fromInventoryName) {
  let inventory = getInventory(store, fromInventoryName);
  if (!inventory) {
    throw new Error(
      `Cannot remove item from non-existant inventory '${fromInventoryName}'.`
    );
  }
  let result = [];
  for (let i = 0; i < inventory.items.length; ++i) {
    let itemId = inventory.items[i];
    if (fromItemIds.includes(itemId)) {
      let item = getItem(store, itemId);
      inventory.items[i] = null;
      deleteItem(store, itemId);
      result.push(item);
    }
  }
  dispatchInventoryChange(store, fromInventoryName);
  return result;
}

/**
 * Clear items from inventory.
 *
 * @param {InventoryStore} store
 * @param {InventoryId} inventoryName
 * @returns {Array<Item>} The cleared items.
 */
export function clearItems(store, inventoryName) {
  let inventory = getInventory(store, inventoryName);
  if (!inventory) {
    throw new Error(
      `Cannot clear items from non-existant inventory '${inventoryName}'.`
    );
  }
  let keys = new Set();
  for (let i = 0; i < inventory.items.length; ++i) {
    let itemId = inventory.items[i];
    if (itemId && !keys.has(itemId)) {
      keys.add(itemId);
    }
    inventory.items[i] = null;
  }
  let result = [];
  for (let itemId of keys) {
    let item = getItem(store, itemId);
    result.push(item);
    deleteItem(store, itemId);
  }
  dispatchInventoryChange(store, inventoryName);
  return result;
}

/**
 * Put and create item in inventory.
 *
 * @param {InventoryStore} store
 * @param {InventoryId} toInventoryName
 * @param {Item} item
 * @param {number} coordX
 * @param {number} coordY
 * @returns {boolean} Whether the item placed successfully.
 */
export function putItem(store, toInventoryName, item, coordX, coordY) {
  let inventory = getInventory(store, toInventoryName);
  if (!inventory) {
    throw new Error(
      `Cannot put item in non-existant inventory '${toInventoryName}'.`
    );
  }
  const itemId = item.itemId;
  // TODO: Since items still keep position in state, set it here
  item.x = coordX;
  item.y = coordY;
  // TODO: Since items are kept globally, create it here
  resolveItem(store, itemId, item);
  // Find the root slot to insert item
  const slotIndex = getSlotIndex(inventory, coordX, coordY);
  inventory.items[slotIndex] = itemId;
  // TODO: Should mark all other related indices with itemId
  dispatchInventoryChange(store, toInventoryName);
  return true;
}

function getSlotIndex(inventory, coordX, coordY) {
  // TODO: For now, it just gets the nearest free slot.
  for (let i = 0; i < inventory.items.length; ++i) {
    if (!inventory.items[i]) {
      return i;
    }
  }
  return inventory.items.length;
}

export function hasItem(store, itemId, inventoryName) {
  const inventory = getInventory(store, inventoryName);
  if (!inventory) {
    throw new Error(
      `Cannot find item from non-existant inventory '${inventoryName}'.`
    );
  }
  if (typeof itemId !== 'string') {
    throw new Error(`Cannot find item for invalid item id '${itemId}'.`);
  }
  for (let i = 0; i < inventory.items.length; ++i) {
    let invItemId = inventory.items[i];
    if (itemId === invItemId) {
      return true;
    }
  }
  return false;
}

export function isInventoryEmpty(store, inventoryName) {
  const inventory = getInventory(store, inventoryName);
  if (inventory) {
    for (let i = 0; i < inventory.items.length; ++i) {
      let itemId = inventory.items[i];
      if (itemId) {
        return false;
      }
    }
  }
  return true;
}

export function getInventoryItemAt(store, inventoryName, coordX, coordY) {
  const inventory = getInventory(store, inventoryName);
  if (inventory) {
    for (let i = 0; i < inventory.items.length; ++i) {
      const itemId = inventory.items[i];
      if (itemId) {
        const item = getItem(store, itemId);
        if (
          coordX >= item.x &&
          coordX < item.x + item.w &&
          coordY >= item.y &&
          coordY < item.y + item.h
        ) {
          return item;
        }
      }
    }
  }
  return null;
}

export function getInventoryItemIds(store, inventoryName) {
  const inventory = getInventory(store, inventoryName);
  if (!inventory) {
    throw new Error(
      `Cannot get item ids from non-existant inventory '${inventoryName}'.`
    );
  }
  let result = new Set();
  for (let i = 0; i < inventory.items.length; ++i) {
    let itemId = inventory.items[i];
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
