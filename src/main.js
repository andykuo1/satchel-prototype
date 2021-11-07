import { setCursorElement } from './inventory/CursorHelper.js';
import { setGroundContainer } from './inventory/GroundHelper.js';
import { createInventoryView } from './inventory/InventoryView.js';
import { getInventoryStore, createInventory } from './inventory/InventoryStore.js';
import {
  applyItemBuilder,
  openItemBuilder,
  resetItemBuilder,
} from './inventory/ItemBuilder.js';
import { loadFromLocalStorage, saveToLocalStorage } from './inventory/InventoryLoader.js';

const APP_VERSION = '1.0.11';

window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#appVersion').textContent = `v${APP_VERSION}`;
  document.querySelector('#itemBuilder').addEventListener('submit', (e) => {
    e.preventDefault();

    const editor = document.querySelector('#editor');
    editor.classList.toggle('open', false);

    const { target } = e;
    applyItemBuilder(target);
    return false;
  });
  document.querySelector('#itemResetButton').addEventListener('click', (e) => {
    e.preventDefault();

    const editor = document.querySelector('#editor');
    editor.classList.toggle('open', false);

    const itemBuilder = document.querySelector('#itemBuilder');
    resetItemBuilder(itemBuilder);

    return false;
  });
  document.addEventListener('itemcontext', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const editor = document.querySelector('#editor');
    editor.classList.toggle('open', false);
    const { itemId } = e.detail;
    if (itemId) {
      openItemBuilder(document.querySelector('#itemBuilder'), itemId);
      // Animate open/close transition
      setTimeout(() => editor.classList.toggle('open', true), 100);
    }

    return false;
  });
});

window.addEventListener('DOMContentLoaded', () => {
  const store = getInventoryStore();
  const workspace = document.querySelector('#workspace');
  const cursor = document.querySelector('#cursor');
  const ground = document.querySelector('#ground');

  const cursorInventory = createInventory(
    getInventoryStore(),
    'cursor',
    'socket',
    1,
    1
  );
  const cursorElement = createInventoryView(store, cursorInventory.name);
  cursor.append(cursorElement);

  setCursorElement(cursorElement);
  setGroundContainer(ground);

  const mainInventory = createInventory(store, 'main', 'grid', 12, 9);
  const mainElement = createInventoryView(store, mainInventory.name);
  workspace.append(mainElement);

  // Load from storage...
  loadFromLocalStorage(getInventoryStore());

  // Auto save to local storage every 5 second
  setInterval(() => {
    console.log('Autosave...');
    saveToLocalStorage(getInventoryStore());
  }, 5000);
});
