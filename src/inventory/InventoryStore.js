import { uuid } from './util.js';

/**
 * @typedef {object} InventoryStore
 * @typedef {object} Container
 * @typedef {object} Inventory
 */

export function createInventoryStore() {
    return {
        items: {},
        containers: {},
        ground: {},
        cursor: {},
    };
}

function createContainer(store, inventoryKey) {
    let container = {
        inventory: null,
        listeners: [],
        active: false,
    };
    store.containers[inventoryKey] = container;
    return container;
}

function getContainer(store, inventoryKey) {
    return store.containers[inventoryKey];
}

function resolveContainer(store, inventoryKey) {
    if (inventoryKey in store.containers) {
        return getContainer(store, inventoryKey);
    } else {
        return createContainer(store, inventoryKey);
    }
}

export function createInventory(store, inventoryKey = uuid()) {
    let inventory = {
        key: inventoryKey,
        items: [],
        width: 1,
        height: 1,
    };
    let container = resolveContainer(store, inventoryKey);
    container.inventory = inventory;
    container.active = true;
    dispatchInventoryChange(store, inventoryKey);
    return inventory;
}

export function deleteInventory(store, inventoryKey) {
    let container = getContainer(store, inventoryKey);
    if (container) {
        container.active = false;
        container.inventory = null;
        dispatchInventoryChange(store, inventoryKey);
    }
}

export function getInventory(store, inventoryKey) {
    let container = getContainer(store, inventoryKey);
    if (container) {
        return container.inventory;
    } else {
        return null;
    }
}

export function clearInventory(store, inventoryKey) {
    let inventory = getInventory(store, inventoryKey);
    if (inventory) {
        let prevLength = inventory.items.length;
        if (prevLength > 0) {
            inventory.items.length = 0;
            dispatchInventoryChange(store, inventoryKey);
        }
    }
}

export function isEmptyInventory(store, inventoryKey) {
    let inventory = getInventory(store, inventoryKey);
    if (inventory) {
        return inventory.items.length === 0;
    } else {
        return true;
    }
}

export function getItemAtInventory(store, inventoryKey, coordX, coordY) {
    let inventory = getInventory(store, inventoryKey);
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

export function isItemInInventory(store, inventoryKey, item) {
    let inventory = getInventory(store, inventoryKey);
    if (!inventory) return false;
    return inventory.items.includes(item);
}

export function putItemInInventory(store, toInventoryKey, item) {
    let inventory = getInventory(store, toInventoryKey);
    if (!inventory) throw new Error('Cannot put item in for non-existant inventory.');
    inventory.items.push(item);
    dispatchInventoryChange(store, toInventoryKey);
}

export function takeItemOutInventory(store, fromInventoryKey, item) {
    let inventory = getInventory(store, fromInventoryKey);
    if (!inventory) throw new Error('Cannot take item out of non-existant inventory.');
    let i = inventory.items.indexOf(item);
    inventory.items.splice(i, 1);
    dispatchInventoryChange(store, fromInventoryKey);
}



export function dispatchInventoryChange(store, inventoryKey) {
    let container = getContainer(store, inventoryKey);
    if (!container) throw new Error('Dispatching inventory change event for null container.');
    let inventory = container.inventory;
    for(let listener of container.listeners) {
        listener.call(undefined, inventory, store);
    }
}

export function addInventoryChangeListener(store, inventoryKey, callback) {
    let container = resolveContainer(store, inventoryKey);
    container.listeners.push(callback);
}

export function removeInventoryChangeListener(store, inventoryKey, callback) {
    let container = resolveContainer(store, inventoryKey);
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
