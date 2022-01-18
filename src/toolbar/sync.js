import {
  loadSatchelAlbumsFromData,
  loadSatchelProfilesFromData,
  saveSatchelAlbumsToData,
  saveSatchelProfilesToData,
} from '../loader/SatchelLoader.js';
import { isAlbumHidden } from '../satchel/album/Album.js';
import { getCursorContext } from '../satchel/inv/CursorHelper.js';
import { getAlbumIdsInStore } from '../store/AlbumStore.js';
import { getProfileIdsInStore } from '../store/ProfileStore.js';
import { getSatchelStore } from '../store/SatchelStore.js';
import { Logger } from '../util/Logger.js';
import { readGoogleAppFile, signInGoogle, signOutGoogle, writeGoogleAppFile } from './GoogleDrive.js';
import { startCloud } from './PeerSession.js';

const LOGGER = new Logger('toolbar.sync');

function el(selector, event, callback) {
  document.querySelector(selector).addEventListener(event, callback);
}

export function setupSync() {
  el('#actionImportGoogle', 'click', onActionImportGoogle);
  el('#actionExportGoogle', 'click', onActionExportGoogle);
  el('#actionSignOut', 'click', onActionSignOut);
  el('#actionPeer', 'click', onActionPeer);
}

const BUSY_ADJ = [
  'Fetching',
  'Feeding',
  'Wrangling',
  'Spooling',
  'Bubbling',
  'Raising',
  'Finding',
  'Investigating',
  'Pushing',
  'Pulling',
  'Committing',
  'Branching',
];
const BUSY_NOUN = [
  'Goblins',
  'Hobgoblins',
  'Beholders',
  'Ankhegs',
  'Dragons',
  'Minds',
  'Cubes',
  'Mimics',
  'Humans',
  'Gnomes',
  'Elves',
];
function randomBusyLabel() {
  let i = Math.floor(Math.random() * BUSY_ADJ.length);
  let j = Math.floor(Math.random() * BUSY_NOUN.length);
  return `${BUSY_ADJ[i]} ${BUSY_NOUN[j]}`;
}

export function startBusyWork() {
  let busyDialog = document.querySelector('#busyDialog');
  busyDialog.toggleAttribute('open', true);
  let busyLabel = document.querySelector('#busyLabel');
  busyLabel.innerHTML = randomBusyLabel();
  let ctx = getCursorContext();
  let handle = setInterval(() => {
    let busyProgress = document.querySelector('#busyProgress');
    switch (busyProgress.textContent) {
      case '.':
        busyProgress.textContent = '..';
        break;
      case '..':
        busyProgress.textContent = '...';
        break;
      case '...':
        busyProgress.textContent = '.';
        break;
      default:
        busyProgress.textContent = '.';
        break;
    }
  }, 300);
  ctx.busyWork = handle;
}

export function stopBusyWork() {
  let busyDialog = document.querySelector('#busyDialog');
  busyDialog.toggleAttribute('open', false);
  let ctx = getCursorContext();
  let handle = ctx.busyWork;
  clearInterval(handle);
}

async function onActionImportGoogle() {
  try {
    startBusyWork();
    if (!(await signInGoogle())) {
      throw new Error('Not signed in to Google.');
    }
    await loadSatchelFromGoogle();
    window.alert('Import complete!');
  } catch (e) {
    LOGGER.error('Failed to import from Google', e);
    window.alert('Error! \n' + JSON.stringify(e));
  } finally {
    stopBusyWork();
  }
}

async function onActionExportGoogle() {
  try {
    startBusyWork();
    if (!(await signInGoogle())) {
      throw new Error('Not signed in to Google.');
    }
    await saveSatchelToGoogle();
    window.alert('Save complete!');
  } catch (e) {
    LOGGER.error('Failed to export to Google', e);
    window.alert('Error! \n' + JSON.stringify(e));
  } finally {
    stopBusyWork();
  }
}

async function onActionSignOut() {
  if (await signOutGoogle()) {
    window.alert('Signed out!');
  } else {
    window.alert('Already signed out.');
  }
}

async function loadSatchelFromGoogle() {
  const store = getSatchelStore();
  // Load from google...
  let satchelData = await readGoogleAppFile('satchel_data_v4');
  if (satchelData) {
    try {
      let jsonData = JSON.parse(satchelData);
      loadSatchelProfilesFromData(store, jsonData, true);
    } catch (e) {
      LOGGER.error('Failed to load satchel from storage', e);
    }
  }
  let albumData = await readGoogleAppFile('satchel_album_v3');
  if (albumData) {
    try {
      let jsonData = JSON.parse(albumData);
      loadSatchelAlbumsFromData(store, jsonData, true);
    } catch (e) {
      LOGGER.error('Failed to load album from storage.', e);
    }
  }
}

async function saveSatchelToGoogle() {
  const store = getSatchelStore();
  try {
    let profileIds = getProfileIdsInStore(store);
    let profileData = saveSatchelProfilesToData(store, profileIds);
    await writeGoogleAppFile('satchel_data_v4', JSON.stringify(profileData));
  } catch (e) {
    LOGGER.error('Failed to save profiles to Google', e);
  }
  try {
    let albumIds = getAlbumIdsInStore(store);
    // Do not save hidden albums
    albumIds.filter((albumId) => !isAlbumHidden(store, albumId));
    let albumData = saveSatchelAlbumsToData(store, albumIds);
    await writeGoogleAppFile('satchel_album_v3', JSON.stringify(albumData));
  } catch (e) {
    LOGGER.error('Failed to save albums to Google', e);
  }
}

function onActionPeer() {
  startCloud();
}
