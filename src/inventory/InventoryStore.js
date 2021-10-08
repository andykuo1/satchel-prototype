import { uuid } from './util.js';

/**
 * @typedef {object} InventoryStore
 * @typedef {object} Container
 * @typedef {object} Inventory
 */

let GLOBAL_STORE = createInventoryStore();

export function createInventoryStore() {
    return {
        items: {},
        containers: {},
        ground: {},
        cursor: {},
    };
}

export function setInventoryStore(store) {
    GLOBAL_STORE = store;
}

export function getInventoryStore() {
    return GLOBAL_STORE;
}

function createContainer(store, inventoryName) {
    let container = {
        inventory: null,
        listeners: [],
        active: false,
    };
    store.containers[inventoryName] = container;
    return container;
}

function getContainer(store, inventoryName) {
    return store.containers[inventoryName];
}

function resolveContainer(store, inventoryName) {
    if (inventoryName in store.containers) {
        return getContainer(store, inventoryName);
    } else {
        return createContainer(store, inventoryName);
    }
}

export function createInventory(store, inventoryName = uuid()) {
    let inventory = {
        name: inventoryName,
        items: [],
        width: 1,
        height: 1,
    };
    let container = resolveContainer(store, inventoryName);
    container.inventory = inventory;
    container.active = true;
    dispatchInventoryChange(store, inventoryName);
    return inventory;
}

export function deleteInventory(store, inventoryName) {
    let container = getContainer(store, inventoryName);
    if (container) {
        container.active = false;
        container.inventory = null;
        dispatchInventoryChange(store, inventoryName);
    }
}

export function resolveInventory(store, inventoryName) {
    let container = getContainer(store, inventoryName);
    if (container && container.inventory) {
        return container.inventory;
    } else {
        return createInventory(store, inventoryName);
    }
}

export function getInventory(store, inventoryName) {
    let container = getContainer(store, inventoryName);
    if (container) {
        return container.inventory;
    } else {
        return null;
    }
}

export function clearInventory(store, inventoryName) {
    let inventory = getInventory(store, inventoryName);
    if (inventory) {
        let prevLength = inventory.items.length;
        if (prevLength > 0) {
            inventory.items.length = 0;
            dispatchInventoryChange(store, inventoryName);
        }
    }
}

export function isEmptyInventory(store, inventoryName) {
    let inventory = getInventory(store, inventoryName);
    if (inventory) {
        return inventory.items.length === 0;
    } else {
        return true;
    }
}

export function getItemAtInventory(store, inventoryName, coordX, coordY) {
    let inventory = getInventory(store, inventoryName);
    if (inventory) {
        for(let item of inventory.items) {
            if (coordX >= item.x
                && coordX < item.x + item.w
                && coordY >= item.y
                && coordY < item.y + item.h) {
                return item;
            }
        }
        return null;
    }
}

export function getItemsInInventory(store, inventoryId) {
    let inventory = getInventory(store, inventoryId);
    if (!inventory) return [];
    return inventory.items;
}

export function isItemInInventory(store, inventoryName, item) {
    let inventory = getInventory(store, inventoryName);
    if (!inventory) return false;
    return inventory.items.includes(item);
}

export function addItemToInventory(store, toInventoryKey, item) {
    let inventory = getInventory(store, toInventoryKey);
    if (!inventory) throw new Error(`Cannot put item in for non-existant inventory '${toInventoryKey}'.`);
    inventory.items.push(item);
    dispatchInventoryChange(store, toInventoryKey);
}

export function deleteItemFromInventory(store, fromInventoryKey, item) {
    let inventory = getInventory(store, fromInventoryKey);
    if (!inventory) throw new Error(`Cannot take item out of non-existant inventory '${fromInventoryKey}'.`);
    let i = inventory.items.indexOf(item);
    inventory.items.splice(i, 1);
    dispatchInventoryChange(store, fromInventoryKey);
}



export function dispatchInventoryChange(store, inventoryName) {
    let container = getContainer(store, inventoryName);
    if (!container) throw new Error('Dispatching inventory change event for null container.');
    for(let listener of container.listeners) {
        listener.call(undefined, store, inventoryName);
    }
}

export function addInventoryChangeListener(store, inventoryName, callback) {
    let container = resolveContainer(store, inventoryName);
    container.listeners.push(callback);
}

export function removeInventoryChangeListener(store, inventoryName, callback) {
    let container = resolveContainer(store, inventoryName);
    let i = container.listeners.indexOf(callback);
    if (i >= 0) {
        container.listeners.splice(i, 1);
    }
}















export function createItem(store, itemId = uuid()) {
    let item = {
        id: itemId,
        name: 'Item',
        x: 0, y: 0,
        w: 1, h: 1,
        metadata: {},
    };
    store.items[itemId] = item;
    return item;
}

export function deleteItem(store, itemId) {
    delete store.items[itemId];
}

export function putItem(store, inventoryId, itemId) {
    let inv = store.containers[inventoryId];
}

export function takeItem(store, inventoryId, itemId) {

}

export function getItem(store, inventoryId, coordX, coordY) {

}
