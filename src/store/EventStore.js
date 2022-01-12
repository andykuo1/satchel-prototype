/**
 * @typedef {import('./SatchelStore.js').SatchelStore} Store
 * @typedef {import('./SatchelStore.js').SatchelEvents} SatchelEvents
 */

/**
 * @param {Store} store
 * @param {keyof SatchelEvents} event
 * @param {string} key
 * @param {Function} callback
 */
export function addStoreEventListener(store, event, key, callback) {
  let listeners = resolveEventListenersInStore(store, event, key);
  listeners.push(callback);
}

/**
 * @param {Store} store
 * @param {keyof SatchelEvents} event
 * @param {string} key
 * @param {Function} callback
 */
export function removeStoreEventListener(store, event, key, callback) {
  let listeners = getEventListenersInStore(store, event, key);
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
 * @param {string} key
 */
export function dispatchStoreEvent(store, event, key) {
  let listeners = getEventListenersInStore(store, event, key);
  if (listeners) {
    for (const listener of listeners) {
      listener.call(undefined, store, key);
    }
  }
}

/**
 * @param {Store} store
 * @param {keyof SatchelEvents} event
 * @param {string} key
 */
function getEventListenersInStore(store, event, key) {
  if (!(event in store.session.events)) {
    throw new Error(`Cannot find listener mapping for unknown event '${event}'.`);
  }
  return store.session.events[event][key];
}

/**
 * @param {Store} store
 * @param {keyof SatchelEvents} event
 * @param {string} key
 * @returns {Array<Function>}
 */
function resolveEventListenersInStore(store, event, key) {
  let listeners = getEventListenersInStore(store, event, key);
  if (!listeners) {
    listeners = [];
    store.session.events[event][key] = listeners;
  }
  return listeners;
}
