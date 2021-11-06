import { getInventory, getItemsInInventory, resetInventoryStore } from './InventoryStore.js';

export function loadFromLocalStorage(store) {
    let dataString = localStorage.getItem('satchel_data_v1');
    let jsonData;
    try {
        jsonData = JSON.parse(dataString);
    } catch(e) {
        return;
    }
    if (jsonData && typeof jsonData.data === 'object') {
        loadFromJSON(store, jsonData);
    }
}

export function saveToLocalStorage(store) {
    let jsonData = saveToJSON(store);
    localStorage.removeItem('satchel_data_v1');
    localStorage.setItem('satchel_data_v1', JSON.stringify(jsonData));
}

export function loadFromJSON(store, jsonData) {
    let nextStore = {
        data: {
            item: jsonData.data.item,
            inventory: jsonData.data.inventory,
        }
    };
    resetInventoryStore(store, nextStore);
}

export function saveToJSON(store) {
    let result = {
        data: store.data,
    };
    return result;
}

export function saveInventoryToJSON(store, inventoryName) {
    let inv = getInventory(store, inventoryName);
    let result = {
        data: {
            item: {},
            inventory: {
                [inventoryName]: inv,
            },
        }
    };
    let items = getItemsInInventory(store, inventoryName);
    for(let item of items) {
        result.data.item[item.itemId] = item;
    }
    return result;
}
