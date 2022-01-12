/**
 * @typedef SatchelMetadataStore
 * @property {object} profile
 * @property {string} profile.activeProfileId
 * 
 * @typedef SatchelDataStore
 * @property {object} inventory
 * @property {object} album
 * @property {object} profile
 * 
 * @typedef SatchelStore
 * @property {SatchelMetadataStore} metadata
 * @property {SatchelDataStore} data
 */

/** @type {SatchelStore} */
const SATCHEL_STORE = {
  metadata: {
    profile: {
      activeProfileId: '',
    },
  },
  data: {
    inventory: {},
    album: {},
    profile: {},
  },
};

/** @returns {SatchelStore} */
export function getSatchelStore() {
  return SATCHEL_STORE;
}
