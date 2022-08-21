import { el } from '../ToolbarHelper.js';
import { updateList } from '../components/ElementListHelper.js';
import { AlbumPackElement, getCursor } from '../components/index.js';
import { isAlbumHidden, isAlbumLocked } from '../satchel/album/Album.js';
import { isGroundAlbum } from '../satchel/GroundAlbum.js';
import { isTrashAlbum } from '../satchel/TrashAlbum.js';
import { playSound } from '../sounds.js';
import { createAlbumInStore, getAlbumsInStore } from '../store/AlbumStore.js';
import { getSatchelStore } from '../store/SatchelStore.js';
import { uuid } from '../util/uuid.js';
import { uploadSatchelFile } from './upload.js';
import { addInventoryListChangeListener } from '../events/InvEvents.js';

export function setupAlbum() {
  el('#actionAlbumOpen', 'click', onActionAlbumOpen);
  el('#actionAlbumNew', 'click', onActionAlbumNew);
  el('#actionAlbumImport', 'click', uploadSatchelFile);
  el('.albumContainer', 'mouseup', onAlbumItemDrop);
  addInventoryListChangeListener(getSatchelStore(), onAlbumListUpdate);
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
    .filter((a) => !isAlbumLocked(store, a.invId))
    .filter((a) => !isGroundAlbum(a))
    .filter((a) => !isTrashAlbum(a))
    .filter((a) => !isAlbumHidden(store, a.invId));
  let cursor = getCursor();
  // HACK: This is so single clicks won't create albums
  // @ts-ignore
  if (cursor.hasHeldItem() && !cursor.ignoreFirstPutDown) {
    let albumId;
    if (albums.length > 0) {
      albumId = albums[0].invId;
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
    .filter((a) => !isTrashAlbum(a))
    .filter((a) => !isAlbumHidden(store, a.invId))
    .map((a) => a.invId)
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
