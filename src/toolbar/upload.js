import { notify } from '../components/NotifyPrompt.js';
import { importAlbumFromJSON } from '../loader/AlbumLoader.js';
import { importItemFromJSON } from '../loader/ItemLoader.js';
import { loadSatchelFromData, loadSatchelProfilesFromData } from '../loader/SatchelLoader.js';
import { copyAlbum } from '../satchel/album/Album.js';
import { dropItemOnGround } from '../satchel/GroundAlbum.js';
import { copyItem } from '../satchel/item/Item.js';
import { forceEmptyStorage } from '../Storage.js';
import { addAlbumInStore, isAlbumInStore } from '../store/AlbumStore.js';
import { setActiveProfileInStore } from '../store/ProfileStore.js';
import { getSatchelStore } from '../store/SatchelStore.js';
import { uploadFile } from '../util/uploader.js';
import { openAlbumPane } from './album.js';

export async function uploadSatchelFile() {
  let files = await uploadFile('.json');
  let file = files[0];

  let jsonData;
  try {
    jsonData = JSON.parse(await file.text());
  } catch {
    notify(`Error! Could not upload file.\nFile must end with '.json'.`);
    return;
  }

  const store = getSatchelStore();
  switch(jsonData._type) {
    case 'satchel_v2':
    case 'satchel_v1': {
      if (!window.confirm('This will ERASE and OVERWRITE all data. Do you want to continue?')) {
        return;
      }
      forceEmptyStorage(true);
      try {
        loadSatchelFromData(store, jsonData, true);
        // Make sure to open the album
        openAlbumPane();
      } catch (e) {
        console.error('Failed to load satchel from file.');
        console.error(e);
      }
      forceEmptyStorage(false);
    } break;
    case 'profile_v2':
    case 'profile_v1': {
      try {
        let loadedProfileIds = loadSatchelProfilesFromData(store, jsonData, false);
        if (loadedProfileIds) {
          let profileId = loadedProfileIds[0];
          if (profileId) {
            setActiveProfileInStore(store, profileId);
          }
        }
      } catch (e) {
        console.error('Failed to load satchel from file.');
        console.error(e);
      }
    } break;
    case 'album_v2':
    case 'album_v1': {
      try {
        const album = importAlbumFromJSON(jsonData);
        if (isAlbumInStore(store, album.albumId)) {
          const newAlbum = copyAlbum(album);
          addAlbumInStore(store, newAlbum.albumId, newAlbum);
        } else {
          addAlbumInStore(store, album.albumId, album);
        }
        // Make sure to open the container
        openAlbumPane();
      } catch (e) {
        console.error('Failed to load album from file.');
        console.error(e);
      }
    } break;
    case 'item_v2':
    case 'item_v1': {
      try {
        let freeItem = copyItem(importItemFromJSON(jsonData));
        dropItemOnGround(freeItem);
      } catch (e) {
        console.error('Failed to load item from file.');
        console.error(e);
      }
    } break;
    default:
      notify(`Error! Could not upload file.\nUnknown data format: ${jsonData._type}`);
      break;
  }
}
