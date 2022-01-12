import { addStoreEventListener, dispatchStoreEvent, removeStoreEventListener } from '../store/InventoryEventStore.js';

/**
 * @typedef {import('../../store/InventoryStore.js').InventoryStore} InventoryStore
 * @typedef {import('./Profile.js').ProfileId} ProfileId
 */

/**
 * @callback OnProfileChangeCallback
 * @param {InventoryStore} store
 * @param {ProfileId} profileId
 */

/**
 * @param {InventoryStore} store 
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
 * @param {InventoryStore} store
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
