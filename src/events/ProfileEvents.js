import { addStoreEventListener, dispatchStoreEvent, removeStoreEventListener } from '../store/EventStore.js';

/**
 * @typedef {import('../store/SatchelStore.js').SatchelStore} Store
 * @typedef {import('../satchel/profile/Profile.js').ProfileId} ProfileId
 */

/**
 * @callback OnProfileChangeCallback
 * @param {Store} store
 * @param {ProfileId} profileId
 */

/**
 * @param {Store} store 
 * @param {ProfileId} profileId 
 */
export function dispatchProfileChange(store, profileId) {
  dispatchStoreEvent(store, 'profile', profileId);
}

/**
 * @param {ProfileId} profileId 
 * @param {OnProfileChangeCallback} callback 
 */
export function addProfileChangeListener(profileId, callback) {
  addStoreEventListener('profile', profileId, callback);
}

/**
 * @param {ProfileId} profileId 
 * @param {OnProfileChangeCallback} callback 
 */
export function removeProfileChangeListener(profileId, callback) {
  removeStoreEventListener('profile', profileId, callback);
}

/**
 * @param {Store} store
 */
 export function dispatchActiveProfileChange(store) {
  dispatchStoreEvent(store, 'activeProfile', 'change');
}

/**
 * @param {OnProfileChangeCallback} callback 
 */
export function addActiveProfileChangeListener(callback) {
  addStoreEventListener('activeProfile', 'change', callback);
}

/**
 * @param {OnProfileChangeCallback} callback 
 */
export function removeActiveProfileChangeListener(callback) {
  removeStoreEventListener('activeProfile', 'change', callback);
}
