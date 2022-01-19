import { updateList } from '../components/ElementListHelper.js';
import { AlbumPackElement, getCursor } from '../components/index.js';
import { addAlbumListChangeListener } from '../events/AlbumEvents.js';
import { isAlbumHidden } from '../satchel/album/Album.js';
import { isGroundAlbum } from '../satchel/GroundAlbum.js';
import { playSound } from '../sounds.js';
import { createAlbumInStore, getAlbumsInStore } from '../store/AlbumStore.js';
import { getSatchelStore } from '../store/SatchelStore.js';
import { uuid } from '../util/uuid.js';
import { uploadSatchelFile } from './upload.js';

function el(selector, event, callback) {
  document.querySelector(selector).addEventListener(event, callback);
}

export function setupAlbum() {
  el('#actionAlbumOpen', 'click', onActionAlbumOpen);
  el('#actionAlbumNew', 'click', onActionAlbumNew);
  el('#actionAlbumImport', 'click', uploadSatchelFile);
  el('.albumContainer', 'mouseup', onAlbumItemDrop);
  addAlbumListChangeListener(getSatchelStore(), onAlbumListUpdate);
}

export function openAlbumPane() {
  // Make sure to open the container
  let albumContainer = document.querySelector('.albumContainer');
  if (!albumContainer.classList.contains('open')) {
    onActionAlbumOpen();
  }
}

function onActionAlbumOpen() {
  let albumContainer = document.querySelector('.albumContainer');
  albumContainer.classList.toggle('open');
  let isOpen = albumContainer.classList.contains('open');
  if (isOpen) {
    playSound('openBag');
  } else {
    playSound('closeBag');
  }
}

function onAlbumItemDrop(e) {
  const store = getSatchelStore();
  const albums = getAlbumsInStore(store)
    .filter((a) => !a.locked)
    .filter((a) => !isGroundAlbum(a))
    .filter((a) => !isAlbumHidden(store, a.albumId));
  let cursor = getCursor();
  // HACK: This is so single clicks won't create albums
  // @ts-ignore
  if (cursor.hasHeldItem() && !cursor.ignoreFirstPutDown) {
    let albumId;
    if (albums.length > 0) {
      albumId = albums[0].albumId;
    } else {
      albumId = onActionAlbumNew();
    }
    let result = cursor.putDownInAlbum(albumId);
    if (result) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
}

function onAlbumListUpdate() {
  const store = getSatchelStore();
  const list = getAlbumsInStore(store)
    .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''))
    .filter((a) => !isGroundAlbum(a))
    .filter((a) => !isAlbumHidden(store, a.albumId))
    .map((a) => a.albumId)
    .reverse();
  const albumList = document.querySelector('#albumList');
  const factoryCreate = (key) => new AlbumPackElement(key);
  updateList(albumList, list, factoryCreate);
}

function onActionAlbumNew() {
  const store = getSatchelStore();
  const albumId = uuid();
  createAlbumInStore(store, albumId);
  const albumList = document.querySelector('#albumList');
  albumList.scrollTo(0, 0);
  return albumId;
}
