import { notify } from '../components/NotifyPrompt.js';
import { importAlbumFromJSON } from '../loader/AlbumLoader.js';
import { importItemFromJSON } from '../loader/ItemLoader.js';
import { loadSatchelFromData, loadSatchelProfilesFromData } from '../loader/SatchelLoader.js';
import { dropItemOnGround } from '../satchel/GroundAlbum.js';
import { copyInventory } from '../satchel/inv/Inv.js';
import { copyItem } from '../satchel/item/Item.js';
import { forceEmptyStorage } from '../Storage.js';
import { addInvInStore, isInvInStore } from '../store/InvStore.js';
import { setActiveProfileInStore } from '../store/ProfileStore.js';
import { getSatchelStore } from '../store/SatchelStore.js';
import { uploadFile } from '../util/uploader.js';
import { openAlbumPane } from './album.js';
import { startBusyWork, stopBusyWork } from './sync.js';

async function tryUploadJSONFile() {
  let file;
  try {
    let files = await uploadFile('.json');
    file = files[0];
  } catch (e) {
    notify('Upload cancelled.');
    return null;
  }
  let jsonData;
  try {
    jsonData = JSON.parse(await file.text());
  } catch (e) {
    notify(`Error! Could not upload file.\nFile must end with '.json'.\n${e}`);
    return null;
  }
  return jsonData;
}

async function tryLoadJSONFile(store, jsonData) {
  switch (jsonData._type) {
    case 'satchel_v2':
    case 'satchel_v1':
      {
        if (!window.confirm('This will ERASE and OVERWRITE all data. Do you want to continue?')) {
          notify('Upload cancelled.');
          return;
        }
        try {
          forceEmptyStorage(true);
          loadSatchelFromData(store, jsonData, true);
          // Make sure to open the album
          openAlbumPane();
        } catch (e) {
          notify(`Error! Failed to load album file.\n${e}`);
        } finally {
          forceEmptyStorage(false);
        }
      }
      break;
    case 'profile_v2':
    case 'profile_v1':
      {
        try {
          let loadedProfileIds = loadSatchelProfilesFromData(store, jsonData, false);
          if (loadedProfileIds) {
            let profileId = loadedProfileIds[0];
            if (profileId) {
              setActiveProfileInStore(store, profileId);
            }
          }
        } catch (e) {
          notify(`Error! Failed to load satchel file.\n${e}`);
        }
      }
      break;
    case 'album_v3':
    case 'album_v2':
    case 'album_v1':
      {
        try {
          const album = importAlbumFromJSON(jsonData);
          if (isInvInStore(store, album.invId)) {
            const newAlbum = copyInventory(album);
            addInvInStore(store, newAlbum.invId, newAlbum);
          } else {
            addInvInStore(store, album.invId, album);
          }
          // Make sure to open the container
          openAlbumPane();
        } catch (e) {
          notify(`Error! Failed to load album file.\n${e}`);
        }
      }
      break;
    case 'item_v2':
    case 'item_v1':
      {
        try {
          let freeItem = copyItem(importItemFromJSON(jsonData));
          dropItemOnGround(freeItem);
        } catch (e) {
          notify(`Error! Failed to load item file.\n${e}`);
        }
      }
      break;
    default:
      notify(`Error! Could not upload file.\nUnknown data format: ${jsonData._type}`);
      break;
  }
}

export async function uploadSatchelFile() {
  try {
    startBusyWork();
    let result = await tryUploadJSONFile();
    if (!result) {
      return;
    }
    const store = getSatchelStore();
    tryLoadJSONFile(store, result);
    notify('Upload completed!');
  } finally {
    stopBusyWork();
  }
}
