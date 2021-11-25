import { exportDataToJSON, importDataFromJSON } from '../inventory/InventoryLoader.js';
import { dispatchAlbumChange } from '../inventory/InventoryStore.js';
import { copyItem } from '../inventory/Item.js';
import { uuid } from '../util/uuid.js';

export function exportAlbumToJSON(album, dst = undefined) {
  return exportDataToJSON('album_v1', copyAlbum(album), {}, dst);
}

export function importAlbumFromJSON(jsonData, dst = undefined) {
  return importDataFromJSON(jsonData, 'album_v1', (data) => copyAlbum(data, dst));
}

export function getExistingAlbum(store, albumId) {
  if (isAlbumInStore(store, albumId)) {
    return getAlbumInStore(store, albumId);
  } else {
    throw new Error(`Cannot get non-existant album '${albumId}'.`);
  }
}

export function isAlbumInStore(store, albumId) {
  return albumId in store.data.album;
}

export function getAlbumInStore(store, albumId) {
  return store.data.album[albumId];
}

export function addAlbumToStore(store, albumId, album) {
  if (albumId !== album.albumId) {
    throw new Error(`Cannot add album '${album.albumId}' for mismatched id '${albumId}'.`);
  }
  if (albumId in store.data.album) {
    return false;
  }
  store.data.album[albumId] = album;
  dispatchAlbumChange(store, albumId);
  return true;
}

export function deleteAlbumFromStore(store, albumId, album) {
  if (albumId !== album.albumId) {
    throw new Error(`Cannot delete album '${album.albumId}' for mismatched id '${albumId}'.`);
  }
  if (!(albumId in store.data.album)) {
    return false;
  }
  delete store.data.album[albumId];
  dispatchAlbumChange(store, albumId);
  return true;
}

export function createAlbumInStore(store, albumId) {
  let album = createAlbum(albumId);
  if (!addAlbumToStore(store, albumId, album)) {
    throw new Error('Failed to create album in store.');
  }
  return album;
}

export function createAlbum(albumId) {
  let album = {
    albumId,
    items: {},
  };
  return album;
}

export function copyAlbum(other, dst = undefined) {
  const albumId = other.albumId || uuid();
  if (!dst) {
    dst = createAlbum(albumId);
  } else {
    dst.albumId = albumId;
  }
  if (typeof other.items === 'object') {
    for (let item of Object.values(other.items)) {
      let newItem = copyItem(item);
      dst.items[newItem.itemId] = item;
    }
  }
  return dst;
}

export function addItemToAlbum(store, albumId, item) {
  let album = getExistingAlbum(store, albumId);
  const itemId = item.itemId;
  album.items[itemId] = item;
  dispatchAlbumChange(store, albumId);
}

export function removeItemFromAlbum(store, albumId, itemId) {
  let album = getExistingAlbum(store, albumId);
  if (hasItemInAlbum(store, albumId, itemId)) {
    delete album.items[itemId];
    dispatchAlbumChange(store, albumId);
  }
}

export function hasItemInAlbum(store, albumId, itemId) {
  let album = getExistingAlbum(store, albumId);
  return itemId in album.items;
}

export function getItemInAlbum(store, albumId, itemId) {
  let album = getExistingAlbum(store, albumId);
  return album.items[itemId];
}

export function getItemIdsInAlbum(store, albumId) {
  let album = getExistingAlbum(store, albumId);
  return Object.keys(album.items);
}

export function getItemsInAlbum(store, albumId) {
  let album = getExistingAlbum(store, albumId);
  return Object.keys(album.items);
}
