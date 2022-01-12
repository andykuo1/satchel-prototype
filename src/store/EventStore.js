/**
 * @typedef {import('./SatchelStore.js').SatchelStore} Store
 */

/**
 * @typedef {Function} SatchelEventCallback
 * @typedef {string} SatchelEventCallbackKey
 * @typedef {Record<SatchelEventCallbackKey, Array<SatchelEventCallback>>} SatchelEventMap
 * 
 * @typedef SatchelEvents
 * @property {SatchelEventMap} item
 * @property {SatchelEventMap} inventory
 * @property {SatchelEventMap} album
 * @property {SatchelEventMap} profile
 * @property {SatchelEventMap} activeProfile
 */

/** @type {SatchelEvents} */
const SATCHEL_EVENTS = {
  item: {},
  inventory: {},
  album: {},
  profile: {},
  activeProfile: {},
};

/**
 * @param {keyof SatchelEvents} event
 * @param {SatchelEventCallbackKey} key
 * @param {SatchelEventCallback} callback
 */
export function addStoreEventListener(event, key, callback) {
  if (!(event in SATCHEL_EVENTS)) {
    throw new Error(`Cannot manage listener for unknown inventory event '${event}'.`);
  }
  let listeners = SATCHEL_EVENTS[event][key];
  if (!listeners) {
    listeners = [];
    SATCHEL_EVENTS[event][key] = listeners;
  }
  listeners.push(callback);
}

/**
 * @param {keyof SatchelEvents} event
 * @param {SatchelEventCallbackKey} key
 * @param {SatchelEventCallback} callback
 */
export function removeStoreEventListener(event, key, callback) {
  if (!(event in SATCHEL_EVENTS)) {
    throw new Error(`Cannot manage listener for unknown inventory event '${event}'.`);
  }
  const listeners = SATCHEL_EVENTS[event][key];
  if (listeners) {
    const i = listeners.indexOf(callback);
    if (i >= 0) {
      listeners.splice(i, 1);
    }
  }
}

/**
 * @param {Store} store
 * @param {keyof SatchelEvents} event
 * @param {SatchelEventCallbackKey} key
 */
export function dispatchStoreEvent(store, event, key) {
  if (!(event in SATCHEL_EVENTS)) {
    throw new Error(`Cannot dispatch event for unknown inventory event '${event}'.`);
  }
  const listeners = SATCHEL_EVENTS[event][key];
  if (listeners) {
    for (const listener of listeners) {
      listener.call(undefined, store, key);
    }
  }
}
