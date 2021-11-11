import { uuid } from '../util/uuid.js';

/**
 * @typedef {object} InventoryStore
 */

let GLOBAL_STORE = createInventoryStore();

/**
 *
 */
export function createInventoryStore() {
  return {
    data: {
      item: {},
      inventory: {},
    },
    listeners: {
      item: {},
      inventory: {},
      container: {},
    },
  };
}

/**
 * @param store
 */
export function setInventoryStore(store) {
  GLOBAL_STORE = store;
}

/**
 * @param previousStore
 * @param nextStore
 */
export function resetInventoryStore(previousStore, nextStore) {
  const previousItemList = Object.keys(previousStore.data.item);
  const previousInventoryList = Object.keys(previousStore.data.inventory);
  const nextItemList = Object.keys(nextStore.data.item);
  const nextInventoryList = Object.keys(nextStore.data.inventory);
  // Copy data over
  previousStore.data.item = { ...nextStore.data.item };
  previousStore.data.inventory = { ...nextStore.data.inventory };

  // Dispatch all events
  dispatchInventoryListChange(previousStore);
  const visitedItems = new Set();
  const visitedInventories = new Set();
  // Dispatch for old objects
  for (const itemId of previousItemList) {
    visitedItems.add(itemId);
    dispatchItemChange(previousStore, itemId);
  }

  for (const invName of previousInventoryList) {
    visitedInventories.add(invName);
    dispatchInventoryChange(previousStore, invName);
  }

  // Dispatch for new objects
  for (const itemId of nextItemList) {
    if (!visitedItems.has(itemId)) {
      dispatchItemChange(previousStore, itemId);
    }
  }

  for (const inventoryName of nextInventoryList) {
    if (!visitedInventories.has(inventoryName)) {
      dispatchInventoryChange(previousStore, inventoryName);
    }
  }
}

export function getInventoryStore() {
  return GLOBAL_STORE;
}

/**
 * @typedef {string} ItemId
 * @typedef {'grid'|'socket'} InventoryType
 * 
 * @typedef Inventory
 * @property {string} name
 * @property {InventoryType} type
 * @property {Array<ItemId>} items
 * @property {number} width
 * @property {number} height
 */

/**
 * @param store
 * @param inventoryName
 */
export function deleteInventory(store, inventoryName) {
  if (inventoryName in store.data.inventory) {
    delete store.data.inventory[inventoryName];
    dispatchInventoryListChange(store);
    dispatchInventoryChange(store, inventoryName);
  }
}

/**
 * @param store
 * @param inventoryName
 */
export function getInventory(store, inventoryName) {
  const inventory = store.data.inventory[inventoryName];
  if (inventory) {
    return inventory;
  }

  return null;
}

/**
 * @param store
 * @param inventoryName
 * @param deleteItems
 */
export function clearInventory(store, inventoryName, deleteItems = true) {
  const inventory = getInventory(store, inventoryName);
  if (inventory) {
    const previousLength = inventory.items.length;
    if (previousLength > 0) {
      if (deleteItems) {
        for (const itemId of inventory.items) {
          deleteItem(store, itemId);
        }
      }

      inventory.items.length = 0;
      dispatchInventoryChange(store, inventoryName);
    }
  }
}

/**
 * @param store
 * @param inventoryName
 * @param type
 */
export function changeInventoryType(store, inventoryName, type) {
  const inventory = getInventory(store, inventoryName);
  if (type !== inventory.type) {
    inventory.type = type;
    dispatchInventoryChange(store, inventoryName);
  }
}

/**
 * @param store
 * @param inventoryName
 * @param width
 * @param height
 */
export function changeInventorySize(store, inventoryName, width, height) {
  const inventory = getInventory(store, inventoryName);
  if (width !== inventory.width || height !== inventory.height) {
    inventory.width = width;
    inventory.height = height;
    dispatchInventoryChange(store, inventoryName);
  }
}

/**
 * @param store
 * @param inventoryName
 */
export function isEmptyInventory(store, inventoryName) {
  const inventory = getInventory(store, inventoryName);
  if (inventory) {
    return inventory.items.length === 0;
  }

  return true;
}

/**
 * @param store
 * @param inventoryName
 * @param coordX
 * @param coordY
 */
export function getItemAtInventory(store, inventoryName, coordX, coordY) {
  const inventory = getInventory(store, inventoryName);
  if (inventory) {
    for (const itemId of inventory.items) {
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

  return null;
}

/**
 * @param store
 * @param inventoryName
 */
export function getItemIdsInInventory(store, inventoryName) {
  const inventory = getInventory(store, inventoryName);
  if (!inventory) {
    return [];
  }

  return inventory.items;
}

/**
 * @param store
 * @param inventoryName
 */
export function getItemsInInventory(store, inventoryName) {
  const inventory = getInventory(store, inventoryName);
  if (!inventory) {
    return [];
  }

  return inventory.items.map((itemId) => getItem(store, itemId));
}

/**
 * @param store
 * @param inventoryName
 * @param {string} itemId
 */
export function isItemInInventory(store, inventoryName, itemId) {
  const inventory = getInventory(store, inventoryName);
  if (!inventory) {
    return false;
  }

  for (const invItemId of inventory.items) {
    if (invItemId === itemId) {
      return true;
    }
  }

  return false;
}

/**
 * @param store
 * @param toInventoryName
 * @param item
 */
export function addItemToInventory(store, toInventoryName, item) {
  const inventory = getInventory(store, toInventoryName);
  if (!inventory) {
    throw new Error(
      `Cannot put item in for non-existant inventory '${toInventoryName}'.`
    );
  }

  inventory.items.push(item.itemId);
  dispatchInventoryChange(store, toInventoryName);
}

/**
 * @param store
 * @param fromInventoryName
 * @param item
 */
export function deleteItemFromInventory(store, fromInventoryName, item) {
  const inventory = getInventory(store, fromInventoryName);
  if (!inventory) {
    throw new Error(
      `Cannot take item out of non-existant inventory '${fromInventoryName}'.`
    );
  }

  for (let i = 0; i < inventory.items.length; ++i) {
    const invItemId = inventory.items[i];
    if (invItemId === item.itemId) {
      inventory.items.splice(i, 1);
    }
  }

  dispatchInventoryChange(store, fromInventoryName);
}

/**
 * @param store
 * @param inventoryName
 */
export function dispatchInventoryChange(store, inventoryName) {
  dispatchInventoryEvent(store, 'inventory', inventoryName);
}

/**
 * @param store
 * @param inventoryName
 * @param callback
 */
export function addInventoryChangeListener(store, inventoryName, callback) {
  addInventoryEventListener(store, 'inventory', inventoryName, callback);
}

/**
 * @param store
 * @param inventoryName
 * @param callback
 */
export function removeInventoryChangeListener(store, inventoryName, callback) {
  removeInventoryEventListener(store, 'inventory', inventoryName, callback);
}

/**
 * @param store
 */
export function dispatchInventoryListChange(store) {
  dispatchInventoryEvent(store, 'container', 'all');
}

/**
 * @param store
 * @param callback
 */
export function addInventoryListChangeListener(store, callback) {
  addInventoryEventListener(store, 'container', 'all', callback);
}

/**
 * @param store
 * @param callback
 */
export function removeInventoryListChangeListener(store, callback) {
  removeInventoryEventListener(store, 'container', 'all', callback);
}

/**
 * @param store
 */
export function getInventoryList(store) {
  return Object.values(store.data.inventory);
}

/**
 * @typedef Item
 * @property {ItemId} itemId
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 * @property {string} imgSrc
 * @property {string} displayName
 * @property {object} metadata
 */

/**
 * @param store
 * @param itemId
 */
export function resolveItem(store, itemId) {
  if (isItem(store, itemId)) {
    return getItem(store, itemId);
  }

  return createItem(store, itemId);
}

/**
 * @param store
 * @param state
 * @param {ItemId} itemId
 * @returns {Item}
 */
export function createItem(store, state, itemId = uuid()) {
  const item = {
    itemId,
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    imgSrc: '',
    displayName: 'Item',
    metadata: {},
    ...state,
  };
  store.data.item[itemId] = item;
  return item;
}

/**
 * @param store
 * @param itemId
 */
export function deleteItem(store, itemId) {
  delete store.data.item[itemId];
}

/**
 * @param store
 * @param itemId
 */
export function isItem(store, itemId) {
  return Boolean(store.data.item[itemId]);
}

/**
 * @param store
 * @param itemId
 */
export function getItem(store, itemId) {
  return store.data.item[itemId];
}

/**
 * @param store
 */
export function getItems(store) {
  return Object.values(store.data.item);
}

/**
 * @param store
 * @param itemId
 * @param state
 */
export function updateItem(store, itemId, state) {
  const item = store.data.item[itemId];
  if (!item) {
    throw new Error('Cannot update null item.');
  }

  store.data.item[itemId] = {
    ...item,
    ...state,
  };
  dispatchItemChange(store, itemId);
}

/**
 * @param store
 * @param itemId
 */
export function dispatchItemChange(store, itemId) {
  dispatchInventoryEvent(store, 'item', itemId);
}

/**
 * @param store
 * @param itemId
 * @param callback
 */
export function addItemChangeListener(store, itemId, callback) {
  addInventoryEventListener(store, 'item', itemId, callback);
}

/**
 * @param store
 * @param itemId
 * @param callback
 */
export function removeItemChangeListener(store, itemId, callback) {
  removeInventoryEventListener(store, 'item', itemId, callback);
}

/**
 * @param store
 * @param event
 * @param key
 * @param callback
 */
function addInventoryEventListener(store, event, key, callback) {
  if (!(event in store.listeners)) {
    throw new Error(
      `Cannot manage listener for unknown inventory event '${event}'.`
    );
  }

  let listeners = store.listeners[event][key];
  if (!listeners) {
    listeners = [];
    store.listeners[event][key] = listeners;
  }

  listeners.push(callback);
}

/**
 * @param store
 * @param event
 * @param key
 * @param callback
 */
function removeInventoryEventListener(store, event, key, callback) {
  if (!(event in store.listeners)) {
    throw new Error(
      `Cannot manage listener for unknown inventory event '${event}'.`
    );
  }

  const listeners = store.listeners[event][key];
  if (listeners) {
    const i = listeners.indexOf(callback);
    if (i >= 0) {
      listeners.splice(i, 1);
    }
  }
}

/**
 * @param store
 * @param event
 * @param key
 */
function dispatchInventoryEvent(store, event, key) {
  if (!(event in store.listeners)) {
    throw new Error(
      `Cannot dispatch event for unknown inventory event '${event}'.`
    );
  }

  const listeners = store.listeners[event][key];
  if (listeners) {
    for (const listener of listeners) {
      listener.call(undefined, store, key);
    }
  }
}
