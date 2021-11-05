import { uuid } from './util.js';

/**
 * @typedef {object} InventoryStore
 * @typedef {object} Container
 * @typedef {object} Inventory
 */

let GLOBAL_STORE = createInventoryStore();

export function createInventoryStore() {
    return {
        data: {
            inventory: {},
        },
        items: {},
        containers: {},
        listeners: {
            item: {},
            inventory: {},
            container: {},
        },
    };
}

export function setInventoryStore(store) {
    GLOBAL_STORE = store;
}

export function getInventoryStore() {
    return GLOBAL_STORE;
}



export function createInventory(store, inventoryName = uuid(), inventoryType = 'grid', inventoryWidth = 1, inventoryHeight = 1) {
    let inventory = {
        name: inventoryName,
        items: [],
        width: inventoryWidth,
        height: inventoryHeight,
        type: inventoryType,
    };
    store.data.inventory[inventoryName] = inventory;
    dispatchInventoryListChange(store);
    dispatchInventoryChange(store, inventoryName);
    return inventory;
}

export function deleteInventory(store, inventoryName) {
    if (inventoryName in store.data.inventory) {
        delete store.data.inventory[inventoryName];
        dispatchInventoryListChange(store);
        dispatchInventoryChange(store, inventoryName);
    }
}

export function getInventory(store, inventoryName) {
    let inventory = store.data.inventory[inventoryName];
    if (inventory) {
        return inventory;
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

export function changeInventoryType(store, inventoryName, type) {
    let inventory = getInventory(store, inventoryName);
    if (type !== inventory.type) {
        inventory.type = type;
        dispatchInventoryChange(store, inventoryName);
    }
}

export function changeInventorySize(store, inventoryName, width, height) {
    let inventory = getInventory(store, inventoryName);
    if (width !== inventory.width || height !== inventory.height) {
        inventory.width = width;
        inventory.height = height;
        dispatchInventoryChange(store, inventoryName);
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
        for(let itemId of inventory.items) {
            let item = getItem(store, itemId);
            if (coordX >= item.x
                && coordX < item.x + item.w
                && coordY >= item.y
                && coordY < item.y + item.h) {
                return item;
            }
        }
    }
    return null;
}

export function getItemIdsInInventory(store, inventoryName) {
    let inventory = getInventory(store, inventoryName);
    if (!inventory) return [];
    return inventory.items;
}

export function getItemsInInventory(store, inventoryName) {
    let inventory = getInventory(store, inventoryName);
    if (!inventory) return [];
    return inventory.items.map(itemId => getItem(store, itemId));
}

export function isItemInInventory(store, inventoryName, item) {
    let inventory = getInventory(store, inventoryName);
    if (!inventory) return false;
    for(let itemId of inventory.items) {
        if (itemId === item.itemId) {
            return true;
        }
    }
    return false;
}

export function addItemToInventory(store, toInventoryName, item) {
    let inventory = getInventory(store, toInventoryName);
    if (!inventory) throw new Error(`Cannot put item in for non-existant inventory '${toInventoryName}'.`);
    inventory.items.push(item.itemId);
    dispatchInventoryChange(store, toInventoryName);
}

export function deleteItemFromInventory(store, fromInventoryName, item) {
    let inventory = getInventory(store, fromInventoryName);
    if (!inventory) throw new Error(`Cannot take item out of non-existant inventory '${fromInventoryName}'.`);
    for(let i = 0; i < inventory.items.length; ++i) {
        let invItemId = inventory.items[i];
        if (invItemId === item.itemId) {
            inventory.items.splice(i, 1);
        }
    }
    dispatchInventoryChange(store, fromInventoryName);
}



export function dispatchInventoryChange(store, inventoryName) {
    dispatchInventoryEvent(store, 'inventory', inventoryName);
}

export function addInventoryChangeListener(store, inventoryName, callback) {
    addInventoryEventListener(store, 'inventory', inventoryName, callback);
}

export function removeInventoryChangeListener(store, inventoryName, callback) {
    removeInventoryEventListener(store, 'inventory', inventoryName, callback);
}



export function dispatchInventoryListChange(store) {
    dispatchInventoryEvent(store, 'container', 'all');
}

export function addInventoryListChangeListener(store, callback) {
    addInventoryEventListener(store, 'container', 'all', callback);
}

export function removeInventoryListChangeListener(store, callback) {
    removeInventoryEventListener(store, 'container', 'all', callback);
}

export function getInventoryList(store) {
    return Object.values(store.data.inventory);
}


export function resolveItem(store, itemId) {
    if (isItem(store, itemId)) {
        return getItem(store, itemId);
    } else {
        return createItem(store, itemId);
    }
}

export function createItem(store, state, itemId = uuid()) {
    let item = {
        itemId: itemId,
        x: 0, y: 0,
        w: 1, h: 1,
        imgSrc: '',
        displayName: 'Item',
        metadata: {},
        ...state,
    };
    store.items[itemId] = item;
    return item;
}

export function deleteItem(store, itemId) {
    store.items[itemId] = null;
}

export function isItem(store, itemId) {
    return Boolean(store.items[itemId]);
}

export function getItem(store, itemId) {
    return store.items[itemId];
}

export function updateItem(store, itemId, state) {
    let item = store.items[itemId];
    if (!item) throw new Error('Cannot update null item.');
    store.items[itemId] = {
        ...item,
        ...state,
    };
    dispatchItemChange(store, itemId);
}



export function dispatchItemChange(store, itemId) {
    dispatchInventoryEvent(store, 'item', itemId);
}

export function addItemChangeListener(store, itemId, callback) {
    addInventoryEventListener(store, 'item', itemId, callback);
}

export function removeItemChangeListener(store, itemId, callback) {
    removeInventoryEventListener(store, 'item', itemId, callback);
}


function addInventoryEventListener(store, event, key, callback) {
    if (!(event in store.listeners)) throw new Error(`Cannot manage listener for unknown inventory event '${event}'.`);
    let listeners = store.listeners[event][key];
    if (!listeners) {
        listeners = [];
        store.listeners[event][key] = listeners;
    }
    listeners.push(callback);
}

function removeInventoryEventListener(store, event, key, callback) {
    if (!(event in store.listeners)) throw new Error(`Cannot manage listener for unknown inventory event '${event}'.`);
    let listeners = store.listeners[event][key];
    if (listeners) {
        let i = listeners.indexOf(callback);
        if (i >= 0) {
            listeners.splice(i, 1);
        }
    }
}

function dispatchInventoryEvent(store, event, key) {
    if (!(event in store.listeners)) throw new Error(`Cannot dispatch event for unknown inventory event '${event}'.`);
    let listeners = store.listeners[event][key];
    if (listeners) {
        for(let listener of listeners) {
            listener.call(undefined, store, key);
        }
    }
}
