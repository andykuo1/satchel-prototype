import { createAlbumInStore, exportAlbumToJSON, getAlbumInStore, importAlbumFromJSON, isAlbumInStore } from '../cards/CardAlbum.js';
import { exportInventoryToJSON, importInventoryFromJSON } from '../inventory/InventoryLoader.js';
import { createGridInventoryInStore, dispatchAlbumChange, dispatchInventoryChange, getInventoryInStore, getInventoryStore, isInventoryInStore } from '../inventory/InventoryStore.js';

export function loadSatchelFromStorage() {
  const store = getInventoryStore();

  // Resolve store data
  let mainInventory;
  if (isInventoryInStore(store, 'main')) {
    mainInventory = getInventoryInStore(store, 'main');
  } else {
    mainInventory = createGridInventoryInStore(store, 'main', 12, 9);
  }
  let mainAlbum;
  if (isAlbumInStore(store, 'main')) {
    mainAlbum = getAlbumInStore(store, 'main');
  } else {
    mainAlbum = createAlbumInStore(store, 'main');
  }

  // Load from storage...
  let invData = localStorage.getItem('satchel_data_v3');
  if (invData) {
    try {
      let jsonData = JSON.parse(invData);
      importInventoryFromJSON(jsonData, mainInventory);
      mainInventory.displayName = '';
      dispatchInventoryChange(store, mainInventory.invId);
    } catch (e) {
      console.error('Failed to load inventory from localStorage.');
      console.error(e);
    }
  }
  let albumData = localStorage.getItem('satchel_album_v2');
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
}

export function saveSatchelToStorage() {
  const store = getInventoryStore();

  if (isInventoryInStore(store, 'main')) {
    try {
      let mainInventory = getInventoryInStore(store, 'main');
      let invData = exportInventoryToJSON(mainInventory);
      localStorage.setItem('satchel_data_v3', JSON.stringify(invData));
    } catch (e) {
      console.error(e);
    }
  }

  if (isAlbumInStore(store, 'main')) {
    try {
      let mainAlbum = getAlbumInStore(store, 'main');
      let albumData = exportAlbumToJSON(mainAlbum);
      localStorage.setItem('satchel_album_v2', JSON.stringify(albumData));
    } catch (e) {
      console.error(e);
    }
  }
}
