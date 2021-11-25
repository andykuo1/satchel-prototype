import { setGroundContainer } from './inventory/GroundHelper.js';
import { getInventoryStore, createGridInventoryInStore, dispatchInventoryChange } from './inventory/InventoryStore.js';
import { loadInventoryFromJSON, saveInventoryToJSON } from './inventory/InventoryLoader.js';
import { getExistingInventory } from './inventory/InventoryTransfer.js';

const APP_VERSION = '1.0.20';

window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#appVersion').textContent = `v${APP_VERSION}`;
  document.addEventListener('itemcontext', (e) => {
    e.preventDefault();
    e.stopPropagation();

    /** @type {import('./inventory/element/ItemDetailEditorElement.js').ItemDetailEditorElement} */
    const detailEditor = document.querySelector('#detailEditor');
    const { invId, itemId, clientX, clientY } = e.detail;
    if (invId && itemId) {
      detailEditor.open(invId, itemId, clientX, clientY, true);
    }
    return false;
  });
});

window.addEventListener('DOMContentLoaded', () => {
  const store = getInventoryStore();
  const ground = document.querySelector('#ground');

  setGroundContainer(ground);

  const mainInventory = createGridInventoryInStore(store, 'main', 12, 9);

  // Load from storage...
  let invData = localStorage.getItem('satchel_data_v2');
  if (invData) {
    let jsonData = JSON.parse(invData);
    loadInventoryFromJSON(jsonData, mainInventory);
    mainInventory.displayName = '';
    dispatchInventoryChange(store, mainInventory.invId);
  }

  // Auto save to local storage every 1 second
  setInterval(() => {
    console.log('Autosave...');
    let inv = getExistingInventory(store, 'main');
    let jsonData = saveInventoryToJSON(inv, {});
    localStorage.setItem('satchel_data_v2', JSON.stringify(jsonData));
  }, 1000);
});
