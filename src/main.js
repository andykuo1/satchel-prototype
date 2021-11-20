import { setGroundContainer } from './inventory/GroundHelper.js';
import { createInventoryView } from './inventory/InvView.js';
import { getInventoryStore, createGridInventoryInStore, dispatchInventoryChange } from './inventory/InventoryStore.js';
import {
  applyItemBuilder,
  openItemBuilder,
  resetItemBuilder,
} from './app/ItemBuilder.js';
import { loadInventoryFromJSON, saveInventoryToJSON } from './inventory/InventoryLoader.js';
import { getExistingInventory } from './inventory/InventoryTransfer.js';

const APP_VERSION = '1.0.18';

window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#appVersion').textContent = `v${APP_VERSION}`;
  document.querySelector('inventory-itembuilder').addEventListener('submit', (e) => {
    e.preventDefault();

    const editor = document.querySelector('#editor');
    editor.classList.toggle('open', false);

    const { target } = e;
    applyItemBuilder(target);
    return false;
  });
  document.querySelector('inventory-itembuilder').addEventListener('reset', (e) => {
    e.preventDefault();

    const editor = document.querySelector('#editor');
    editor.classList.toggle('open', false);

    const { target } = e;
    resetItemBuilder(target);
    return false;
  });
  document.addEventListener('itemcontext', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const editor = document.querySelector('#editor');
    editor.classList.toggle('open', false);
    const { invId, itemId } = e.detail;
    if (invId && itemId) {
      openItemBuilder(document.querySelector('inventory-itembuilder'), invId, itemId);
      // Animate open/close transition
      setTimeout(() => editor.classList.toggle('open', true), 100);
    }

    return false;
  });
});

window.addEventListener('DOMContentLoaded', () => {
  const store = getInventoryStore();
  const workspace = document.querySelector('#workspace');
  const ground = document.querySelector('#ground');

  setGroundContainer(ground);

  const mainInventory = createGridInventoryInStore(store, 'main', 12, 9);
  const mainElement = createInventoryView(store, mainInventory.invId);
  workspace.append(mainElement);

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
