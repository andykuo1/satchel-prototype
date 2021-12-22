let PREVENT_STORAGE = false;

export function saveToStorage(key, value) {
  if (PREVENT_STORAGE) {
    return;
  }
  localStorage.setItem(key, value);
}

export function loadFromStorage(key) {
  return localStorage.getItem(key);
}

export function forceEmptyStorage(force = true) {
  PREVENT_STORAGE = force;
  if (force) {
    localStorage.clear();
  }
}
