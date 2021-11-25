import { setGroundContainer } from './inventory/GroundHelper.js';
import { getInventoryStore, createGridInventoryInStore, dispatchInventoryChange, dispatchAlbumChange } from './inventory/InventoryStore.js';
import { loadInventoryFromJSON, saveInventoryToJSON } from './inventory/InventoryLoader.js';
import { getExistingInventory } from './inventory/InventoryTransfer.js';
import { exportAlbumToJSON, getExistingAlbum, importAlbumFromJSON, createAlbumInStore } from './cards/CardAlbum.js';

const APP_VERSION = '1.0.21';

window.addEventListener('DOMContentLoaded', () => {
  // Set app version
  document.querySelector('#appVersion').textContent = `v${APP_VERSION}`;
  // Prepare item context menu
  document.addEventListener('itemcontext', (e) => {
    e.preventDefault();
    e.stopPropagation();

    /** @type {import('./inventory/element/ItemDetailEditorElement.js').ItemDetailEditorElement} */
    const detailEditor = document.querySelector('#detailEditor');
    // @ts-ignore
    const { invId, itemId, clientX, clientY } = e.detail;
    if (invId && itemId) {
      detailEditor.open(invId, itemId, clientX, clientY, true);
    }
    return false;
  });
  // Initialize store
  const store = getInventoryStore();
  const ground = document.querySelector('#ground');
  setGroundContainer(ground);
  const mainInventory = createGridInventoryInStore(store, 'main', 12, 9);
  const mainAlbum = createAlbumInStore(store, 'main');

  // Load from storage...
  let invData = localStorage.getItem('satchel_data_v2');
  if (invData) {
    try {
      let jsonData = JSON.parse(invData);
      loadInventoryFromJSON(jsonData, mainInventory);
      mainInventory.displayName = '';
      dispatchInventoryChange(store, mainInventory.invId);
    } catch (e) {
      console.error('Failed to load inventory from localStorage.');
      console.error(e);
    }
  }
  let albumData = localStorage.getItem('satchel_album_v1');
  if (albumData) {
    try {
      let jsonData = JSON.parse(albumData);
      importAlbumFromJSON(jsonData, mainAlbum);
      dispatchAlbumChange(store, mainAlbum.albumId);
    } catch (e) {
      console.error('Failed to load album from localStorage.');
      console.error(e);
    }
  }

  // Auto save to local storage every 1 second
  setInterval(() => {
    console.log('Autosave...');

    try {
      let inv = getExistingInventory(store, 'main');
      let invData = saveInventoryToJSON(inv, {});
      localStorage.setItem('satchel_data_v2', JSON.stringify(invData));
    } catch (e) {
      console.error(e);
    }

    try {
      let album = getExistingAlbum(store, 'main');
      let albumData = exportAlbumToJSON(album);
      localStorage.setItem('satchel_album_v1', JSON.stringify(albumData));
    } catch (e) {
      console.error(e);
    }
  }, 5000);
});
