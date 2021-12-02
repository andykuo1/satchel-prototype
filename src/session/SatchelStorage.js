import { copyAlbum, createAlbum } from '../satchel/album/Album.js';
import { dispatchAlbumChange } from '../satchel/album/AlbumEvents.js';
import { exportAlbumToJSON, importAlbumFromJSON } from '../satchel/album/AlbumLoader.js';
import { addAlbumInStore, getAlbumInStore, getAlbumsInStore, isAlbumInStore } from '../satchel/album/AlbumStore.js';
import { exportInventoryToJSON, importInventoryFromJSON } from '../satchel/inv/InvLoader.js';
import { createGridInventoryInStore, dispatchInventoryChange, getInventoryInStore, getInventoryStore, isInventoryInStore } from '../inventory/InventoryStore.js';

export function loadSatchelFromStorage() {
  const store = getInventoryStore();

  // Resolve store data
  let mainInventory;
  if (isInventoryInStore(store, 'main')) {
    mainInventory = getInventoryInStore(store, 'main');
  } else {
    mainInventory = createGridInventoryInStore(store, 'main', 12, 9);
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
  let albumData = localStorage.getItem('satchel_album_v3');
  if (albumData) {
    try {
      let jsonData = JSON.parse(albumData);
      for(let albumJson of jsonData) {
        const album = importAlbumFromJSON(albumJson);
        const albumId = album.albumId;
        if (isAlbumInStore(store, albumId)) {
          const oldAlbum = getAlbumInStore(store, albumId);
          copyAlbum(album, oldAlbum);
          dispatchAlbumChange(store, albumId);
        } else {
          addAlbumInStore(store, albumId, album);
        }
      }
    } catch (e) {
      console.error('Failed to load album from localStorage.');
      console.error(e);
    }
  } else {
    if (!isAlbumInStore(store, 'ground')) {
      let album = createAlbum('ground');
      album.displayName = 'Ground';
      addAlbumInStore(store, album.albumId, album);
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

  let albums = getAlbumsInStore(store);
  let albumData = [];
  for(let album of albums) {
    try {
      albumData.push(exportAlbumToJSON(album));
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem('satchel_album_v3', JSON.stringify(albumData));
}
