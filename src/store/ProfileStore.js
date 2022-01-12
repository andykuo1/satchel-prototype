import { createProfile } from '../satchel/profile/Profile.js';
import { dispatchActiveProfileChange, dispatchProfileChange } from '../events/ProfileEvents.js';

/**
 * @typedef {import('./SatchelStore.js').SatchelStore} Store
 * @typedef {import('../satchel/profile/Profile.js').Profile} Profile
 * @typedef {import('../satchel/profile/Profile.js').ProfileId} ProfileId
 */

/**
 * @param {Store} store
 * @param {ProfileId} profileId
 * @returns {Profile}
 */
export function getExistingProfileInStore(store, profileId) {
  if (isProfileInStore(store, profileId)) {
    return getProfileInStore(store, profileId);
  } else {
    throw new Error(`Cannot get non-existant profile '${profileId}'.`);
  }
}

/**
 * @param {Store} store
 * @param {ProfileId} profileId
 * @returns {Profile}
 */
export function getProfileInStore(store, profileId) {
  return store.data.profile[profileId];
}

/**
 * @param {Store} store
 * @returns {Array<Profile>}
 */
export function getProfilesInStore(store) {
  return Object.values(store.data.profile);
}

/**
 * @param {Store} store
 * @returns {Array<ProfileId>}
 */
export function getProfileIdsInStore(store) {
  return Object.keys(store.data.profile);
}

/**
 * @param {Store} store
 * @param {ProfileId} profileId
 * @returns {boolean}
 */
export function isProfileInStore(store, profileId) {
  return profileId in store.data.profile;
}

/**
 * @param {Store} store
 * @param {ProfileId} profileId
 * @returns {Profile}
 */
export function createProfileInStore(store, profileId) {
  let profile = createProfile(profileId);
  if (!addProfileInStore(store, profileId, profile)) {
    throw new Error('Failed to create profile in store.');
  }
  return profile;
}

/**
 * @param {Store} store
 * @param {ProfileId} profileId
 * @param {Profile} profile
 * @returns {boolean}
 */
export function addProfileInStore(store, profileId, profile) {
  if (profileId !== profile.profileId) {
    throw new Error(`Cannot add profile '${profile.profileId}' for mismatched id '${profileId}'.`);
  }
  if (profileId in store.data.profile) {
    return false;
  }
  store.data.profile[profileId] = profile;
  dispatchProfileChange(store, profileId);
  return true;
}

/**
 * @param {Store} store
 * @param {ProfileId} profileId
 * @param {Profile} profile
 * @returns {boolean}
 */
export function deleteProfileInStore(store, profileId, profile) {
  if (profileId !== profile.profileId) {
    throw new Error(`Cannot delete profile '${profile.profileId}' for mismatched id '${profileId}'.`);
  }
  if (!(profileId in store.data.profile)) {
    return false;
  }
  delete store.data.profile[profileId];
  dispatchProfileChange(store, profileId);
  return true;
}

/**
 * @param {Store} store
 * @returns {Profile}
 */
export function getActiveProfileInStore(store) {
  let activeProfileId = store.metadata.profile.activeProfileId;
  if (activeProfileId) {
    return getProfileInStore(store, activeProfileId);
  } else {
    return null;
  }
}

/**
 * @param {Store} store
 * @param {ProfileId} profileId
 */
export function setActiveProfileInStore(store, profileId) {
  let prev = store.metadata.profile.activeProfileId;
  if (prev === profileId) {
    return;
  }
  if (profileId) {
    store.metadata.profile.activeProfileId = profileId;
  } else {
    store.metadata.profile.activeProfileId = '';
  }
  dispatchActiveProfileChange(store);
}

/**
 * @param {Store} store
 * @returns {boolean}
 */
export function hasActiveProfileInStore(store) {
  return Boolean(store.metadata.profile.activeProfileId);
}
