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
 * @param {Store} store
 * @param {ProfileId} profileId 
 * @param {OnProfileChangeCallback} callback 
 */
export function addProfileChangeListener(store, profileId, callback) {
  addStoreEventListener(store, 'profile', profileId, callback);
}

/**
 * @param {Store} store
 * @param {ProfileId} profileId 
 * @param {OnProfileChangeCallback} callback 
 */
export function removeProfileChangeListener(store, profileId, callback) {
  removeStoreEventListener(store, 'profile', profileId, callback);
}

/**
 * @param {Store} store
 */
 export function dispatchActiveProfileChange(store) {
  dispatchStoreEvent(store, 'activeProfile', 'change');
}

/**
 * @param {Store} store
 * @param {OnProfileChangeCallback} callback 
 */
export function addActiveProfileChangeListener(store, callback) {
  addStoreEventListener(store, 'activeProfile', 'change', callback);
}

/**
 * @param {Store} store
 * @param {OnProfileChangeCallback} callback 
 */
export function removeActiveProfileChangeListener(store, callback) {
  removeStoreEventListener(store, 'activeProfile', 'change', callback);
}
