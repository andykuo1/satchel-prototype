import { getCursorContext } from '../inventory/CursorHelper.js';
import { getInventoryStore } from '../inventory/InventoryStore.js';
import { uuid } from '../util/uuid.js';
import { addActiveProfileChangeListener, addProfileChangeListener, removeActiveProfileChangeListener, removeProfileChangeListener } from './profile/ProfileEvents.js';
import { createProfileInStore, getActiveProfileInStore, getProfileInStore, getProfileIdsInStore, hasActiveProfileInStore, isProfileInStore, setActiveProfileInStore } from './profile/ProfileStore.js';

export function setupActiveProfile() {
  const store = getInventoryStore();
  const ctx = getCursorContext();
  const activeProfile = resolveActiveProfile(store);
  ctx.lastActiveProfileId = activeProfile.profileId;
  addActiveProfileChangeListener(onActiveProfileChange);
  addProfileChangeListener(activeProfile.profileId, onProfileChange);
  onProfileChange();
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
  let newProfile = createProfileInStore(store, uuid());
  setActiveProfileInStore(store, newProfile.profileId);
  return newProfile;
}

function onActiveProfileChange() {
  const store = getInventoryStore();
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
  const store = getInventoryStore();
  const activeProfile = getActiveProfileInStore(store);
  if (!activeProfile) {
    return;
  }
  for(let invId of activeProfile.invs) {
    let elementId = `profile_inv-${invId}`;
    let invElement = /** @type {import('../inventory/element/InventoryGridElement.js').InventoryGridElement} */ (document.createElement('inventory-grid'));
    invElement.id = elementId;
    invElement.invId = invId;
    invsContainer.appendChild(invElement);
  }
  /** @type {HTMLInputElement} */
  let profileTitle = document.querySelector('#appTitle');
  profileTitle.textContent = activeProfile.displayName;
}
