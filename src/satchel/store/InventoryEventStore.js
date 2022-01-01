const GLOBAL_LISTENERS = {
  item: {},
  inventory: {},
  album: {},
  profile: {},
  activeProfile: {},
};

/**
 * @param event
 * @param key
 * @param callback
 */
export function addStoreEventListener(event, key, callback) {
  if (!(event in GLOBAL_LISTENERS)) {
    throw new Error(`Cannot manage listener for unknown inventory event '${event}'.`);
  }
  let listeners = GLOBAL_LISTENERS[event][key];
  if (!listeners) {
    listeners = [];
    GLOBAL_LISTENERS[event][key] = listeners;
  }
  listeners.push(callback);
}

/**
 * @param event
 * @param key
 * @param callback
 */
export function removeStoreEventListener(event, key, callback) {
  if (!(event in GLOBAL_LISTENERS)) {
    throw new Error(`Cannot manage listener for unknown inventory event '${event}'.`);
  }
  const listeners = GLOBAL_LISTENERS[event][key];
  if (listeners) {
    const i = listeners.indexOf(callback);
    if (i >= 0) {
      listeners.splice(i, 1);
    }
  }
}

/**
 * @param store
 * @param event
 * @param key
 */
export function dispatchStoreEvent(store, event, key) {
  if (!(event in GLOBAL_LISTENERS)) {
    throw new Error(`Cannot dispatch event for unknown inventory event '${event}'.`);
  }
  const listeners = GLOBAL_LISTENERS[event][key];
  if (listeners) {
    for (const listener of listeners) {
      listener.call(undefined, store, key);
    }
  }
}
