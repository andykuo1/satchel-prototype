import { resetInventoryStore } from './InventoryStore.js';

export function loadFromLocalStorage(store) {
    let dataString = localStorage.getItem('satchel_data_v1');
    let jsonData;
    try {
        jsonData = JSON.parse(dataString);
    } catch(e) {
        return;
    }
    if (jsonData && typeof jsonData.item === 'object' && typeof jsonData.inventory === 'object') {
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
            item: jsonData.item,
            inventory: jsonData.inventory,
        }
    };
    console.log(nextStore);
    resetInventoryStore(store, nextStore);
}

export function saveToJSON(store) {
    return store.data;
}

function saveItemToJSON(item) {
    return JSON.stringify(item);
}

function saveInventoryToJSON(inventory) {
    return JSON.stringify(inventory);
}
