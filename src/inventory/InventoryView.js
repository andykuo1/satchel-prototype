import { deleteInventory, getInventory, getInventoryStore, isEmptyInventory } from './InventoryStore.js';

export function createInventoryView(store, inventoryName) {
    let inv = getInventory(store, inventoryName);
    let element = document.createElement('inventory-grid');
    element.name = inv.name;
    return element;
}

export function createTemporaryInventoryView(store, inventoryName) {
    let inv = getInventory(store, inventoryName);
    let element = document.createElement('inventory-grid');
    element.name = inv.name;
    element.addEventListener('itemchange', onTemporaryInventoryItemChange);
    return element;
}

function onTemporaryInventoryItemChange(e) {
    let target = e.target;
    let inventoryName = target.name;
    let store = getInventoryStore();
    if (isEmptyInventory(store, inventoryName)) {
        target.removeEventListener('itemchange', onTemporaryInventoryItemChange);
        target.parentNode.removeChild(target);
        deleteInventory(store, inventoryName);
    }
}