/**
 * @typedef {Record<string, Array<Function>>} SatchelEventListenersMap
 * 
 * @typedef SatchelEvents
 * @property {SatchelEventListenersMap} item
 * @property {SatchelEventListenersMap} inventory
 * @property {SatchelEventListenersMap} album
 * @property {SatchelEventListenersMap} profile
 * @property {SatchelEventListenersMap} activeProfile
 * 
 * @typedef SatchelSessionStore
 * @property {SatchelEvents} events
 * 
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
 * @property {SatchelSessionStore} session
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
  session: {
    events: {
      item: {},
      inventory: {},
      album: {},
      profile: {},
      activeProfile: {},
    },
  },
};

/** @returns {SatchelStore} */
export function getSatchelStore() {
  return SATCHEL_STORE;
}
