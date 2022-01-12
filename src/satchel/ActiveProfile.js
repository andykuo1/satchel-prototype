import { getCursorContext } from './inv/CursorHelper.js';
import { getSatchelStore } from '../store/SatchelStore.js';
import { uuid } from '../util/uuid.js';
import { createProfile } from './profile/Profile.js';
import {
  addActiveProfileChangeListener,
  addProfileChangeListener,
  removeActiveProfileChangeListener,
  removeProfileChangeListener,
} from '../events/ProfileEvents.js';
import {
  getActiveProfileInStore,
  getProfileInStore,
  getProfileIdsInStore,
  hasActiveProfileInStore,
  isProfileInStore,
  setActiveProfileInStore,
  addProfileInStore,
} from '../store/ProfileStore.js';
import { createGridInvInStore } from '../store/InvStore.js';

export function setupActiveProfile() {
  const store = getSatchelStore();
  const ctx = getCursorContext();
  const activeProfile = resolveActiveProfile(store);
  ctx.lastActiveProfileId = activeProfile.profileId;
  addActiveProfileChangeListener(onActiveProfileChange);
  addProfileChangeListener(activeProfile.profileId, onProfileChange);
  onProfileChange();

  // Enable profile editing
  document.querySelector('#actionProfile').toggleAttribute('disabled', false);
}

export function teardownActiveProfile() {
  const ctx = getCursorContext();
  let lastActiveProfileId = ctx.lastActiveProfileId;
  removeActiveProfileChangeListener(onActiveProfileChange);
  removeProfileChangeListener(lastActiveProfileId, onProfileChange);
}

export function changeActiveProfile(store, profileId) {
  if (isProfileInStore(store, profileId)) {
    setActiveProfileInStore(store, profileId);
    return true;
  }
  return false;
}

export function resolveActiveProfile(store) {
  if (hasActiveProfileInStore(store)) {
    let activeProfile = getActiveProfileInStore(store);
    if (activeProfile) {
      return activeProfile;
    }
  }
  let profileIds = getProfileIdsInStore(store);
  if (profileIds.length > 0) {
    let nextProfileId = profileIds[0];
    setActiveProfileInStore(store, nextProfileId);
    return getProfileInStore(store, nextProfileId);
  }
  // Create the default active profile if none exists.
  let newProfile = createProfile(uuid());
  let newInv = createGridInvInStore(store, uuid(), 12, 9);
  newProfile.invs.push(newInv.invId);
  addProfileInStore(store, newProfile.profileId, newProfile);
  setActiveProfileInStore(store, newProfile.profileId);
  return newProfile;
}

function onActiveProfileChange() {
  const store = getSatchelStore();
  let ctx = getCursorContext();
  let lastActiveProfileId = ctx.lastActiveProfileId;
  if (lastActiveProfileId) {
    removeProfileChangeListener(lastActiveProfileId, onProfileChange);
  }
  let nextActiveProfile = resolveActiveProfile(store);
  addProfileChangeListener(nextActiveProfile.profileId, onProfileChange);
  ctx.lastActiveProfileId = nextActiveProfile.profileId;
  onProfileChange();
}

function onProfileChange() {
  let invsContainer = document.querySelector('#localWorkspace');
  invsContainer.innerHTML = '';
  const store = getSatchelStore();
  const activeProfile = getActiveProfileInStore(store);
  if (!activeProfile) {
    return;
  }
  for (let invId of activeProfile.invs) {
    let elementId = `profile_inv-${invId}`;
    let invElement =
      /** @type {import('../components/invgrid/InventoryGridElement.js').InventoryGridElement} */ (
        document.createElement('inventory-grid')
      );
    invElement.id = elementId;
    invElement.invId = invId;
    invsContainer.appendChild(invElement);
  }
  for(let albumId of activeProfile.albums) {
    let elementId = `profile_album-${albumId}`;
    let albumElement =
    /** @type {import('../components/album/AlbumSpaceElement.js').AlbumSpaceElement} */ (
      document.createElement('album-space')
    );
    albumElement.id = elementId;
    albumElement.albumId = albumId;
    invsContainer.appendChild(albumElement);
  }
  /** @type {HTMLInputElement} */
  let profileTitle = document.querySelector('#appTitle');
  profileTitle.textContent = activeProfile.displayName;
}
