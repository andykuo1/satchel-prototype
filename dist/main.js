import { u as uuid, b as upgradeProperty, c as copyToClipboard, a as pasteFromClipboard, B as BUILD_VERSION, r as resolveSessionStatus } from './clipboard-7b1bb698.js';

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
function addStoreEventListener(store, event, key, callback) {
  let listeners = resolveEventListenersInStore(store, event, key);
  listeners.push(callback);
}

/**
 * @param {Store} store
 * @param {keyof SatchelEvents} event
 * @param {string} key
 * @param {Function} callback
 */
function removeStoreEventListener(store, event, key, callback) {
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
function dispatchStoreEvent(store, event, key) {
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

/**
 * @typedef {import('../store/SatchelStore.js').SatchelStore} Store
 * @typedef {import('../satchel/inv/Inv.js').InvId} InvId
 */

/**
 * @callback OnInventoryChangeCallback
 * @param {Store} store
 * @param {InvId} invId
 *
 * @callback OnInventoryListChangeCallback
 * @param {Store} store
 */

/**
 * @param {Store} store
 * @param {InvId} invId
 */
function dispatchInventoryChange(store, invId) {
  dispatchStoreEvent(store, 'inventory', invId);
}

/**
 * @param {Store} store
 * @param {InvId} invId
 * @param {OnInventoryChangeCallback} callback
 */
function addInventoryChangeListener(store, invId, callback) {
  addStoreEventListener(store, 'inventory', invId, callback);
}

/**
 * @param {Store} store
 * @param {InvId} invId
 * @param {OnInventoryChangeCallback} callback
 */
function removeInventoryChangeListener(store, invId, callback) {
  removeStoreEventListener(store, 'inventory', invId, callback);
}

/**
 * @param {Store} store
 */
function dispatchInventoryListChange(store) {
  dispatchStoreEvent(store, 'inventoryList', 'all');
}

/**
 * @param {Store} store
 * @param {OnInventoryListChangeCallback} callback
 */
function addInventoryListChangeListener(store, callback) {
  addStoreEventListener(store, 'inventoryList', 'all', callback);
}

/**
 * @typedef {string} ItemId
 *
 * @typedef Item
 * @property {ItemId} itemId
 * @property {number} width
 * @property {number} height
 * @property {string} imgSrc
 * @property {string} displayName
 * @property {string} description
 * @property {number} stackSize
 * @property {string} background
 * @property {object} metadata
 */

/**
 * @param {ItemId} itemId
 */
function createItem(itemId) {
  // NOTE: Order matters! New properties should always be added at the end.
  let item = {
    itemId,
    width: 1,
    height: 1,
    imgSrc: '',
    displayName: '',
    description: '',
    stackSize: -1,
    background: '',
    metadata: {},
  };
  return item;
}

function copyItem(other, dst = undefined) {
  let result = cloneItem(other, dst);
  if (result.itemId === other.itemId) {
    result.itemId = uuid();
  }
  return result;
}

/**
 * @param {Item} other
 * @param {Item} [dst]
 * @returns {Item}
 */
function cloneItem(other, dst = undefined) {
  const itemId = other.itemId;
  if (!dst) {
    dst = createItem(itemId || uuid());
  } else if (itemId) {
    dst.itemId = itemId;
  } else if (!dst.itemId) {
    dst.itemId = uuid();
  }
  if (typeof other.width === 'number') {
    dst.width = other.width;
  }
  if (typeof other.height === 'number') {
    dst.height = other.height;
  }
  if (typeof other.imgSrc === 'string') {
    dst.imgSrc = other.imgSrc;
  }
  if (typeof other.displayName === 'string') {
    dst.displayName = other.displayName;
  }
  if (typeof other.description === 'string') {
    dst.description = other.description;
  }
  if (typeof other.stackSize === 'number') {
    dst.stackSize = other.stackSize;
  }
  if (typeof other.background === 'string') {
    dst.background = other.background;
  }
  if (typeof other.metadata === 'object') {
    try {
      dst.metadata = JSON.parse(JSON.stringify(other.metadata));
    } catch (e) {
      dst.metadata = {};
    }
  }
  return dst;
}

class ItemBuilder {
  static from(baseItem) {
    return new ItemBuilder().fromItem(baseItem);
  }

  constructor() {
    /** @private */
    this._itemId = null;
    /** @private */
    this._width = 1;
    /** @private */
    this._height = 1;
    /** @private */
    this._imageSrc = '';
    /** @private */
    this._displayName = '';
    /** @private */
    this._description = '';
    /** @private */
    this._stackSize = -1;
    /** @private */
    this._background = '';
    /** @private */
    this._metadata = {};
  }

  /**
   * @param {ItemBuilder} itemBuilder
   */
  fromItemBuilder(itemBuilder) {
    this._itemId = itemBuilder._itemId;
    this._width = itemBuilder._width;
    this._height = itemBuilder._height;
    this._imageSrc = itemBuilder._imageSrc;
    this._displayName = itemBuilder._displayName;
    this._description = itemBuilder._description;
    this._stackSize = itemBuilder._stackSize;
    this._background = itemBuilder._background;
    this._metadata = JSON.parse(JSON.stringify(itemBuilder._metadata));
    return this;
  }

  /**
   * @param {Item} item
   */
  fromItem(item) {
    let newItem = cloneItem(item);
    this._itemId = newItem.itemId;
    this._width = newItem.width;
    this._height = newItem.height;
    this._imageSrc = newItem.imgSrc;
    this._displayName = newItem.displayName;
    this._description = newItem.description;
    this._stackSize = newItem.stackSize;
    this._background = newItem.background;
    this._metadata = newItem.metadata;
    return this;
  }

  fromDefault() {
    this._itemId = null;
    this._width = 1;
    this._height = 1;
    this._imageSrc = 'res/images/potion.png';
    this._displayName = '';
    this._description = '';
    this._stackSize = -1;
    this._background = '';
    this._metadata = {};
    return this;
  }

  itemId(itemId) {
    this._itemId = itemId;
    return this;
  }

  width(width) {
    this._width = width;
    return this;
  }

  height(height) {
    this._height = height;
    return this;
  }

  imageSrc(src) {
    this._imageSrc = src;
    return this;
  }

  displayName(displayName) {
    this._displayName = displayName;
    return this;
  }

  description(description) {
    this._description = description;
    return this;
  }

  stackSize(stackSize) {
    this._stackSize = stackSize;
    return this;
  }

  background(background) {
    this._background = background;
    return this;
  }

  metadata(key, value) {
    this._metadata[key] = value;
    return this;
  }

  /**
   * @returns {Item}
   */
  build() {
    let itemId = this._itemId !== null ? this._itemId : uuid();
    if (!itemId) {
      throw new Error(`Invalid item id '${itemId}'.`);
    }
    let width = Number(this._width);
    let height = Number(this._height);
    if (!Number.isFinite(width) || !Number.isSafeInteger(width) || width <= 0) {
      throw new Error('Invalid item width - must be a finite positive integer.');
    }
    if (!Number.isFinite(height) || !Number.isSafeInteger(height) || height <= 0) {
      throw new Error('Invalid item height - must be a finite positive integer.');
    }
    let imgSrc = String(this._imageSrc.trim());
    let displayName = String(this._displayName.trim());
    let description = String(this._description);
    let stackSize = Number(this._stackSize);
    let background = String(this._background);
    let metadata;
    try {
      metadata = JSON.parse(JSON.stringify(this._metadata));
    } catch (e) {
      throw new Error(`Invalid json for metadata - ${e}`);
    }
    let item = createItem(itemId);
    item.width = width;
    item.height = height;
    item.imgSrc = imgSrc;
    item.displayName = displayName;
    item.description = description;
    item.stackSize = stackSize;
    item.background = background;
    item.metadata = metadata;
    return item;
  }
}

/**
 * @typedef {import('../item/Item.js').Item} Item
 * @typedef {import('../item/Item.js').ItemId} ItemId
 */

/**
 * @typedef {string} InvId
 * @typedef {'grid'|'socket'|'album'} InventoryType
 *
 * @typedef Inventory
 * @property {InvId} invId
 * @property {InventoryType} type
 * @property {Record<ItemId, Item>} items
 * @property {Array<ItemId>} slots
 * @property {number} width
 * @property {number} height
 * @property {number} length
 * @property {string} displayName
 * @property {object} metadata
 * @property {number} flags
 */

/**
 * Create an inventory.
 *
 * @param {InvId} invId
 * @param {InventoryType} invType
 * @param {number} slotCount
 * @param {number} maxCoordX
 * @param {number} maxCoordY
 * @returns {Inventory}
 */
function createInventory(invId, invType, slotCount, maxCoordX, maxCoordY) {
  let inv = {
    invId,
    type: invType,
    items: {},
    slots: new Array(slotCount).fill(null),
    width: maxCoordX,
    height: maxCoordY,
    length: slotCount,
    displayName: '',
    metadata: {}, // TODO: Not used yet.
    flags: 0,
  };
  return inv;
}

/**
 * Create a grid inventory of given size.
 *
 * @param {InvId} invId
 * @param {number} width
 * @param {number} height
 * @returns {Inventory}
 */
function createGridInventory(invId, width, height) {
  return createInventory(invId, 'grid', width * height, width, height);
}

/**
 * Create a socket inventory.
 *
 * @param {InvId} invId
 * @returns {Inventory}
 */
function createSocketInventory(invId) {
  // TODO: width, height = Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY
  return createInventory(invId, 'socket', 1, 1, 1);
}

/**
 * Create an album inventory.
 *
 * @param {InvId} invId
 * @returns {Inventory}
 */
function createAlbumInventory(invId) {
  return createInventory(invId, 'album', 0, 0, 0);
}

/**
 * Copies the target inventory to destination as a new inventory. Unlike cloneInventory(),
 * the resultant inventory can be added to the store with its copy.
 *
 * @param {Inventory} other
 * @param {Inventory} [dst]
 * @returns {Inventory}
 */
function copyInventory(other, dst = undefined) {
  let result = cloneInventory(other, dst, { preserveItemId: false });
  if (result.invId === other.invId) {
    result.invId = uuid();
  }
  return result;
}

/**
 * Clones the target inventory to destination as a stored inventory. This is usually used
 * to store an exact replica of an inventory state, including ids. Unlike copyInventory(),
 * the resultant inventory CANNOT be added to the store with its clone. It must be replace
 * its clone.
 *
 * @param {Inventory} other
 * @param {Inventory} [dst]
 * @param {object} [opts]
 * @param {boolean} [opts.preserveItemId]
 * @returns {Inventory}
 */
function cloneInventory(other, dst = undefined, opts = {}) {
  const { preserveItemId = true } = opts;
  const invId = other.invId || uuid();
  const type = other.type || 'grid';
  const width = Number(other.width);
  const height = Number(other.height);
  const length = Number(other.length);
  if (!dst) {
    dst = createInventory(invId, type, length, width, height);
  } else {
    dst.invId = invId;
    dst.type = type;
    dst.width = width;
    dst.height = height;
    dst.length = length;
  }
  let overrideItemIds = {};
  if (typeof other.items === 'object') {
    if (preserveItemId) {
      for (let item of Object.values(other.items)) {
        let newItem = cloneItem(item);
        dst.items[newItem.itemId] = newItem;
      }
    } else {
      for (let item of Object.values(other.items)) {
        let newItem = copyItem(item);
        overrideItemIds[item.itemId] = newItem.itemId;
        dst.items[newItem.itemId] = newItem;
      }
    }
  }
  if (Array.isArray(other.slots)) {
    if (preserveItemId) {
      const length = Math.min(other.slots.length, dst.slots.length);
      for (let i = 0; i < length; ++i) {
        dst.slots[i] = other.slots[i];
      }
    } else {
      const length = Math.min(other.slots.length, dst.slots.length);
      for (let i = 0; i < length; ++i) {
        let otherItemId = other.slots[i];
        let newItemId = overrideItemIds[otherItemId];
        dst.slots[i] = newItemId || null;
      }
    }
  }
  if (typeof other.displayName === 'string') {
    dst.displayName = other.displayName;
  }
  if (typeof other.metadata === 'object') {
    try {
      dst.metadata = JSON.parse(JSON.stringify(other.metadata));
    } catch (e) {
      dst.metadata = {};
    }
  }
  if (typeof other.flags === 'number') {
    dst.flags = other.flags;
  }
  return dst;
}

function getInventorySlotCount(inv) {
  return inv.length;
}

function toggleInventoryFlag(store, invId, bitmask, force = undefined) {
  let inv = getExistingInvInStore(store, invId);
  if (typeof force === 'undefined') {
    inv.flags ^= bitmask;
    dispatchInventoryChange(store, invId);
    return true;
  } else if (Boolean(force)) {
    if (!isInventoryFlagEnabled(inv, bitmask)) {
      inv.flags |= bitmask;
      dispatchInventoryChange(store, invId);
      return true;
    }
  } else {
    if (!isInventoryFlagDisabled(inv, bitmask)) {
      inv.flags &= ~bitmask;
      dispatchInventoryChange(store, invId);
      return true;
    }
  }
  return false;
}

function isInventoryFlagEnabled(inv, bitmask) {
  return (inv.flags & bitmask) === bitmask;
}

function isInventoryFlagDisabled(inv, bitmask) {
  return (inv.flags & bitmask) === 0;
}

/**
 * @typedef {import('./SatchelStore.js').SatchelStore} Store
 * @typedef {import('../satchel/inv/Inv.js').Inventory} Inv
 * @typedef {import('../satchel/inv/Inv.js').InvId} InvId
 */

/**
 * Get an existing inventory. Will throw if it does not exist.
 *
 * @param {Store} store
 * @param {InvId} invId
 * @returns {Inv}
 */
function getExistingInvInStore(store, invId) {
  if (isInvInStore(store, invId)) {
    return getInvInStore(store, invId);
  } else {
    throw new Error(`Cannot get non-existant inventory '${invId}'.`);
  }
}

/**
 * @param {Store} store
 * @param {InvId} invId
 * @returns {Inv}
 */
function getInvInStore(store, invId) {
  return store.data.inventory[invId];
}

/**
 * @param {Store} store
 * @returns {Array<Inv>}
 */
function getInvsInStore(store) {
  return Object.values(store.data.inventory);
}

/**
 * @param {Store} store
 * @param {InvId} invId
 * @returns {boolean}
 */
function isInvInStore(store, invId) {
  return invId in store.data.inventory;
}

/**
 * @param {Store} store
 * @param {InvId} invId
 * @param {number} width
 * @param {number} height
 * @returns {Inv}
 */
function createGridInvInStore(store, invId, width, height) {
  let inv = createGridInventory(invId, width, height);
  if (!addInvInStore(store, invId, inv)) {
    throw new Error('Failed to create grid inventory in store.');
  }
  return inv;
}

/**
 * @param {Store} store
 * @param {InvId} invId
 * @returns {Inv}
 */
function createSocketInvInStore(store, invId) {
  let inv = createSocketInventory(invId);
  if (!addInvInStore(store, invId, inv)) {
    throw new Error('Failed to create socket inventory in store.');
  }
  return inv;
}

/**
 * @param {Store} store
 * @param {InvId} invId
 * @param {Inv} inv
 * @returns {boolean}
 */
function addInvInStore(store, invId, inv) {
  if (invId !== inv.invId) {
    throw new Error(`Cannot add inventory '${inv.invId}' for mismatched id '${invId}'.`);
  }
  if (invId in store.data.inventory) {
    return false;
  }
  store.data.inventory[invId] = inv;
  dispatchInventoryChange(store, invId);
  dispatchInventoryListChange(store);
  return true;
}

/**
 * @param {Store} store
 * @param {InvId} invId
 * @param {Inv} inv
 * @returns {boolean}
 */
function deleteInvInStore(store, invId, inv) {
  if (invId !== inv.invId) {
    throw new Error(`Cannot delete inv '${inv.invId}' for mismatched id '${invId}'.`);
  }
  if (!(invId in store.data.inventory)) {
    return false;
  }
  delete store.data.inventory[invId];
  dispatchInventoryChange(store, invId);
  dispatchInventoryListChange(store);
  return true;
}

/**
 * @typedef {import('../../store/SatchelStore').SatchelStore} Store
 * @typedef {import('../inv/Inv.js').InvId} InvId
 * @typedef {import('../item/Item.js').Item} Item
 * @typedef {import('../item/Item.js').ItemId} ItemId
 * @typedef {import('../inv/Inv.js').Inventory} Inventory
 */

/**
 * @typedef {InvId} AlbumId
 * @typedef {Inventory} Album
 */

const ALBUM_FLAG_HIDDEN_BIT = 0x1;
const ALBUM_FLAG_LOCKED_BIT = 0x2;
const ALBUM_FLAG_EXPAND_BIT = 0x4;

/**
 * @param {AlbumId} albumId
 * @returns {Album}
 */
function createAlbum(albumId) {
  let album = createAlbumInventory(albumId);
  album.displayName = 'Untitled';
  album.flags |= ALBUM_FLAG_EXPAND_BIT;
  return album;
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId
 * @param {boolean} locked
 */
function setAlbumLocked(store, albumId, locked) {
  toggleInventoryFlag(store, albumId, ALBUM_FLAG_LOCKED_BIT, locked);
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId
 * @returns {boolean}
 */
function isAlbumLocked(store, albumId) {
  let album = getExistingInvInStore(store, albumId);
  return isInventoryFlagEnabled(album, ALBUM_FLAG_LOCKED_BIT);
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId
 * @returns {boolean}
 */
function isAlbumHidden(store, albumId) {
  let album = getExistingInvInStore(store, albumId);
  return isInventoryFlagEnabled(album, ALBUM_FLAG_HIDDEN_BIT);
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId
 * @param {boolean} expand
 */
function setAlbumExpanded(store, albumId, expand) {
  toggleInventoryFlag(store, albumId, ALBUM_FLAG_EXPAND_BIT, expand);
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId
 * @returns {boolean}
 */
function isAlbumExpanded(store, albumId) {
  let album = getExistingInvInStore(store, albumId);
  return isInventoryFlagEnabled(album, ALBUM_FLAG_EXPAND_BIT);
}

/**
 * @typedef ImportDataFormat
 * @property {string} [_type]
 * @property {object} [_data]
 * @property {object} [_meta]
 * @property {number} [_meta.time]
 */

/**
 * @param {ImportDataFormat} jsonData
 * @param {string} expectedType
 * @param {(data: object, metadata: object) => any} dataCallback
 * @returns {any}
 */
function importDataFromJSON(jsonData, expectedType, dataCallback) {
  if (jsonData._type === expectedType) {
    return dataCallback(jsonData._data, jsonData._meta);
  } else {
    throw new Error(`Invalid json data format for imported type '${expectedType}'.`);
  }
}

/**
 * @param {string} type
 * @param {object} data
 * @param {object} metadata
 * @param {object} [dst]
 * @returns {ImportDataFormat}
 */
function exportDataToJSON(type, data, metadata, dst = undefined) {
  if (!dst) {
    dst = {};
  }
  dst._type = type;
  dst._data = data;
  dst._meta = {
    time: Date.now(),
    ...metadata,
  };
  return dst;
}

const CURRENT_INV_VERSION = 'inv_v3';

function exportInventoryToJSON(inv, dst = undefined) {
  return exportDataToJSON(CURRENT_INV_VERSION, compressInventoryJson(cloneInventory(inv)), {}, dst);
}

function importInventoryFromJSON(jsonData, dst = undefined) {
  switch (jsonData._type) {
    case 'inv_v1':
      return importDataFromJSON(jsonData, 'inv_v1', (data) => cloneInventory(data, dst));
    case 'inv_v2':
      return importDataFromJSON(jsonData, 'inv_v2', (data) =>
        cloneInventory(decompressInventoryJson(data), dst)
      );
    case 'inv_v3': // Added `flags` field
      return importDataFromJSON(jsonData, 'inv_v3', (data) =>
        cloneInventory(decompressInventoryJson(data), dst)
      );
    default:
      throw new Error(`Unsupported inventory version '${jsonData._type}'.`);
  }
}

function compressInventoryJson(uncompressedJson) {
  const slots = uncompressedJson.slots;
  const length = uncompressedJson.length;
  let newSlots = new Array(length).fill(0);
  let nextAvailableSlottedId = 1;
  let itemMapping = {};
  let slotsMapping = {};
  for (let i = 0; i < length; ++i) {
    let itemId = slots[i];
    if (itemId) {
      if (!(itemId in itemMapping)) {
        itemMapping[itemId] = nextAvailableSlottedId;
        slotsMapping[nextAvailableSlottedId] = itemId;
        nextAvailableSlottedId += 1;
      }
      newSlots[i] = itemMapping[itemId];
    }
  }
  return {
    ...uncompressedJson,
    __slotsMap: slotsMapping,
    slots: newSlots,
  };
}

function decompressInventoryJson(compressedJson) {
  const { __slotsMap: slotsMapping, slots, ...json } = compressedJson;
  const length = compressedJson.length;
  let newSlots = new Array(length).fill(null);
  for (let i = 0; i < length; ++i) {
    let slottedId = slots[i];
    if (slottedId) {
      let itemId = slotsMapping[slottedId];
      newSlots[i] = itemId;
    }
  }
  return {
    ...json,
    slots: newSlots,
  };
}

function exportItemToBase64(item) {
  let json = exportItemToJSON(item);
  let rawString = JSON.stringify(json);
  return window.btoa(rawString);
}

function importItemFromBase64(base64String, dst = undefined) {
  let rawString = window.atob(base64String);
  let json = JSON.parse(rawString);
  return importItemFromJSON(json, dst);
}

/**
 * @typedef {import('../satchel/item/Item.js').Item} Item
 * @typedef {import('./DataLoader.js').ImportDataFormat} ImportDataFormat
 */

const CURRENT_ITEM_VERSION = 'item_v2';

/**
 * @param {Item} item
 * @param {object} dst
 * @returns {ImportDataFormat}
 */
function exportItemToJSON(item, dst = undefined) {
  return exportDataToJSON(CURRENT_ITEM_VERSION, compressItemJson(cloneItem(item)), {}, dst);
}

/**
 * @param {object} jsonData
 * @param {Item} dst
 * @returns {Item}
 */
function importItemFromJSON(jsonData, dst = undefined) {
  switch (jsonData._type) {
    case 'item_v1':
      return importDataFromJSON(jsonData, 'item_v1', (data) => cloneItem(data, dst));
    case 'item_v2':
    default:
      return importDataFromJSON(jsonData, 'item_v2', (data) => {
        data = decompressItemJson(data);
        return cloneItem(data, dst);
      });
  }
}

function exportItemToString(item) {
  let cloned = cloneItem(item);
  cloned.itemId = '_';
  let dataString = exportItemToBase64(cloned);
  return `item:${dataString}`;
}

function importItemFromString(itemString, dst = undefined) {
  let i = itemString.indexOf('item:');
  if (i < 0) {
    throw new Error(`Invalid item string - missing required prefix 'item'`);
  }
  let j = itemString.indexOf(/\s+/, i);
  let k = i + 'item:'.length;
  let base64String = j < 0 ? itemString.substring(k) : itemString.substring(k, j);
  let result = importItemFromBase64(base64String, dst);
  result.itemId = uuid();
  return result;
}

function compressItemJson(uncompressedJson) {
  let newItem = createItem('');
  let result = [];
  for (let key of Object.keys(newItem)) {
    let value = uncompressedJson[key];
    result.push(value);
  }
  return result;
}

function decompressItemJson(compressedJson) {
  let newItem = createItem('');
  let result = {};
  let i = 0;
  for (let key of Object.keys(newItem)) {
    let value = compressedJson[i];
    result[key] = value;
    ++i;
  }
  return result;
}

/**
 * @typedef {import('../satchel/album/Album.js').Album} Album
 * @typedef {import('./DataLoader.js').ImportDataFormat} ImportDataFormat
 */

const CURRENT_ALBUM_VERSION = 'album_v3';

/**
 * @param {Album} album
 * @param {object} [dst]
 * @returns {ImportDataFormat}
 */
function exportAlbumToJSON(album, dst = undefined) {
  return exportDataToJSON(CURRENT_ALBUM_VERSION, compressInventoryJson(cloneInventory(album)), {}, dst);
}

/**
 * @param {object} jsonData
 * @param {Album} [dst]
 * @returns {Album}
 */
function importAlbumFromJSON(jsonData, dst = undefined) {
  switch (jsonData._type) {
    case 'album_v1':
      return importDataFromJSON(jsonData, 'album_v1', (data) => cloneInventory(albumV1ToV3(data, dst)));
    case 'album_v2':
      return importDataFromJSON(jsonData, 'album_v2', (data) =>
        cloneInventory(albumV1ToV3(decompressAlbumJsonV2(data), dst))
      );
    case 'album_v3':
      return importDataFromJSON(jsonData, 'album_v3', (data) =>
        cloneInventory(decompressInventoryJson(data), dst)
      );
    default:
      throw new Error(`Unsupported album version '${jsonData._type}'.`);
  }
}

function albumV1ToV3(other, dst) {
  const albumId = other.albumId || uuid();
  if (!dst) {
    dst = createAlbum(albumId);
  } else {
    dst.invId = albumId;
  }
  dst.items = other.items;
  dst.displayName = other.displayName;
  if (other.locked) {
    dst.flags |= ALBUM_FLAG_LOCKED_BIT;
  }
  if (other.hidden) {
    dst.flags |= ALBUM_FLAG_HIDDEN_BIT;
  }
  if (other.expand) {
    dst.flags |= ALBUM_FLAG_EXPAND_BIT;
  }
  return dst;
}

/**
 * @param {object} compressedJson
 * @returns {object}
 */
function decompressAlbumJsonV2(compressedJson) {
  let { t: newItemType, d: newItems } = compressedJson.items;
  if (!newItems || newItems.length <= 0) {
    return {
      ...compressedJson,
      items: {},
    };
  }
  let oldItems = {};
  for (let newItemData of newItems) {
    let newItem = {
      _type: newItemType,
      _data: newItemData,
      _meta: {},
    };
    let oldItem = importItemFromJSON(newItem);
    oldItems[oldItem.itemId] = oldItem;
  }
  return {
    ...compressedJson,
    items: oldItems,
  };
}

/**
 * @typedef {import('./SatchelStore.js').SatchelStore} Store
 * @typedef {import('../satchel/album/Album.js').Album} Album
 * @typedef {import('../satchel/album/Album.js').AlbumId} AlbumId
 */

/**
 * @param {Store} store
 * @returns {Array<Album>}
 */
function getAlbumsInStore(store) {
  return getInvsInStore(store).filter((inv) => inv.type === 'album');
}

/**
 * @param {Store} store
 * @returns {Array<AlbumId>}
 */
function getAlbumIdsInStore(store) {
  return getAlbumsInStore(store).map((album) => album.invId);
}

/**
 * @param {Store} store
 * @param {AlbumId} albumId
 * @returns {Album}
 */
function createAlbumInStore(store, albumId) {
  let album = createAlbum(albumId);
  if (!addInvInStore(store, albumId, album)) {
    throw new Error('Failed to create album in store.');
  }
  return album;
}

/**
 * @typedef {Record<string, Array<Function>>} SatchelEventListenersMap
 *
 * @typedef SatchelEvents
 * @property {SatchelEventListenersMap} item
 * @property {SatchelEventListenersMap} inventory
 * @property {SatchelEventListenersMap} album
 * @property {SatchelEventListenersMap} profile
 * @property {SatchelEventListenersMap} activeProfile
 * @property {SatchelEventListenersMap} albumList
 * @property {SatchelEventListenersMap} profileList
 * @property {SatchelEventListenersMap} inventoryList
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
      albumList: {},
      profileList: {},
      inventoryList: {},
    },
  },
};

/** @returns {SatchelStore} */
function getSatchelStore() {
  return SATCHEL_STORE;
}

/**
 * @param {Inventory} inv
 * @param {number} slotIndex
 * @returns {boolean}
 */
function isSlotIndexEmpty(inv, slotIndex) {
  let itemId = inv.slots[slotIndex];
  if (itemId) {
    return false;
  } else {
    return true;
  }
}

/**
 * @param {Inventory} inv
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 * @param {ItemId} itemId
 */
function setSlots(inv, fromX, fromY, toX, toY, itemId) {
  for (let x = fromX; x <= toX; ++x) {
    for (let y = fromY; y <= toY; ++y) {
      let slotIndex = getSlotIndexByCoords(inv, x, y);
      if (slotIndex < 0) {
        continue;
      }
      inv.slots[slotIndex] = itemId;
    }
  }
}

/**
 * @param {Inventory} inv
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 */
function clearSlots(inv, fromX, fromY, toX, toY) {
  for (let x = fromX; x <= toX; ++x) {
    for (let y = fromY; y <= toY; ++y) {
      let slotIndex = getSlotIndexByCoords(inv, x, y);
      if (slotIndex < 0) {
        continue;
      }
      inv.slots[slotIndex] = null;
    }
  }
}

/**
 * @param {Inventory} inv
 * @param {number} coordX
 * @param {number} coordY
 * @returns {number}
 */
function getSlotIndexByCoords(inv, coordX, coordY) {
  if (coordX < 0 || coordY < 0) {
    return -1;
  }
  switch (inv.type) {
    case 'socket':
    case 'grid': {
      const width = inv.width;
      const height = inv.height;
      if (coordX >= width || coordY >= height) {
        return -1;
      }
      return Math.floor(coordX) + Math.floor(coordY) * width;
    }
    case 'album':
      return -1;
    default:
      throw new Error('Unsupported inventory type for slot coords.');
  }
}

/**
 * @param {Inventory} inv
 * @param {number} slotIndex
 * @returns {[number, number]}
 */
function getSlotCoordsByIndex(inv, slotIndex) {
  if (slotIndex < 0) {
    return [-1, -1];
  }
  switch (inv.type) {
    case 'socket':
    case 'grid': {
      const width = inv.width;
      return [slotIndex % width, Math.floor(slotIndex / width)];
    }
    default:
      throw new Error('Unsupported inventory type for slot coords.');
  }
}

function getSlotIndexByItemId(inv, itemId, startIndex = 0) {
  const length = getInventorySlotCount(inv);
  for (let i = startIndex; i < length; ++i) {
    let invItemId = inv.slots[i];
    if (invItemId && invItemId === itemId) {
      return i;
    }
  }
  return -1;
}

/**
 * @typedef {import('./Inv.js').Inventory} Inventory
 * @typedef {import('../item/Item.js').ItemId} ItemId
 * @typedef {import('../item/Item.js').Item} Item
 */

/**
 * @param {Inventory} inv
 * @param {ItemId} itemId
 * @returns {boolean}
 */
function hasItem(inv, itemId) {
  let item = inv.items[itemId];
  if (item) {
    return true;
  } else {
    return false;
  }
}

/**
 * @param {Inventory} inv
 * @param {Item} item
 * @param {number} coordX
 * @param {number} coordY
 */
function putItem(inv, item, coordX, coordY) {
  if (!inv) {
    throw new Error('Cannot put item to non-existant inventory.');
  }
  if (!item) {
    throw new Error('Cannot put null item.');
  }
  const itemId = item.itemId;
  if (itemId in inv.items) {
    throw new Error(`Cannot put item '${itemId}' that already exists in inventory '${inv.invId}'.`);
  }
  inv.items[itemId] = item;
  setSlots(inv, coordX, coordY, coordX + item.width - 1, coordY + item.height - 1, itemId);
}

/**
 * @param {Inventory} inv
 * @param {ItemId} itemId
 */
function removeItem(inv, itemId) {
  if (!inv) {
    throw new Error('Cannot remove item from non-existant inventory.');
  }
  if (!(itemId in inv.items)) {
    throw new Error(`Cannot remove item '${itemId}' that does not exist in inventory '${inv.invId}'.`);
  }
  // If slots exist, then check it is in there.
  if (inv.slots.length > 0) {
    let slotIndex = getSlotIndexByItemId(inv, itemId);
    if (slotIndex < 0) {
      throw new Error(`Failed to remove item '${itemId}' - missing slot index for item.`);
    }
    let item = getItemByItemId(inv, itemId);
    let [fromX, fromY] = getSlotCoordsByIndex(inv, slotIndex);
    let toX = fromX + item.width - 1;
    let toY = fromY + item.height - 1;
    clearSlots(inv, fromX, fromY, toX, toY);
  }
  // And delete it regardless.
  delete inv.items[itemId];
  return true;
}

/**
 * @param {Inventory} inv
 */
function clearItems(inv) {
  clearSlots(inv, 0, 0, inv.width - 1, inv.height - 1);
  inv.items = {};
}

/**
 * @param {Inventory} inv
 * @param {number} coordX
 * @param {number} coordY
 * @returns {ItemId}
 */
function getItemIdBySlotCoords(inv, coordX, coordY) {
  let slotIndex = getSlotIndexByCoords(inv, coordX, coordY);
  return getItemIdBySlotIndex(inv, slotIndex);
}

/**
 * @param {Inventory} inv
 * @param {number} slotIndex
 * @returns {ItemId}
 */
function getItemIdBySlotIndex(inv, slotIndex) {
  return inv.slots[slotIndex];
}

/**
 * @param {Inventory} inv
 * @returns {Array<ItemId>}
 */
function getItemIds(inv) {
  return Object.keys(inv.items);
}

/**
 * @param {Inventory} inv
 * @param {ItemId} itemId
 * @returns {Item}
 */
function getItemByItemId(inv, itemId) {
  return inv.items[itemId];
}

/**
 * @param {Inventory} inv
 * @returns {Array<Item>}
 */
function getItems(inv) {
  return Object.values(inv.items);
}

function getItemInInv(store, invId, itemId) {
  let inv = getExistingInvInStore(store, invId);
  return getItemByItemId(inv, itemId);
}

function getItemIdsInInv(store, invId) {
  let inv = getExistingInvInStore(store, invId);
  return getItemIds(inv);
}

/**
 * @param {import('../../store/SatchelStore.js').SatchelStore} store
 * @param {string} invId
 * @returns {Array<import('../item/Item.js').Item>}
 */
function getItemsInInv(store, invId) {
  let inv = getExistingInvInStore(store, invId);
  return getItems(inv);
}

/**
 * @typedef {import('../store/SatchelStore.js').SatchelStore} Store
 * @typedef {import('../satchel/item/Item.js').ItemId} ItemId
 */

/**
 * @callback OnItemChangeCallback
 * @param {Store} store
 * @param {ItemId} itemId
 */

/**
 * @param {Store} store
 * @param {ItemId} itemId
 */
function dispatchItemChange(store, itemId) {
  dispatchStoreEvent(store, 'item', itemId);
}

/**
 * @param {Store} store
 * @param {ItemId} itemId
 * @param {OnItemChangeCallback} callback
 */
function addItemChangeListener(store, itemId, callback) {
  addStoreEventListener(store, 'item', itemId, callback);
}

/**
 * @param {Store} store
 * @param {ItemId} itemId
 * @param {OnItemChangeCallback} callback
 */
function removeItemChangeListener(store, itemId, callback) {
  removeStoreEventListener(store, 'item', itemId, callback);
}

/**
 * @typedef {import('../item/Item.js').Item} Item
 * @typedef {import('../item/Item.js').ItemId} ItemId
 * @typedef {import('../../store/SatchelStore.js').SatchelStore} SatchelStore
 * @typedef {import('./Inv.js').Inventory} Inventory
 * @typedef {import('./Inv.js').InvId} InvId
 * @typedef {import('./Inv.js').InventoryType} InventoryType
 */

/**
 * @param {SatchelStore} store
 * @param {InvId} invId
 * @param {Item} item
 * @param {number} coordX
 * @param {number} coordY
 */
function addItemToInventory(store, invId, item, coordX, coordY) {
  let inv = getExistingInvInStore(store, invId);
  putItem(inv, item, coordX, coordY);
  dispatchInventoryChange(store, invId);
}

/**
 * @param {SatchelStore} store
 * @param {InvId} invId
 * @param {ItemId} itemId
 * @returns {boolean}
 */
function removeItemFromInventory(store, invId, itemId) {
  let inv = getExistingInvInStore(store, invId);
  if (hasItem(inv, itemId)) {
    removeItem(inv, itemId);
    dispatchInventoryChange(store, invId);
    return true;
  }
  return false;
}

function clearItemsInInventory(store, invId) {
  let inv = getExistingInvInStore(store, invId);
  clearItems(inv);
  dispatchInventoryChange(store, invId);
}

function hasItemInInventory(store, invId, itemId) {
  let inv = getExistingInvInStore(store, invId);
  return hasItem(inv, itemId);
}

function getItemAtSlotIndex(store, invId, slotIndex) {
  let inv = getExistingInvInStore(store, invId);
  let itemId = getItemIdBySlotIndex(inv, slotIndex);
  return getItemByItemId(inv, itemId);
}

function getItemAtSlotCoords(store, invId, coordX, coordY) {
  let inv = getExistingInvInStore(store, invId);
  let itemId = getItemIdBySlotCoords(inv, coordX, coordY);
  return getItemByItemId(inv, itemId);
}

function getItemIdAtSlotCoords(store, invId, coordX, coordY) {
  let inv = getExistingInvInStore(store, invId);
  return getItemIdBySlotCoords(inv, coordX, coordY);
}

function getItemIdsInSlots(store, invId) {
  let inv = getExistingInvInStore(store, invId);
  return new Set(inv.slots.filter((itemId) => typeof itemId === 'string'));
}

/**
 * @param {SatchelStore} store
 * @param {InvId} invId
 * @returns {boolean}
 */
function isInventoryEmpty(store, invId) {
  const inv = getExistingInvInStore(store, invId);
  const length = getInventorySlotCount(inv);
  for (let i = 0; i < length; ++i) {
    let itemId = inv.slots[i];
    if (itemId) {
      return false;
    }
  }
  return true;
}

const FOUNDRY_ALBUM_DISPLAY_NAME = '[ Recent ]';

/**
 * @param {import('./item/Item.js').Item} freedItem
 */
function saveItemToFoundryAlbum(freedItem) {
  const store = getSatchelStore();
  let foundryAlbumId = getFoundryAlbumId(store);
  addItemToInventory(store, foundryAlbumId, freedItem, 0, 0);
}

function resolveFoundryAlbumId(store) {
  let foundryAlbumId = uuid();
  let album = createAlbum(foundryAlbumId);
  album.displayName = FOUNDRY_ALBUM_DISPLAY_NAME;
  album.flags &= ~ALBUM_FLAG_EXPAND_BIT;
  album.flags |= ALBUM_FLAG_LOCKED_BIT;
  addInvInStore(store, album.invId, album);
  return foundryAlbumId;
}

/**
 * @param {import('./item/Item.js').Item} item
 * @returns {boolean}
 */
function shouldSaveItemToFoundryAlbum(item) {
  const store = getSatchelStore();
  const albums = getAlbumsInStore(store);
  let foundryAlbumId = null;
  for (let album of albums) {
    if (isFoundryAlbum(album)) {
      foundryAlbumId = album.invId;
      break;
    }
  }
  if (!foundryAlbumId) {
    return false;
  }
  if (!isAlbumLocked(store, foundryAlbumId)) {
    return false;
  }
  // Save it as long as the image is different.
  const imgSrc = item.imgSrc;
  const items = getItemsInInv(store, foundryAlbumId);
  for (let albumItem of items) {
    if (albumItem.imgSrc === imgSrc) {
      return false;
    }
  }
  return true;
}

/**
 * @param {import('./album/Album.js').Album} album
 * @returns {boolean}
 */
function isFoundryAlbum(album) {
  return album.displayName === FOUNDRY_ALBUM_DISPLAY_NAME;
}

function hasFoundryAlbum(store) {
  const albums = getAlbumsInStore(store);
  for (let album of albums) {
    if (isFoundryAlbum(album)) {
      return true;
    }
  }
  return false;
}

function getFoundryAlbumId(store) {
  const albums = getAlbumsInStore(store);
  for (let album of albums) {
    if (isFoundryAlbum(album)) {
      return album.invId;
    }
  }
  return resolveFoundryAlbumId(store);
}

const GROUND_ALBUM_DISPLAY_NAME = '[ Ground ]';

function dropItemOnGround(freedItem) {
  const store = getSatchelStore();
  const groundAlbumId = getGroundAlbumId(store);
  addItemToInventory(store, groundAlbumId, freedItem, 0, 0);
}

function resolveGroundAlbumId(store) {
  const groundAlbumId = 'ground';
  let album = createAlbum(groundAlbumId);
  album.displayName = GROUND_ALBUM_DISPLAY_NAME;
  addInvInStore(store, album.invId, album);
  return groundAlbumId;
}

function clearItemsOnGround() {
  const store = getSatchelStore();
  const groundAlbumId = getGroundAlbumId(store);
  clearItemsInInventory(store, groundAlbumId);
}

function isGroundAlbum(album) {
  return album.invId === 'ground';
}

function hasGroundAlbum(store) {
  let groundAlbumId = 'ground';
  if (!isInvInStore(store, groundAlbumId)) {
    return false;
  } else {
    return true;
  }
}

function getGroundAlbumId(store) {
  let groundAlbumId = 'ground';
  if (!isInvInStore(store, groundAlbumId)) {
    return resolveGroundAlbumId(store);
  } else {
    return groundAlbumId;
  }
}

let PREVENT_STORAGE = false;

function saveToStorage(key, value) {
  if (PREVENT_STORAGE) {
    return;
  }
  localStorage.setItem(key, value);
}

function loadFromStorage(key) {
  return localStorage.getItem(key);
}

function forceEmptyStorage(force = true) {
  PREVENT_STORAGE = force;
  if (force) {
    localStorage.clear();
  }
}

const AUDIO_CONTEXT = new AudioContext();
autoUnlock(AUDIO_CONTEXT);

async function createSound(buffer, opts = {}) {
  const ctx = AUDIO_CONTEXT;
  let data = await ctx.decodeAudioData(buffer);
  return new Sound(ctx, data, Boolean(opts.loop));
}

const DEFAULT_SOURCE_PARAMS = {
  gain: 0,
  pitch: 0,
  pan: 0,
  loop: false,
};
class Sound {
  constructor(ctx, audioBuffer, loop = false) {
    this.context = ctx;
    this.buffer = audioBuffer;

    this._source = null;

    this.playing = false;
    this.loop = loop;

    this.onAudioSourceEnded = this.onAudioSourceEnded.bind(this);
  }

  onAudioSourceEnded() {
    this._playing = false;
  }

  play(opts = DEFAULT_SOURCE_PARAMS) {
    if (!this.buffer) return;
    if (this._source) this.destroy();

    const ctx = this.context;
    let source = ctx.createBufferSource();
    source.addEventListener('ended', this.onAudioSourceEnded);
    source.buffer = this.buffer;
    source.loop = opts.loop;

    let prevNode = source;

    // https://www.oreilly.com/library/view/web-audio-api/9781449332679/ch04.html
    // Add pitch
    if (opts.pitch) {
      source.detune.value = opts.pitch * 100;
    }

    // Add gain
    if (opts.gain) {
      const gainNode = ctx.createGain();
      gainNode.gain.value = opts.gain;
      prevNode = prevNode.connect(gainNode);
    }

    // Add stereo pan
    if (opts.pan) {
      const pannerNode = ctx.createStereoPanner();
      pannerNode.pan.value = opts.pan;
      prevNode = prevNode.connect(pannerNode);
    }

    prevNode.connect(ctx.destination);
    source.start();

    this._source = source;
    this._playing = true;
  }

  pause() {
    this._source.stop();
    this._playing = false;
  }

  destroy() {
    if (this._source) this._source.disconnect();
    this._source = null;
  }
}

async function autoUnlock(ctx) {
  const callback = () => {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  };
  document.addEventListener('click', callback);
}

const INIT_FLAG = Symbol('init');
const PLAY_FLAG = Symbol('play');
const SOUNDS = {
  [INIT_FLAG]: false,
  [PLAY_FLAG]: loadFromStorage('sound') !== 'off',
};

function toggleSound(force = undefined) {
  let result = typeof force === 'undefined' ? !SOUNDS[PLAY_FLAG] : Boolean(force);
  SOUNDS[PLAY_FLAG] = result;
  saveToStorage('sound', result ? 'on' : 'off');
  playSound('ping');
}

function playSound(name) {
  if (!SOUNDS[PLAY_FLAG]) {
    return;
  }
  if (!SOUNDS[INIT_FLAG]) {
    SOUNDS[INIT_FLAG] = true;
    initSounds().then(() => playSound(name));
    return;
  }
  if (name in SOUNDS) {
    const { sound, pitchLow, pitchRange, gain, pan } = SOUNDS[name];
    sound.play({
      pitch: Math.random() * pitchRange - pitchLow,
      gain: gain,
      pan: pan,
    });
  }
}

async function initSounds() {
  let pop = await loadSound('res/sounds/pop.ogg');
  let mug = await loadSound('res/sounds/mug.ogg');
  let dunk = await loadSound('res/sounds/dunk.ogg');
  let put = await loadSound('res/sounds/put.ogg');
  let pick = await loadSound('res/sounds/pick.ogg');
  let open = await loadSound('res/sounds/open.ogg');
  registerSound('pickup', pick, -5, 5);
  registerSound('putdown', mug, -5, 5, 0.3);
  registerSound('putdownGround', pop, -5, 5);
  registerSound('putdownAlbum', mug, -5, 5, 0.3);
  registerSound('openBag', open, 2, 5, 0.5);
  registerSound('closeBag', open, -5, -2, 0.5);
  registerSound('openAnvil', open, 2, 5, 0.5);
  registerSound('closeAnvil', open, -5, -2, 0.5);
  registerSound('spawnItem', pick, -5, 5);
  registerSound('clearItem', dunk, -5, 0);
  registerSound('sizeItem', put, -5, 0, 0.5);
  registerSound('ping', pop, -5, 5);
}

/**
 * @param {string} name
 * @param {object} sound
 * @param {number} pitchLow
 * @param {number} pitchHigh
 * @param {number} gain
 */
function registerSound(name, sound, pitchLow = 0, pitchHigh = pitchLow, gain = 0, pan = 0) {
  SOUNDS[name] = {
    sound,
    pitchLow: Math.min(pitchLow, pitchHigh),
    pitchHigh: Math.max(pitchLow, pitchHigh),
    pitchRange: Math.abs(pitchHigh - pitchLow),
    gain: gain,
    pan: pan,
  };
}

async function loadSound(url) {
  let response = await fetch(url);
  let buffer = await response.arrayBuffer();
  return await createSound(buffer);
}

const TRASH_ALBUM_DISPLAY_NAME = '[ Trash ]';
const MAX_ITEMS_IN_TRASH = 30;

/**
 * @param {import('./item/Item.js').Item} freedItem
 */
function saveItemToTrashAlbum(freedItem) {
  const store = getSatchelStore();
  let trashAlbumId = getTrashAlbumId(store);
  addItemToInventory(store, trashAlbumId, freedItem, 0, 0);
  let itemIds = getItemIdsInInv(store, trashAlbumId);
  if (itemIds.length > MAX_ITEMS_IN_TRASH) {
    let firstItemId = itemIds[0];
    removeItemFromInventory(store, trashAlbumId, firstItemId);
  }
  playSound('clearItem');
}

function resolveTrashAlbumId(store) {
  let trashAlbumId = uuid();
  let album = createAlbum(trashAlbumId);
  album.displayName = TRASH_ALBUM_DISPLAY_NAME;
  album.flags &= ~ALBUM_FLAG_LOCKED_BIT & ~ALBUM_FLAG_EXPAND_BIT;
  addInvInStore(store, album.invId, album);
  return trashAlbumId;
}

/**
 * @param {import('./album/Album.js').Album} album
 * @returns {boolean}
 */
function isTrashAlbum(album) {
  return album.displayName === TRASH_ALBUM_DISPLAY_NAME;
}

function getTrashAlbumId(store) {
  const albums = getAlbumsInStore(store);
  for (let album of albums) {
    if (isTrashAlbum(album)) {
      return album.invId;
    }
  }
  return resolveTrashAlbumId(store);
}

/**
 * @param {string} filename
 * @param {string} textData
 */
function downloadText(filename, textData) {
  downloadURL(filename, getTextDataURI(textData));
}

/**
 * @param {string} filename
 * @param {string} url
 */
function downloadURL(filename, url) {
  const element = document.createElement('a');
  const headerIndex = url.indexOf(';');
  url = `${url.slice(
    0,
    Math.max(0, headerIndex + 1)
  )}headers=Content-Disposition%3A%20attachment%3B%20filename=${filename};${url.slice(
    Math.max(0, headerIndex + 1)
  )}`;
  element.setAttribute('href', url);
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.append(element);

  element.click();
  element.remove();
}

/**
 * @param {string|number|boolean} data
 * @returns {string}
 */
function getTextDataURI(data) {
  return `data:text/plain; charset=utf-8,${encodeURIComponent(data)}`;
}

/**
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number}
 */
function distanceSquared(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

/**
 * @typedef {import('./ItemElement.js').ItemElement} ItemElement
 */

const DEFAULT_ITEM_UNIT_SIZE = 48;

/**
 * Perform pickup logic for item elements.
 *
 * @param {MouseEvent} mouseEvent The triggering mouse event.
 * @param {ItemElement} itemElement The target element.
 * @param {number} unitSize The item unit size.
 * @returns {boolean} Whether to allow the event to propagate.
 */
function itemMouseDownCallback(mouseEvent, itemElement, unitSize) {
  const containerElement = itemElement.container;
  if (containerElement.hasAttribute('nooutput')) {
    return;
  }
  const boundingRect = containerElement._container.getBoundingClientRect();
  const clientCoordX = getClientCoordX(boundingRect, mouseEvent.clientX, unitSize);
  const clientCoordY = getClientCoordY(boundingRect, mouseEvent.clientY, unitSize);
  const store = getSatchelStore();
  const itemId = itemElement.itemId;
  const invId = containerElement.invId;
  const inv = getInvInStore(store, invId);
  const item = getItemByItemId(inv, itemId);
  let cursor = getCursor();
  let result;
  if (containerElement.hasAttribute('copyoutput')) {
    if (!itemId) {
      return;
    }
    if (cursor.hasHeldItem()) {
      // NOTE: Swapping is performed on putDown(), so ignore for pick up.
      return;
    }
    let newItem = copyItem(item);
    // Try splitting the stack.
    if (mouseEvent.shiftKey && item.stackSize > 1) {
      newItem.stackSize = Math.floor(item.stackSize / 2);
    }
    const slotIndex = getSlotIndexByItemId(inv, itemId);
    const [fromItemX, fromItemY] = getSlotCoordsByIndex(inv, slotIndex);
    cursor.setHeldItem(newItem, fromItemX - clientCoordX, fromItemY - clientCoordY);
    result = true;
  } else {
    // Try splitting the stack.
    if (mouseEvent.shiftKey && !cursor.hasHeldItem() && item.stackSize > 1) {
      let newStackSize = Math.floor(item.stackSize / 2);
      let remaining = item.stackSize - newStackSize;
      let newItem = copyItem(item);
      newItem.stackSize = newStackSize;
      item.stackSize = remaining;
      dispatchItemChange(store, itemId);
      const slotIndex = getSlotIndexByItemId(inv, itemId);
      const [fromItemX, fromItemY] = getSlotCoordsByIndex(inv, slotIndex);
      cursor.setHeldItem(newItem, fromItemX - clientCoordX, fromItemY - clientCoordY);
      result = true;
    } else {
      result = cursor.pickUp(containerElement.invId, itemId, clientCoordX, clientCoordY);
    }
  }
  if (result) {
    // HACK: This should really grab focus to the item.
    let activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    return false;
  }
}

/**
 * Perform pickup logic for container elements.
 *
 * @param {MouseEvent} mouseEvent The triggering mouse event.
 * @param {HTMLElement & { _container: Element, invId: string }} containerElement The target container element.
 * @param {number} unitSize The item unit size.
 * @returns {boolean} Whether to allow the event to propagate.
 */
function containerMouseUpCallback(mouseEvent, containerElement, unitSize) {
  if (containerElement.hasAttribute('noinput')) {
    return;
  }
  const invId = containerElement.invId;
  const rootElement = containerElement._container;
  const swappable = !containerElement.hasAttribute('nooutput');
  const mergable = !containerElement.hasAttribute('noinput');
  const shiftKey = mouseEvent.shiftKey;
  const boundingRect = rootElement.getBoundingClientRect();
  const clientCoordX = getClientCoordX(boundingRect, mouseEvent.clientX, unitSize);
  const clientCoordY = getClientCoordY(boundingRect, mouseEvent.clientY, unitSize);
  let cursor = getCursor();
  let result = cursor.putDown(invId, clientCoordX, clientCoordY, swappable, mergable, shiftKey);
  if (result) {
    // HACK: This should really grab focus to the item.
    let activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    return false;
  }
}

/**
 * @param {DOMRect} elementBoundingRect
 * @param {number} clientX
 * @param {number} unitSize
 * @returns {number}
 */
function getClientCoordX(elementBoundingRect, clientX, unitSize) {
  return Math.trunc((clientX - elementBoundingRect.x) / unitSize);
}

/**
 * @param {DOMRect} elementBoundingRect
 * @param {number} clientY
 * @param {number} unitSize
 * @returns {number}
 */
function getClientCoordY(elementBoundingRect, clientY, unitSize) {
  return Math.trunc((clientY - elementBoundingRect.y) / unitSize);
}

/**
 *
 * @param {DocumentFragment|Element} parentNode
 * @param {Iterable<string>} list
 * @param {(key: string) => Element} factoryCreate
 * @param {(key: string, element: Element) => void} [factoryDelete]
 * @param {(key: string, element: Element, preserved: boolean) => void} [callback]
 * @returns {[Array<Element>, Array<Element>]}
 */
function updateList(parentNode, list, factoryCreate, factoryDelete = () => {}, callback = () => {}) {
  const children = parentNode.children;
  /** @type {Record<string, Element>} */
  const preserved = {};
  for (let i = 0; i < children.length; ++i) {
    let child = children.item(i);
    if (child.hasAttribute('data-listkey')) {
      let listKey = child.getAttribute('data-listkey');
      preserved[listKey] = child;
    }
  }
  /** @type {Array<Element>} */
  let reversedChildren = [];
  let newChildren = [];
  const preservedKeys = Object.keys(preserved);
  let keys = [...list].reverse();
  for (let key of keys) {
    let i = preservedKeys.indexOf(key);
    if (i >= 0) {
      preservedKeys.splice(i, 1);
      let element = preserved[key];
      callback(key, element, false);
      reversedChildren.push(element);
    } else {
      let element = factoryCreate(key);
      element.setAttribute('data-listkey', key);
      callback(key, element, true);
      if (reversedChildren.length > 0) {
        parentNode.insertBefore(element, reversedChildren[reversedChildren.length - 1]);
      } else {
        parentNode.appendChild(element);
      }
      reversedChildren.push(element);
      newChildren.push(element);
    }
  }
  let oldChildren = [];
  // Delete any remaining preserved
  for (let key of preservedKeys) {
    let element = preserved[key];
    element.remove();
    factoryDelete(key, element);
    oldChildren.push(element);
  }
  return [newChildren, oldChildren];
}

/**
 * @typedef {ReturnType<createInventoryView>} InventoryView
 * @typedef {InventoryViewInputModes[keyof InventoryViewInputModes]} InventoryViewInputMode
 * @typedef {InventoryViewOutputModes[keyof InventoryViewOutputModes]} InventoryViewOutputMode
 * @typedef {InventoryViewResizeModes[keyof InventoryViewResizeModes]} InventoryViewResizeMode
 */

/**
 * @param {HTMLElement & { _container: HTMLElement, invId: string }} containerElement
 */
function createInventoryView(containerElement, invId) {
  return {
    invId,
    containerElement,
  };
}

/**
 * @param {InventoryView} invView
 */
function getInventoryViewInvId(invView) {
  return invView.invId;
}

/**
 * @param {InventoryView} invView
 */
function isInventoryViewUnitSized(invView) {
  return invView.containerElement.hasAttribute('fixed');
}

/**
 * @param {InventoryView} invView
 */
function isInventoryViewEditable(invView) {
  return invView.containerElement.hasAttribute('noedit');
}

/** @typedef {import('../inventory/InventoryView.js').InventoryView} InventoryView */

const INNER_HTML$f = /* html */ `
<figure class="container">
  <div class="innerContainer">
    <img src="res/images/potion.png">
    <figcaption></figcaption>
    <label id="stackSize">1</label>
  </div>
</figure>
`;
const INNER_STYLE$f = /* css */ `
:host {
  --foreground-color: var(--item-foreground-color);
  --background-color: var(--item-background-color);
  --hover-color: var(--item-hover-color);
  --title-font: var(--item-title-font);
  
  --itemX: 0;
  --itemY: 0;
  --itemWidth: 1;
  --itemHeight: 1;
  --itemBackground: unset;
  /* var(--item-unit-size) is inherited from parent container. */
}
.container {
  display: inline-block;
  position: absolute;
  left: calc(var(--itemX) * var(--item-unit-size));
  top: calc(var(--itemY) * var(--item-unit-size));
  width: calc(var(--itemWidth) * var(--item-unit-size));
  height: calc(var(--itemHeight) * var(--item-unit-size));
  padding: 0;
  margin: 0;
  user-select: none;
  box-shadow: 0 0 0 rgba(0, 0, 0, 0);
  transition: box-shadow 0.1s ease;
  background: var(--background-color);
}
.container.background {
  left: calc(var(--itemX) * var(--item-unit-size));
  top: calc(var(--itemY) * var(--item-unit-size));
  width: calc(var(--itemWidth) * var(--item-unit-size) - 0.2em);
  height: calc(var(--itemHeight) * var(--item-unit-size) - 0.2em);
  background: linear-gradient(to bottom right,
    var(--background-color), var(--itemBackground, var(--background-color)));
  border: 0.1em solid var(--itemBackground, var(--background-color));
}
.container.background, .container.background .innerContainer {
  border-radius: 1em;
}
.container:hover {
  z-index: 5;
}
.container:hover .innerContainer {
  background-color: var(--hover-color);
}

.innerContainer {
  position: relative;
  width: 100%;
  height: 100%;
}
img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
figcaption {
  font-family: var(--title-font);
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: unset;
  color: var(--foreground-color);
  background-color: rgba(0, 0, 0, 0.1);
  text-align: center;
  text-overflow: clip;
  text-shadow: 0.1em 0.1em 0.05em #000000;
  white-space: nowrap;
  overflow: hidden;
}
figcaption.vertical {
  top: 0;
  bottom: 0;
  left: 0;
  right: unset;
  writing-mode: vertical-rl;
}

#stackSize {
  position: absolute;
  right: 0.2em;
  top: 0;
  text-align: right;
  text-shadow: 0.1em 0.1em 0.05em #000000;
}
`;

class ItemElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML$f;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE$f;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('inventory-item', this);
  }

  get invId() {
    return this._invId;
  }

  get itemId() {
    return this._itemId;
  }

  get container() {
    return this._invView.containerElement;
  }

  /**
   * @param {InventoryView} invView
   * @param {string} invId
   * @param {string} itemId
   */
  constructor(invView, invId, itemId) {
    super();
    if (!invView) {
      throw new Error('Missing view for item container.');
    }
    if (!invId) {
      throw new Error('Missing inventory id for item element.');
    }
    if (!itemId) {
      throw new Error('Missing item id for item element.');
    }
    const inv = getExistingInvInStore(getSatchelStore(), invId);
    if (!hasItem(inv, itemId)) {
      throw new Error('Cannot create item element with item id not in given inventory.');
    }
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this._invView = invView;
    /** @private */
    this._invId = invId;
    /** @private */
    this._itemId = itemId;

    /** @private */
    this._container = shadowRoot.querySelector('.container');
    /** @private */
    this._image = shadowRoot.querySelector('img');
    /** @private */
    this._caption = shadowRoot.querySelector('figcaption');
    /** @private */
    this._stackSize = shadowRoot.querySelector('#stackSize');

    /** @protected */
    this.onItemChange = this.onItemChange.bind(this);
    /** @protected */
    this.onMouseDown = this.onMouseDown.bind(this);
    /** @protected */
    this.onContextMenu = this.onContextMenu.bind(this);
  }

  /** @protected */
  connectedCallback() {
    const store = getSatchelStore();
    this.addEventListener('mousedown', this.onMouseDown);
    this.addEventListener('contextmenu', this.onContextMenu);
    addItemChangeListener(store, this.itemId, this.onItemChange);
    this.onItemChange(store, this.itemId);
  }

  /** @protected */
  disconnectedCallback() {
    const store = getSatchelStore();
    this.removeEventListener('mousedown', this.onMouseDown);
    this.removeEventListener('contextmenu', this.onContextMenu);
    removeItemChangeListener(store, this.itemId, this.onItemChange);
  }

  /**
   * @private
   * @param store
   * @param itemId
   */
  onItemChange(store, itemId) {
    const unitSized = isInventoryViewUnitSized(this._invView);
    const invId = this._invId;
    const inv = getExistingInvInStore(store, invId);
    const slotIndex = getSlotIndexByItemId(inv, itemId);
    const [x, y] = getSlotCoordsByIndex(inv, slotIndex);
    const item = getItemByItemId(inv, itemId);
    this.style.setProperty('--itemX', `${x}`);
    this.style.setProperty('--itemY', `${y}`);
    if (unitSized) {
      this.style.setProperty('--itemWidth', '1');
      this.style.setProperty('--itemHeight', '1');
    } else {
      this.style.setProperty('--itemWidth', `${item.width}`);
      this.style.setProperty('--itemHeight', `${item.height}`);
    }
    if (item.background) {
      try {
        let hex = Number.parseInt(item.background.substring(1), 16);
        let r = (hex >> 16) & 0xff;
        let g = (hex >> 8) & 0xff;
        let b = hex & 0xff;
        let a = hex === 0 ? 0.1 : 0.3;
        let background = `rgba(${r}, ${g}, ${b}, ${a})`;
        this.style.setProperty('--itemBackground', background);
        this._container.classList.toggle('background', true);
      } catch (e) {
        this.style.removeProperty('--itemBackground');
        this._container.classList.toggle('background', false);
      }
    } else {
      this.style.removeProperty('--itemBackground');
      this._container.classList.toggle('background', false);
    }
    const title = item.displayName || 'Item';
    this.title = title;
    this._image.src = item.imgSrc;
    this._image.alt = title;
    this._caption.textContent = item.displayName;
    this._caption.classList.toggle('vertical', item.width < item.height);
    // Stack size
    if (item.stackSize >= 0) {
      this._stackSize.textContent = `⨯${item.stackSize}`;
    } else {
      this._stackSize.textContent = '';
    }
  }

  /**
   * @private
   * @param {MouseEvent} e
   */
  onMouseDown(e) {
    if (e.button === 0) {
      return itemMouseDownCallback(e, this, DEFAULT_ITEM_UNIT_SIZE);
    }
  }

  /**
   * @private
   * @param {MouseEvent} e
   */
  onContextMenu(e) {
    if (isInventoryViewEditable(this._invView)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    let event = new CustomEvent('itemcontext', {
      bubbles: true,
      composed: true,
      detail: {
        clientX: e.clientX,
        clientY: e.clientY,
        element: this,
        container: this.container,
        invId: this.invId,
        itemId: this.itemId,
      },
    });
    this.dispatchEvent(event);
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}
ItemElement.define();

function useInternalInventoryItemList(parent, invView) {
  return () => {
    const store = getSatchelStore();
    const invId = getInventoryViewInvId(invView);
    const list = getItemIdsInSlots(store, invId);
    const [created, deleted] = updateList(parent, list, (key) => {
      let invItem = getItemInInv(store, invId, key);
      return new ItemElement(invView, invId, invItem.itemId);
    });
    return [created, deleted];
  };
}

class InventoryItemList {
  /**
   * @param {HTMLElement} parent The parent element to add all item elements under.
   */
  constructor(parent) {
    this.parent = parent;
  }

  update(store, invView) {
    const invId = getInventoryViewInvId(invView);
    const list = getItemIdsInSlots(store, invId);
    const [created, deleted] = updateList(this.parent, list, (key) => {
      let invItem = getItemInInv(store, invId, key);
      return new ItemElement(invView, invId, invItem.itemId);
    });
    return [created, deleted];
  }
}

/**
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 * @typedef {import('../../satchel/inv/Inv.js').InvId} InvId
 * @typedef {import('../../store/SatchelStore.js').SatchelStore} Store
 */

const INNER_HTML$e = /* html */ `
<section class="root">
  <h2></h2>
  <div class="container grid flattop">
    <p class="itemList"></p>
  </div>
</section>
`;
const INNER_STYLE$e = /* css */ `
:host {
  display: inline-block;

  --background-color: var(--satchel-background-color);
  --outline-color: var(--satchel-outline-color);
  --title-color: var(--satchel-title-color);
  --grid-color: var(--satchel-grid-color);

  --container-width: 1;
  --container-height: 1;
  --item-unit-size: ${DEFAULT_ITEM_UNIT_SIZE}px;
}
.root {
  position: relative;
  display: inline-block;
  width: calc(var(--container-width) * var(--item-unit-size));
  margin: 0;
  margin-right: 0.5em;
  margin-bottom: 0.5em;
}
.root.topmargin {
  margin-top: 2em;
}
h2 {
  position: absolute;
  top: 2rem;
  left: 0;
  right: 0;
  font-size: 0.9rem;
  padding-bottom: 2rem;
  margin: 0;
  overflow: hidden;
  text-overflow: clip;
  border-radius: 1em;
  text-align: center;
  color: white;
  background-color: var(--title-color);
  transform: translateY(-100%);
  box-shadow: 0.4rem 0.4rem 0 0 var(--outline-color);
}
p {
  margin: 0;
  padding: 0;
}
.hidden {
  visibility: hidden;
}
.container {
  position: relative;
  width: 100%;
  height: calc(var(--container-height) * var(--item-unit-size));
  background-color: var(--background-color);
  border-radius: 1rem;
  box-shadow: 0.4rem 0.4rem 0 0 var(--outline-color);
  overflow: hidden;
}
.container.flattop {
  border-top-right-radius: 0rem;
  border-top-left-radius: 0rem;
}
.grid {
  background-size: var(--item-unit-size) var(--item-unit-size);
  background-position: -1px -1px;
  background-image:
    linear-gradient(to right, var(--grid-color), transparent 1px),
    linear-gradient(to bottom, var(--grid-color), transparent 1px);
}
`;

/**
 * - init - create a new inventory on add
 * - fixed - force single unit size
 * - temp - delete the inventory on remove
 * - noinput - no adding items
 * - nooutput - no removing items
 * - copyoutput - only copy items on remove (does not actually remove)
 */
class InvSocketElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML$e;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE$e;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('inv-socket', this);
  }

  static get observedAttributes() {
    return ['invid', 'fixed'];
  }

  get invId() {
    return this._invId;
  }

  set invId(value) {
    this.setAttribute('invid', value);
  }

  get init() {
    return this.getAttribute('init');
  }

  set init(value) {
    this.setAttribute('init', value);
  }

  get _container() {
    return this.innerContainer;
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this._invId = null;
    /** @private */
    this._invView = createInventoryView(this, null);

    /** @private */
    this.rootContainer = shadowRoot.querySelector('.root');
    /** @private */
    this.innerContainer = shadowRoot.querySelector('.container');
    /** @private */
    this.invHeader = shadowRoot.querySelector('h2');

    /** @private */
    this.itemList = new InventoryItemList(shadowRoot.querySelector('.itemList'));

    /** @private */
    this.onInventoryChange = this.onInventoryChange.bind(this);
    /** @private */
    this.onMouseUp = this.onMouseUp.bind(this);
    /** @private */
    this.onContextMenu = this.onContextMenu.bind(this);
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'invId');
    upgradeProperty(this, 'init');

    const store = getSatchelStore();
    const init = this.init;

    // Only start init once.
    let invId;
    switch (init) {
      case 'inv':
        invId = uuid();
        createSocketInvInStore(store, invId);
        break;
      default:
        if (init && init !== 'null') {
          throw new Error(`Unknown init type '${init}' for album-list.`);
        } else {
          // Only if not init, use invId attribute
          invId = this.invId;
        }
        break;
    }
    this.internallyChangeInvId(store, invId);

    this.innerContainer.addEventListener('mouseup', this.onMouseUp);
    this.innerContainer.addEventListener('contextmenu', this.onContextMenu);
  }

  /** @protected */
  disconnectedCallback() {
    const store = getSatchelStore();
    const init = this.init;
    const invId = this._invId;
    this.internallyChangeInvId(store, null);

    // Only stop init if initialized.
    if (init) {
      const inventory = getInvInStore(store, invId);
      if (inventory) {
        deleteInvInStore(store, invId, inventory);
      }
    }

    this.innerContainer.removeEventListener('mouseup', this.onMouseUp);
    this.innerContainer.removeEventListener('contextmenu', this.onContextMenu);
  }

  /**
   * @protected
   * @param {string} attribute
   * @param {string} previous
   * @param {string} value
   */
  attributeChangedCallback(attribute, previous, value) {
    switch (attribute) {
      case 'invid':
        {
          if (value && this.init) {
            throw new Error(`Cannot set inv id '${value}' for init type '${this.init}' invs.`);
          }
          const store = getSatchelStore();
          this.internallyChangeInvId(store, value);
        }
        break;
      case 'fixed':
        {
          const store = getSatchelStore();
          this.onInventoryChange(store, this._invId);
        }
        break;
    }
  }

  /**
   * @private
   * @param {Store} store
   * @param {InvId} newInvId
   */
  internallyChangeInvId(store, newInvId) {
    const prevInvId = this._invId;
    if (prevInvId !== newInvId) {
      this._invId = newInvId;
      if (prevInvId) {
        removeInventoryChangeListener(store, prevInvId, this.onInventoryChange);
      }
      if (newInvId) {
        this._invView.invId = newInvId;
        addInventoryChangeListener(store, newInvId, this.onInventoryChange);
        this.onInventoryChange(store, newInvId);
      }
    }
  }

  /**
   * @private
   * @param {Store} store
   * @param {InvId} invId
   */
  onInventoryChange(store, invId) {
    if (!isInvInStore(store, invId)) {
      // The inv has been deleted.
      this.style.setProperty('--container-width', '0');
      this.style.setProperty('--container-height', '0');
      return;
    }

    const temp = this.hasAttribute('temp');
    const fixed = this.hasAttribute('fixed');

    const inv = getInvInStore(store, invId);
    const invType = inv.type;
    if (invType !== 'socket') {
      throw new Error('Trying to display non-socket inventory with inv-socket.');
    }
    if (temp && isInventoryEmpty(store, invId)) {
      this.internallyChangeInvId(store, null);
      this.remove();
      deleteInvInStore(store, invId, inv);
      return;
    }

    const item = getItemAtSlotIndex(store, invId, 0);

    // Set inv dimensions
    let invWidth = inv.width;
    let invHeight = inv.height;
    if (!fixed && item) {
      invWidth = item.width;
      invHeight = item.height;
    } else {
      invWidth = 1;
      invHeight = 1;
    }
    this.style.setProperty('--container-width', `${invWidth}`);
    this.style.setProperty('--container-height', `${invHeight}`);

    // Set display name
    const displayName = inv.displayName;
    const isDisplayName = Boolean(displayName);
    this.invHeader.textContent = displayName;
    this.invHeader.classList.toggle('hidden', !isDisplayName);
    this.rootContainer.classList.toggle('topmargin', isDisplayName);
    this.innerContainer.classList.toggle('flattop', isDisplayName);

    // Update items
    const [created, deleted] = this.itemList.update(store, this._invView);
    this.dispatchEvent(
      new CustomEvent('change', {
        composed: true,
        bubbles: false,
        detail: {
          invId,
          created,
          deleted,
        },
      })
    );
  }

  /**
   * @private
   * @param {MouseEvent} e
   */
  onMouseUp(e) {
    if (e.button === 0) {
      return containerMouseUpCallback(e, this, DEFAULT_ITEM_UNIT_SIZE);
    }
  }

  /**
   * @private
   * @param {MouseEvent} e
   */
  onContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}
InvSocketElement.define();

/**
 * @typedef {import('../../satchel/item/Item.js').Item} Item
 */

const INNER_HTML$d = /* html */ `
<div class="outer">
  <img>
</div>
`;
const INNER_STYLE$d = /* css */ `
:host {
  display: inline-block;
  pointer-events: none;
}
.outer {
  position: absolute;
  left: 0;
  top: 0;
  width: ${DEFAULT_ITEM_UNIT_SIZE}px;
  height: ${DEFAULT_ITEM_UNIT_SIZE}px;
  animation-duration: 1s;
  animation-timing-function: cubic-bezier(0.6, -0.18, 0.735, 0.045);
  animation-fill-mode: forwards;
  overflow: hidden;
  transform: scale(0);
}
img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.falling {
  animation-name: itemfall;
}
@keyframes itemfall {
  0% {
    transform: scale(1.5);
  }
  20% {
    transform: scale(3);
  }
  to {
    transform: scale(0);
    top: 10%;
    left: 100%;
  }
}
`;

class FallingItemElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML$d;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE$d;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('falling-item', this);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this.containerElement = /** @type {HTMLElement} */ (shadowRoot.querySelector('.outer'));
    /** @private */
    this.imageElement = shadowRoot.querySelector('img');
  }

  /**
   * @param {Item} item
   */
  animateItem(item, clientX, clientY) {
    const img = this.imageElement;
    img.src = item.imgSrc;
    img.alt = item.displayName;
    const root = this.containerElement;
    root.style.setProperty('left', `${clientX}px`);
    root.style.setProperty('top', `${clientY}px`);
    root.classList.remove('falling');
    void root.offsetWidth;
    root.classList.add('falling');
  }
}
FallingItemElement.define();

/**
 * @returns {FallingItemElement}
 */
function getFalling() {
  return document.querySelector('falling-item');
}

function dropFallingItem(item, clientX, clientY) {
  playSound('putdownGround');
  dropItemOnGround(item);
  getFalling().animateItem(item, clientX, clientY);
}

/**
 * @callback EndCallback
 * @param {number} x The x coordinate to evaluate.
 * @param {number} y The y coordinate to evaluate.
 * @returns {boolean} Whether the passed-in coordinate can is an "end" coordinate for the dijkstra path search.
 */

/**
 * @callback NeighborCallback
 * @param {number} x The x coordinate to get neighbors for.
 * @param {number} y The y coordinate to get neighbors for.
 * @param {Array<number>} out The destination array of the coordinate's neighbor ids.
 * @returns {Array<number>} The output array containing the coordinate's neighbor ids.
 */

/**
 * @callback FromCoordCallback
 * @param {number} x The x coordinate to translate to the associated object id.
 * @param {number} y The y coordinate to translate to the associated object id.
 * @returns {number} The associated object id at the x and y coordinates.
 */

/**
 * @callback ToCoordCallback
 * @param {number} id The id of an object to get the coordinates of.
 * @param {Array<number>} out The destination array of neighbors.
 * @returns {Array<number>} The output array containing the x and y coordinates.
 */

/**
 * Performs Dijkstra's on a 2d coordinate system with the passed-in callback functions. It assumes that every
 * coordinate can be translated to an uniquely identifying number to represent node uniqueness. It also assumes
 * the reverse is also easily computable (from node to coordinates). This does NOT use a priority queue.
 *
 * @param {number} x The starting x coordinate.
 * @param {number} y The starting y coordinate.
 * @param {number} minX The minimum x coordinate.
 * @param {number} minY The minimum y coordinate.
 * @param {number} maxX The maximum x coordinate.
 * @param {number} maxY The maximum y coordinate.
 * @param {EndCallback} isEnd A callback that checks with the coordinate should be considered a successful result.
 * @param {NeighborCallback} getNeighbors A callback that gets the neighbor object ids for any given coordinates.
 * @param {FromCoordCallback} fromCoord A callback that converts object ids to coordinates.
 * @param {ToCoordCallback} toCoord A callback that converts coordinates to its associated object ids.
 * @returns {Array<number>} An array of x and y coordinates of the found end coordinates. If none are found, then
 * it will return [ -1, -1 ].
 */
function dijkstra2d(x, y, minX, minY, maxX, maxY, isEnd, getNeighbors, fromCoord, toCoord) {
  if (Number.isNaN(maxX) || Number.isNaN(maxY)) {
    throw new TypeError('Maximum coordinates must be a number.');
  }

  if (minX < 0 || minY < 0 || maxX < 0 || maxY < 0) {
    throw new Error('Coordinates must be non-negative.');
  }

  if (minX > maxX || minY > maxY) {
    throw new Error('Minimum coordinates must be less than maximum coordinates.');
  }

  if (maxX !== (maxX & 0xff_ff) || maxY !== (maxY & 0xff_ff)) {
    throw new Error('Cannot find coordinates in dimensions larger than 2^16.');
  }

  const outNeighbors = Array.from({ length: 4 });
  const outCoord = Array.from({ length: 2 });

  const visited = new Set();
  const unvisited = [fromCoord(x, y)];
  while (unvisited.length > 0) {
    const node = unvisited.shift();
    const [nodeX, nodeY] = toCoord(node, outCoord);
    if (isEnd(nodeX, nodeY)) {
      return outCoord;
    }

    visited.add(node);

    for (const neighbor of getNeighbors(nodeX, nodeY, outNeighbors)) {
      if (visited.has(neighbor)) {
        continue;
      }

      const [neighborX, neighborY] = toCoord(neighbor, outCoord);
      if (neighborX >= minX && neighborY >= minY && neighborX <= maxX && neighborY <= maxY) {
        unvisited.push(neighbor);
      }
    }
  }

  outCoord[0] = -1;
  outCoord[1] = -1;
  return outCoord;
}

/**
 * @typedef {import('../../satchel/inv/Inv.js').Inventory} Inventory
 * @typedef {import('../../satchel/inv/Inv.js').InvId} InvId
 * @typedef {import('../../store/SatchelStore.js').SatchelStore} SatchelStore
 *
 * @typedef {import('../../satchel/item/Item.js').Item} Item
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 *
 * @typedef {import('./InvCursorElement.js').InvCursorElement} InvCursorElement
 */

/**
 * @param {InvCursorElement} cursor
 * @param {SatchelStore} store
 * @param {InvId} toInvId
 * @param {number} coordX
 * @param {number} coordY
 * @param {boolean} swappable
 * @param {boolean} mergable
 * @param {boolean} shiftKey
 */
function putDownToSocketInventory(
  cursor,
  store,
  toInvId,
  coordX,
  coordY,
  swappable,
  mergable,
  shiftKey
) {
  let heldItem = cursor.getHeldItem();
  let prevItem = getItemAtSlotIndex(store, toInvId, 0);
  let prevItemX = -1;
  let prevItemY = -1;
  if (prevItem) {
    if (swappable) {
      // Has an item to swap. So pick up this one for later.
      let inv = getExistingInvInStore(store, toInvId);
      let prevItemId = prevItem.itemId;
      let slotIndex = getSlotIndexByItemId(inv, prevItemId);
      let [x, y] = getSlotCoordsByIndex(inv, slotIndex);
      prevItemX = x;
      prevItemY = y;
      prevItem = getItemByItemId(inv, prevItemId);
      // If we can merge, do it now.
      if (tryMergeItems(store, cursor, prevItem, heldItem, mergable, shiftKey)) {
        return true;
      }
      // ...otherwise we continue with the swap.
      removeItemFromInventory(store, toInvId, prevItemId);
    } else {
      // Cannot swap. Exit early.
      return false;
    }
  } else if (tryDropPartialItem(store, toInvId, heldItem, mergable, shiftKey, 0, 0)) {
    // No item in the way and we want to partially drop singles.
    return true;
  }
  // Now there are no items in the way. Place it down!
  cursor.clearHeldItem();
  addItemToInventory(store, toInvId, heldItem, 0, 0);
  // ...finally put the remaining item back now that there is space.
  if (prevItem) {
    cursor.setHeldItem(prevItem, Math.min(0, prevItemX - coordX), Math.min(0, prevItemY - coordY));
  }
  return true;
}

/**
 * @param {InvCursorElement} cursor
 * @param {SatchelStore} store
 * @param {InvId} toInvId
 * @param {number} itemX The root slot coordinates to place item (includes holding offset)
 * @param {number} itemY The root slot coordinates to place item (includes holding offset)
 * @param {boolean} swappable
 * @param {boolean} mergable
 * @param {boolean} shiftKey
 */
function putDownToGridInventory(cursor, store, toInvId, itemX, itemY, swappable, mergable, shiftKey) {
  const toInventory = getInvInStore(store, toInvId);
  const heldItem = cursor.getHeldItem();
  const invWidth = toInventory.width;
  const invHeight = toInventory.height;
  const itemWidth = heldItem.width;
  const itemHeight = heldItem.height;
  const maxCoordX = invWidth - itemWidth;
  const maxCoordY = invHeight - itemHeight;
  if (maxCoordX < 0 || maxCoordY < 0) {
    return false;
  }
  const targetCoordX = Math.min(Math.max(0, itemX), maxCoordX);
  const targetCoordY = Math.min(Math.max(0, itemY), maxCoordY);

  let prevItemId = null;
  for (let y = 0; y < itemHeight; ++y) {
    for (let x = 0; x < itemWidth; ++x) {
      let itemId = getItemIdAtSlotCoords(store, toInvId, targetCoordX + x, targetCoordY + y);
      if (itemId) {
        if (prevItemId) {
          if (itemId !== prevItemId) {
            swappable = false;
          }
        } else {
          prevItemId = itemId;
        }
      }
    }
  }

  if (swappable) {
    let prevItem = null;
    let prevItemX = -1;
    let prevItemY = -1;
    if (prevItemId) {
      // Has an item to swap or merge. So pick up this one for later.
      let inv = getInvInStore(store, toInvId);
      let slotIndex = getSlotIndexByItemId(inv, prevItemId);
      let [x, y] = getSlotCoordsByIndex(inv, slotIndex);
      prevItemX = x;
      prevItemY = y;
      prevItem = getItemByItemId(inv, prevItemId);
      // If we can merge, do it now.
      if (tryMergeItems(store, cursor, prevItem, heldItem, mergable, shiftKey)) {
        return true;
      }
      // ...otherwise we continue with the swap.
      removeItemFromInventory(store, toInvId, prevItemId);
    } else if (tryDropPartialItem(store, toInvId, heldItem, mergable, shiftKey, targetCoordX, targetCoordY)) {
      // No item in the way and we want to partially drop singles.
      return true;
    }
    // Now there are no items in the way. Place it down!
    cursor.clearHeldItem();
    addItemToInventory(store, toInvId, heldItem, targetCoordX, targetCoordY);
    // ...finally put the remaining item back now that there is space.
    if (prevItem) {
      cursor.setHeldItem(
        prevItem,
        Math.min(0, prevItemX - targetCoordX),
        Math.min(0, prevItemY - targetCoordY)
      );
    }
    return true;
  } else {
    // Cannot swap here. Find somehwere close?
    const [x, y] = findEmptyCoords(targetCoordX, targetCoordY, maxCoordX, maxCoordY, (x, y) =>
      canPlaceAt(store, toInvId, x, y, itemWidth, itemHeight)
    );
    if (x >= 0 && y >= 0) {
      cursor.clearHeldItem();
      addItemToInventory(store, toInvId, heldItem, x, y);
      return true;
    }
    // No can do :(
    return false;
  }
}

function tryTakeOneItem(store, item) {
  if (item.stackSize > 1) {
    let amount = 1;
    let remaining = item.stackSize - amount;
    let newItem = copyItem(item);
    newItem.stackSize = amount;
    item.stackSize = remaining;
    dispatchItemChange(store, item.itemId);
    return newItem;
  } else {
    return null;
  }
}

function tryDropPartialItem(store, toInvId, heldItem, mergable, shiftKey, targetCoordX, targetCoordY) {
  if (mergable && shiftKey && heldItem.stackSize > 1) {
    // No item in the way and we want to partially drop singles.
    let amount = 1;
    let remaining = heldItem.stackSize - amount;
    let newItem = copyItem(heldItem);
    newItem.stackSize = amount;
    heldItem.stackSize = remaining;
    dispatchItemChange(store, heldItem.itemId);
    addItemToInventory(store, toInvId, newItem, targetCoordX, targetCoordY);
    return true;
  }
  return false;
}

function tryMergeItems(store, cursor, prevItem, heldItem, mergable, shiftKey) {
  // If we can merge, do it now.
  if (!mergable || !isMergableItems(prevItem, heldItem)) {
    return false;
  }
  // Full merge!
  if (!shiftKey) {
    mergeItems(prevItem, heldItem);
    dispatchItemChange(store, prevItem.itemId);
    // Merged successfully! Discard the held item.
    cursor.clearHeldItem();
    return true;
  }
  // If not enough items, stop here.
  if (heldItem.stackSize <= 1) {
    return true;
  }
  // Single merge!
  let amount = 1;
  let remaining = heldItem.stackSize - amount;
  prevItem.stackSize += amount;
  heldItem.stackSize = remaining;
  dispatchItemChange(store, prevItem.itemId);
  dispatchItemChange(store, heldItem.itemId);
  return true;
}

/**
 * @param {Item} item
 * @param {Item} other
 */
function mergeItems(item, other) {
  item.stackSize += other.stackSize;
  if (item.description !== other.description && other.description) {
    if (item.description) {
      item.description += '\n\n';
    }
    item.description += other.description;
  }
  if (other.metadata) {
    item.metadata = {
      ...item.metadata,
      ...other.metadata,
    };
  }
  return item;
}

/**
 * @param {Item} item
 * @param {Item} other
 */
function isMergableItems(item, other) {
  if (item.stackSize < 0 || other.stackSize < 0) {
    // Only merge if already stackable.
    return false;
  }
  if (item.imgSrc !== other.imgSrc) {
    return false;
  }
  if (item.displayName !== other.displayName) {
    return false;
  }
  if (item.width !== other.width || item.height !== other.height) {
    return false;
  }
  if (item.background !== other.background) {
    return false;
  }
  if (item.itemId === other.itemId) {
    // Cannot self merge.
    return false;
  }
  return true;
}

/**
 * @param {SatchelStore} store
 * @param {InvId} invId
 * @param coordX
 * @param coordY
 * @param itemWidth
 * @param itemHeight
 * @param exclude
 */
function canPlaceAt(store, invId, coordX, coordY, itemWidth, itemHeight, exclude = null) {
  for (let y = 0; y < itemHeight; ++y) {
    for (let x = 0; x < itemWidth; ++x) {
      const item = getItemAtSlotCoords(store, invId, coordX + x, coordY + y);
      if (item && (!exclude || item !== exclude)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * @param coordX
 * @param coordY
 * @param maxCoordX
 * @param maxCoordY
 * @param isEmptyCallback
 */
function findEmptyCoords(coordX, coordY, maxCoordX, maxCoordY, isEmptyCallback = () => true) {
  return dijkstra2d(
    coordX,
    coordY,
    0,
    0,
    maxCoordX,
    maxCoordY,
    isEmptyCallback,
    getNeighborsFromCoords,
    fromCoordsToNode,
    toCoordsFromNode
  );
}

/**
 * @param coordX
 * @param coordY
 */
function fromCoordsToNode(coordX, coordY) {
  return ((coordX & 0xff_ff) << 16) | (coordY & 0xff_ff);
}

/**
 * @param node
 * @param out
 */
function toCoordsFromNode(node, out) {
  out[0] = node >> 16;
  out[1] = node & 0xff_ff;
  return out;
}

/**
 * @param coordX
 * @param coordY
 * @param out
 */
function getNeighborsFromCoords(coordX, coordY, out) {
  out[0] = fromCoordsToNode(coordX - 1, coordY);
  out[1] = fromCoordsToNode(coordX, coordY - 1);
  out[2] = fromCoordsToNode(coordX + 1, coordY);
  out[3] = fromCoordsToNode(coordX, coordY + 1);
  return out;
}

/**
 * @typedef {import('../invgrid/InvSocketElement.js').InvSocketElement} InvSocketElement
 *
 * @typedef {import('../../satchel/inv/Inv.js').Inventory} Inventory
 * @typedef {import('../../satchel/inv/Inv.js').InvId} InvId
 * @typedef {import('../../store/SatchelStore.js').SatchelStore} SatchelStore
 *
 * @typedef {import('../../satchel/item/Item.js').Item} Item
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 */

const CURSOR_OFFSET_PIXELS = 24;
const PLACE_BUFFER_RANGE = 10;
const PLACE_BUFFER_RANGE_SQUARED = PLACE_BUFFER_RANGE * PLACE_BUFFER_RANGE;
const CURSOR_INV_ID = 'cursor';

const INNER_HTML$c = /* html */ `
<inv-socket invid="${CURSOR_INV_ID}"></inv-socket>
`;
const INNER_STYLE$c = /* css */ `
:host {
  position: absolute;
  display: none;
  filter: brightness(70%);
  opacity: 1;
}
/* This is only used externally and for style. */
:host([danger]) {
  opacity: 0.8;
  filter: brightness(70%) drop-shadow(0 0 0.5em red);
}
/* This is only used externally and for style. */
:host([important]) {
  opacity: 0.8;
  filter: brightness(70%) drop-shadow(0 0 0.5em white);
}
`;

class InvCursorElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML$c;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE$c;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('inv-cursor', this);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this.animationHandle = null;
    /** @private */
    this.clientX = 0;
    /** @private */
    this.clientY = 0;

    /** @private */
    this.startHeldX = 0;
    /** @private */
    this.startHeldY = 0;
    /** @private */
    this.heldOffsetX = 0;
    /** @private */
    this.heldOffsetY = 0;

    /**
     * This allows drag-n-drop or click-n-deposit gestures.
     *
     * @private
     */
    this.ignoreFirstPutDown = false;

    /** @private */
    this.inventoryElement = /** @type {InvSocketElement} */ (shadowRoot.querySelector('inv-socket'));

    /** @private */
    this.onAnimationFrame = this.onAnimationFrame.bind(this);
    /** @private */
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  get invId() {
    return this.inventoryElement.invId;
  }

  /** @protected */
  connectedCallback() {
    let store = getSatchelStore();
    if (!isInvInStore(store, CURSOR_INV_ID)) {
      createSocketInvInStore(store, CURSOR_INV_ID);
    }

    document.addEventListener('mousemove', this.onMouseMove);
    this.animationHandle = requestAnimationFrame(this.onAnimationFrame);
  }

  /** @protected */
  disconnectedCallback() {
    document.removeEventListener('mousemove', this.onMouseMove);
    cancelAnimationFrame(this.animationHandle);
    this.animationHandle = null;

    let store = getSatchelStore();
    if (isInvInStore(store, CURSOR_INV_ID)) {
      deleteInvInStore(store, CURSOR_INV_ID, getInvInStore(store, CURSOR_INV_ID));
    }
  }

  /** @private */
  onAnimationFrame() {
    // Update cursor position
    const clientX = this.clientX;
    const clientY = this.clientY;
    const posX = clientX + this.heldOffsetX * DEFAULT_ITEM_UNIT_SIZE;
    const posY = clientY + this.heldOffsetY * DEFAULT_ITEM_UNIT_SIZE;
    this.style.setProperty('left', `${posX - CURSOR_OFFSET_PIXELS}px`);
    // TODO: Maybe add 2rem from inv element's title margin?
    this.style.setProperty('top', `calc(${posY - CURSOR_OFFSET_PIXELS}px)`);
    if (
      this.ignoreFirstPutDown &&
      distanceSquared(clientX, clientY, this.startHeldX, this.startHeldY) >= PLACE_BUFFER_RANGE_SQUARED
    ) {
      // This is a drag motion. Next putDown should be intentful.
      this.ignoreFirstPutDown = false;
    }
    // Wait for another frame...
    this.animationHandle = requestAnimationFrame(this.onAnimationFrame);
  }

  /** @private */
  onMouseMove(e) {
    this.clientX = e.clientX;
    this.clientY = e.clientY;
  }

  /**
   * Pick up from target inventory to cursor if able to.
   *
   * @param {InvId} invId The inventory to pick up from
   * @param {ItemId} itemId The item to pick up
   * @param {number} coordX The cursor pick up coordinates from the inventory
   * @param {number} coordY The cursor pick up coordinates from the inventory
   * @returns {boolean} Whether the transfer to cursor was successful.
   */
  pickUp(invId, itemId, coordX = 0, coordY = 0) {
    if (!itemId) {
      return false;
    }
    if (this.hasHeldItem()) {
      // NOTE: Swapping is performed on putDown(), so ignore for pick up.
      return false;
    }
    let store = getSatchelStore();
    let inv = getExistingInvInStore(store, invId);
    const slotIndex = getSlotIndexByItemId(inv, itemId);
    const [fromItemX, fromItemY] = getSlotCoordsByIndex(inv, slotIndex);
    const item = getItemByItemId(inv, itemId);
    removeItemFromInventory(store, invId, itemId);
    this.setHeldItem(item, fromItemX - coordX, fromItemY - coordY);
    return true;
  }

  /**
   * Put down from cursor to destination inventory.
   *
   * @param {InvId} invId
   * @param {number} coordX
   * @param {number} coordY
   * @param {boolean} swappable
   * @param {boolean} mergable
   * @param {boolean} shiftKey
   */
  putDown(invId, coordX, coordY, swappable, mergable, shiftKey) {
    const store = getSatchelStore();
    const heldItem = this.getHeldItem();
    if (!heldItem) {
      return false;
    }
    if (this.ignoreFirstPutDown) {
      // First put down has been ignored. Don't ignore the next intentful one.
      this.ignoreFirstPutDown = false;
      return true;
    }
    playSound('putdown');
    const toInventory = getExistingInvInStore(store, invId);
    const invType = toInventory.type;
    switch (invType) {
      case 'socket':
        return putDownToSocketInventory(this, store, invId, coordX, coordY, swappable, mergable, shiftKey);
      case 'grid':
        return putDownToGridInventory(
          this,
          store,
          invId,
          coordX + this.heldOffsetX,
          coordY + this.heldOffsetY,
          swappable,
          mergable,
          shiftKey
        );
      default:
        throw new Error('Unsupported inventory type.');
    }
  }

  /**
   * Put down from cursor to ground.
   */
  putDownInGround(clientX = 0, clientY = 0) {
    const heldItem = this.getHeldItem();
    if (!heldItem) {
      return false;
    }
    if (this.ignoreFirstPutDown) {
      // First put down has been ignored. Don't ignore the next intentful one.
      this.ignoreFirstPutDown = false;
      return true;
    }
    this.clearHeldItem();
    dropFallingItem(heldItem, clientX, clientY);
    return true;
  }

  /**
   * Put down from cursor to album.
   */
  putDownInAlbum(albumId, shiftKey, clientX = 0, clientY = 0, destX = 0, destY = 0) {
    const heldItem = this.getHeldItem();
    if (!heldItem) {
      return false;
    }
    if (this.ignoreFirstPutDown) {
      // First put down has been ignored. Don't ignore the next intentful one.
      this.ignoreFirstPutDown = false;
      return true;
    }
    if (shiftKey) {
      // Try dropping as one?
      const store = getSatchelStore();
      let newItem = tryTakeOneItem(store, heldItem);
      if (newItem) {
        addItemToInventory(store, albumId, newItem, 0, 0);
        playSound('putdownAlbum');
        return true;
      }
      // Cannot drop as one. Stop here.
      return true;
    }
    const store = getSatchelStore();
    this.clearHeldItem();
    addItemToInventory(store, albumId, heldItem, 0, 0);
    // TODO: drop as falling item?
    playSound('putdownAlbum');
    return true;
  }

  hasHeldItem() {
    let store = getSatchelStore();
    let inv = getExistingInvInStore(store, this.invId);
    return !isSlotIndexEmpty(inv, 0);
  }

  getHeldItem() {
    let store = getSatchelStore();
    return getItemAtSlotIndex(store, this.invId, 0);
  }

  /**
   * @param {Item} item The item to hold
   * @param {number} offsetX The held offset from root item slot (can only be non-positive)
   * @param {number} offsetY The held offset from root item slot (can only be non-positive)
   */
  setHeldItem(item, offsetX = 0, offsetY = 0) {
    if (!item) {
      throw new Error('Cannot set held item to null - use clearHeldItem() instead.');
    }
    if (this.hasHeldItem()) {
      throw new Error('Cannot set held item - already holding another item.');
    }
    let store = getSatchelStore();
    addItemToInventory(store, this.invId, item, 0, 0);
    this.style.display = 'unset';
    this.ignoreFirstPutDown = true;
    this.startHeldX = this.clientX;
    this.startHeldY = this.clientY;
    this.heldOffsetX = Math.min(0, offsetX);
    this.heldOffsetY = Math.min(0, offsetY);
    playSound('pickup');
  }

  clearHeldItem() {
    let store = getSatchelStore();
    clearItemsInInventory(store, this.invId);
    this.style.display = 'none';
    this.ignoreFirstPutDown = false;
  }
}
InvCursorElement.define();

/**
 * @returns {InvCursorElement}
 */
function getCursor() {
  return document.querySelector('inv-cursor');
}

const INNER_HTML$b = /* html */ `
<button>
  <img>
</button>
`;
const INNER_STYLE$b = /* css */ `
:host {
  display: inline-block;
  width: 3em;
  height: 3em;
  margin: 0.2em;
  color: #ffffff;
  --background-color: #444444;
  --hover-color: #666666;
}
button {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 0.8em;
  background-color: var(--background-color);
  cursor: pointer;
}
button:disabled {
  opacity: 0.3;
  cursor: unset;
}
button:not(:disabled):hover {
  background-color: var(--hover-color);
}
button:not(:disabled):active {
  filter: brightness(60%);
}
img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}
`;

class IconButtonElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML$b;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE$b;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('icon-button', this);
  }

  /** @protected */
  static get observedAttributes() {
    return ['icon', 'alt', 'disabled'];
  }

  get icon() {
    return this.getAttribute('icon');
  }

  set icon(value) {
    this.setAttribute('icon', value);
  }

  get alt() {
    return this.getAttribute('alt');
  }

  set alt(value) {
    this.setAttribute('alt', value);
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    this.toggleAttribute('disabled', value);
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    this.shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this.button = this.shadowRoot.querySelector('button');
    /** @private */
    this.image = this.shadowRoot.querySelector('img');
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'icon');
    upgradeProperty(this, 'alt');
    upgradeProperty(this, 'disabled');
  }

  /** @protected */
  disconnectedCallback() {}

  /** @protected */
  attributeChangedCallback(attribute, prev, value) {
    switch (attribute) {
      case 'icon':
        this.image.src = value;
        break;
      case 'alt':
        this.image.alt = value;
        break;
      case 'disabled':
        this.button.toggleAttribute('disabled', value !== null);
        break;
    }
  }
}
IconButtonElement.define();

/**
 * @typedef {import('../invgrid/InvSocketElement.js').InvSocketElement} InvSocketElement
 * @typedef {import('../../satchel/item/Item.js').Item} Item
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 * @typedef {import('../../satchel/inv/Inv.js').InvId} InvId
 * @typedef {import('../../store/SatchelStore.js').SatchelStore} Store
 */

/**
 * @param {Item} a
 * @param {Item} b
 * @returns {number}
 */
function itemAlphabeticalComparator(a, b) {
  return (a.displayName || '').localeCompare(b.displayName || '');
}

/**
 * @param {Store} store
 * @param {Item} readOnlyItem
 * @param {Record<InvId, ItemId>} itemInvMap
 * @param {() => void} invChangeCallback
 * @returns {InvSocketElement}
 */
function setUpItemInvElement(store, readOnlyItem, itemInvMap, invChangeCallback) {
  let invId = uuid();
  createSocketInvInStore(store, invId);
  let newItem = cloneItem(readOnlyItem);
  addItemToInventory(store, invId, newItem, 0, 0);
  let invElement = /** @type {InvSocketElement} */ (document.createElement('inv-socket'));
  invElement.invId = invId;
  invElement.toggleAttribute('noinput', true);
  invElement.toggleAttribute('temp', true);
  itemInvMap[invId] = newItem.itemId;
  addInventoryChangeListener(store, invId, invChangeCallback);
  return invElement;
}

/**
 * @param {Store} store
 * @param {InvId} invId
 * @param {Record<InvId, ItemId>} itemInvMap
 * @param {() => void} invChangeCallback
 * @returns {ItemId}
 */
function tearDownItemInvElement(store, invId, itemInvMap, invChangeCallback) {
  removeInventoryChangeListener(store, invId, invChangeCallback);
  let itemId = itemInvMap[invId];
  delete itemInvMap[invId];
  return itemId;
}

/**
 * @param {Store} store
 * @param {HTMLCollection} itemElements
 * @param {Record<InvId, ItemId>} itemInvMap
 * @param {() => void} invChangeCallback
 */
function cleanUpItemInvElements(store, itemElements, itemInvMap, invChangeCallback) {
  // Remove all temp inv listeners
  const keys = Object.keys(itemInvMap);
  for (let invId of keys) {
    tearDownItemInvElement(store, invId, itemInvMap, invChangeCallback);
  }

  // Destroy all items
  let elements = [];
  const length = itemElements.length;
  for (let i = 0; i < length; ++i) {
    let element = /** @type {InvSocketElement} */ (itemElements.item(i));
    let invId = element.invId;
    if (isInvInStore(store, invId)) {
      let inv = getInvInStore(store, invId);
      deleteInvInStore(store, invId, inv);
    }
    elements.push(element);
  }
  for (let element of elements) {
    element.remove();
  }
}

/**
 * @typedef {import('../invgrid/InvSocketElement.js').InvSocketElement} InvSocketElement
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 * @typedef {import('../../satchel/album/Album.js').AlbumId} AlbumId
 * @typedef {import('../../store/SatchelStore.js').SatchelStore} Store
 */

const INNER_HTML$a = /* html */ `
`;
const INNER_STYLE$a = /* css */ `
:host {
  display: inline-block;
  vertical-align: top;
}
.shaking {
  animation-name: shake;
  animation-fill-mode: forwards;
  animation-duration: var(--animation-duration, 0);
  animation-delay: var(--animation-delay, 0);
  transform: translate(0, 0) scale(0);
}

@keyframes shake {
  0% {
    transform: translate(0, 0) scale(0);
  }
  20% {
    transform: translate(10%, 0) scale(1);
  }
  40% {
    transform: translate(-10%, 0);
  }
  50% {
    transform: translate(10%, 0);
  }
  60% {
    transform: translate(-10%, 0);
  }
  80% {
    transform: translate(10%, 0);
  }
  100% {
    transform: translate(0, 0);
  }
}
`;

/**
 * @fires change When album changes and element requires update
 */
class AlbumListElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML$a;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE$a;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('album-list', this);
  }

  static get observedAttributes() {
    return ['albumid', 'locked'];
  }

  get albumId() {
    return this._albumId;
  }

  set albumId(value) {
    this.setAttribute('albumid', value);
  }

  get init() {
    return this.getAttribute('init');
  }

  set init(value) {
    this.setAttribute('init', value);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this._albumId = null;

    /** @private */
    this.itemList = shadowRoot;
    /** @private */
    this.itemListEntryIds = {};

    /** @private */
    this.onAlbumChange = this.onAlbumChange.bind(this);
    /** @private */
    this.onItemListEntryCreate = this.onItemListEntryCreate.bind(this);
    /** @private */
    this.onItemListEntryUpdate = this.onItemListEntryUpdate.bind(this);
    /** @private */
    this.onItemListEntryInventoryChange = this.onItemListEntryInventoryChange.bind(this);
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'albumId');
    upgradeProperty(this, 'init');

    const store = getSatchelStore();
    const init = this.init;

    // Only start init once.
    let albumId;
    switch (init) {
      case 'ground':
        albumId = getGroundAlbumId(store);
        break;
      case 'trash':
        albumId = getTrashAlbumId(store);
        break;
      case 'album':
        albumId = uuid();
        createAlbumInStore(store, albumId);
        break;
      default:
        if (init && init !== 'null') {
          throw new Error(`Unknown init type '${init}' for album-list.`);
        } else {
          // Only if not init, use albumId attribute
          albumId = this.albumId;
        }
        break;
    }
    this.internallyChangeAlbumId(store, albumId);
  }

  /** @protected */
  disconnectedCallback() {
    const store = getSatchelStore();
    const init = this.init;
    const albumId = this.albumId;
    this.internallyChangeAlbumId(store, null);

    // Only stop init if initialized.
    if (init) {
      const album = getInvInStore(store, albumId);
      if (!isTrashAlbum(album) && !isGroundAlbum(album)) {
        deleteInvInStore(store, albumId, album);
      }
    }
  }

  /**
   * @protected
   * @param {string} attribute
   * @param previous
   * @param value
   */
  attributeChangedCallback(attribute, previous, value) {
    switch (attribute) {
      case 'albumid':
        {
          if (value && this.init) {
            throw new Error(`Cannot set album id '${value}' for init type '${this.init}' albums.`);
          }
          const store = getSatchelStore();
          this.internallyChangeAlbumId(store, value);
        }
        break;
      case 'locked':
        {
          const store = getSatchelStore();
          this.onAlbumChange(store, this._albumId);
        }
        break;
    }
  }

  /**
   * @private
   * @param {Store} store
   * @param {AlbumId} newAlbumId
   */
  internallyChangeAlbumId(store, newAlbumId) {
    const prevAlbumId = this._albumId;
    if (prevAlbumId !== newAlbumId) {
      this._albumId = newAlbumId;
      if (prevAlbumId) {
        removeInventoryChangeListener(store, prevAlbumId, this.onAlbumChange);
        cleanUpItemInvElements(
          store,
          this.itemList.children,
          this.itemListEntryIds,
          this.onItemListEntryInventoryChange
        );
      }
      if (newAlbumId) {
        addInventoryChangeListener(store, newAlbumId, this.onAlbumChange);
        this.onAlbumChange(store, newAlbumId);
      }
    }
  }

  /**
   * @private
   * @param store
   * @param albumId
   */
  onAlbumChange(store, albumId) {
    if (!isInvInStore(store, albumId)) {
      // The album has been deleted.
      return;
    }
    const list = getItemsInInv(store, albumId)
      .sort(itemAlphabeticalComparator)
      .map((a) => a.itemId);
    const [created, deleted] = updateList(
      this.itemList,
      list,
      this.onItemListEntryCreate,
      undefined,
      this.onItemListEntryUpdate
    );
    this.dispatchEvent(
      new CustomEvent('change', {
        composed: true,
        bubbles: false,
        detail: {
          albumId,
          created,
          deleted,
        },
      })
    );
  }

  /**
   * @private
   * @param {ItemId} key
   * @returns {InvSocketElement}
   */
  onItemListEntryCreate(key) {
    const albumId = this.albumId;
    const store = getSatchelStore();

    let albumItem = getItemInInv(store, albumId, key);
    let element = setUpItemInvElement(
      store,
      albumItem,
      this.itemListEntryIds,
      this.onItemListEntryInventoryChange
    );
    element.toggleAttribute('fixed', this.hasAttribute('fixed'));
    element.classList.add('shaking');
    return element;
  }

  /**
   * @private
   * @param {ItemId} key
   * @param {InvSocketElement} element
   */
  onItemListEntryUpdate(key, element) {
    if (this.hasAttribute('locked')) {
      element.toggleAttribute('copyoutput', true);
      element.toggleAttribute('temp', false);
    } else {
      element.toggleAttribute('copyoutput', false);
      element.toggleAttribute('temp', true);
    }
  }

  /** @private */
  onItemListEntryInventoryChange(store, invId) {
    if (isInvInStore(store, invId)) {
      // It still exists. Continue as normal.
      return;
    }
    const itemId = tearDownItemInvElement(
      store,
      invId,
      this.itemListEntryIds,
      this.onItemListEntryInventoryChange
    );
    const albumId = this.albumId;
    if (hasItemInInventory(store, albumId, itemId)) {
      removeItemFromInventory(store, albumId, itemId);
    }
  }
}
AlbumListElement.define();

/**
 * @typedef {import('../../satchel/item/Item.js').Item} Item
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 */

const INNER_HTML$9 = /* html */ `
<fieldset>
  <legend contenteditable></legend>
  <span class="preactionbar">
    <icon-button class="button" id="buttonExpand" icon="res/expandmore.svg" alt="expand" title="Expand Album"></icon-button>
  </span>
  <span class="actionbar">
    <icon-button class="button" id="buttonDelete" icon="res/delete.svg" alt="clear" title="Clear Album"></icon-button>
    <icon-button class="button" id="buttonExport" icon="res/download.svg" alt="export" title="Export Album"></icon-button>
    <icon-button class="button" id="buttonLock" icon="res/unlock.svg" alt="lock" title="Lock Album"></icon-button>
  </span>
  <label id="labelEmpty" class="hidden">- - - - - Empty - - - - -</label>
  <album-list fixed></album-list>
</fieldset>
`;
const INNER_STYLE$9 = /* css */ `
fieldset {
  position: relative;
  min-height: 2em;
  padding-right: 2.5em;
  border-color: #444444;
}
fieldset.unlocked {
  border-color: #ffffff;
}
legend {
  display: flex;
  flex-direction: row;
  border-bottom: 2px solid transparent;
  margin-left: 1.5em;
}
legend[contenteditable] {
  border-color: #ffffff;
}
.preactionbar {
  position: absolute;
  top: -1.5em;
  left: 0.3em;
  background-color: #333333;
  padding: 0 0.1em;
}
.actionbar {
  position: absolute;
  top: -1.5em;
  right: 0.3em;
  background-color: #333333;
  padding: 0 0.1em;
}
.button {
  display: inline-block;
  width: 1.5em;
  height: 1.5em;
  margin: 0;
}
#labelEmpty {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  color: #666666;
  text-align: center;
}
.hidden {
  display: none;
}
fieldset.internal {
  opacity: 0.6;
}
legend.internal {
  color: #888888;
}
album-list:not(.expanded) {
  display: none;
}
`;

class AlbumPackElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML$9;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE$9;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('album-pack', this);
  }

  get albumId() {
    return this._albumId;
  }

  constructor(albumId) {
    super();
    if (!albumId) {
      throw new Error('Missing album id for album element.');
    }
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this._albumId = albumId;
    /** @private */
    this._locked = false;

    /** @private */
    this.container = shadowRoot.querySelector('fieldset');
    /** @private */
    this.inputTitle = shadowRoot.querySelector('legend');
    /** @private */
    this.labelEmpty = shadowRoot.querySelector('#labelEmpty');

    /** @private */
    this.buttonDelete = shadowRoot.querySelector('#buttonDelete');
    /** @private */
    this.buttonExport = shadowRoot.querySelector('#buttonExport');
    /** @private */
    this.buttonLock = /** @type {IconButtonElement} */ (shadowRoot.querySelector('#buttonLock'));
    /** @private */
    this.buttonExpand = /** @type {IconButtonElement} */ (shadowRoot.querySelector('#buttonExpand'));

    /** @private */
    this.albumList = shadowRoot.querySelector('album-list');
    this.albumList.setAttribute('albumid', albumId);
    /** @private */
    this.onAlbumListChange = this.onAlbumListChange.bind(this);

    /** @private */
    this.onInputTitle = this.onInputTitle.bind(this);
    /** @private */
    this.onButtonLock = this.onButtonLock.bind(this);
    /** @private */
    this.onButtonExport = this.onButtonExport.bind(this);
    /** @private */
    this.onButtonDelete = this.onButtonDelete.bind(this);
    /** @private */
    this.onButtonExpand = this.onButtonExpand.bind(this);

    /** @private */
    this.onAlbumDrop = this.onAlbumDrop.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.albumList.addEventListener('change', this.onAlbumListChange);
    this.inputTitle.addEventListener('input', this.onInputTitle);
    this.buttonLock.addEventListener('click', this.onButtonLock);
    this.buttonExport.addEventListener('click', this.onButtonExport);
    this.buttonDelete.addEventListener('click', this.onButtonDelete);
    this.buttonExpand.addEventListener('click', this.onButtonExpand);
    this.container.addEventListener('mouseup', this.onAlbumDrop);
  }

  /** @protected */
  disconnectedCallback() {
    this.albumList.removeEventListener('change', this.onAlbumListChange);
    this.inputTitle.removeEventListener('input', this.onInputTitle);
    this.buttonLock.removeEventListener('click', this.onButtonLock);
    this.buttonExport.removeEventListener('click', this.onButtonExport);
    this.buttonDelete.removeEventListener('click', this.onButtonDelete);
    this.buttonExpand.removeEventListener('click', this.onButtonExpand);
    this.container.removeEventListener('mouseup', this.onAlbumDrop);
  }

  /** @private */
  onAlbumListChange(e) {
    const albumId = e.detail.albumId;
    const store = getSatchelStore();
    const album = getInvInStore(store, albumId);

    if (isGroundAlbum(album) || isTrashAlbum(album)) {
      // Cannot change lock state for a ground album
      this.buttonLock.toggleAttribute('disabled', true);
    }

    // Update lock status
    const locked = isAlbumLocked(store, albumId);
    this.buttonLock.icon = locked ? 'res/lock.svg' : 'res/unlock.svg';
    this.buttonLock.alt = locked ? 'unlock' : 'lock';
    this.buttonLock.title = locked ? 'Unlock Album' : 'Lock Album';
    this.buttonDelete.toggleAttribute('disabled', locked);
    this.inputTitle.toggleAttribute('contenteditable', !locked);
    this.container.classList.toggle('unlocked', !locked);
    this.albumList.toggleAttribute('locked', locked);

    // Update expand status
    const expanded = isAlbumExpanded(store, albumId);
    this.buttonExpand.icon = expanded ? 'res/expandless.svg' : 'res/expandmore.svg';
    this.buttonExpand.alt = expanded ? 'less' : 'more';
    this.buttonExpand.title = expanded ? 'Hide Album' : 'Show Album';
    this.albumList.classList.toggle('expanded', expanded);

    // Change style for internal albums
    let isInternalAlbum = isFoundryAlbum(album) || isGroundAlbum(album) || isTrashAlbum(album);
    this.container.classList.toggle('internal', isInternalAlbum);
    this.inputTitle.classList.toggle('internal', isInternalAlbum);

    // Update name
    const name = album.displayName;
    if (name !== this.inputTitle.textContent) {
      this.inputTitle.textContent = name;
    }

    // Update if empty
    let empty = getItemIdsInInv(store, albumId).length > 0;
    this.labelEmpty.classList.toggle('hidden', empty);
  }

  /** @private */
  onInputTitle(e) {
    const store = getSatchelStore();
    const albumId = this.albumId;
    if (isInvInStore(store, albumId)) {
      const name = this.inputTitle.textContent;
      const album = getInvInStore(store, albumId);
      album.displayName = name;
      dispatchInventoryChange(store, albumId);
    }
  }

  /** @private */
  onButtonLock() {
    const store = getSatchelStore();
    const albumId = this.albumId;
    if (isInvInStore(store, albumId)) {
      const locked = isAlbumLocked(store, albumId);
      setAlbumLocked(store, albumId, !locked);
    }
  }

  /** @private */
  onButtonExport() {
    const store = getSatchelStore();
    const album = getInvInStore(store, this.albumId);
    if (album) {
      try {
        const jsonData = exportAlbumToJSON(album);
        const name = album.displayName;
        downloadText(`${name}-album.json`, JSON.stringify(jsonData, null, 4));
      } catch (e) {
        console.error(e);
      }
    }
  }

  /** @private */
  onButtonDelete() {
    const store = getSatchelStore();
    const albumId = this.albumId;
    clearItemsInInventory(store, albumId);
    const album = getInvInStore(store, albumId);
    deleteInvInStore(store, albumId, album);
    this.remove();
  }

  /** @private */
  onButtonExpand() {
    const store = getSatchelStore();
    const albumId = this.albumId;
    if (isInvInStore(store, albumId)) {
      const expanded = isAlbumExpanded(store, albumId);
      setAlbumExpanded(store, albumId, !expanded);
    }
  }

  /** @private */
  onAlbumDrop(e) {
    const store = getSatchelStore();
    const albumId = this.albumId;
    if (!isInvInStore(store, albumId)) {
      return;
    }
    if (!isAlbumExpanded(store, albumId)) {
      return;
    }
    let cursor = getCursor();
    // HACK: This is so single clicks won't create albums
    // @ts-ignore
    if (isAlbumLocked(store, albumId) && cursor.hasHeldItem() && !cursor.ignoreFirstPutDown) {
      let heldItem = cursor.getHeldItem();
      let items = getItemsInInv(store, albumId);
      for (let item of items) {
        // Dragging similar items to the album will delete it.
        if (isItemSimilarEnoughToBeDestroyed(item, heldItem)) {
          cursor.clearHeldItem();
          saveItemToTrashAlbum(heldItem);
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
      // Or reject this attempt and dump to ground.
      if (cursor.putDownInGround(e.clientX, e.clientY)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
    // Otherwise, try to add it to the album normally.
    let result = cursor.putDownInAlbum(albumId, e.shiftKey);
    if (result) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
}
AlbumPackElement.define();

/**
 * @param {Item} item
 * @param {Item} other
 */
function isItemSimilarEnoughToBeDestroyed(item, other) {
  if (item.displayName !== other.displayName) {
    return false;
  }
  if (item.background !== other.background) {
    return false;
  }
  if (item.imgSrc !== other.imgSrc) {
    return false;
  }
  if (item.width !== other.width) {
    return false;
  }
  if (item.height !== other.height) {
    return false;
  }
  if (item.description !== other.description) {
    return false;
  }
  return true;
}

/**
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 */

const INNER_HTML$8 = /* html */ `
<album-list init="ground" fixed></album-list>
`;
const INNER_STYLE$8 = /* css */ `
album-list {
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;

  --animation-delay: 0.3s;
  --animation-duration: 1.3s;
}
`;

class AlbumGroundElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML$8;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE$8;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('album-ground', this);
  }

  get albumId() {
    return this._albumId;
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    const store = getSatchelStore();
    /** @private */
    this._albumId = getGroundAlbumId(store);

    /** @private */
    this.albumList = shadowRoot.querySelector('album-list');

    /** @private */
    this.onAlbumListChange = this.onAlbumListChange.bind(this);
    /** @private */
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  /** @protected */
  connectedCallback() {
    document.addEventListener('mouseup', this.onMouseUp);
    this.albumList.addEventListener('change', this.onAlbumListChange);
  }

  /** @protected */
  disconnectedCallback() {
    document.removeEventListener('mouseup', this.onMouseUp);
    this.albumList.removeEventListener('change', this.onAlbumListChange);
  }

  /** @private */
  onAlbumListChange(e) {
    const { created } = e.detail;
    if (created && created.length > 0) {
      // Scroll to new items.
      let firstElement = created[0];
      let rect = firstElement.getBoundingClientRect();
      this.scrollTo(rect.x + rect.width, rect.y + rect.height);
    }
  }

  /** @private */
  onMouseUp(e) {
    const cursor = getCursor();
    if (cursor.putDownInGround(e.clientX, e.clientY)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
}
AlbumGroundElement.define();

/**
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 */

const INNER_HTML$7 = /* html */ `
<fieldset>
  <legend></legend>
  <album-list></album-list>
</fieldset>
`;
const INNER_STYLE$7 = /* css */ `
:host {
  display: inline-block;
  min-width: 2em;
  min-height: 6em;
  text-align: left;
  vertical-align: top;
}
fieldset {
  position: relative;
  width: calc(100% - 1em);
  height: calc(100% - 1em);
  max-width: 20em;
  overflow-y: auto;
  border: 0.5em dashed #333333;
  padding: 2em 1em;
  scroll-behavior: smooth;
  text-align: center;
}
:host([mini]) fieldset {
  padding: 0;
}
:host([mini]) legend {
  display: none;
}
album-list {
  text-align: center;
}
`;

class AlbumSpaceElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML$7;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE$7;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('album-space', this);
  }

  get albumId() {
    return this.albumList.getAttribute('albumid');
  }

  set albumId(value) {
    this.albumList.setAttribute('albumid', value);
  }

  get init() {
    return this.albumList.getAttribute('init');
  }

  set init(value) {
    this.albumList.setAttribute('init', value);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this.container = shadowRoot.querySelector('fieldset');
    /** @private */
    this.containerTitle = shadowRoot.querySelector('legend');

    /** @private */
    this.albumList = shadowRoot.querySelector('album-list');

    /** @private */
    this.onMouseUp = this.onMouseUp.bind(this);
    /** @private */
    this.onAlbumListChange = this.onAlbumListChange.bind(this);
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'albumId');
    upgradeProperty(this, 'init');

    this.container.addEventListener('mouseup', this.onMouseUp);
    this.albumList.addEventListener('change', this.onAlbumListChange);
  }

  /** @protected */
  disconnectedCallback() {
    this.albumList.removeEventListener('change', this.onAlbumListChange);
    this.container.removeEventListener('mouseup', this.onMouseUp);
  }

  /** @private */
  onAlbumListChange(e) {
    const store = getSatchelStore();
    const album = getInvInStore(store, e.detail.albumId);
    // Update name
    const name = album.displayName;
    this.containerTitle.textContent = name;
  }

  /** @private */
  onMouseUp(e) {
    const cursor = getCursor();
    const store = getSatchelStore();
    const albumId = this.albumId;
    if (!isInvInStore(store, albumId)) {
      return;
    }
    if (cursor.putDownInAlbum(albumId)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
}
AlbumSpaceElement.define();

/**
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 * @typedef {import('../../satchel/inv/Inv.js').InvId} InvId
 * @typedef {import('../../store/SatchelStore.js').SatchelStore} Store
 */

const INNER_HTML$6 = /* html */ `
<section class="root">
  <h2></h2>
  <div class="container grid flattop">
    <p class="itemList"></p>
  </div>
</section>
`;

const INNER_STYLE$6 = /* css */`
:host {
  display: inline-block;

  --background-color: var(--satchel-background-color);
  --outline-color: var(--satchel-outline-color);
  --title-color: var(--satchel-title-color);
  --grid-color: var(--satchel-grid-color);

  --container-width: 1;
  --container-height: 1;
  --item-unit-size: ${DEFAULT_ITEM_UNIT_SIZE}px;
}
.root {
  position: relative;
  display: inline-block;
  width: calc(var(--container-width) * var(--item-unit-size));
  margin: 0;
  margin-right: 0.5em;
  margin-bottom: 0.5em;
}
.root.topmargin {
  margin-top: 2em;
}
h2 {
  position: absolute;
  top: 2rem;
  left: 0;
  right: 0;
  font-size: 0.9rem;
  padding-bottom: 2rem;
  margin: 0;
  overflow: hidden;
  text-overflow: clip;
  border-radius: 1em;
  text-align: center;
  color: white;
  background-color: var(--title-color);
  transform: translateY(-100%);
  box-shadow: 0.4rem 0.4rem 0 0 var(--outline-color);
}
.hidden {
  visibility: hidden;
}
.container {
  position: relative;
  width: 100%;
  height: calc(var(--container-height) * var(--item-unit-size));
  background-color: var(--background-color);
  border-radius: 1rem;
  box-shadow: 0.4rem 0.4rem 0 0 var(--outline-color);
  overflow: hidden;
}
.container.flattop {
  border-top-right-radius: 0rem;
  border-top-left-radius: 0rem;
}
.grid {
  background-size: var(--item-unit-size) var(--item-unit-size);
  background-position: -1px -1px;
  background-image:
    linear-gradient(to right, var(--grid-color), transparent 1px),
    linear-gradient(to bottom, var(--grid-color), transparent 1px);
}
`;

/**
 * - init - create a new inventory on add
 * - fixed - force single unit size
 * - temp - delete the inventory on remove
 * - noinput - no adding items
 * - nooutput - no removing items
 * - copyoutput - only copy items on remove (does not actually remove)
 */
class InvGridElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML$6;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE$6;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('inv-grid', this);
  }

  static get observedAttributes() {
    return ['invid'];
  }

  get invId() {
    return this._invId;
  }

  set invId(value) {
    this.setAttribute('invid', value);
  }

  get init() {
    return this.getAttribute('init');
  }

  set init(value) {
    this.setAttribute('init', value);
  }

  get _container() {
    return this.innerContainer;
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this._invId = null;
    /** @private */
    this._invView = createInventoryView(this, null);

    /** @private */
    this.rootContainer = shadowRoot.querySelector('.root');
    /** @private */
    this.innerContainer = shadowRoot.querySelector('.container');
    /** @private */
    this.invHeader = shadowRoot.querySelector('h2');

    /** @private */
    this.onInventoryChange = this.onInventoryChange.bind(this);
    /** @private */
    this.onMouseUp = this.onMouseUp.bind(this);
    /** @private */
    this.onContextMenu = this.onContextMenu.bind(this);

    /** @private */
    this.updateItemList = useInternalInventoryItemList(shadowRoot.querySelector('.itemList'), this._invView);
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'invId');
    upgradeProperty(this, 'init');

    const store = getSatchelStore();
    const init = this.init;

    // Only start init once.
    let invId;
    if (init && init.startsWith('grid')) {
      let i = init.indexOf('x');
      let w = Number(init.substring(4, i)) || 1;
      let h = Number(init.substring(i + 1)) || 1;
      invId = uuid();
      createGridInvInStore(store, invId, w, h);
    } else if (init && init !== 'null') {
      throw new Error(`Unknown init type '${init}' for album-list.`);
    } else {
      // Only if not init, use invId attribute
      invId = this.invId;
    }
    this.internallyChangeInvId(store, invId);

    this.innerContainer.addEventListener('mouseup', this.onMouseUp);
    this.innerContainer.addEventListener('contextmenu', this.onContextMenu);
  }

  /** @protected */
  disconnectedCallback() {
    const store = getSatchelStore();
    const init = this.init;
    const invId = this._invId;
    this.internallyChangeInvId(store, null);

    // Only stop init if initialized.
    if (init) {
      const inventory = getInvInStore(store, invId);
      if (inventory) {
        deleteInvInStore(store, invId, inventory);
      }
    }

    this.innerContainer.removeEventListener('mouseup', this.onMouseUp);
    this.innerContainer.removeEventListener('contextmenu', this.onContextMenu);
  }

  /**
   * @protected
   * @param {string} attribute
   * @param {string} previous
   * @param {string} value
   */
  attributeChangedCallback(attribute, previous, value) {
    switch (attribute) {
      case 'invid':
        {
          if (value && this.init) {
            throw new Error(`Cannot set inv id '${value}' for init type '${this.init}' invs.`);
          }
          const store = getSatchelStore();
          this.internallyChangeInvId(store, value);
        }
        break;
    }
  }

  /**
   * @private
   * @param {Store} store
   * @param {InvId} newInvId
   */
  internallyChangeInvId(store, newInvId) {
    const prevInvId = this._invId;
    if (prevInvId !== newInvId) {
      this._invId = newInvId;
      if (prevInvId) {
        removeInventoryChangeListener(store, prevInvId, this.onInventoryChange);
      }
      if (newInvId) {
        this._invView.invId = newInvId;
        addInventoryChangeListener(store, newInvId, this.onInventoryChange);
        this.onInventoryChange(store, newInvId);
      }
    }
  }

  /**
   * @private
   * @param {Store} store
   * @param {InvId} invId
   */
  onInventoryChange(store, invId) {
    if (!isInvInStore(store, invId)) {
      // The inv has been deleted.
      this.style.setProperty('--container-width', '0');
      this.style.setProperty('--container-height', '0');
      return;
    }

    const temp = this.hasAttribute('temp');

    const inv = getInvInStore(store, invId);
    const invType = inv.type;
    if (invType !== 'grid') {
      throw new Error('Trying to display non-grid inventory with inv-grid.');
    }
    if (temp && isInventoryEmpty(store, invId)) {
      this.internallyChangeInvId(store, null);
      this.remove();
      deleteInvInStore(store, invId, inv);
      return;
    }

    // Set inv dimensions
    let invWidth = inv.width;
    let invHeight = inv.height;
    this.style.setProperty('--container-width', `${invWidth}`);
    this.style.setProperty('--container-height', `${invHeight}`);

    // Set display name
    const displayName = inv.displayName;
    const isDisplayName = Boolean(displayName);
    this.invHeader.textContent = displayName;
    this.invHeader.classList.toggle('hidden', !isDisplayName);
    this.rootContainer.classList.toggle('topmargin', isDisplayName);
    this.innerContainer.classList.toggle('flattop', isDisplayName);

    // Update items
    const [created, deleted] = this.updateItemList();
    this.dispatchEvent(
      new CustomEvent('change', {
        composed: true,
        bubbles: false,
        detail: {
          invId,
          created,
          deleted,
        },
      })
    );
  }

  /**
   * @private
   * @param {MouseEvent} e
   */
  onMouseUp(e) {
    if (e.button === 0) {
      return containerMouseUpCallback(e, this, DEFAULT_ITEM_UNIT_SIZE);
    }
  }

  /**
   * @private
   * @param {MouseEvent} e
   */
  onContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}
InvGridElement.define();

const INNER_HTML$5 = /* html */ `
<div class="container">
  <slot></slot>
</div>
`;
const INNER_STYLE$5 = /* css */ `
:host {
  --width: 10em;
  --height: 12em;
}
.container {
  position: fixed;
  padding: 0.5em;
  background-color: #444444;
  border-radius: 2em;
  border-top: 0.1em solid #666666;
  border-left: 0.1em solid #666666;
  border-right: 0.3em solid #666666;
  border-bottom: 0.3em solid #666666;
  width: var(--width);
  height: var(--height);
  z-index: 1;
  opacity: 1;
  transition: opacity 0.2s ease;
  overflow-y: auto;
}
.container:not(.visible) {
  visibility: hidden;
  opacity: 0;
}
.topleft {
  border-top-left-radius: 0;
}
.bottomleft {
  border-bottom-left-radius: 0;
}
.topright {
  border-top-right-radius: 0;
}
.bottomright {
  border-bottom-right-radius: 0;
}
`;

/**
 * @fires open
 * @fires close
 */
class ContextMenuElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML$5;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE$5;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('context-menu', this);
  }

  static get observedAttributes() {
    return ['open', 'x', 'y'];
  }

  get x() {
    return Number(this.getAttribute('x'));
  }

  set x(value) {
    this.setAttribute('x', String(value));
  }

  get y() {
    return Number(this.getAttribute('y'));
  }

  set y(value) {
    this.setAttribute('y', String(value));
  }

  get open() {
    return this.hasAttribute('open');
  }

  set open(value) {
    this.toggleAttribute('open', value);
  }

  get required() {
    return this.hasAttribute('required');
  }

  set required(value) {
    this.toggleAttribute('required', value);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this.containerElement = /** @type {HTMLElement} */ (shadowRoot.querySelector('.container'));

    /** @private */
    this.onOutside = this.onOutside.bind(this);
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'open');
    upgradeProperty(this, 'required');

    document.addEventListener('click', this.onOutside, true);
    document.addEventListener('contextmenu', this.onOutside, true);
  }

  /** @protected */
  disconnectedCallback() {
    document.removeEventListener('click', this.onOutside, true);
    document.removeEventListener('contextmenu', this.onOutside, true);
  }

  /**
   * @param attribute
   * @param previous
   * @param value
   * @protected
   */
  attributeChangedCallback(attribute, previous, value) {
    switch (attribute) {
      case 'open':
        {
          let result = value !== null;
          if (result) {
            this.performOpen();
          } else {
            this.performClose();
          }
        }
        break;
    }
  }

  /**
   * @private
   * @param {number} clientX
   * @param {number} clientY
   * @returns {ContextMenuElement}
   */
  setPosition(clientX, clientY) {
    const contextMenu = this.containerElement;
    const innerRect = contextMenu.getBoundingClientRect();
    const width = innerRect.width;
    const height = innerRect.height;
    const root = document.documentElement;
    const rootWidth = root.clientWidth;
    const rootHeight = root.clientHeight;
    let bottom = false;
    let right = false;
    if (rootHeight < clientY + height) {
      contextMenu.style.top = `${clientY - height}px`;
      bottom = true;
    } else {
      contextMenu.style.top = `${clientY}px`;
    }
    if (rootWidth < clientX + width) {
      contextMenu.style.left = `${clientX - width}px`;
      right = true;
    } else {
      contextMenu.style.left = `${clientX}px`;
    }
    contextMenu.classList.toggle('bottomleft', bottom && !right);
    contextMenu.classList.toggle('bottomright', bottom && right);
    contextMenu.classList.toggle('topleft', !bottom && !right);
    contextMenu.classList.toggle('topright', !bottom && right);
    return this;
  }

  /** @private */
  performOpen() {
    const contextMenu = this.containerElement;
    if (contextMenu.classList.contains('visible')) {
      return;
    }
    this.setPosition(this.x, this.y);
    contextMenu.classList.add('visible');
    this.dispatchEvent(
      new CustomEvent('open', {
        composed: true,
        bubbles: false,
      })
    );
  }

  /** @private */
  performClose() {
    const contextMenu = this.containerElement;
    if (!contextMenu.classList.contains('visible')) {
      return;
    }
    contextMenu.classList.remove('visible');
    this.dispatchEvent(
      new CustomEvent('close', {
        composed: true,
        bubbles: false,
      })
    );
  }

  /** @private */
  onOutside(e) {
    const contextMenu = this.containerElement;
    if (!contextMenu.classList.contains('visible')) {
      return;
    }
    if (this.required) {
      return;
    }
    const rect = contextMenu.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x > rect.right || x < rect.left || y > rect.bottom || y < rect.top) {
      this.open = false;
    }
  }
}
ContextMenuElement.define();

/**
 * @typedef {import('../invgrid/InvSocketElement.js').InvSocketElement} InvSocketElement
 * @typedef {import('../lib/ContextMenuElement.js').ContextMenuElement} ContextMenuElement
 * @typedef {import('../../satchel/item/Item.js').Item} Item
 */

const MAX_ITEM_WIDTH = 8;
const MAX_ITEM_HEIGHT = 8;

const INNER_HTML$4 = /* html */ `
<div class="rootContainer">
  <fieldset class="portraitContainer">
    <div class="foundrySocketContainer">
      <div class="foundryContainer">
        <icon-button id="actionExpand" icon="res/expandmore.svg" alt="expand" title="Morph Tools"></icon-button>
        <span id="foundryActions" class="hidden">
          <icon-button id="actionEnlarge" icon="res/enlarge.svg" alt="more" title="Enlarge"></icon-button>
          <icon-button id="actionShrink" icon="res/shrink.svg" alt="less" title="Shrink"></icon-button>
          <icon-button id="actionFlatten" icon="res/flatten.svg" alt="flat" title="Flatten"></icon-button>
          <icon-button id="actionFlattenRotated" icon="res/flatten.svg" alt="long" title="Elongate" style="transform: rotate(90deg);"></icon-button>
          <icon-button id="actionFit" icon="res/aspectratio.svg" alt="fit" title="Fit"></icon-button>
        </span>
      </div>
      <div class="socketXContainer">
        <div class="socketSpacing"></div>
        <div class="socketYContainer">
          <div class="socketSpacing"></div>
          <div class="socketContainer">
            <inv-socket id="socketInventory" init="inv" noedit></inv-socket>
          </div>
          <div class="socketSpacing">
            <input type="number" min="1" max="${MAX_ITEM_WIDTH}" id="itemWidth">
          </div>
        </div>
        <div class="socketSpacing">
          <input type="number" min="1" max="${MAX_ITEM_HEIGHT}" id="itemHeight">
        </div>
      </div>
      <div class="foundrySocketMargin"></div>
    </div>
    <p class="styleContainer">
      <icon-button id="actionBackground" icon="res/palette.svg" alt="color" title="Background"></icon-button>
      <icon-button id="actionImage" icon="res/image.svg" alt="image" title="Image"></icon-button>
    </p>
  </fieldset>
  <fieldset class="detailContainer">
    <p class="titleContainer">
      <span id="itemTitleContainer">
        <input type="text" id="itemTitle" placeholder="Item">
      </span>
      <span id="itemStackSizeContainer">
        <span id="preStackSize">⨯</span><input type="number" id="itemStackSize" placeholder="--">
      </span>
    </p>
    <p class="textContainer">
      <textarea id="itemDesc" placeholder="Notes..."></textarea>
      <slot name="actions" class="actionContainer"></slot>
    </p>
  </fieldset>
</div>

<context-menu id="galleryContextMenu">
  <div class="galleryContainer">
    <div id="galleryImages"></div>
    <textarea id="itemImage"></textarea>
  </div>
</context-menu>

<context-menu id="paletteContextMenu">
  <div class="paletteContainer">
    <div id="paletteColors">
      <button style="background-color: #ffff00;" data-color="#ffff00"></button>
      <button style="background-color: #80ff00;" data-color="#80ff00"></button>
      <button style="background-color: #00ffff;" data-color="#00ffff"></button>

      <button style="background-color: #ff8000;" data-color="#ff8000"></button>
      <button style="background-color: #ff00ff;" data-color="#ff00ff"></button>
      <button style="background-color: #9900ff;" data-color="#9900ff"></button>
      
      <button style="background-color: #ff0000;" data-color="#ff0000"></button>
      <button style="background-color: #ffffff;" data-color="#ffffff"></button>
      <button style="background-color: #000000; color: #ffffff;" data-color="#000000">⊘</button>
    </div>
    <input type="color" id="itemBackground">
  </div>
</context-menu>
`;
const INNER_STYLE$4 = /* css */ `
:host {
  text-align: center;
  height: 100%;
}

textarea {
  flex: 1;
  outline: none;
  border: none;
  background: none;
  color: var(--foreground-color);
  resize: none;
}

p {
  padding: 0;
  margin: 0;
}

img {
  height: 100%;
}

.rootContainer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.portraitContainer {
  flex: 2;
  position: relative;
  display: flex;
  flex-direction: column;
  border: none;
}
.detailContainer {
  flex: 2;
  position: relative;
  display: flex;
  flex-direction: column;
  margin-top: 0.5em;
  border: none;
}
.detailContainer:disabled {
  display: none;
}

.titleContainer {
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 0.2em solid var(--foreground-color);
  margin-bottom: 0.5em;
}
.textContainer {
  flex: 1;
  display: flex;
  flex-direction: row;
}
.styleContainer {
  position: absolute;
  right: 0.7em;
  bottom: 0;
  display: flex;
  flex-direction: column;
}
.styleContainer icon-button {
  width: 2em;
  height: 2em;
}

.foundrySocketContainer {
  flex: 1;
  display: flex;
  flex-direction: row;
}
.foundrySocketMargin {
  width: 1em;
}

.foundryContainer {
  display: flex;
  flex-direction: column;
}
.foundryContainer icon-button {
  width: 2em;
  height: 2em;
  margin: 0.2em 0;
}
.foundryContainer icon-button[disabled] {
  visibility: hidden;
}
#foundryActions {
  display: flex;
  flex-direction: column;
}
.hidden {
  visibility: hidden;
}

.socketContainer {
  max-width: 10em;
  max-height: 10em;
  overflow: auto;
}
.socketSpacing {
  flex: 1;
}
.socketXContainer {
  flex: 1;
  display: flex;
  flex-direction: row;
  text-align: left;
  align-items: center;
}
.socketYContainer {
  display: flex;
  flex-direction: column;
  text-align: center;
  align-items: center;
}

#itemDesc {
  min-height: 10em;
}

#itemWidth, #itemHeight {
  color: var(--foreground-color);
  width: 2.5em;
  background: none;
  border: none;
}
#itemWidth:disabled, #itemHeight:disabled {
  visibility: hidden;
}
#itemWidth {
  z-index: 1;
  transform: translateX(30%);
}
#itemHeight {
  z-index: 1;
  transform: translateY(-80%);
}

.rootContainer[disabled] #actionImage,
.rootContainer[disabled] #actionBackground {
  visibility: hidden;
}

#preStackSize {
  display: inline-block;
  border: none;
  margin-left: 0.5em;
  font-size: 1.2em;
}
#itemStackSize {
  font-family: serif;
  font-size: 1.2em;
  width: 2.5em;
  height: 100%;
  border: none;
  background-color: transparent;
  color: var(--foreground-color);
  margin: 0;
}
#itemTitleContainer {
  flex: 1;
  height: 100%;
}
#itemStackSizeContainer {
  flex: 0;
  white-space: nowrap;
  height: 100%;
}

#itemTitle {
  width: 100%;
  height: 100%;
  display: inline-block;
  font-family: serif;
  font-size: 1.2em;
  border: none;
  background-color: transparent;
  color: var(--foreground-color);
}

.actionContainer {
  display: flex;
  flex-direction: column;
}

.actionContainer::slotted(*) {
  width: 2em;
  height: 2em;
}

.galleryContainer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
#galleryImages {
  flex: 3;
  text-align: left;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(3em, 1fr));
}
#galleryImages img {
  width: 100%;
  height: 100%;
  max-width: 3em;
  max-height: 3em;
  margin: 0 0.1em;
  object-fit: contain;
}
#galleryImages img:hover {
  outline: 0.1em solid #666666;
  background-color: #666666;
  cursor: pointer;
}
#itemImage {
  flex: 1;
  min-height: 1em;
  border: none;
  border-top: 0.2em solid var(--foreground-color);
  resize: none;
}

.paletteContainer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
#paletteColors {
  flex: 3;
  text-align: left;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(3em, 1fr));
}
#paletteColors button {
  width: 2.5em;
  height: 2.5em;
  margin: 0.25em;
  border-radius: 0.5em;
}
#paletteColors button:hover {
  cursor: pointer;
}
#itemBackground {
  flex: 1;
  width: 100%;
}
#itemBackground:disabled {
  visibility: hidden;
}
`;

class ItemEditorElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML$4;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE$4;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('item-editor', this);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this.rootContainer = shadowRoot.querySelector('.rootContainer');
    /** @private */
    this.portraitContainer = shadowRoot.querySelector('.portraitContainer');
    /** @private */
    this.detailContainer = shadowRoot.querySelector('.detailContainer');
    /** @private */
    this.galleryContextMenu = /** @type {ContextMenuElement} */ (
      shadowRoot.querySelector('#galleryContextMenu')
    );
    /** @private */
    this.galleryImages = shadowRoot.querySelector('#galleryImages');
    /** @private */
    this.foundryActions = shadowRoot.querySelector('#foundryActions');
    /** @private */
    this.paletteContextMenu = /** @type {ContextMenuElement} */ (
      shadowRoot.querySelector('#paletteContextMenu')
    );
    /** @private */
    this.paletteColors = shadowRoot.querySelectorAll('#paletteColors > button');

    /**
     * @private
     * @type {InvSocketElement}
     */
    this.socket = shadowRoot.querySelector('inv-socket');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemImage = shadowRoot.querySelector('#itemImage');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemStackSize = shadowRoot.querySelector('#itemStackSize');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemTitle = shadowRoot.querySelector('#itemTitle');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemDesc = shadowRoot.querySelector('#itemDesc');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemBackground = shadowRoot.querySelector('#itemBackground');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemWidth = shadowRoot.querySelector('#itemWidth');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemHeight = shadowRoot.querySelector('#itemHeight');
    /** @private */
    this.actionEnlarge = shadowRoot.querySelector('#actionEnlarge');
    /** @private */
    this.actionShrink = shadowRoot.querySelector('#actionShrink');
    /** @private */
    this.actionFlatten = shadowRoot.querySelector('#actionFlatten');
    /** @private */
    this.actionFlattenRotated = shadowRoot.querySelector('#actionFlattenRotated');
    /** @private */
    this.actionFit = shadowRoot.querySelector('#actionFit');
    /** @private */
    this.actionImage = shadowRoot.querySelector('#actionImage');
    /** @private */
    this.actionExpand = shadowRoot.querySelector('#actionExpand');
    /** @private */
    this.actionBackground = shadowRoot.querySelector('#actionBackground');

    /** @private */
    this.onItemTitle = this.onItemTitle.bind(this);
    /** @private */
    this.onItemDesc = this.onItemDesc.bind(this);
    /** @private */
    this.onItemStackSize = this.onItemStackSize.bind(this);
    /** @private */
    this.onItemImage = this.onItemImage.bind(this);
    /** @private */
    this.onItemBackground = this.onItemBackground.bind(this);
    /** @private */
    this.onClickSelectAll = this.onClickSelectAll.bind(this);
    /** @private */
    this.onActionEnlarge = this.onActionEnlarge.bind(this);
    /** @private */
    this.onActionShrink = this.onActionShrink.bind(this);
    /** @private */
    this.onActionFlatten = this.onActionFlatten.bind(this);
    /** @private */
    this.onActionFlattenRotated = this.onActionFlattenRotated.bind(this);
    /** @private */
    this.onActionFit = this.onActionFit.bind(this);
    /** @private */
    this.onActionImage = this.onActionImage.bind(this);
    /** @private */
    this.onFoundryAlbumChange = this.onFoundryAlbumChange.bind(this);
    /** @private */
    this.onFoundryAlbumImageClick = this.onFoundryAlbumImageClick.bind(this);
    /** @private */
    this.onItemWidth = this.onItemWidth.bind(this);
    /** @private */
    this.onItemHeight = this.onItemHeight.bind(this);
    /** @private */
    this.onActionExpand = this.onActionExpand.bind(this);
    /** @private */
    this.onActionBackground = this.onActionBackground.bind(this);
    /** @private */
    this.onActionColor = this.onActionColor.bind(this);

    /** @private */
    this.onSocketInventoryChange = this.onSocketInventoryChange.bind(this);
    /** @private */
    this.onItemDrop = this.onItemDrop.bind(this);
  }

  /** @protected */
  connectedCallback() {
    const editable = this.hasAttribute('editable');
    this.socket.toggleAttribute('noinput', !editable);
    this.socket.toggleAttribute('nooutput', !editable);

    this.itemTitle.addEventListener('input', this.onItemTitle);
    this.itemDesc.addEventListener('input', this.onItemDesc);
    this.itemStackSize.addEventListener('change', this.onItemStackSize);
    this.itemImage.addEventListener('change', this.onItemImage);
    this.itemImage.addEventListener('click', this.onClickSelectAll);
    this.itemBackground.addEventListener('input', this.onItemBackground);
    this.actionEnlarge.addEventListener('click', this.onActionEnlarge);
    this.actionShrink.addEventListener('click', this.onActionShrink);
    this.actionFlatten.addEventListener('click', this.onActionFlatten);
    this.actionFlattenRotated.addEventListener('click', this.onActionFlattenRotated);
    this.actionFit.addEventListener('click', this.onActionFit);
    this.actionImage.addEventListener('click', this.onActionImage);
    this.itemWidth.addEventListener('change', this.onItemWidth);
    this.itemHeight.addEventListener('change', this.onItemHeight);
    this.portraitContainer.addEventListener('mouseup', this.onItemDrop);
    this.actionExpand.addEventListener('click', this.onActionExpand);
    this.actionBackground.addEventListener('click', this.onActionBackground);
    this.paletteColors.forEach((e) => {
      e.addEventListener('click', this.onActionColor);
    });

    const store = getSatchelStore();
    addInventoryChangeListener(store, this.socket.invId, this.onSocketInventoryChange);
    addInventoryChangeListener(store, getFoundryAlbumId(store), this.onFoundryAlbumChange);

    this.disableInputs(true);
  }

  /** @protected */
  disconnectedCallback() {
    this.itemTitle.removeEventListener('change', this.onItemTitle);
    this.itemDesc.removeEventListener('input', this.onItemDesc);
    this.itemStackSize.removeEventListener('change', this.onItemStackSize);
    this.itemImage.removeEventListener('change', this.onItemImage);
    this.itemImage.removeEventListener('click', this.onClickSelectAll);
    this.itemBackground.removeEventListener('input', this.onItemBackground);
    this.actionEnlarge.removeEventListener('click', this.onActionEnlarge);
    this.actionShrink.removeEventListener('click', this.onActionShrink);
    this.actionFlatten.removeEventListener('click', this.onActionFlatten);
    this.actionFlattenRotated.removeEventListener('click', this.onActionFlattenRotated);
    this.actionFit.removeEventListener('click', this.onActionFit);
    this.actionImage.removeEventListener('click', this.onActionImage);
    this.itemWidth.removeEventListener('change', this.onItemWidth);
    this.itemHeight.removeEventListener('change', this.onItemHeight);
    this.portraitContainer.removeEventListener('mouseup', this.onItemDrop);
    this.actionExpand.removeEventListener('click', this.onActionExpand);
    this.actionBackground.removeEventListener('click', this.onActionBackground);
    this.paletteColors.forEach((e) => {
      e.removeEventListener('click', this.onActionColor);
    });

    const store = getSatchelStore();
    removeInventoryChangeListener(store, this.socket.invId, this.onSocketInventoryChange);
    removeInventoryChangeListener(store, getFoundryAlbumId(store), this.onFoundryAlbumChange);
  }

  grabDefaultFocus() {
    this.itemDesc.focus();
  }

  clearSocketedItem() {
    const store = getSatchelStore();
    const socketInvId = this.socket.invId;
    clearItemsInInventory(store, socketInvId);
    this.setupSocketInventory(false);
  }

  putSocketedItem(item, resizable = false) {
    const store = getSatchelStore();
    const socketInvId = this.socket.invId;
    if (item && !isInventoryEmpty(store, socketInvId)) {
      const item = getItemAtSlotIndex(store, socketInvId, 0);
      clearItemsInInventory(store, socketInvId);
      const clientRect = this.getBoundingClientRect();
      dropFallingItem(item, clientRect.x + clientRect.width / 2, clientRect.y + clientRect.height / 2);
    }
    if (item) {
      removeInventoryChangeListener(store, socketInvId, this.onSocketInventoryChange);
      addItemToInventory(store, socketInvId, item, 0, 0);
      addInventoryChangeListener(store, socketInvId, this.onSocketInventoryChange);
    }
    this.setupSocketInventory(resizable);
  }

  getSocketedItem() {
    const store = getSatchelStore();
    return getItemAtSlotIndex(store, this.socket.invId, 0);
  }

  /** @private */
  onSocketInventoryChange() {
    if (this.hasAttribute('editable')) {
      this.setupSocketInventory(true);
    }
  }

  /** @private */
  setupSocketInventory(resizable) {
    const item = this.getSocketedItem();
    if (!item) {
      // Only save items that have a custom image
      if (this.itemImage.value) {
        let currentItem = this.createItemFromInputs();
        if (shouldSaveItemToFoundryAlbum(currentItem)) {
          saveItemToFoundryAlbum(currentItem);
        }
      }
      this.disableInputs(true);
      this.clearInputs();
      return;
    }
    this.disableInputs(false);
    this.resetInputs(item);
    this.resetSizeInputs(resizable);
    const content = this.itemDesc.value;
    if (!this.contains(document.activeElement)) {
      this.itemDesc.focus({ preventScroll: true });
      this.itemDesc.setSelectionRange(content.length, content.length);
      this.itemDesc.scrollTo({ top: 0 });
    }
  }

  /** @private */
  disableInputs(force) {
    this.rootContainer.toggleAttribute('disabled', force);
    this.itemImage.toggleAttribute('disabled', force);
    this.itemBackground.toggleAttribute('disabled', force);
    this.itemWidth.toggleAttribute('disabled', force);
    this.itemHeight.toggleAttribute('disabled', force);
    this.actionEnlarge.toggleAttribute('disabled', force);
    this.actionShrink.toggleAttribute('disabled', force);
    this.actionFlatten.toggleAttribute('disabled', force);
    this.actionFlattenRotated.toggleAttribute('disabled', force);
    this.actionFit.toggleAttribute('disabled', force);
    this.detailContainer.toggleAttribute('disabled', force);
    this.actionExpand.toggleAttribute('disabled', force);
    this.actionBackground.toggleAttribute('disabled', force);
    this.actionImage.toggleAttribute('disabled', force);
  }

  /** @private */
  clearInputs() {
    this.itemTitle.value = '';
    this.itemDesc.value = '';
    this.itemWidth.value = '';
    this.itemHeight.value = '';
    this.itemBackground.value = '#000000';
    this.itemStackSize.value = '';
    this.itemImage.value = '';
    this.itemImage.placeholder = '';
    this.galleryContextMenu.toggleAttribute('open', false);
    this.paletteContextMenu.toggleAttribute('open', false);
  }

  /**
   * @private
   * @param {Item} item
   */
  resetInputs(item) {
    this.itemTitle.value = item.displayName;
    this.itemDesc.value = item.description;
    this.itemWidth.value = String(item.width);
    this.itemHeight.value = String(item.height);
    this.itemBackground.value = item.background || '#000000';
    if (item.stackSize < 0) {
      this.itemStackSize.value = '';
    } else {
      this.itemStackSize.value = String(item.stackSize);
    }
    const defaultImgSrc = getDefaultImageSourceByDimensions(item.width, item.height, item.stackSize);
    if (defaultImgSrc !== item.imgSrc) {
      this.itemImage.value = item.imgSrc;
    } else {
      this.itemImage.value = '';
    }
    this.itemImage.placeholder = 'Paste image url here...';
    this.galleryContextMenu.toggleAttribute('open', false);
    this.paletteContextMenu.toggleAttribute('open', false);
  }

  /** @private */
  resetSizeInputs(resizable) {
    this.itemWidth.toggleAttribute('disabled', !resizable);
    this.itemHeight.toggleAttribute('disabled', !resizable);
    this.actionEnlarge.toggleAttribute('disabled', !resizable);
    this.actionShrink.toggleAttribute('disabled', !resizable);
    this.actionFlatten.toggleAttribute('disabled', !resizable);
    this.actionFlattenRotated.toggleAttribute('disabled', !resizable);
    this.actionFit.toggleAttribute('disabled', !resizable);
    this.actionExpand.toggleAttribute('disabled', !resizable);
  }

  /**
   * @private
   * @param {*} store
   * @param {Item} item
   * @param {number} width
   * @param {number} height
   */
  updateItemSize(store, item, width, height) {
    width = Math.min(Math.max(width, 1), MAX_ITEM_WIDTH);
    height = Math.min(Math.max(height, 1), MAX_ITEM_HEIGHT);
    this.itemWidth.value = String(width);
    this.itemHeight.value = String(height);
    item.width = width;
    item.height = height;
    // Change image based on size
    const defaultImgSrc = getDefaultImageSourceByDimensions(item.width, item.height, item.stackSize);
    if (!this.itemImage.value) {
      item.imgSrc = defaultImgSrc;
    }
    dispatchItemChange(store, item.itemId);
    dispatchInventoryChange(store, this.socket.invId);
    playSound('sizeItem');
  }

  /** @private */
  onActionEnlarge() {
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const oldWidth = socketItem.width;
    const oldHeight = socketItem.height;
    let newWidth = oldWidth + 1;
    let newHeight = oldHeight + 1;
    if (newWidth === newHeight && newWidth !== 2) {
      newWidth += 1;
      newHeight += 1;
    }
    this.updateItemSize(store, socketItem, newWidth, newHeight);
  }

  /** @private */
  onActionShrink() {
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const oldWidth = socketItem.width;
    const oldHeight = socketItem.height;
    let newWidth = oldWidth - 1;
    let newHeight = oldHeight - 1;
    if (newWidth === newHeight && newWidth !== 1) {
      newWidth -= 1;
      newHeight -= 1;
    }
    this.updateItemSize(store, socketItem, newWidth, newHeight);
  }

  /** @private */
  onActionFlatten() {
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const oldWidth = socketItem.width;
    const oldHeight = socketItem.height;
    let newWidth;
    let newHeight;
    if (oldHeight > oldWidth) {
      // Rotate it
      newWidth = oldHeight;
      newHeight = oldWidth;
    } else if (oldHeight === 1) {
      if (oldWidth === 1) {
        // Flat & Tiny
        newWidth = 2;
        newHeight = 1;
      } else {
        // No change
        return;
      }
    } else {
      // Flatten it
      newWidth = oldWidth + 1;
      newHeight = Math.ceil(oldHeight / 2);
      if (newWidth === newHeight && newWidth !== 1) {
        newWidth -= 1;
        newHeight -= 1;
      }
    }
    this.updateItemSize(store, socketItem, newWidth, newHeight);
  }

  /** @private */
  onActionFlattenRotated() {
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const oldWidth = socketItem.width;
    const oldHeight = socketItem.height;
    let newWidth;
    let newHeight;
    if (oldWidth > oldHeight) {
      // Rotate it
      newWidth = oldHeight;
      newHeight = oldWidth;
    } else if (oldWidth === 1) {
      if (oldHeight === 1) {
        // Flat & Tiny
        newWidth = 1;
        newHeight = 2;
      } else {
        // No change
        return;
      }
    } else {
      // Flatten it
      newWidth = Math.ceil(oldWidth / 2);
      newHeight = oldHeight + 1;
      if (newWidth === newHeight && newHeight !== 1) {
        newWidth -= 1;
        newHeight -= 1;
      }
    }
    this.updateItemSize(store, socketItem, newWidth, newHeight);
  }

  /** @private */
  onActionFit() {
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const oldWidth = socketItem.width;
    const oldHeight = socketItem.height;
    // NOTE: Finds the nearest square size that is even (min 1)
    let newSize = Math.max(1, Math.floor(Math.floor((oldWidth + oldHeight) / 2) / 2) * 2);
    this.updateItemSize(store, socketItem, newSize, newSize);
  }

  /** @private */
  onActionImage(e) {
    const contextMenu = this.galleryContextMenu;
    let rect = e.target.getBoundingClientRect();
    let x = rect.x + rect.width / 2;
    let y = rect.y + rect.height / 2;
    contextMenu.x = x;
    contextMenu.y = y;
    contextMenu.toggleAttribute('open', true);
    this.onFoundryAlbumChange();
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  /** @private */
  onFoundryAlbumImageClick(e) {
    const src = e.target.getAttribute('data-imgsrc');
    this.itemImage.value = src;
    this.onItemImage();
  }

  /** @private */
  onFoundryAlbumChange() {
    const store = getSatchelStore();
    if (!hasFoundryAlbum(store)) {
      return;
    }
    const albumId = getFoundryAlbumId(store);
    const items = getItemsInInv(store, albumId);
    const list = new Set([
      'res/images/potion.png',
      'res/images/blade.png',
      'res/images/scroll.png',
      ...items.map((item) => item.imgSrc).filter(Boolean),
    ]);
    const create = (key) => {
      let element = document.createElement('img');
      element.setAttribute('data-imgsrc', key);
      element.src = key;
      element.alt = key;
      element.title = key;
      element.addEventListener('click', this.onFoundryAlbumImageClick);
      return element;
    };
    const destroy = (key, element) => {
      element.removeEventListener('click', this.onFoundryAlbumImageClick);
    };
    updateList(this.galleryImages, list, create, destroy);
  }

  /** @private */
  onClickSelectAll(e) {
    e.target.select();
  }

  /** @private */
  onItemWidth() {
    const width = this.parseItemWidth();
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    this.updateItemSize(store, socketItem, width, socketItem.height);
  }

  /** @private */
  onItemHeight() {
    const height = this.parseItemHeight();
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    this.updateItemSize(store, socketItem, socketItem.width, height);
  }

  /** @private */
  onItemBackground() {
    const background = this.parseItemBackground();
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    socketItem.background = background;
    dispatchItemChange(store, socketItem.itemId);
  }

  /** @private */
  onItemImage() {
    const imgSrc = this.parseItemImage();
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const defaultImgSrc = getDefaultImageSourceByDimensions(
      socketItem.width,
      socketItem.height,
      socketItem.stackSize
    );
    socketItem.imgSrc = imgSrc || defaultImgSrc;
    dispatchItemChange(store, socketItem.itemId);
  }

  /** @private */
  onItemStackSize() {
    const stackSize = this.parseItemStackSize();
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    socketItem.stackSize = stackSize;
    dispatchItemChange(store, socketItem.itemId);
    if (stackSize < 0) {
      this.itemStackSize.value = '';
    }
  }

  /** @private */
  onItemTitle() {
    const title = this.parseItemTitle();
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    socketItem.displayName = title;
    dispatchItemChange(store, socketItem.itemId);
  }

  /** @private */
  onItemDesc() {
    const desc = this.parseItemDesc();
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    socketItem.description = desc;
    dispatchItemChange(store, socketItem.itemId);
  }

  /** @private */
  onItemDrop(e) {
    if (!this.hasAttribute('editable')) {
      return;
    }
    // TODO: Shift key needed here. But where to poll?
    let cursor = getCursor();
    let result = cursor.putDown(this.socket.invId, 0, 0, true, true, false);
    if (result) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  /** @private */
  onActionExpand() {
    let isMore = this.actionExpand.getAttribute('icon') === 'res/expandmore.svg';
    if (isMore) {
      this.actionExpand.setAttribute('icon', 'res/expandless.svg');
      this.foundryActions.classList.toggle('hidden', false);
    } else {
      this.actionExpand.setAttribute('icon', 'res/expandmore.svg');
      this.foundryActions.classList.toggle('hidden', true);
    }
  }

  /** @private */
  onActionBackground(e) {
    const contextMenu = this.paletteContextMenu;
    let rect = e.target.getBoundingClientRect();
    let x = rect.x + rect.width / 2;
    let y = rect.y + rect.height / 2;
    contextMenu.x = x;
    contextMenu.y = y;
    contextMenu.toggleAttribute('open', true);
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  /** @private */
  onActionColor(e) {
    let colorValue = e.target.getAttribute('data-color');
    this.itemBackground.value = colorValue;
    this.onItemBackground();
  }

  /** @private */
  parseItemWidth() {
    return Math.min(Math.max(Number(this.itemWidth.value) || 1, 1), MAX_ITEM_WIDTH);
  }

  /** @private */
  parseItemHeight() {
    return Math.min(Math.max(Number(this.itemHeight.value) || 1, 1), MAX_ITEM_HEIGHT);
  }

  /** @private */
  parseItemBackground() {
    const background = this.itemBackground.value;
    if (background === '#000000') {
      return '';
    }
    return background;
  }

  /** @private */
  parseItemImage() {
    return this.itemImage.value;
  }

  /** @private */
  parseItemStackSize() {
    let stackSize;
    try {
      stackSize = Number.parseInt(this.itemStackSize.value);
      if (!Number.isSafeInteger(stackSize) || stackSize < 0) {
        return -1;
      }
    } catch (e) {
      return -1;
    }
    return stackSize;
  }

  /** @private */
  parseItemTitle() {
    return this.itemTitle.value.trim();
  }

  /** @private */
  parseItemDesc() {
    return this.itemDesc.value;
  }

  /** @private */
  createItemFromInputs() {
    const width = this.parseItemWidth();
    const height = this.parseItemHeight();
    const stackSize = this.parseItemStackSize();
    const background = this.parseItemBackground();
    const image = this.parseItemImage() || getDefaultImageSourceByDimensions(width, height);
    const title = this.parseItemTitle();
    const desc = this.parseItemDesc();
    return new ItemBuilder()
      .fromDefault()
      .width(width)
      .height(height)
      .stackSize(stackSize)
      .background(background)
      .imageSrc(image)
      .displayName(title)
      .description(desc)
      .build();
  }
}
ItemEditorElement.define();

function getDefaultImageSourceByDimensions(width, height, stackSize) {
  if (width < height) {
    return 'res/images/blade.png';
  } else if (width > height) {
    return 'res/images/scroll.png';
  } else {
    return 'res/images/potion.png';
  }
}

const CURSOR_CONTEXT = {};

function getCursorContext() {
  return CURSOR_CONTEXT;
}

function openFoundry(item = undefined) {
  let editorContainer = document.querySelector('.editorContainer');
  let wasOpen = editorContainer.classList.contains('open');
  editorContainer.classList.toggle('open', true);
  /** @type {import('../../components/itemeditor/ItemEditorElement.js').ItemEditorElement} */
  let itemEditor = document.querySelector('#itemEditor');
  itemEditor.putSocketedItem(item, true);
  if (!wasOpen) {
    playSound('openAnvil');
  }
}

function closeFoundry() {
  let editorContainer = document.querySelector('.editorContainer');
  let wasOpen = editorContainer.classList.contains('open');
  editorContainer.classList.toggle('open', false);
  if (wasOpen) {
    playSound('closeAnvil');
  }
}

function isFoundryOpen() {
  let editorContainer = document.querySelector('.editorContainer');
  return editorContainer.classList.contains('open');
}

function copyFoundry() {
  /** @type {import('../../components/itemeditor/ItemEditorElement.js').ItemEditorElement} */
  let itemEditor = document.querySelector('#itemEditor');
  let item = itemEditor.getSocketedItem();
  if (item) {
    return copyItem(item);
  } else {
    return null;
  }
}

function clearFoundry() {
  /** @type {import('../../components/itemeditor/ItemEditorElement.js').ItemEditorElement} */
  let itemEditor = document.querySelector('#itemEditor');
  let item = itemEditor.getSocketedItem();
  if (item) {
    itemEditor.clearSocketedItem();
    return item;
  } else {
    return null;
  }
}

/**
 * @typedef {import('../../peerful/PeerfulConnection.js').PeerfulConnection} PeerfulConnection
 */

/**
 *
 * @typedef LocalClient
 * @property {Array<RemoteServer>} remotes
 *
 * @typedef LocalServer
 * @property {Array<RemoteClient>} remotes
 *
 * @typedef RemoteClient
 * @property {PeerfulConnection} connection
 *
 * @typedef RemoteServer
 * @property {PeerfulConnection} connection
 */
class ActivityBase {
  /**
   * @abstract
   * @param {LocalServer} localServer
   */
  static onLocalServerCreated(localServer) {}
  /**
   * @abstract
   * @param {LocalClient} localClient
   */
  static onLocalClientCreated(localClient) {}

  /**
   * @abstract
   * @param {LocalServer} localServer
   */
  static onLocalServerDestroyed(localServer) {}
  /**
   * @abstract
   * @param {LocalClient} localClient
   */
  static onLocalClientDestroyed(localClient) {}

  /**
   * @abstract
   * @param {LocalClient} localClient
   * @param {RemoteServer} remoteServer
   */
  static onRemoteServerConnected(localClient, remoteServer) {}
  /**
   * @abstract
   * @param {LocalServer} localServer
   * @param {RemoteClient} remoteClient
   */
  static onRemoteClientConnected(localServer, remoteClient) {}

  /**
   * @abstract
   * @param {LocalClient} localClient
   * @param {RemoteServer} remoteServer
   */
  static onRemoteServerDisconnected(localClient, remoteServer) {}
  /**
   * @abstract
   * @param {LocalServer} localServer
   * @param {RemoteClient} remoteClient
   */
  static onRemoteClientDisconnected(localServer, remoteClient) {}

  /**
   * @abstract
   * @param {LocalClient} localClient
   * @param {RemoteServer} remoteServer
   * @param {string} messageType
   * @param {object} messageData
   * @returns {boolean}
   */
  static onRemoteServerMessage(localClient, remoteServer, messageType, messageData) {
    return false;
  }
  /**
   * @abstract
   * @param {LocalServer} localServer
   * @param {RemoteClient} remoteClient
   * @param {string} messageType
   * @param {object} messageData
   * @returns {boolean}
   */
  static onRemoteClientMessage(localServer, remoteClient, messageType, messageData) {
    return false;
  }

  /**
   * @abstract
   * @param {LocalClient} localClient
   * @param {RemoteServer} remoteServer
   * @param {number} now
   */
  static onRemoteServerNanny(localClient, remoteServer, now) {}
  /**
   * @abstract
   * @param {LocalServer} localServer
   * @param {RemoteClient} remoteClient
   * @param {number} now
   */
  static onRemoteClientNanny(localServer, remoteClient, now) {}
}

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
function dispatchProfileChange(store, profileId) {
  dispatchStoreEvent(store, 'profile', profileId);
}

/**
 * @param {Store} store
 * @param {ProfileId} profileId
 * @param {OnProfileChangeCallback} callback
 */
function addProfileChangeListener(store, profileId, callback) {
  addStoreEventListener(store, 'profile', profileId, callback);
}

/**
 * @param {Store} store
 * @param {ProfileId} profileId
 * @param {OnProfileChangeCallback} callback
 */
function removeProfileChangeListener(store, profileId, callback) {
  removeStoreEventListener(store, 'profile', profileId, callback);
}

/**
 * @param {Store} store
 */
function dispatchActiveProfileChange(store) {
  dispatchStoreEvent(store, 'activeProfile', 'change');
}

/**
 * @param {Store} store
 * @param {OnProfileChangeCallback} callback
 */
function addActiveProfileChangeListener(store, callback) {
  addStoreEventListener(store, 'activeProfile', 'change', callback);
}

/**
 * @typedef {import('../inv/Inv.js').InvId} InvId
 * @typedef {import('../../store/SatchelStore').SatchelStore} Store
 *
 * @typedef {import('../album/Album.js').AlbumId} AlbumId
 */

/**
 * @typedef {string} ProfileId
 *
 * @typedef Profile
 * @property {ProfileId} profileId
 * @property {Array<InvId>} invs
 * @property {Array<AlbumId>} albums
 * @property {string} displayName
 */

/**
 * @param {ProfileId} profileId
 * @returns {Profile}
 */
function createProfile(profileId) {
  let profile = {
    profileId,
    invs: [],
    albums: [],
    displayName: 'Satchel',
  };
  return profile;
}

/**
 * @param {Store} store
 * @param {Profile} other
 * @param {Profile} dst
 * @returns {Profile}
 */
function copyProfile(store, other, dst = undefined) {
  let result = cloneProfile(other, dst);
  if (result.profileId === other.profileId) {
    result.profileId = uuid();
  }
  return result;
}

/**
 * @param {Profile} other
 * @param {Profile} dst
 * @returns {Profile}
 */
function cloneProfile(other, dst = undefined) {
  const profileId = other.profileId || uuid();
  if (!dst) {
    dst = createProfile(profileId);
  } else {
    dst.profileId = profileId;
  }
  if (Array.isArray(other.invs)) {
    dst.invs = [...other.invs];
  }
  if (Array.isArray(other.albums)) {
    dst.albums = [...other.albums];
  }
  dst.displayName = String(other.displayName);
  return dst;
}

/**
 * @param {Store} store
 * @param {ProfileId} profileId
 * @returns {Profile}
 */
function getProfileInStore(store, profileId) {
  return store.data.profile[profileId];
}

/**
 * @param {Store} store
 * @returns {Array<ProfileId>}
 */
function getProfileIdsInStore(store) {
  return Object.keys(store.data.profile);
}

/**
 * @param {Store} store
 * @param {ProfileId} profileId
 * @returns {boolean}
 */
function isProfileInStore(store, profileId) {
  return profileId in store.data.profile;
}

/**
 * @param {Store} store
 * @param {ProfileId} profileId
 * @param {Profile} profile
 * @returns {boolean}
 */
function addProfileInStore(store, profileId, profile) {
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
function deleteProfileInStore(store, profileId, profile) {
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
function getActiveProfileInStore(store) {
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
function setActiveProfileInStore(store, profileId) {
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
function hasActiveProfileInStore(store) {
  return Boolean(store.metadata.profile.activeProfileId);
}

/* eslint-disable no-console */

// Log levels
const TRACE = 5;
const DEBUG = 4;
const INFO = 3;
const WARN = 2;
const ERROR = 1;
const OFF = 0;

const LOG_LEVEL_STYLES = {
  [TRACE]: styledLogLevel('#7F8C8D'), // Gray
  [DEBUG]: styledLogLevel('#2ECC71'), // Green
  [INFO]: styledLogLevel('#4794C8'), // Blue
  [WARN]: styledLogLevel('#F39C12'), // Yellow
  [ERROR]: styledLogLevel('#C0392B'), // Red
  [OFF]: [''],
};

function compareLogLevel(a, b) {
  return a - b;
}

function styledLogLevel(color) {
  return [
    `background: ${color}`,
    'border-radius: 0.5em',
    'color: white',
    'font-weight: bold',
    'padding: 2px 0.5em',
  ];
}

// Useful functions
function noop() {
  /** Do nothing. */
}

function getStyledMessage(message, styles) {
  return [`%c${message}`, styles.join(';')];
}

function getConsoleFunction(level) {
  switch (level) {
    case TRACE:
      return console.trace;
    case DEBUG:
      return console.log;
    case INFO:
      return console.log;
    case WARN:
      return console.warn;
    case ERROR:
      return console.error;
    case OFF:
      return noop;
    default:
      return console.log;
  }
}

function prependMessageTags(out, name, domain, level) {
  if (name) {
    out.unshift(`[${name}]`);
  }

  if (domain) {
    let tag = getStyledMessage(domain, LOG_LEVEL_STYLES[level]);
    out.unshift(tag[0], tag[1]);
  }

  return out;
}

const LEVEL = Symbol('level');
const DOMAIN = Symbol('domain');
const LOGGERS = {
  /** To be populated by logger instances. */
};
let DEFAULT_LEVEL = TRACE; //__NODE_ENV__ === 'development' ? TRACE : WARN;
let DEFAULT_DOMAIN = 'app';

class Logger {
  static get TRACE() {
    return TRACE;
  }
  static get DEBUG() {
    return DEBUG;
  }
  static get INFO() {
    return INFO;
  }
  static get WARN() {
    return WARN;
  }
  static get ERROR() {
    return ERROR;
  }
  static get OFF() {
    return OFF;
  }

  /**
   * Creates or gets the logger for the given unique name.
   * @param {String} name
   * @returns {Logger} The logger with the name.
   */
  static getLogger(name) {
    if (name in LOGGERS) {
      return LOGGERS[name];
    } else {
      return (LOGGERS[name] = new Logger(name));
    }
  }

  static useDefaultLevel(level) {
    DEFAULT_LEVEL = level;
    return this;
  }

  static useDefaultDomain(domain) {
    DEFAULT_DOMAIN = domain;
    return this;
  }

  constructor(name) {
    this.name = name;
    this[LEVEL] = DEFAULT_LEVEL;
    this[DOMAIN] = DEFAULT_DOMAIN;
  }

  setLevel(level) {
    this[LEVEL] = level;
    return this;
  }

  getLevel() {
    return this[LEVEL];
  }

  setDomain(domain) {
    this[DOMAIN] = domain;
    return this;
  }

  getDomain() {
    return this[DOMAIN];
  }

  log(level, ...messages) {
    if (compareLogLevel(this[LEVEL], level) < 0) return this;
    prependMessageTags(messages, this.name, this[DOMAIN], level);
    getConsoleFunction(level)(...messages);
  }

  trace(...messages) {
    if (compareLogLevel(this[LEVEL], TRACE) < 0) return this;
    prependMessageTags(messages, this.name, this[DOMAIN], TRACE);
    getConsoleFunction(TRACE)(...messages);
  }

  debug(...messages) {
    if (compareLogLevel(this[LEVEL], DEBUG) < 0) return this;
    prependMessageTags(messages, this.name, this[DOMAIN], DEBUG);
    getConsoleFunction(DEBUG)(...messages);
  }

  info(...messages) {
    if (compareLogLevel(this[LEVEL], INFO) < 0) return this;
    prependMessageTags(messages, this.name, this[DOMAIN], INFO);
    getConsoleFunction(INFO)(...messages);
  }

  warn(...messages) {
    if (compareLogLevel(this[LEVEL], WARN) < 0) return this;
    prependMessageTags(messages, this.name, this[DOMAIN], WARN);
    getConsoleFunction(WARN)(...messages);
  }

  error(...messages) {
    if (compareLogLevel(this[LEVEL], ERROR) < 0) return this;
    prependMessageTags(messages, this.name, this[DOMAIN], ERROR);
    getConsoleFunction(ERROR)(...messages);
  }
}

/**
 * @typedef {import('../satchel/profile/Profile.js').Profile} Profile
 */

const CURRENT_PROFILE_VERSION = 'profile_links_v1';

/**
 * @param {Profile} profile
 * @param {object} dst
 * @returns {object}
 */
function exportProfileToJSON(profile, dst = undefined) {
  return exportDataToJSON(CURRENT_PROFILE_VERSION, cloneProfile(profile), {}, dst);
}

/**
 * @param {object} jsonData
 * @param {Profile} dst
 * @returns {Profile}
 */
function importProfileFromJSON(jsonData, dst = undefined) {
  return importDataFromJSON(jsonData, 'profile_links_v1', (data) => cloneProfile(data, dst));
}

const LOGGER$4 = new Logger('SatchelLoader');

function loadSatchelFromData(store, jsonData, overrideData) {
  return importDataFromJSON(jsonData, 'satchel_v2', (data) => {
    const { profiles, albums } = data;
    try {
      loadSatchelProfilesFromData(store, profiles, overrideData);
    } catch (e) {
      LOGGER$4.error('Failed to load satchel from data', e);
    }
    try {
      loadSatchelAlbumsFromData(store, albums, overrideData);
    } catch (e) {
      LOGGER$4.error('Failed to load album from data', e);
    }
  });
}

function saveSatchelToData(store, dst = {}) {
  const profileIds = getProfileIdsInStore(store);
  const albumIds = getAlbumIdsInStore(store);
  // Do not save hidden albums
  albumIds.filter((albumId) => !isAlbumHidden(store, albumId));
  const profilesData = saveSatchelProfilesToData(store, profileIds);
  const albumsData = saveSatchelAlbumsToData(store, albumIds);
  const data = {
    profiles: profilesData,
    albums: albumsData,
  };
  return exportDataToJSON('satchel_v2', data, {}, dst);
}

function loadSatchelProfilesFromData(store, jsonData, overrideData, changeActive = true) {
  return importDataFromJSON(jsonData, 'profile_v2', (data) => {
    let result = [];
    let inProfiles = data.profdata;
    let inInvs = data.invdata;
    let inAlbums = data.albdata;
    let overrideInvIds = {};
    let overrideAlbumIds = {};
    for (let invId of Object.keys(inInvs)) {
      let invJson = inInvs[invId];
      if (invJson) {
        const inv = importInventoryFromJSON(invJson);
        if (!overrideData) {
          const newInv = copyInventory(inv);
          overrideInvIds[invId] = newInv.invId;
          addInvInStore(store, newInv.invId, newInv);
        } else {
          if (isInvInStore(store, invId)) {
            const oldInv = getInvInStore(store, invId);
            cloneInventory(inv, oldInv);
            dispatchInventoryChange(store, invId);
          } else {
            addInvInStore(store, invId, inv);
          }
        }
      }
    }
    for (let albumId of Object.keys(inAlbums)) {
      let albumJson = inAlbums[albumId];
      if (albumJson) {
        const album = importAlbumFromJSON(albumJson);
        if (!overrideData) {
          const newAlbum = copyInventory(album);
          overrideAlbumIds[albumId] = newAlbum.invId;
          addInvInStore(store, newAlbum.invId, newAlbum);
        } else {
          if (isInvInStore(store, albumId)) {
            const oldAlbum = getInvInStore(store, albumId);
            cloneInventory(album, oldAlbum);
            dispatchInventoryChange(store, albumId);
          } else {
            addInvInStore(store, albumId, album);
          }
        }
      }
    }
    for (let profileJson of inProfiles) {
      const profile = importProfileFromJSON(profileJson);
      const profileId = profile.profileId;
      // NOTE: Transform to use new inv ids and make sure we don't link inventories that cannot be loaded.
      profile.invs = profile.invs
        .map((invId) => overrideInvIds[invId] || invId)
        .filter((invId) => isInvInStore(store, invId));
      // NOTE: Same with albums
      profile.albums = profile.albums
        .map((albumId) => overrideAlbumIds[albumId] || albumId)
        .filter((albumId) => isInvInStore(store, albumId));
      if (!overrideData) {
        const newProfile = copyProfile(store, profile);
        addProfileInStore(store, newProfile.profileId, newProfile);
        result.push(newProfile.profileId);
      } else {
        if (isProfileInStore(store, profileId)) {
          const oldProfile = getProfileInStore(store, profileId);
          cloneProfile(profile, oldProfile);
          dispatchProfileChange(store, profileId);
        } else {
          addProfileInStore(store, profileId, profile);
        }
        result.push(profileId);
      }
    }
    // Change profile to the newly loaded one.
    if (result.length > 0 && changeActive) {
      setActiveProfileInStore(store, result[0]);
    }
    return result;
  });
}

function saveSatchelProfilesToData(store, profileIds, dst = {}) {
  let outProfiles = [];
  let outInvs = {};
  let outAlbums = {};
  for (let profileId of profileIds) {
    let profile = getProfileInStore(store, profileId);
    try {
      for (let invId of profile.invs) {
        let inv = getInvInStore(store, invId);
        outInvs[invId] = exportInventoryToJSON(inv);
      }
      for (let albumId of profile.albums) {
        let album = getInvInStore(store, albumId);
        outAlbums[albumId] = exportAlbumToJSON(album);
      }
      outProfiles.push(exportProfileToJSON(profile));
    } catch (e) {
      LOGGER$4.error('Failed to save satchel profiles to data', e);
    }
  }
  let result = {
    profdata: outProfiles,
    invdata: outInvs,
    albdata: outAlbums,
  };
  return exportDataToJSON('profile_v2', result, {}, dst);
}

function loadSatchelAlbumsFromData(store, jsonData, overrideData) {
  let result = [];
  let inAlbums = jsonData.albums;
  for (let albumJson of inAlbums) {
    const album = importAlbumFromJSON(albumJson);
    const albumId = album.invId;
    if (!overrideData) {
      const newAlbum = copyInventory(album);
      addInvInStore(store, newAlbum.invId, newAlbum);
      result.push(newAlbum.invId);
    } else {
      // HACK: Named albums are hacky. There's gotta be a better way to manage them.
      if (isFoundryAlbum(album)) {
        let internalAlbumId = getFoundryAlbumId(store);
        let internalAlbum = cloneInventory(album, getInvInStore(store, internalAlbumId));
        internalAlbum.invId = internalAlbumId;
        dispatchInventoryChange(store, internalAlbumId);
        result.push(internalAlbumId);
      } else if (isGroundAlbum(album)) {
        let internalAlbumId = getGroundAlbumId(store);
        let internalAlbum = cloneInventory(album, getInvInStore(store, internalAlbumId));
        internalAlbum.invId = internalAlbumId;
        dispatchInventoryChange(store, internalAlbumId);
        result.push(internalAlbumId);
      } else if (isTrashAlbum(album)) {
        let internalAlbumId = getTrashAlbumId(store);
        let internalAlbum = cloneInventory(album, getInvInStore(store, internalAlbumId));
        internalAlbum.invId = internalAlbumId;
        dispatchInventoryChange(store, internalAlbumId);
        result.push(internalAlbumId);
      } else if (isInvInStore(store, albumId)) {
        const oldAlbum = getInvInStore(store, albumId);
        cloneInventory(album, oldAlbum);
        dispatchInventoryChange(store, albumId);
        result.push(albumId);
      } else {
        addInvInStore(store, albumId, album);
        result.push(albumId);
      }
    }
  }
  return result;
}

function saveSatchelAlbumsToData(store, albumIds, dst = {}) {
  let outAlbums = [];
  for (let albumId of albumIds) {
    let album = getInvInStore(store, albumId);
    try {
      outAlbums.push(exportAlbumToJSON(album));
    } catch (e) {
      LOGGER$4.error('Failed to save satchel albums to data', e);
    }
  }
  dst.albums = outAlbums;
  return dst;
}

/**
 * @typedef {import('./SatchelLocal.js').SatchelLocal} LocalPlayerClient
 * @typedef {import('./SatchelLocal.js').SatchelRemote} RemotePlayerClient
 * @typedef {LocalPlayerClient|RemotePlayerClient} PlayerClient
 */

/**
 * @typedef PlayerState
 * @property {string} name
 * @property {number} lastHeartbeat
 */

/**
 * @param {PlayerClient} client
 * @returns {PlayerState}
 */
function setupPlayer(client) {
  let result = {
    name: '',
    lastHeartbeat: -1,
  };
  client.detail.player = result;
  return result;
}

/**
 * @param {PlayerClient} client
 * @returns {PlayerState}
 */
function getPlayer(client) {
  return client.detail.player;
}

/**
 * @param {PlayerClient} client
 * @returns {boolean}
 */
function isPlayer(client) {
  return Boolean(client.detail.player);
}

/**
 * @param {PlayerClient} client
 * @returns {string}
 */
function getPlayerName(client) {
  return getPlayer(client).name;
}

/**
 * @param {PlayerClient} client
 * @param {string} name
 */
function setPlayerName(client, name) {
  if (!validatePlayerName(name)) {
    throw new Error('Invalid player name.');
  }
  getPlayer(client).name = name;
}

/**
 * @param {string} name
 * @returns {string} The valid formatted name or an empty string if invalid.
 */
function validatePlayerName(name) {
  name = name.trim();
  if (name.length > 64) {
    name = name.substring(0, 64);
  }
  name = name.toLowerCase().replace(/\s+/, '_');
  if (name.length <= 0) {
    return '';
  }
  return name;
}

/**
 * @param {PlayerClient} client
 * @returns {boolean}
 */
function hasPlayerHeartbeat(client) {
  return getPlayer(client).lastHeartbeat >= 0;
}

/**
 * @param {PlayerClient} client
 * @param {number} value
 */
function setPlayerLastHeartbeat(client, value) {
  getPlayer(client).lastHeartbeat = value;
}

/**
 * @param {PlayerClient} client
 * @returns {number}
 */
function getPlayerLastHeartbeat(client) {
  return getPlayer(client).lastHeartbeat;
}

/**
 * @typedef {import('../../peerful/Peerful.js').Peerful} Peerful
 * @typedef {import('../../peerful/PeerfulConnection.js').PeerfulConnection} PeerfulConnection
 */

class SatchelLocal {
  /**
   * @param {Peerful} peerful
   */
  constructor(peerful) {
    this.peerful = peerful;
    /** @type {Array<SatchelRemote} */
    this.remotes = [];
    this.detail = {};

    /** @private */
    this.onConnected = this.onConnected.bind(this);
    /** @private */
    this.onDisconnected = this.onDisconnected.bind(this);
    /** @private */
    this.onError = this.onError.bind(this);
    /** @private */
    this.onMessage = this.onMessage.bind(this);

    /** @private */
    this.onInterval = this.onInterval.bind(this);
    /** @private */
    this.intervalHandle = setInterval(this.onInterval, 1_000);

    // Setup peerful
    peerful.on('connect', this.onConnected);
  }

  destroy() {
    clearInterval(this.intervalHandle);
    this.intervalHandle = null;

    // Teardown peerful
    this.peerful.off('connect', this.onConnected);
  }

  /** @protected */
  getRemoteByConnection(connection) {
    for (let i = 0; i < this.remotes.length; ++i) {
      let remote = this.remotes[i];
      if (remote.connection === connection) {
        return remote;
      }
    }
    return null;
  }

  /**
   * @protected
   * @abstract
   * @param {SatchelRemote} remote
   */
  onRemoteConnected(remote) {}
  /**
   * @protected
   * @abstract
   * @param {SatchelRemote} remote
   */
  onRemoteDisconnected(remote) {}
  /**
   * @protected
   * @abstract
   * @param {SatchelRemote} remote
   * @param {string} type
   * @param {object} data
   */
  onRemoteMessage(remote, type, data) {}
  /**
   * @protected
   * @abstract
   * @param {SatchelRemote} remote
   */
  onRemoteNanny(remote) {}

  /**
   * @private
   * @param {PeerfulConnection} connection
   */
  onConnected(connection) {
    const remote = new SatchelRemote(connection);
    connection.on('error', this.onError);
    connection.on('close', this.onDisconnected);
    connection.on('data', this.onMessage);
    this.remotes.push(remote);
    this.onRemoteConnected(remote);
  }

  /**
   * @private
   * @param {PeerfulConnection} connection
   */
  onDisconnected(connection) {
    connection.off('error', this.onError);
    connection.off('close', this.onDisconnected);
    connection.off('data', this.onMessage);
    const remote = this.getRemoteByConnection(connection);
    let i = this.remotes.indexOf(remote);
    if (remote && i >= 0) {
      this.remotes.splice(i, 1);
      this.onRemoteDisconnected(remote);
    } else {
      console.error(`Unable to disconnect unknown connection - ${connection.localId}:${connection.remoteId}`);
    }
  }

  /**
   * @private
   * @param {Error} error
   * @param {PeerfulConnection} connection
   */
  onError(error, connection) {
    console.error(`Oh no! Connection errored: ${error}`);
    connection.close();
  }

  /**
   * @private
   * @param {object} message
   * @param {PeerfulConnection} connection
   */
  onMessage(message, connection) {
    try {
      const remote = this.getRemoteByConnection(connection);
      if (remote) {
        const { type, data } = JSON.parse(message);
        this.onRemoteMessage(remote, type, data);
      }
    } catch (e) {
      console.error(`Could not process remote message - ${message}`, e);
    }
  }

  /** @private */
  onInterval() {
    for (let remote of this.remotes) {
      this.onRemoteNanny(remote);
    }
  }
}

class SatchelRemote {
  /**
   * @param {PeerfulConnection} connection
   */
  constructor(connection) {
    this.connection = connection;
    this.detail = {};
    /** @private */
    this.pending = {};
  }

  /**
   * @param {string} type
   * @param {object} data
   */
  sendMessage(type, data) {
    this.connection.send(JSON.stringify({ type, data }));
  }

  /**
   * @param {string} type
   * @param {number} timeout
   */
  async awaitMessage(type, timeout = 10_000) {
    return new Promise((resolve, reject) => {
      const pending = {
        resolve,
        reject,
        done: false,
      };
      if (type in this.pending) {
        this.pending[type].push(pending);
      } else {
        this.pending[type] = [pending];
      }
      setTimeout(() => {
        if (!pending.done) {
          pending.done = true;
          pending.reject(new Error('Timeout reached for message response.'));
        }
      }, timeout);
    });
  }

  /**
   * @param {string} type
   * @param {object} data
   * @returns {boolean}
   */
  handleMessage(type, data) {
    let flag = false;
    if (type in this.pending) {
      const pendings = this.pending[type];
      delete this.pending[type];
      for (let pending of pendings) {
        if (!pending.done) {
          pending.done = true;
          pending.resolve(data);
          flag = true;
        }
      }
    }
    return flag;
  }
}

function onAutoSave(localServer) {
  const serverData = ActivityPlayerInventory.getLocalServerData(localServer);
  saveToStorage('server_data', JSON.stringify(serverData));
}

class ActivityPlayerInventory extends ActivityBase {
  static get observedMessages() {
    return ['reset', 'sync'];
  }

  /** @override */
  static onLocalServerCreated(localServer) {
    // Load server data from storage...
    let serverData;
    try {
      serverData = JSON.parse(loadFromStorage('server_data')) || {};
    } catch {
      serverData = {};
    }
    localServer.localData = serverData;
    console.log('Loading server data...', serverData);
    // Start saving server data to storage...
    localServer.autoSave = onAutoSave.bind(undefined, localServer);
    localServer.autoSaveHandle = setInterval(localServer.autoSave, 5_000);
  }

  /** @override */
  static onLocalServerDestroyed(localServer) {
    // Stop saving server data
    clearInterval(localServer.autoSaveHandle);
    localServer.autoSaveHandle = null;
    localServer.autoSave = null;
    // Reset server data
    localServer.localData = {};
  }

  /** @override */
  static onRemoteClientConnected(localServer, remoteClient) {
    remoteClient.element = null;
  }

  /** @override */
  static onRemoteServerConnected(localClient, remoteServer) {
    remoteServer.remoteData = {};
  }

  /** @override */
  static onRemoteServerMessage(localClient, remoteServer, messageType, messageData) {
    switch (messageType) {
      case 'reset':
        const store = getSatchelStore();
        const playerName = getPlayerName(localClient);
        const playerDataName = `remote-profile-${playerName}`;
        let profiles = loadSatchelProfilesFromData(store, messageData, true);
        if (profiles[0] !== playerDataName) {
          console.error('Server and client disagree on data name!');
        }
        setActiveProfileInStore(store, profiles[0]);
        return true;
    }
    return false;
  }

  /**
   * @override
   * @param {SatchelLocal} localClient
   * @param {SatchelRemote} remoteServer
   */
  static onRemoteServerNanny(localClient, remoteServer) {
    const store = getSatchelStore();
    const playerName = getPlayerName(localClient);
    const playerDataName = `remote-profile-${playerName}`;
    if (!isProfileInStore(store, playerDataName)) {
      return;
    }
    const satchelData = saveSatchelProfilesToData(store, [playerDataName]);
    remoteServer.sendMessage('sync', satchelData);
  }

  /**
   * @override
   * @param {SatchelLocal} local
   * @param {SatchelRemote} remote
   * @param {number} now
   */
  static onRemoteClientNanny(local, remote, now) {
    if (!hasPlayerHeartbeat(remote)) {
      return;
    }
    const lastHeartbeat = getPlayerLastHeartbeat(remote);
    let delta = now - lastHeartbeat;
    if (delta > 10_000) {
      console.log('Closing connection due to staleness.');
      remote.connection.close();
    }
  }

  /**
   * @override
   * @param {SatchelLocal} localServer
   * @param {SatchelRemote} remoteClient
   */
  static onRemoteClientMessage(localServer, remoteClient, messageType, messageData) {
    switch (messageType) {
      case 'sync':
        const remotePlayerName = getPlayerName(remoteClient);
        if (!remotePlayerName) {
          throw new Error('Missing remote player name.');
        }
        console.log('Syncing client...', remotePlayerName);
        const now = performance.now();
        setPlayerLastHeartbeat(remoteClient, now);
        // Update server's copy of client data
        const clientDataName = `remote-profile-${remotePlayerName}`;
        const clientData = messageData;
        let store = getSatchelStore();
        try {
          let profileIds = loadSatchelProfilesFromData(store, clientData, true, false);
          if (profileIds[0] !== clientDataName) {
            console.error('Server and client disagree on player data name!');
          }
        } catch (e) {
          console.error(`Failed to load client inventory - ${e}`);
        }
        return true;
    }
    return false;
  }

  /**
   * @param {SatchelRemote} remoteClient
   * @param {string} profileId
   */
  static sendPlayerReset(remoteClient, profileId) {
    const store = getSatchelStore();
    if (!isProfileInStore(store, profileId)) {
      let newProfile = createProfile(profileId);
      let newInv = createGridInvInStore(store, uuid(), 12, 9);
      newProfile.invs.push(newInv.invId);
      addProfileInStore(store, newProfile.profileId, newProfile);
    }
    let satchelData = saveSatchelProfilesToData(store, [profileId]);
    remoteClient.sendMessage('reset', satchelData);
  }

  static resetLocalServerData(localServer, serverData) {
    localServer.localData = serverData;
  }

  static getLocalServerData(localServer) {
    return localServer.localData;
  }
}

class ActivityPlayerHandshake extends ActivityBase {
  static get observedMessages() {
    return ['handshake'];
  }

  /**
   * @override
   * @param {SatchelLocal} local
   * @param {SatchelRemote} remote
   */
  static onRemoteServerConnected(local, remote) {
    let name = '';
    while (!name) {
      name = window.prompt('Who Art Thou? (cannot be changed yet, sry)');
      name = validatePlayerName(name);
      if (!name) {
        window.alert('Invalid name.');
      }
    }
    setupPlayer(local);
    setPlayerName(local, name);
    remote.sendMessage('handshake', name);
  }

  /**
   * @override
   * @param {SatchelLocal} local
   * @param {SatchelRemote} remote
   */
  static onRemoteClientConnected(local, remote) {
    setupPlayer(remote);
  }

  /**
   * @override
   * @param {SatchelLocal} local
   * @param {SatchelRemote} remote
   */
  static onRemoteClientMessage(local, remote, messageType, messageData) {
    if (messageType !== 'handshake') {
      // Verify client already did handshake, otherwise do not process this message.
      if (!isPlayer(remote) || !getPlayerName(remote)) {
        console.log(messageData, remote);
        remote.sendMessage('error', 'Not yet signed in.');
        return true;
      }
      return false;
    }
    const remotePlayerName = validatePlayerName(messageData);
    if (!remotePlayerName) {
      remote.sendMessage('error', 'Invalid user name.');
      return;
    }
    console.log('Setting up client...', remotePlayerName);
    const now = performance.now();
    setPlayerName(remote, remotePlayerName);
    setPlayerLastHeartbeat(remote, now);
    // Send to client their first data store
    const playerDataName = `remote-profile-${remotePlayerName}`;
    ActivityPlayerInventory.sendPlayerReset(remote, playerDataName);
    return true;
  }

  /**
   * @param {SatchelLocal} localServer
   * @returns {Array<string>}
   */
  static getActiveClientNames(localServer) {
    return localServer.remotes.map(getPlayerName);
  }

  /**
   * @param {SatchelLocal} localServer
   * @returns {SatchelRemote|null}
   */
  static getActiveClientByName(localServer, playerName) {
    for (let client of localServer.remotes) {
      const clientName = getPlayerName(client);
      if (clientName === playerName) {
        return client;
      }
    }
    return null;
  }
}

/**
 * @typedef {import('./PeerSatchel.js').SatchelServer} SatchelServer
 * @typedef {import('./PeerSatchel.js').SatchelClient} SatchelClient
 * @typedef {import('./SatchelLocal.js').SatchelRemote} SatchelRemote
 */

class ActivityPlayerList extends ActivityBase {
  static get observedMessages() {
    return ['clients'];
  }

  /** @override */
  static onRemoteServerConnected(localClient, remoteServer) {
    remoteServer.clientNames = [];
  }

  /** @override */
  static onRemoteServerMessage(localClient, remoteServer, messageType, messageData) {
    if (messageType !== 'clients') {
      return false;
    }
    remoteServer.clientNames = [...messageData];
    return true;
  }

  /** @override */
  static onRemoteClientNanny(localServer, remoteClient) {
    this.sendPlayerList(localServer, remoteClient);
  }

  /**
   * @param {SatchelServer} localServer
   * @returns {Array<string>}
   */
  static getPlayerNameListOnServer(localServer) {
    return ActivityPlayerHandshake.getActiveClientNames(localServer).filter((name) => name.length > 0);
  }

  /**
   * @param {SatchelClient} localClient
   * @returns {Array<string>}
   */
  static getPlayerNameListOnClient(localClient) {
    const localPlayerName = getPlayerName(localClient);
    return localClient.remoteServer.clientNames.filter((name) => name !== localPlayerName);
  }

  /**
   * @param {SatchelServer} localServer
   * @param {SatchelRemote} remoteClient
   */
  static sendPlayerList(localServer, remoteClient) {
    const validClientNames = this.getPlayerNameListOnServer(localServer);
    remoteClient.sendMessage('clients', validClientNames);
  }
}

/**
 * @typedef {import('../../satchel/item/Item.js').Item} Item
 * @typedef {import('../lib/BannerPromptElement.js').BannerPromptElement} BannerPromptElement
 */

const INNER_HTML$3 = /* html */ `
<banner-prompt>
  <item-editor>
    <icon-button slot="actions" id="actionFoundry" icon="res/anvil.svg" alt="foundry" title="Edit in Foundry"></icon-button>
    <icon-button slot="actions" id="actionFoundryShare" icon="res/share.svg" alt="share" title="Share Item"></icon-button>
    <icon-button slot="actions" id="actionDuplicate" icon="res/duplicate.svg" alt="duplicate" title="Duplicate Item"></icon-button>
  </item-editor>
</banner-prompt>
`;
const INNER_STYLE$3 = /* css */ `
`;

class ItemDialogElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML$3;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE$3;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('item-dialog', this);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this._containerElement = null;
    /** @private */
    this._invId = null;
    /** @private */
    this._itemId = null;

    /**
     * @private
     * @type {BannerPromptElement}
     */
    this.dialog = shadowRoot.querySelector('banner-prompt');
    /**
     * @private
     * @type {ItemEditorElement}
     */
    this.itemEditor = shadowRoot.querySelector('item-editor');

    /** @private */
    this.actionDuplicate = shadowRoot.querySelector('#actionDuplicate');
    /** @private */
    this.actionFoundry = shadowRoot.querySelector('#actionFoundry');
    /** @private */
    this.actionFoundryShare = shadowRoot.querySelector('#actionFoundryShare');

    /** @private */
    this.onDialogClose = this.onDialogClose.bind(this);
    /** @private */
    this.onActionDuplicate = this.onActionDuplicate.bind(this);
    /** @private */
    this.onActionFoundry = this.onActionFoundry.bind(this);
    /** @private */
    this.onActionFoundryShare = this.onActionFoundryShare.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.dialog.addEventListener('close', this.onDialogClose);
    this.actionDuplicate.addEventListener('click', this.onActionDuplicate);
    this.actionFoundry.addEventListener('click', this.onActionFoundry);
    this.actionFoundryShare.addEventListener('click', this.onActionFoundryShare);
  }

  /** @protected */
  disconnectedCallback() {
    this.dialog.removeEventListener('close', this.onDialogClose);
    this.actionDuplicate.removeEventListener('click', this.onActionDuplicate);
    this.actionFoundry.removeEventListener('click', this.onActionFoundry);
    this.actionFoundryShare.removeEventListener('click', this.onActionFoundryShare);
  }

  openDialog(containerElement, invId, itemId, clientX = 0, clientY = 0) {
    if (!containerElement || !invId || !itemId) {
      throw new Error('Cannot open dialog for non-existant inventory item.');
    }
    this._containerElement = containerElement;
    this._invId = invId;
    this._itemId = itemId;

    const store = getSatchelStore();
    const inv = getInvInStore(store, invId);
    const item = getItemByItemId(inv, itemId);
    const newItem = cloneItem(item);
    this.itemEditor.clearSocketedItem();
    this.itemEditor.putSocketedItem(newItem, false);
    this.dialog.toggleAttribute('open', true);
    this.itemEditor.grabDefaultFocus();
  }

  copySocketedItem() {
    const item = this.itemEditor.getSocketedItem();
    if (!item) {
      return null;
    } else {
      return copyItem(item);
    }
  }

  /** @private */
  applyChanges() {
    const invId = this._invId;
    const itemId = this._itemId;
    const store = getSatchelStore();
    const inv = getInvInStore(store, invId);
    const sourceItem = getItemByItemId(inv, itemId);
    const socketItem = this.itemEditor.getSocketedItem();
    cloneItem(socketItem, sourceItem);
    dispatchItemChange(store, itemId);
  }

  /** @private */
  onActionDuplicate(e) {
    if (!this._containerElement || !this._invId || !this._itemId) {
      return;
    }
    this.applyChanges();

    const socketedItem = this.itemEditor.getSocketedItem();
    if (socketedItem) {
      let newItem = copyItem(socketedItem);
      const clientRect = e.target.getBoundingClientRect();
      dropFallingItem(newItem, clientRect.x, clientRect.y);
    }
  }

  /** @private */
  onActionFoundry() {
    if (!this._containerElement || !this._invId || !this._itemId) {
      return;
    }
    this.applyChanges();
    this.dialog.toggleAttribute('open', false);

    const store = getSatchelStore();
    const item = tryTakeItemFromInventory(store, this._containerElement, this._itemId);
    if (item) {
      let newItem = copyItem(item);
      openFoundry(newItem);
    }
  }

  /** @private */
  onActionFoundryShare() {
    const socketedItem = this.itemEditor.getSocketedItem();
    try {
      if (socketedItem) {
        /** @type {HTMLSelectElement} */
        let giftTarget = document.querySelector('#giftTarget');
        let ctx = getCursorContext();
        if (ctx.server && ctx.server.instance) {
          const localServer = /** @type {import('../../satchel/peer/PeerSatchel.js').SatchelServer} */ (
            ctx.server.instance
          );
          const playerNames = ActivityPlayerList.getPlayerNameListOnServer(localServer);
          let content = playerNames
            .map((clientName) => `<option>${clientName.toLowerCase()}</option>`)
            .join('\n');
          giftTarget.innerHTML = content;
        } else if (ctx.client && ctx.client.instance) {
          const localClient = /** @type {import('../../satchel/peer/PeerSatchel.js').SatchelClient} */ (
            ctx.client.instance
          );
          const playerNames = ActivityPlayerList.getPlayerNameListOnClient(localClient);
          let content = playerNames
            .map((clientName) => `<option>${clientName.toLowerCase()}</option>`)
            .join('\n');
          giftTarget.innerHTML = content;
        } else {
          giftTarget.innerHTML = '';
        }
        let giftDialog = document.querySelector('#giftDialog');
        giftDialog.toggleAttribute('open', true);
      }
    } catch (e) {
      console.error('Failed to export item', e);
    }
  }

  /** @private */
  onDialogClose(e) {
    this.applyChanges();
  }
}
ItemDialogElement.define();

function tryTakeItemFromInventory(store, containerElement, itemId) {
  const containerInvId = containerElement.invId;
  if (containerElement.hasAttribute('nooutput')) {
    return null;
  }
  const inv = getInvInStore(store, containerInvId);
  const item = getItemByItemId(inv, itemId);
  if (containerElement.hasAttribute('copyoutput')) {
    return copyItem(item);
  }
  removeItemFromInventory(store, containerInvId, itemId);
  return item;
}

const INNER_HTML$2 = /* html */ `
<div id="sidebar">
  <slot name="sidebar"></slot>
</div>
<div id="viewport">
  <slot></slot>
</div>
`;
const INNER_STYLE$2 = /* css */ `
:host {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  --background-color: #333333;
}

#sidebar {
  position: relative;
  background-color: var(--background-color);
  overflow-x: hidden;
  overflow-y: auto;
}

#sidebar ::slotted(*) {
  display: flex;
  flex-direction: column;
  text-align: center;
  width: 100%;
  height: 100%;
}

#viewport {
  position: relative;
  flex: 1;
  overflow: hidden;
}
`;

class SidebarLayoutElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML$2;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE$2;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('sidebar-layout', this);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));
  }

  /** @protected */
  connectedCallback() {}

  /** @protected */
  disconnectedCallback() {}

  /**
   * @param attribute
   * @param previous
   * @param value
   * @protected
   */
  attributeChangedCallback(attribute, previous, value) {}
}
SidebarLayoutElement.define();

/** @typedef {import('./cursor/InvCursorElement.js').InvCursorElement} InvCursorElement */

const INNER_HTML$1 = /* html */ `
<icon-button id="actionDelete" icon="res/delete.svg" alt="delete" title="Delete Item"></icon-button>
`;
const INNER_STYLE$1 = /* css */ `
`;

class TrashCanElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML$1;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE$1;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('trash-can', this);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this.actionDelete = this.shadowRoot.querySelector('#actionDelete');

    /** @private */
    this.onActionDelete = this.onActionDelete.bind(this);
    /** @private */
    this.onActionDeleteEnter = this.onActionDeleteEnter.bind(this);
    /** @private */
    this.onActionDeleteLeave = this.onActionDeleteLeave.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.actionDelete.addEventListener('mouseup', this.onActionDelete);
    this.actionDelete.addEventListener('mouseenter', this.onActionDeleteEnter);
    this.actionDelete.addEventListener('mouseleave', this.onActionDeleteLeave);
  }

  /** @protected */
  disconnectedCallback() {
    this.actionDelete.removeEventListener('mouseup', this.onActionDelete);
    this.actionDelete.removeEventListener('mouseenter', this.onActionDeleteEnter);
    this.actionDelete.removeEventListener('mouseleave', this.onActionDeleteLeave);
  }

  /** @private */
  onActionDelete(e) {
    let cursor = getCursor();
    if (cursor && cursor.hasHeldItem()) {
      let heldItem = cursor.getHeldItem();
      cursor.clearHeldItem();
      saveItemToTrashAlbum(heldItem);
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  /** @private */
  onActionDeleteEnter() {
    /** @type {InvCursorElement} */
    let cursor = document.querySelector('inv-cursor');
    if (cursor) {
      cursor.toggleAttribute('danger', true);
    }
  }

  /** @private */
  onActionDeleteLeave() {
    /** @type {InvCursorElement} */
    let cursor = document.querySelector('inv-cursor');
    if (cursor) {
      cursor.toggleAttribute('danger', false);
    }
  }
}
TrashCanElement.define();

/** @typedef {import('./cursor/InvCursorElement.js').InvCursorElement} InvCursorElement */

const INNER_HTML = /* html */ `
<icon-button id="actionEdit" icon="res/anvil.svg" alt="edit" title="Edit Item"></icon-button>
`;
const INNER_STYLE = /* css */ `
`;

class FoundryAnvilElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('foundry-anvil', this);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this.actionEdit = this.shadowRoot.querySelector('#actionEdit');

    /** @private */
    this.onActionEdit = this.onActionEdit.bind(this);
    /** @private */
    this.onActionEditEnter = this.onActionEditEnter.bind(this);
    /** @private */
    this.onActionEditLeave = this.onActionEditLeave.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.actionEdit.addEventListener('mouseup', this.onActionEdit);
    this.actionEdit.addEventListener('mouseenter', this.onActionEditEnter);
    this.actionEdit.addEventListener('mouseleave', this.onActionEditLeave);
  }

  /** @protected */
  disconnectedCallback() {
    this.actionEdit.removeEventListener('mouseup', this.onActionEdit);
    this.actionEdit.removeEventListener('mouseenter', this.onActionEditEnter);
    this.actionEdit.removeEventListener('mouseleave', this.onActionEditLeave);
  }

  /** @private */
  onActionEdit(e) {
    let cursor = getCursor();
    if (cursor && cursor.hasHeldItem()) {
      let heldItem = cursor.getHeldItem();
      cursor.clearHeldItem();
      openFoundry(heldItem);
      e.preventDefault();
      e.stopPropagation();
      return false;
    } else if (isFoundryOpen()) {
      closeFoundry();
    } else {
      openFoundry(null);
    }
  }

  /** @private */
  onActionEditEnter() {
    /** @type {InvCursorElement} */
    let cursor = document.querySelector('inv-cursor');
    if (cursor) {
      cursor.toggleAttribute('important', true);
    }
  }

  /** @private */
  onActionEditLeave() {
    /** @type {InvCursorElement} */
    let cursor = document.querySelector('inv-cursor');
    if (cursor) {
      cursor.toggleAttribute('important', false);
    }
  }
}
FoundryAnvilElement.define();

function setupActiveProfile() {
  const store = getSatchelStore();
  const ctx = getCursorContext();
  let activeProfile = resolveActiveProfile(store);
  let storedProfileId = loadFromStorage('activeProfileId');
  if (storedProfileId) {
    changeActiveProfile(store, storedProfileId);
    activeProfile = resolveActiveProfile(store);
  }
  ctx.lastActiveProfileId = activeProfile.profileId;
  addActiveProfileChangeListener(store, onActiveProfileChange);
  addProfileChangeListener(store, activeProfile.profileId, onProfileChange);
  onProfileChange();

  // Enable profile editing
  document.querySelector('#actionProfile').toggleAttribute('disabled', false);
}

function changeActiveProfile(store, profileId) {
  if (isProfileInStore(store, profileId)) {
    setActiveProfileInStore(store, profileId);
    return true;
  }
  return false;
}

function resolveActiveProfile(store) {
  if (hasActiveProfileInStore(store)) {
    let activeProfile = getActiveProfileInStore(store);
    if (activeProfile) {
      return activeProfile;
    }
  }
  let profileIds = getProfileIdsInStore(store);
  if (profileIds.length > 0) {
    let nextProfileId = profileIds[0];
    setActiveProfileInStore(store, nextProfileId);
    return getProfileInStore(store, nextProfileId);
  }
  // Create the default active profile if none exists.
  let newProfile = createProfile(uuid());
  let newInv = createGridInvInStore(store, uuid(), 12, 9);
  newProfile.invs.push(newInv.invId);
  addProfileInStore(store, newProfile.profileId, newProfile);
  setActiveProfileInStore(store, newProfile.profileId);
  return newProfile;
}

function onActiveProfileChange() {
  const store = getSatchelStore();
  let ctx = getCursorContext();
  let lastActiveProfileId = ctx.lastActiveProfileId;
  if (lastActiveProfileId) {
    removeProfileChangeListener(store, lastActiveProfileId, onProfileChange);
  }
  const nextActiveProfile = resolveActiveProfile(store);
  const nextActiveProfileId = nextActiveProfile.profileId;
  addProfileChangeListener(store, nextActiveProfileId, onProfileChange);
  ctx.lastActiveProfileId = nextActiveProfileId;
  onProfileChange();
  saveToStorage('activeProfileId', nextActiveProfileId);
}

function onProfileChange() {
  let invsContainer = document.querySelector('#localWorkspace');
  invsContainer.innerHTML = '';
  const store = getSatchelStore();
  const activeProfile = getActiveProfileInStore(store);
  if (!activeProfile) {
    return;
  }
  for (let invId of activeProfile.invs) {
    let elementId = `profile_inv-${invId}`;
    let invElement = /** @type {import('../components/invgrid/InvGridElement.js').InvGridElement} */ (
      document.createElement('inv-grid')
    );
    invElement.id = elementId;
    invElement.invId = invId;
    invsContainer.appendChild(invElement);
  }
  for (let albumId of activeProfile.albums) {
    let elementId = `profile_album-${albumId}`;
    let albumElement = /** @type {import('../components/album/AlbumSpaceElement.js').AlbumSpaceElement} */ (
      document.createElement('album-space')
    );
    albumElement.id = elementId;
    albumElement.albumId = albumId;
    invsContainer.appendChild(albumElement);
  }
  /** @type {HTMLInputElement} */
  let profileTitle = document.querySelector('#appTitle');
  let windowTitle = document.querySelector('title');
  let displayName = activeProfile.displayName;
  profileTitle.textContent = displayName;
  windowTitle.textContent = displayName;
}

/**
 * @template T
 */
class Eventable {
  constructor() {
    /** @private */
    this.listeners = /** @type {Record<keyof T, Array<T[keyof T]>>} */ ({});
  }

  /**
   * @param {keyof T} event
   * @param {T[keyof T]} callback
   * @returns {Eventable}
   */
  on(event, callback) {
    this.addEventListener(event, callback);
    return this;
  }

  /**
   * @param {keyof T} event
   * @param {T[keyof T]} callback
   * @returns {Eventable}
   */
  off(event, callback) {
    this.removeEventListener(event, callback);
    return this;
  }

  /**
   * @param {keyof T} event
   * @param {T[keyof T]} callback
   * @returns {Eventable}
   */
  once(event, callback) {
    const f = /** @type {Function} */ (/** @type {unknown} */ (callback));
    const wrapper = function () {
      f.apply(undefined, arguments);
      this.removeEventListener(event, wrapper);
    }.bind(this);
    this.addEventListener(event, wrapper);
    return this;
  }

  /**
   * @param {keyof T} event
   * @param {...any} args
   * @returns {Eventable}
   */
  emit(event, ...args) {
    this.dispatchEvent(event, args);
    return this;
  }

  /**
   * @protected
   * @param {keyof T} event
   * @param {T[keyof T]} callback
   */
  addEventListener(event, callback) {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.push(callback);
    } else {
      this.listeners[event] = [callback];
    }
  }

  /**
   * @protected
   * @param {keyof T} event
   * @param {T[keyof T]} callback
   */
  removeEventListener(event, callback) {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      const i = eventListeners.indexOf(callback);
      if (i >= 0) {
        eventListeners.splice(i, 1);
      }
    }
  }

  /**
   * @protected
   * @param {keyof T} event
   * @returns {Array<T[keyof T]>}
   */
  getEventListeners(event) {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      return eventListeners.slice();
    }
    return [];
  }

  /**
   * @protected
   * @param {keyof T} event
   * @param {Array<any>} args
   */
  dispatchEvent(event, args) {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      for (const callback of eventListeners) {
        const f = /** @type {Function} */ (/** @type {unknown} */ (callback));
        f.apply(undefined, args);
      }
    }
  }

  /**
   * @protected
   */
  clearEventListeners() {
    this.listeners = /** @type {Record<keyof T, Array<T[keyof T]>>} */ ({});
  }
}

const LOGGER$3 = new Logger('PeerfulUtil');
/**
 * @param  {...any} messages
 */
function debug(...messages) {
  LOGGER$3.debug(...messages);
}

const FILTER_TRICKLE_SDP_PATTERN = /a=ice-options:trickle\s\n/g;
const DEFAULT_ICE_SERVERS = [
  {
    urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'],
  },
  { urls: 'turn:0.peerjs.com:3478', username: 'peerjs', credential: 'peerjsp' },
];

/**
 * @template T
 * @typedef PromiseStatusSuccessResult<T>
 * @property {boolean} complete
 * @property {true} result
 * @property {T} reason
 * @property {Array<Function>} resolve
 * @property {Array<Function>} reject
 */

/**
 * @typedef PromiseStatusErrorResult
 * @property {boolean} complete
 * @property {false} result
 * @property {Error} reason
 * @property {Array<Function>} resolve
 * @property {Array<Function>} reject
 */

/**
 * @template T
 * @typedef {PromiseStatusSuccessResult<T>|PromiseStatusErrorResult} PromiseStatusResult<T>
 */

/**
 * @template T
 * @returns {PromiseStatusResult<T>}
 */
function createPromiseStatus() {
  return {
    complete: false,
    result: false,
    reason: null,
    resolve: [],
    reject: [],
  };
}

/**
 * @returns {boolean}
 */
function isPromiseStatusPending(promiseStatus) {
  return !promiseStatus.complete && (promiseStatus.resolve.length > 0 || promiseStatus.reject.length > 0);
}

/**
 * @template T
 * @param {PromiseStatusResult<T>} promiseStatus
 * @returns {Promise<T>}
 */
async function createPromiseStatusPromise(promiseStatus) {
  return new Promise((resolve, reject) => {
    if (promiseStatus.complete) {
      if (promiseStatus.result) {
        resolve(promiseStatus.reason);
      } else {
        reject(promiseStatus.reason);
      }
    } else {
      promiseStatus.resolve.push(resolve);
      promiseStatus.reject.push(reject);
    }
  });
}

/**
 * @template T
 * @param {PromiseStatusResult<T>} promiseStatus
 * @param {T} reason
 */
function resolvePromiseStatus(promiseStatus, reason) {
  if (!promiseStatus.complete) {
    let resolvers = promiseStatus.resolve;
    promiseStatus.complete = true;
    promiseStatus.resolve = [];
    promiseStatus.reject = [];
    promiseStatus.result = true;
    promiseStatus.reason = reason;
    for (let resolver of resolvers) {
      resolver(reason);
    }
  } else {
    throw new Error('Cannot resolve pending promise already completed.');
  }
}

/**
 * @template T
 * @param {PromiseStatusResult<T>} promiseStatus
 * @param {Error} reason
 */
function rejectPromiseStatus(promiseStatus, reason) {
  if (!promiseStatus.complete) {
    let rejectors = promiseStatus.reject;
    promiseStatus.complete = true;
    promiseStatus.resolve = [];
    promiseStatus.reject = [];
    promiseStatus.result = false;
    promiseStatus.reason = reason;
    for (let rejector of rejectors) {
      rejector(reason);
    }
  } else {
    throw new Error('Cannot reject pending promise already completed.');
  }
}

/**
 * @typedef {(error: Error|null, data: object|null, src?: string, dst?: string) => void} PeerJsSignalingHandler
 */

const PeerJsSignalingErrorCode = {
  UNKNOWN: -1,
  ERROR: 1,
  ID_TAKEN: 2,
  INVALID_KEY: 3,
  LEAVE: 4,
  EXPIRE: 5,
};

class PeerJsSignalingError extends Error {
  /**
   * @param {number} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);

    this.code = code;
  }
}

/**
 * @typedef PeerJsSignalingOptions
 * @property {string} protocol
 * @property {string} host
 * @property {string} path
 * @property {number} port
 * @property {string} key
 * @property {number} pingIntervalMillis
 */

/** @type {PeerJsSignalingOptions} */
const DEFAULT_OPTS = {
  protocol: 'wss',
  host: '0.peerjs.com',
  path: '/',
  port: 443,
  key: 'peerjs',
  pingIntervalMillis: 5000,
};

class PeerJsSignaling {
  /**
   * @param {string} id
   * @param {PeerJsSignalingHandler} callback
   * @param {PeerJsSignalingOptions} [options]
   * @param options
   */
  constructor(id, callback, options = undefined) {
    options = {
      ...DEFAULT_OPTS,
      ...options,
    };
    /** @private */
    this.callback = callback;
    /** @private */
    this.webSocket = null;
    /** @private */
    this.closed = false;
    /** @private */
    this.opened = false;
    /** @private */
    this.id = id;
    /** @private */
    this.token = randomToken();
    /** @private */
    this.baseUrl = buildPeerJsSignalingUrl(
      options.protocol,
      options.host,
      options.port,
      options.path,
      options.key
    );
    /** @private */
    this.pingHandle = null;
    /** @private */
    this.pingInterval = options.pingIntervalMillis;
    /** @private */
    this.activeStatus = createPromiseStatus();

    /** @private */
    this.onSocketMessage = this.onSocketMessage.bind(this);
    /** @private */
    this.onSocketOpened = this.onSocketOpened.bind(this);
    /** @private */
    this.onSocketClosed = this.onSocketClosed.bind(this);
    /** @private */
    this.onHeartbeatTimeout = this.onHeartbeatTimeout.bind(this);
  }

  /**
   * @returns {Promise<PeerJsSignaling>}
   */
  async open() {
    debug('[SIGNAL]', 'Opening signaling socket...');
    if (this.closed) {
      throw new Error('Cannot open already closed connection to peerjs server.');
    }

    if (this.opened) {
      throw new Error('Already opened connection to peerjs server.');
    }

    if (isPromiseStatusPending(this.activeStatus)) {
      throw new Error('Already trying to open connection to peerjs server.');
    }

    const url = `${this.baseUrl}&id=${this.id}&token=${this.token}`;
    const webSocket = new WebSocket(url);
    this.webSocket = webSocket;

    webSocket.addEventListener('message', this.onSocketMessage);
    webSocket.addEventListener('close', this.onSocketClosed);
    webSocket.addEventListener('open', this.onSocketOpened);

    return createPromiseStatusPromise(this.activeStatus);
  }

  /** @private */
  onSocketOpened() {
    debug('[SOCKET]', 'Open!');
    if (this.closed) {
      return;
    }

    this.scheduleHeartbeat();
  }

  /**
   * @private
   * @param {MessageEvent<?>} e
   */
  onSocketMessage(e) {
    debug('[SOCKET]', 'Received message:', e.data);
    if (this.closed) {
      return;
    }

    let data;
    try {
      data = JSON.parse(e.data);
    } catch (error) {
      this.callback(new Error(`Invalid signaling message from peerjs server: ${error.data}`), null);
      return;
    }

    const { type, payload, src, dst } = data;
    switch (type) {
      case 'OPEN':
        if (!this.opened) {
          this.opened = true;
          resolvePromiseStatus(this.activeStatus, this);
        }
        break;
      case 'ERROR':
        this.callback(
          new PeerJsSignalingError(PeerJsSignalingErrorCode.ERROR, JSON.stringify(payload)),
          null
        );
        break;
      case 'ID-TAKEN':
        this.callback(
          new PeerJsSignalingError(
            PeerJsSignalingErrorCode.ID_TAKEN,
            'The requested signaling id is unavailable.'
          ),
          null
        );
        break;
      case 'INVALID-KEY':
        this.callback(
          new PeerJsSignalingError(
            PeerJsSignalingErrorCode.INVALID_KEY,
            'The given signaling api key is invalid.'
          ),
          null
        );
        break;
      case 'LEAVE':
        this.callback(
          new PeerJsSignalingError(PeerJsSignalingErrorCode.LEAVE, 'Signaling connection left.'),
          null
        );
        break;
      case 'EXPIRE':
        this.callback(
          new PeerJsSignalingError(PeerJsSignalingErrorCode.EXPIRE, 'Signaling connection expired.'),
          null
        );
        break;
      case 'OFFER':
        this.callback(undefined, payload, src, dst);
        break;
      case 'ANSWER':
        this.callback(undefined, payload, src, dst);
        break;
      case 'CANDIDATE':
        this.callback(undefined, payload, src, dst);
        break;
      default:
        this.callback(
          new PeerJsSignalingError(
            PeerJsSignalingErrorCode.UNKNOWN,
            `Unknown signaling message from peerjs server: ${JSON.stringify(data)}`
          ),
          null
        );
    }
  }

  /** @private */
  onSocketClosed() {
    debug('[SOCKET]', 'Close!');
    if (this.closed) {
      return;
    }

    this.destroy();
    this.closed = true;
    this.callback(new Error('Signaling connection closed unexpectedly to peerjs server.'), null);
  }

  /**
   *
   * @param {string} src
   * @param {string} dst
   * @param {RTCIceCandidate} candidate
   */
  sendCandidateMessage(src, dst, candidate) {
    debug('[SIGNAL]', 'Sending candidate from', src, 'to', dst);
    if (this.closed) {
      return;
    }

    if (!isWebSocketOpen(this.webSocket)) {
      this.callback(new Error('Cannot send candidate message to un-opened connection.'), null);
      return;
    }

    const message = JSON.stringify({
      type: 'CANDIDATE',
      payload: candidate,
      dst,
    });
    this.webSocket.send(message);
  }

  /**
   * @param {string} src
   * @param {string} dst
   * @param {RTCSessionDescriptionInit} signal
   */
  sendSignalMessage(src, dst, signal) {
    const { type } = signal;
    debug('[SIGNAL]', 'Sending', type, 'from', src, 'to', dst);
    if (this.closed) {
      return;
    }

    if (!isWebSocketOpen(this.webSocket)) {
      this.callback(new Error('Cannot send signaling message to un-opened connection.'), null);
      return;
    }

    let message;
    switch (type) {
      case 'offer':
        message = JSON.stringify({
          type: 'OFFER',
          payload: signal,
          dst,
        });
        break;
      case 'answer':
        message = JSON.stringify({
          type: 'ANSWER',
          payload: signal,
          dst,
        });
        break;
      // TODO: Unknown signal type?
    }

    this.webSocket.send(message);
  }

  sendHeartbeatMessage() {
    debug('[SIGNAL]', 'Sending heartbeat');
    if (this.closed) {
      return;
    }

    if (!isWebSocketOpen(this.webSocket)) {
      this.callback(new Error('Cannot send signaling heartbeat to un-opened connection.'), null);
      return;
    }

    const message = JSON.stringify({ type: 'HEARTBEAT' });
    this.webSocket.send(message);
  }

  close() {
    if (this.closed) {
      return;
    }

    this.destroy();
    this.closed = true;
  }

  /** @private */
  scheduleHeartbeat() {
    if (!this.pingHandle) {
      this.pingHandle = setTimeout(this.onHeartbeatTimeout, this.pingInterval);
    }
  }

  /** @private */
  onHeartbeatTimeout() {
    if (this.closed || !isWebSocketOpen(this.webSocket)) {
      return;
    }

    const { pingHandle } = this;
    if (pingHandle) {
      clearTimeout(pingHandle);
      this.pingHandle = null;
    }

    this.sendHeartbeatMessage();
    this.scheduleHeartbeat();
  }

  /** @private */
  destroy() {
    const { webSocket } = this;
    if (!webSocket) {
      webSocket.removeEventListener('open', this.onSocketOpened);
      webSocket.removeEventListener('close', this.onSocketClosed);
      webSocket.removeEventListener('message', this.onSocketMessage);
      webSocket.close();
      // Refresh token for the re-connection
      this.token = randomToken();
      this.webSocket = null;
    }

    const { pingHandle } = this;
    if (pingHandle) {
      clearTimeout(pingHandle);
      this.pingHandle = null;
    }

    const { activeStatus } = this;
    if (isPromiseStatusPending(activeStatus)) {
      rejectPromiseStatus(activeStatus, new Error('Signaling connection closed.'));
    }

    this.opened = false;
  }
}

/** @param {WebSocket} webSocket */
function isWebSocketOpen(webSocket) {
  return webSocket && webSocket.readyState === 1;
}

/**
 * @param {string} protocol
 * @param {string} host
 * @param {number} port
 * @param {string} path
 * @param {string} key
 */
function buildPeerJsSignalingUrl(protocol, host, port, path, key) {
  return `${protocol}://${host}:${port}${path}peerjs?key=${key}`;
}

/**
 *
 */
function randomToken() {
  return Math.random().toString(36).slice(2);
}

/** @typedef {import('./PeerJsSignaling.js').PeerJsSignaling} PeerJsSignaling */

/**
 * @typedef PeerfulNegotiatorEvents
 * @property {() => void} ready
 * @property {(error: Error) => void} error
 */

/**
 * @augments Eventable<PeerfulNegotiatorEvents>
 */
class PeerfulNegotiator extends Eventable {
  /**
   * @param {PeerJsSignaling} signaling
   * @param {string} localId
   * @param {RTCPeerConnection} peerConnection
   * @param {number} timeout
   */
  constructor(signaling, localId, peerConnection, timeout = 5_000) {
    super();

    /** @private */
    this.signaling = signaling;
    /** @private */
    this.peerConnection = peerConnection;
    /** @private */
    this.localId = localId;
    /** @private */
    this.remoteId = null;
    /** @private */
    this.timeout = timeout;

    /**
     * @protected
     * @type {Array<RTCIceCandidate>}
     */
    this.pendingCandidates = [];

    /** @private */
    this.completed = false;
    /** @private */
    this.iceStatus = createPromiseStatus();
    /** @private */
    this.iceTimeoutHandle = null;

    /** @private */
    this.onIceTimeout = this.onIceTimeout.bind(this);

    /** @private */
    this.onIceCandidate = this.onIceCandidate.bind(this);
    /** @private */
    this.onIceCandidateError = this.onIceCandidateError.bind(this);
    /** @private */
    this.onIceConnectionStateChange = this.onIceConnectionStateChange.bind(this);
    /** @private */
    this.onIceGatheringStateChange = this.onIceGatheringStateChange.bind(this);
    /** @private */
    this.onSignalingStateChange = this.onSignalingStateChange.bind(this);

    peerConnection.addEventListener('icecandidate', this.onIceCandidate);
    peerConnection.addEventListener('icecandidateerror', this.onIceCandidateError);
    peerConnection.addEventListener('iceconnectionstatechange', this.onIceConnectionStateChange);
    peerConnection.addEventListener('icegatheringstatechange', this.onIceGatheringStateChange);
    peerConnection.addEventListener('signalingstatechange', this.onSignalingStateChange);
  }

  destroy() {
    if (this.iceTimeoutHandle) {
      clearTimeout(this.iceTimeoutHandle);
      this.iceTimeoutHandle = null;
    }
    this.pendingCandidates.length = 0;
    let peerConnection = this.peerConnection;
    peerConnection.removeEventListener('icecandidate', this.onIceCandidate);
    peerConnection.removeEventListener('icecandidateerror', this.onIceCandidateError);
    peerConnection.removeEventListener('iceconnectionstatechange', this.onIceConnectionStateChange);
    peerConnection.removeEventListener('icegatheringstatechange', this.onIceGatheringStateChange);
    peerConnection.removeEventListener('signalingstatechange', this.onSignalingStateChange);
    this.peerConnection = null;
    if (!this.completed) {
      this.completed = true;
      rejectPromiseStatus(this.iceStatus, new Error('Negotiator closed.'));
    }
    this.clearEventListeners();
  }

  async negotiate() {
    if (!this.completed) {
      return createPromiseStatusPromise(this.iceStatus);
    }
  }

  /**
   * @param {RTCIceCandidate} candidate
   */
  addCandidate(candidate) {
    this.pendingCandidates.push(candidate);
    if (this.remoteId && this.peerConnection.remoteDescription) {
      this.onRemoteDescription(this.remoteId);
    }
  }

  /**
   * Called to flush pending candidates to be considered for connection once remote description is available.
   * @param {string} remoteId
   */
  onRemoteDescription(remoteId) {
    if (this.completed) {
      return;
    } else if (this.remoteId && this.remoteId !== remoteId) {
      debug('[NEGOTIATOR]', 'Already negotiating connection with another remote id.');
      return;
    }

    this.remoteId = remoteId;

    let candidates = this.pendingCandidates.slice();
    this.pendingCandidates.length = 0;

    for (let pending of candidates) {
      this.peerConnection
        .addIceCandidate(pending)
        .then(() => debug('[NEGOTIATOR]', 'Received candidate.'))
        .catch((e) => debug('[NEGOTIATOR]', 'Failed to add candidate.', e));
    }
  }

  /** @private */
  onIceComplete() {
    debug('[NEGOTIATOR]', 'Completed ICE candidate negotiation.');
    this.completed = true;
    resolvePromiseStatus(this.iceStatus, undefined);
  }

  /** @private */
  onIceTimeout() {
    if (!this.completed) {
      debug('[NEGOTIATOR]', 'Timed out negotiation for ICE candidates.');
      this.onIceComplete();
    }
  }

  /** @private */
  onIceGatheringStateChange() {
    let connectionState = this.peerConnection.iceConnectionState;
    let gatheringState = this.peerConnection.iceGatheringState;
    debug('[NEGOTIATOR] ICE connection:', connectionState, ', gathering:', gatheringState);
  }

  /** @private */
  onSignalingStateChange() {
    let signalingState = this.peerConnection.signalingState;
    debug('[NEGOTIATOR]', 'ICE signaling:', signalingState);
  }

  /**
   * @private
   * @param {RTCPeerConnectionIceEvent} e
   */
  onIceCandidate(e) {
    if (!e.candidate) {
      debug('[NEGOTIATOR]', 'End of ICE candidates.');
      if (!this.completed) {
        this.onIceComplete();
      }
    } else {
      debug('[NEGOTIATOR]', 'Sending an ICE candidate.');
      this.signaling.sendCandidateMessage(this.localId, this.remoteId, e.candidate);
      // Start ice timeout if not yet started
      if (!this.iceTimeoutHandle) {
        this.iceTimeoutHandle = setTimeout(this.onIceTimeout, this.timeout);
      }
    }
  }

  /**
   * @private
   * @param {RTCPeerConnectionIceErrorEvent|Event} e
   */
  onIceCandidateError(e) {
    debug('[NEGOTIATOR]', 'ICE error!', e);
  }

  /**
   * @private
   * @param {Event} e
   */
  onIceConnectionStateChange(e) {
    const conn = /** @type {RTCPeerConnection} */ (e.target);
    let connectionState = conn.iceConnectionState;
    switch (connectionState) {
      case 'checking':
        debug('[NEGOTIATOR]', 'ICE checking...');
        break;
      case 'connected':
        debug('[NEGOTIATOR]', 'ICE connected!');
        this.emit('ready');
        break;
      case 'completed':
        debug('[NEGOTIATOR]', 'ICE completed!');
        this.emit('ready');
        break;
      case 'failed':
        throw new Error('Ice connection failed.');
      case 'closed':
        throw new Error('Ice connection closed.');
    }
  }
}

/** @typedef {import('./PeerJsSignaling.js').PeerJsSignaling} PeerJsSignaling */

/**
 * @typedef PeerfulConnectionEvents
 * @property {(data: string, conn: PeerfulConnection) => void} data
 * @property {(error: Error, conn: PeerfulConnection) => void} error
 * @property {(conn: PeerfulConnection) => void} open Same as waiting on the returned promise when connecting.
 * @property {(conn: PeerfulConnection) => void} close
 */

/**
 * @augments Eventable<PeerfulConnectionEvents>
 */
class PeerfulConnection extends Eventable {
  /**
   * @param {string} id
   * @param {PeerJsSignaling} signaling
   * @param {object} [options]
   */
  constructor(id, signaling, options = undefined) {
    super();

    /** @protected */
    this.options = {
      trickle: false,
      rtcConfig: {},
      answerOptions: {},
      offerOptions: {},
      channelOptions: {},
    };
    if (options) {
      Object.assign(this.options, options);
    }

    /** @protected */
    this.opened = false;
    /** @protected */
    this.closed = false;

    this.channelReady = false;
    this.negotiatorReady = false;

    this.localId = id;
    this.remoteId = null;

    /** @protected */
    this.signaling = signaling;

    /**
     * @protected
     * @type {import('./PromiseStatus.js').PromiseStatusResult<PeerfulConnection>}
     */
    this.connectedStatus = null;
    /**
     * @protected
     * @type {RTCPeerConnection}
     */
    this.peerConnection = null;
    /**
     * @protected
     * @type {PeerfulNegotiator}
     */
    this.negotiator = null;
    /**
     * @protected
     * @type {RTCDataChannel}
     */
    this.dataChannel = null;

    /** @private */
    this.onDataChannelClose = this.onDataChannelClose.bind(this);
    /** @private */
    this.onDataChannelError = this.onDataChannelError.bind(this);
    /** @private */
    this.onDataChannelMessage = this.onDataChannelMessage.bind(this);
    /** @private */
    this.onDataChannelOpen = this.onDataChannelOpen.bind(this);
  }

  /**
   * @protected
   * @param {RTCDataChannel} channel
   */
  setDataChannel(channel) {
    let prevChannel = this.dataChannel;
    if (prevChannel === channel) {
      return;
    }
    if (prevChannel) {
      prevChannel.removeEventListener('message', this.onDataChannelMessage);
      prevChannel.removeEventListener('error', this.onDataChannelError);
      prevChannel.removeEventListener('close', this.onDataChannelClose);
      prevChannel.removeEventListener('open', this.onDataChannelOpen);
      prevChannel.close();
      if (!channel) {
        // NOTE: Force close the data channel callback.
        this.onDataChannelClose();
      }
    }
    // Setup new data channel
    this.dataChannel = channel;
    if (channel) {
      channel.binaryType = 'arraybuffer';
      channel.addEventListener('message', this.onDataChannelMessage);
      channel.addEventListener('error', this.onDataChannelError);
      channel.addEventListener('close', this.onDataChannelClose);
      channel.addEventListener('open', this.onDataChannelOpen);
    }
  }

  /**
   * @param {string} data
   */
  send(data) {
    if (!this.dataChannel) {
      throw new Error('Cannot send message to un-opened connection.');
    }

    this.dataChannel.send(data);
  }

  close() {
    if (this.closed) {
      throw new Error('Cannot close already closed connection.');
    }

    this.closed = true;
    this.opened = false;
    if (isPromiseStatusPending(this.connectedStatus)) {
      rejectPromiseStatus(this.connectedStatus, new Error('Connection closed.'));
      this.connectedStatus = null;
    }
    if (this.dataChannel) {
      this.setDataChannel(null);
    }
    if (this.negotiator) {
      this.negotiator.destroy();
      this.negotiator = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.clearEventListeners();
  }

  /**
   * @param {string} type
   * @param {RTCSessionDescription|RTCIceCandidate} sdp
   * @param {string} src
   * @param {string} dst
   */
  onSignalingResponse(type, sdp, src, dst) {}

  /**
   * @private
   * @param {MessageEvent} e
   */
  onDataChannelMessage(e) {
    debug('[CHANNEL]', 'Received message:', e.data);
    this.emit('data', e.data, this);
  }

  /**
   * @private
   */
  onDataChannelClose() {
    debug('[CHANNEL]', 'Close!');
    this.emit('close', this);
  }

  /**
   * @private
   */
  onDataChannelOpen() {
    debug('[CHANNEL]', 'Open!');
    this.channelReady = true;
    this.tryConnectionReady();
  }

  /**
   * @private
   * @param {Event} e
   */
  onDataChannelError(e) {
    // NOTE: This is an RTCErrorEvent.
    let errorEvent = /** @type {unknown} */ (e);
    let error = /** @type {{error: DOMException}} */ (errorEvent).error;
    debug('[CHANNEL]', 'Error!', error);
    this.emit('error', error, this);
  }

  /** @protected */
  tryConnectionStart() {
    if (this.opened) {
      throw new Error('Cannot open already opened connection.');
    }
    this.opened = false;
    this.closed = false;
    this.connectedStatus = createPromiseStatus();
    this.peerConnection = new RTCPeerConnection({
      iceServers: DEFAULT_ICE_SERVERS,
      ...this.options.rtcConfig,
    });
    this.negotiator = new PeerfulNegotiator(this.signaling, this.localId, this.peerConnection);
    this.negotiator.on('ready', () => {
      this.negotiatorReady = true;
      this.tryConnectionReady();
    });
    return this;
  }

  /** @protected */
  tryConnectionReady() {
    if (this.opened) {
      // Already opened.
      return;
    }
    if (!this.channelReady || !this.negotiatorReady) {
      // Not yet finished connecting.
      return;
    }
    this.opened = true;
    resolvePromiseStatus(this.connectedStatus, this);
    this.emit('open', this);
    return this;
  }
}

class PeerfulLocalConnection extends PeerfulConnection {
  /**
   * @param {string} id
   * @param {PeerJsSignaling} signaling
   * @param {object} [options]
   */
  constructor(id, signaling, options = undefined) {
    super(id, signaling, options);

    this.onNegotiationNeeded = this.onNegotiationNeeded.bind(this);
  }

  /**
   * @param {string} remoteId
   */
  async connect(remoteId) {
    debug('[LOCAL]', 'Connecting to', remoteId, '...');
    this.remoteId = remoteId;

    // Start connection
    this.tryConnectionStart();
    // Listen for negotiations...
    this.peerConnection.addEventListener('negotiationneeded', this.onNegotiationNeeded);
    // Create channel
    const channel = this.peerConnection.createDataChannel('data', this.options.channelOptions);
    this.setDataChannel(channel);
    // Wait to be connected...
    return createPromiseStatusPromise(this.connectedStatus);
  }

  onNegotiationNeeded() {
    debug('[LOCAL]', 'Negotiation needed.');
    // Send offer
    this.performOffer();
  }

  /**
   * @override
   * @param {'answer'|'candidate'} type
   * @param {RTCSessionDescription|RTCIceCandidate} sdp
   * @param {string} src
   * @param {string} dst
   */
  onSignalingResponse(type, sdp, src, dst) {
    debug('[LOCAL]', 'Received signal', type, src, dst);
    if (type === 'answer') {
      const description = /** @type {RTCSessionDescription} */ (sdp);
      // Process answer
      this.peerConnection
        .setRemoteDescription(description)
        .then(() => this.negotiator.onRemoteDescription(this.remoteId))
        .then(() => debug('[LOCAL]', 'Successfully set remote description.'))
        .catch((e) => debug('[LOCAL]', 'Failed to set remote description.', e));
      // Wait for channel to open...
    } else if (type === 'candidate') {
      const candidate = /** @type {RTCIceCandidate} */ (sdp);
      this.negotiator.addCandidate(candidate);
    } else {
      throw new Error(`Received invalid response type '${type}' on local connection.`);
    }
  }

  /**
   * @private
   * @param {RTCOfferOptions} [options]
   */
  async performOffer(options = undefined) {
    // Create offer
    debug('[LOCAL]', 'Creating offer...');
    const offer = await this.peerConnection.createOffer(options);
    await this.peerConnection.setLocalDescription(offer);
    if (this.options.trickle) {
      debug('[LOCAL]', 'Trickling ICE...');
      // Just negotiate in the background...
      this.negotiator.negotiate();
    } else {
      debug('[LOCAL]', 'Waiting for ICE to complete...');
      // Remove trickle request from sdp
      offer.sdp = offer.sdp.replace(FILTER_TRICKLE_SDP_PATTERN, '');
      // Wait for negotiation
      await this.negotiator.negotiate();
    }
    // Send offer
    debug('[LOCAL]', 'Sending offer...');
    this.signaling.sendSignalMessage(
      this.localId,
      this.remoteId,
      this.peerConnection.localDescription || offer
    );
  }
}

class PeerfulRemoteConnection extends PeerfulConnection {
  /**
   * @param {string} id
   * @param {PeerJsSignaling} signaling
   * @param {object} [options]
   */
  constructor(id, signaling, options = undefined) {
    super(id, signaling, options);

    this.onDataChannel = this.onDataChannel.bind(this);
  }

  async listen() {
    debug('[REMOTE]', 'Listening...');

    // Start connection
    this.tryConnectionStart();
    // Listen for data channels...
    this.peerConnection.addEventListener('datachannel', this.onDataChannel);
    // Wait to be connected...
    return createPromiseStatusPromise(this.connectedStatus);
  }

  /**
   * @protected
   * @param {RTCDataChannelEvent} e
   */
  onDataChannel(e) {
    debug('[REMOTE]', 'Received data channel');
    // Create channel
    this.setDataChannel(e.channel);
    // Wait for channel to open...
  }

  /**
   * @override
   * @param {'offer'|'candidate'} type
   * @param {RTCSessionDescription|RTCIceCandidate} sdp
   * @param {string} src
   * @param {string} dst
   */
  onSignalingResponse(type, sdp, src, dst) {
    debug('[REMOTE]', 'Received signal', type, src, dst);
    if (type === 'offer') {
      this.remoteId = src;
      const description = /** @type {RTCSessionDescription} */ (sdp);
      // Receive offer
      this.peerConnection
        .setRemoteDescription(description)
        .then(() => this.negotiator.onRemoteDescription(this.remoteId))
        .then(() => debug('[REMOTE]', 'Successfully set remote description from offer.'))
        .catch((e) => debug('[REMOTE]', 'Failed to set remote description from offer.', e))
        .then(async () => {
          // Send answer
          await this.performAnswer();
          // Wait to be connected...
          return createPromiseStatusPromise(this.connectedStatus);
        });
    } else if (type === 'candidate') {
      const candidate = /** @type {RTCIceCandidate} */ (sdp);
      this.negotiator.addCandidate(candidate);
    } else {
      throw new Error(`Received invalid response type '${type}' on remote connection.`);
    }
  }

  /**
   * @private
   * @param {RTCOfferAnswerOptions} [options]
   */
  async performAnswer(options = undefined) {
    // Create answer
    debug('[REMOTE]', 'Creating answer...');
    const answer = await this.peerConnection.createAnswer(options);
    await this.peerConnection.setLocalDescription(answer);
    if (this.options.trickle) {
      debug('[REMOTE]', 'Trickling ICE...');
      // Just negotiate in the background...
      this.negotiator.negotiate();
    } else {
      debug('[REMOTE]', 'Waiting for ICE to complete...');
      // Remove trickle request from sdp
      answer.sdp = answer.sdp.replace(FILTER_TRICKLE_SDP_PATTERN, '');
      // Wait for negotiation
      await this.negotiator.negotiate();
    }
    // Send answer
    debug('[REMOTE]', 'Sending answer...');
    this.signaling.sendSignalMessage(
      this.localId,
      this.remoteId,
      this.peerConnection.localDescription || answer
    );
  }
}

/**
 * @typedef {import('./PeerfulConnection.js').PeerfulConnection} PeerfulConnection
 * @typedef PeerfulEvents
 * @property {(connection: PeerfulConnection) => void} connect
 * @property {(error: Error) => void} error
 */

const LOGGER$2 = new Logger('Peerful');

/**
 * @augments Eventable<PeerfulEvents>
 */
class Peerful extends Eventable {
  /**
   * @param {string} id
   */
  constructor(id = uuid()) {
    super();

    this.id = id;

    /** @protected */
    this.closed = false;

    /** @type {Record<string, PeerfulConnection>} */
    this.connections = {};
    this.connectionOptions = {};

    /** @private */
    this.onPeerfulLocalConnectionOpen = this.onPeerfulLocalConnectionOpen.bind(this);
    /** @private */
    this.onPeerfulRemoteConnectionOpen = this.onPeerfulRemoteConnectionOpen.bind(this);

    /** @private */
    this.onSignaling = this.onSignaling.bind(this);
    /** @private */
    this.signaling = new PeerJsSignaling(id, this.onSignaling);
    /** @private */
    this.signalingPromise = this.signaling.open();
  }

  close() {
    this.closed = true;
    const conns = Object.values(this.connections);
    this.connections = {};
    for (const conn of conns) {
      conn.close();
    }
    this.signaling.close();
  }

  /**
   * @param {string} remoteId
   */
  async connect(remoteId) {
    if (this.id === remoteId) {
      throw new Error('Cannot connect to peer with the same id.');
    }
    if (this.closed) {
      throw new Error('Cannot connect to peers when already closed.');
    }
    await this.signalingPromise;

    const conn = new PeerfulLocalConnection(this.id, this.signaling, this.connectionOptions);
    this.connections[remoteId] = conn;
    // Try connecting to remote now
    try {
      await conn.connect(remoteId);
    } catch (e) {
      LOGGER$2.error('Failed to connect to peer', e);
      delete this.connections[remoteId];
    }

    this.onPeerfulLocalConnectionOpen(conn);
    return this;
  }

  async listen() {
    if (this.closed) {
      throw new Error('Cannot listen for peers when already closed.');
    }
    await this.signalingPromise;
    return this;
  }

  /**
   * @private
   * @param {string} dst
   * @returns {PeerfulRemoteConnection}
   */
  resolveRemoteConnection(dst) {
    let conn = /** @type {PeerfulRemoteConnection} */ (this.connections[dst]);
    if (conn) return conn;
    let next = new PeerfulRemoteConnection(this.id, this.signaling, this.connectionOptions);
    next.listen().then(this.onPeerfulRemoteConnectionOpen);
    this.connections[dst] = next;
    return next;
  }

  /**
   * @private
   * @param {PeerfulConnection} conn
   */
  onPeerfulLocalConnectionOpen(conn) {
    this.emit('connect', conn);
  }

  /**
   * @private
   * @param {PeerfulConnection} conn
   */
  onPeerfulRemoteConnectionOpen(conn) {
    this.emit('connect', conn);
  }

  /**
   * @private
   * @param {Error} error
   * @param {RTCSessionDescriptionInit|RTCIceCandidateInit} sdp
   * @param {string} src The source id of the signal (the remote instance)
   * @param {string} dst The destination id for the signal (the local instance)
   */
  onSignaling(error, sdp, src, dst) {
    if (error) {
      const conn = this.connections[src] || this.connections[dst];
      if (conn) {
        conn.close();
      }
      this.emit('error', error);
    } else {
      if ('type' in sdp) {
        const init = /** @type {RTCSessionDescriptionInit} */ (sdp);
        switch (init.type) {
          case 'offer':
            {
              const conn = this.resolveRemoteConnection(src);
              const description = new RTCSessionDescription(init);
              conn.onSignalingResponse('offer', description, src, dst);
            }
            break;
          case 'answer':
            {
              const conn = this.connections[src];
              if (!conn) {
                LOGGER$2.warn('Received signaling attempt when not listening.');
                return;
              }
              const description = new RTCSessionDescription(init);
              conn.onSignalingResponse('answer', description, src, dst);
            }
            break;
          default:
            LOGGER$2.warn('Received unknown signal:', init);
            break;
        }
      } else if ('candidate' in sdp) {
        const init = /** @type {RTCIceCandidateInit} */ (sdp);
        const conn = this.resolveRemoteConnection(src);
        const candidate = new RTCIceCandidate(init);
        conn.onSignalingResponse('candidate', candidate, src, dst);
      } else {
        LOGGER$2.warn('Received unknown signal:', sdp);
      }
    }
  }
}

class ActivityError extends ActivityBase {
  /**
   * @override
   * @param {SatchelLocal} local
   * @param {SatchelRemote} remote
   * @param {string} type
   * @param {object} data
   */
  static onRemoteServerMessage(local, remote, type, data) {
    if (type !== 'error') {
      return false;
    }
    window.alert(`Oops! Server error message: ${data}`);
    remote.connection.close();
    return true;
  }

  /**
   * @param {SatchelRemote} remote
   * @param {object} data
   */
  static sendError(remote, data) {
    remote.sendMessage('error', data);
  }
}

/** @typedef {import('../item/Item.js').Item} Item */

class ActivityPlayerGift extends ActivityBase {
  static get observedMessages() {
    return ['gift', 'giftack', 'giftnak'];
  }

  /**
   * @override
   * @param {SatchelLocal} localClient
   * @param {SatchelRemote} remoteServer
   * @param {string} messageType
   * @param {object} messageData
   */
  static onRemoteServerMessage(localClient, remoteServer, messageType, messageData) {
    const { from, target, item } = messageData;
    switch (messageType) {
      case 'gift':
        let freeItem = copyItem(importItemFromJSON(item));
        dropItemOnGround(freeItem);
        window.alert(`You received a gift from ${from || 'the server'}!`);
        remoteServer.sendMessage('giftack', { from, target });
        return true;
      case 'giftack':
        window.alert(`Gift sent to ${target}!`);
        return true;
      case 'giftnak':
        window.alert(`Gift failed to send to ${target}!`);
        return true;
    }
    return false;
  }

  /**
   * @override
   * @param {SatchelLocal} localServer
   * @param {SatchelRemote} remoteClient
   * @param {string} messageType
   * @param {object} messageData
   */
  static onRemoteClientMessage(localServer, remoteClient, messageType, messageData) {
    switch (messageType) {
      case 'gift':
        const target = messageData.target;
        const targetClient = ActivityPlayerHandshake.getActiveClientByName(localServer, target);
        if (targetClient) {
          // Forward the request to the target client.
          targetClient.sendMessage(messageType, messageData);
        } else {
          remoteClient.sendMessage('giftnack', undefined);
        }
        return true;
      case 'giftack':
        const from = messageData.from;
        if (from) {
          const fromClient = ActivityPlayerHandshake.getActiveClientByName(localServer, from);
          if (fromClient) {
            // Forward the request to the source client.
            fromClient.sendMessage(messageType, messageData);
          }
        } else {
          // This is a server gift.
          let { target } = messageData;
          window.alert(`Gift sent to ${target}!`);
        }
        return true;
    }
    return false;
  }

  /**
   * @param {SatchelRemote} remoteClient
   * @param {string} playerName
   * @param {Item} item
   */
  static sendPlayerItem(remoteClient, playerName, item) {
    console.log('Sending item to client...', playerName);
    remoteClient.sendMessage('gift', { from: '', target: playerName, item: exportItemToJSON(item) });
  }
}

/**
 * @typedef {import('../../peerful/PeerfulConnection.js').PeerfulConnection} PeerfulConnection
 * @typedef {import('./SatchelLocal.js').SatchelRemote} SatchelRemote
 */

const ACTIVITY_REGISTRY = [
  ActivityError,
  ActivityPlayerHandshake,
  ActivityPlayerList,
  ActivityPlayerInventory,
  ActivityPlayerGift,
];

class SatchelServer extends SatchelLocal {
  constructor(peerful) {
    super(peerful);
    /** @protected */
    this.activities = [];

    this.initialize();
  }

  /** @protected */
  initialize() {
    const toBeCreated = ACTIVITY_REGISTRY;
    for (let activity of toBeCreated) {
      try {
        activity.onLocalServerCreated(this);
        this.activities.push(activity);
      } catch (e) {
        console.error(e);
      }
    }
  }

  destroy() {
    const toBeDestroyed = this.activities.slice().reverse();
    this.activities.length = 0;
    for (let activity of toBeDestroyed) {
      try {
        activity.onLocalServerDestroyed(this);
      } catch (e) {
        console.error(e);
      }
    }
  }

  /** @override */
  onRemoteConnected(remoteClient) {
    console.log('Remote connection established.');
    for (let activity of this.activities) {
      try {
        activity.onRemoteClientConnected(this, remoteClient);
      } catch (e) {
        console.error(e);
      }
    }
  }

  /** @override */
  onRemoteDisconnected(remoteClient) {
    const reversedActivities = this.activities.slice().reverse();
    for (let activity of reversedActivities) {
      try {
        activity.onRemoteClientDisconnected(this, remoteClient);
      } catch (e) {
        console.error(e);
      }
    }
  }

  /**
   * @override
   * @param {SatchelRemote} remote
   * @param {string} type
   * @param {object} data
   */
  onRemoteMessage(remote, type, data) {
    for (let activity of this.activities) {
      try {
        let result = activity.onRemoteClientMessage(this, remote, type, data);
        if (result) {
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    console.error(`Found unknown message from client - ${data}`);
    ActivityError.sendError(remote, 'Unknown message.');
  }

  /** @override */
  onRemoteNanny(remote) {
    if (remote.connection.closed) {
      console.log('Closing connection since already closed.');
      return;
    }
    const now = performance.now();
    for (let activity of this.activities) {
      try {
        activity.onRemoteClientNanny(this, remote, now);
      } catch (e) {
        console.error(e);
      }
    }
  }

  sendItemTo(clientName, item) {
    const client = ActivityPlayerHandshake.getActiveClientByName(this, clientName);
    if (!client || !client.connection) {
      return false;
    }
    ActivityPlayerGift.sendPlayerItem(client, clientName, item);
  }
}

class SatchelClient extends SatchelLocal {
  /** @returns {SatchelRemote} */
  get remoteServer() {
    return this.remotes[0];
  }

  constructor(peerful) {
    super(peerful);
    /** @protected */
    this.activities = [];

    this.initialize();
  }

  /** @protected */
  initialize() {
    const toBeCreated = ACTIVITY_REGISTRY;
    for (let activity of toBeCreated) {
      try {
        activity.onLocalClientCreated(this);
        this.activities.push(activity);
      } catch (e) {
        console.error(e);
      }
    }
  }

  destroy() {
    const toBeDestroyed = this.activities.slice().reverse();
    this.activities.length = 0;
    for (let activity of toBeDestroyed) {
      try {
        activity.onLocalClientDestroyed(this);
      } catch (e) {
        console.error(e);
      }
    }
  }

  /** @override */
  onRemoteConnected(remoteServer) {
    console.log('Local connection established.');
    for (let activity of this.activities) {
      try {
        activity.onRemoteServerConnected(this, remoteServer);
      } catch (e) {
        console.error(e);
      }
    }
  }

  /** @override */
  onRemoteDisconnected(remoteServer) {
    console.error('Local connection closed.');
    const reversedActivities = this.activities.slice().reverse();
    for (let activity of reversedActivities) {
      activity.onRemoteServerDisconnected(this, remoteServer);
    }
    window.alert('Connection lost! Please refresh the browser and try again.');
  }

  /** @override */
  onRemoteMessage(remoteServer, type, data) {
    for (let activity of this.activities) {
      try {
        let result = activity.onRemoteServerMessage(this, remoteServer, type, data);
        if (result) {
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    console.error(`Found unknown message from server - ${data}`);
  }

  /** @override */
  onRemoteNanny(remoteServer) {
    const now = performance.now();
    for (let activity of this.activities) {
      try {
        activity.onRemoteServerNanny(this, remoteServer, now);
      } catch (e) {
        console.error(e);
      }
    }
  }

  sendItemTo(clientName, item) {
    const playerNames = ActivityPlayerList.getPlayerNameListOnClient(this);
    if (!playerNames.includes(clientName)) {
      return false;
    }
    console.log('Sending item to client...', clientName);
    const localClientName = getPlayerName(this);
    this.remoteServer.sendMessage('gift', {
      from: localClientName,
      target: clientName,
      item: exportItemToJSON(item),
    });
    return true;
  }
}

async function connectAsClient(ctx, remoteId) {
  if (!remoteId) {
    throw new Error('Missing remote id to start client.');
  }

  if (!ctx.client) {
    // Initialize client
    const peerful = new Peerful();
    ctx.client = {
      peerful,
      instance: new SatchelClient(peerful),
    };
    peerful.on('error', (err) => {
      window.alert('Oh no! Failed to connect to server! ' + err);
    });
  }

  const { peerful } = ctx.client;
  try {
    await peerful.connect(remoteId);
  } catch (error) {
    window.alert('Oh no! Failed to connect to server!');
    throw error;
  }

  window.alert('Hooray! Connected to server!');
  document.querySelector('#onlineStatus').classList.toggle('active', true);
  return true;
}

async function connectAsServer(ctx, localId) {
  if (!localId) {
    throw new Error('Missing local id to start server.');
  }
  if (!ctx.server) {
    // Initialize server
    const peerful = new Peerful(localId);
    ctx.server = {
      peerful,
      instance: new SatchelServer(peerful),
    };
    peerful.on('error', (err) => {
      window.alert('Oh no! Failed to start server! ' + err);
    });
    peerful
      .listen()
      .then(() => console.log('Server started!'))
      .catch((error) => window.alert(error));
  }

  document.querySelector('#onlineStatus').classList.toggle('active', true);
}

function loadSatchelFromStorage() {
  const store = getSatchelStore();

  // Load from storage...
  let satchelData = loadFromStorage('satchel_data_v4');
  if (satchelData) {
    try {
      let jsonData = JSON.parse(satchelData);
      loadSatchelProfilesFromData(store, jsonData, true);
    } catch (e) {
      console.error('Failed to load satchel from storage.');
      console.error(e);
    }
  }
  let albumData = loadFromStorage('satchel_album_v3');
  if (albumData) {
    try {
      let jsonData = JSON.parse(albumData);
      loadSatchelAlbumsFromData(store, jsonData, true);
    } catch (e) {
      console.error('Failed to load album from storage.');
      console.error(e);
    }
  }
}

function saveSatchelToStorage() {
  const store = getSatchelStore();
  try {
    let profileIds = getProfileIdsInStore(store);
    let profileData = saveSatchelProfilesToData(store, profileIds);
    saveToStorage('satchel_data_v4', JSON.stringify(profileData));
  } catch (e) {
    console.error(e);
  }
  try {
    let albumIds = getAlbumIdsInStore(store);
    // Do not save hidden albums
    albumIds.filter((albumId) => !isAlbumHidden(store, albumId));
    let albumData = saveSatchelAlbumsToData(store, albumIds);
    saveToStorage('satchel_album_v3', JSON.stringify(albumData));
  } catch (e) {
    console.error(e);
  }
}

function el(selector, event, callback) {
  document.querySelector(selector).addEventListener(event, callback);
}

/** @typedef {import('./lib/BannerPromptElement.js').BannerPromptElement} BannerPromptElement */

async function notify(message, confirm = false) {
  return new Promise((resolve, reject) => {
    try {
      /** @type {HTMLTemplateElement} */
      let notifyTemplate = document.querySelector('#notifyTemplate');
      let element = /** @type {BannerPromptElement} */ (
        notifyTemplate.content.firstElementChild.cloneNode(true)
      );
      let label = element.querySelector('label');
      /** @type {HTMLButtonElement} */
      let button = element.querySelector('button');
      processRichText(label, message);
      if (confirm) {
        element.toggleAttribute('required', true);
      } else {
        button.style.display = 'none';
      }
      document.body.appendChild(element);
      button.addEventListener(
        'click',
        () => {
          element.toggleAttribute('open', false);
          resolve();
        },
        { once: true }
      );
      element.addEventListener(
        'close',
        () => {
          element.remove();
        },
        { once: true }
      );
      if (!confirm) {
        resolve();
      }
    } catch (e) {
      reject(e);
    }
  });
}

function processRichText(root, message) {
  let lines = message.split('\n');
  if (lines.length > 1) {
    root.innerHTML = '';
    for (let line of lines) {
      let p = document.createElement('p');
      p.textContent = line;
      root.appendChild(p);
    }
  } else {
    root.innerHTML = message;
  }
}

/**
 * @param {string|Array<string>} [acceptFileTypes]
 * @param {boolean} [multiple]
 * @returns {Promise<FileList>}
 */
async function uploadFile$1(acceptFileTypes = undefined, multiple = false) {
  let input = document.createElement('input');
  input.type = 'file';
  if (typeof acceptFileTypes !== 'undefined') {
    input.accept = Array.isArray(acceptFileTypes) ? acceptFileTypes.join(',') : acceptFileTypes;
  }
  input.toggleAttribute('multiple', multiple);
  input.toggleAttribute('hidden');
  return new Promise((resolve, reject) => {
    let uploaded = false;
    input.addEventListener(
      'change',
      (e) => {
        if (uploaded) {
          // Already uploaded. Try resetting.
          input.value = '';
          return;
        }
        uploaded = true;
        const files = input.files;
        resolve(files);
      },
      { once: true }
    );
    window.addEventListener(
      'mouseup',
      (e) => {
        if (uploaded || input.files.length > 0) {
          // Success! It was fine!
          input.value = '';
          return;
        }
        reject(new Error('Maybe file dialog cancelled?'));
      },
      { once: true, capture: true }
    );
    try {
      document.head.appendChild(input);
      input.click();
    } catch (e) {
      reject(e);
    } finally {
      document.head.removeChild(input);
    }
  });
}

/** @typedef {import('./lib/BannerPromptElement.js').BannerPromptElement} BannerPromptElement */

const BUSY_ADJ = [
  'Fetching',
  'Feeding',
  'Wrangling',
  'Spooling',
  'Bubbling',
  'Raising',
  'Finding',
  'Investigating',
  'Pushing',
  'Pulling',
  'Committing',
  'Branching',
];
const BUSY_NOUN = [
  'Goblins',
  'Hobgoblins',
  'Beholders',
  'Ankhegs',
  'Dragons',
  'Minds',
  'Cubes',
  'Mimics',
  'Humans',
  'Gnomes',
  'Elves',
];

function randomBusyLabel() {
  let i = Math.floor(Math.random() * BUSY_ADJ.length);
  let j = Math.floor(Math.random() * BUSY_NOUN.length);
  return `${BUSY_ADJ[i]} ${BUSY_NOUN[j]}`;
}

function busy() {
  /** @type {HTMLTemplateElement} */
  let busyTemplate = document.querySelector('#busyTemplate');
  let element = /** @type {BannerPromptElement} */ (busyTemplate.content.firstElementChild.cloneNode(true));
  element.toggleAttribute('open', true);
  let label = element.querySelector('label');
  let progress = element.querySelector('span');
  label.innerHTML = randomBusyLabel();
  let ctx = getCursorContext();
  let handle = setInterval(() => {
    switch (progress.textContent) {
      case '.':
        progress.textContent = '..';
        break;
      case '..':
        progress.textContent = '...';
        break;
      case '...':
        progress.textContent = '.';
        break;
      default:
        progress.textContent = '.';
        break;
    }
  }, 300);
  ctx.busyWork = handle;
  document.body.appendChild(element);
  return () => {
    element.toggleAttribute('open', false);
    element.remove();
    let ctx = getCursorContext();
    let handle = ctx.busyWork;
    clearInterval(handle);
  };
}

/* global gapi */

// TODO: To test this, you need to use localhost (not 127.0.0.1)
// Client ID and API key from the Developer Console
const CLIENT_ID = '195145006634-0mp9f2fvmgfufp524aj70ckka4q6oc9t.apps.googleusercontent.com';
const ENCRYPTED_API_KEY = 'QUl6YVN5QmpFN3RuTkhqWVBPclhVSnVzbzR5R0NaazY0WkV0b0pV';

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

const LOGGER$1 = new Logger('GoogleDriveAPI');

function isSignedInGoogle() {
  let script = document.querySelector('#gapiScript');
  if (!script) {
    return false;
  }
  if (typeof gapi === 'undefined') {
    return false;
  }
  return gapi.auth2.getAuthInstance().isSignedIn.get();
}

async function signInGoogle() {
  await initializeGoogle();
  if (isSignedInGoogle()) {
    return true;
  }
  await gapi.auth2.getAuthInstance().signIn();
  return isSignedInGoogle();
}

async function signOutGoogle() {
  await initializeGoogle();
  if (!isSignedInGoogle()) {
    return false;
  }
  await gapi.auth2.getAuthInstance().signOut();
  return true;
}

async function readGoogleAppFile(fileName) {
  let fileId = await getFileId(fileName);
  if (!fileId) {
    return null;
  }
  return await readFile(fileId);
}

async function writeGoogleAppFile(fileName, jsonContent) {
  let fileId = await getFileId(fileName);
  if (!fileId) {
    fileId = await createFile(fileName);
  }
  await uploadFile(fileId, fileName, jsonContent);
}

async function initializeGoogle() {
  let script = document.querySelector('#gapiScript');
  if (!script) {
    LOGGER$1.info('Initializing Google...');
    return new Promise((resolve, reject) => {
      let script = document.createElement('script');
      script.id = 'gapiScript';
      script.toggleAttribute('async', true);
      script.toggleAttribute('defer', true);
      script.setAttribute('src', 'https://apis.google.com/js/api.js');
      script.addEventListener('load', () =>
        gapi.load('client:auth2', async () => {
          try {
            let apiKey = window.atob(ENCRYPTED_API_KEY);
            await gapi.client.init({
              apiKey: apiKey,
              clientId: CLIENT_ID,
              discoveryDocs: DISCOVERY_DOCS,
              scope: SCOPES,
            });
          } catch (e) {
            reject(e);
            return;
          }
          LOGGER$1.info('Google complete!');
          // Listen for sign-in state changes
          gapi.auth2.getAuthInstance().isSignedIn.listen(onGoogleSignIn);
          // Resolve the pending promise
          resolve();
        })
      );
      document.body.appendChild(script);
    });
  }
}

function onGoogleSignIn(signedIn) {
  if (signedIn) {
    LOGGER$1.info('Signed in to Google!');
  } else {
    LOGGER$1.info('Signed out from Google!');
  }
}

async function createFile(name) {
  LOGGER$1.info(`Creating Google app file '${name}'...`);
  let fileMetadata = {
    name,
    mimeType: 'application/json',
    parents: ['appDataFolder'],
  };
  let response = await gapi.client.drive.files.create({
    resource: fileMetadata,
    fields: 'id',
  });
  return response.result.id;
}

async function listFiles() {
  LOGGER$1.info('Listing Google app folder...');
  let response = await gapi.client.drive.files.list({
    spaces: 'appDataFolder',
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  });
  let files = response.result.files;
  if (!files || files.length <= 0) {
    return [];
  }
  let result = [];
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    result.push({
      id: file.id,
      name: file.name,
    });
  }
  return result;
}

const APP_FILE_ID_CACHE = {};
async function getFileId(name) {
  if (name in APP_FILE_ID_CACHE) {
    const { fileId, timestamp } = APP_FILE_ID_CACHE[name];
    let staleness = (Date.now() - timestamp) / 1_000;
    LOGGER$1.debug(`Using Google app file id from cache (${staleness}s old)...`);
    return fileId;
  }
  let result = null;
  let files = await listFiles();
  for (let file of files) {
    if (file.name === name) {
      result = file.id;
      break;
    }
  }
  if (result) {
    APP_FILE_ID_CACHE[name] = {
      fileId: result,
      timestamp: Date.now(),
    };
  }
  return result;
}

async function readFile(fileId) {
  LOGGER$1.info(`Reading Google file '${fileId}'...`);
  let response = await gapi.client.drive.files.get({
    fileId,
    alt: 'media',
  });
  return response.body;
}

async function uploadFile(fileId, name, jsonString) {
  if (typeof jsonString !== 'string') {
    throw new Error('Cannot upload non-string content.');
  }
  LOGGER$1.info(`Uploading Google file '${name}'...`);
  LOGGER$1.debug(fileId, name, typeof jsonString);
  const accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
  const response = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: new Headers({
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }),
      body: jsonString,
    }
  );
  if (response.status === 200) {
    return true;
  } else {
    LOGGER$1.error('Failed to upload file -', response, await response.text());
    return false;
  }
}

async function startCloud() {
  const ctx = getCursorContext();
  let peerId;
  if (ctx.server) {
    peerId = ctx.server.peerful.id;
  } else if (ctx.client) {
    peerId = ctx.client.peerful.remoteId;
  } else {
    peerId = ctx.sessionId;
    await connectAsServer(ctx, peerId);
  }
  const shareable = generateShareableLink(peerId);
  await copyToClipboard(shareable);
  window.alert(`Link copied!\n${shareable}`);
}

/**
 * @param {string} peerId
 * @returns {string}
 */
function generateShareableLink(peerId) {
  return `${location.origin}${location.pathname}?id=${peerId}`;
}

const LOGGER = new Logger('toolbar.sync');

function setupSync() {
  el('#actionImportGoogle', 'click', onActionImportGoogle);
  el('#actionExportGoogle', 'click', onActionExportGoogle);
  el('#actionSignOut', 'click', onActionSignOut);
  el('#actionPeer', 'click', onActionPeer);
}

function startBusyWork() {
  let callback = busy();
  let ctx = getCursorContext();
  ctx.busyCallback = callback;
}

function stopBusyWork() {
  let ctx = getCursorContext();
  let callback = ctx.busyCallback;
  callback();
}

async function onActionImportGoogle() {
  try {
    startBusyWork();
    if (!(await signInGoogle())) {
      throw new Error('Not signed in to Google.');
    }
    await loadSatchelFromGoogle();
    window.alert('Import complete!');
  } catch (e) {
    LOGGER.error('Failed to import from Google', e);
    window.alert('Error! \n' + JSON.stringify(e));
  } finally {
    stopBusyWork();
  }
}

async function onActionExportGoogle() {
  try {
    startBusyWork();
    if (!(await signInGoogle())) {
      throw new Error('Not signed in to Google.');
    }
    await saveSatchelToGoogle();
    window.alert('Save complete!');
  } catch (e) {
    LOGGER.error('Failed to export to Google', e);
    window.alert('Error! \n' + JSON.stringify(e));
  } finally {
    stopBusyWork();
  }
}

async function onActionSignOut() {
  if (await signOutGoogle()) {
    window.alert('Signed out!');
  } else {
    window.alert('Already signed out.');
  }
}

async function loadSatchelFromGoogle() {
  const store = getSatchelStore();
  // Load from google...
  let satchelData = await readGoogleAppFile('satchel_data_v4');
  if (satchelData) {
    try {
      let jsonData = JSON.parse(satchelData);
      loadSatchelProfilesFromData(store, jsonData, true);
    } catch (e) {
      LOGGER.error('Failed to load satchel from storage', e);
    }
  }
  let albumData = await readGoogleAppFile('satchel_album_v3');
  if (albumData) {
    try {
      let jsonData = JSON.parse(albumData);
      loadSatchelAlbumsFromData(store, jsonData, true);
    } catch (e) {
      LOGGER.error('Failed to load album from storage.', e);
    }
  }
}

async function saveSatchelToGoogle() {
  const store = getSatchelStore();
  try {
    let profileIds = getProfileIdsInStore(store);
    let profileData = saveSatchelProfilesToData(store, profileIds);
    await writeGoogleAppFile('satchel_data_v4', JSON.stringify(profileData));
  } catch (e) {
    LOGGER.error('Failed to save profiles to Google', e);
  }
  try {
    let albumIds = getAlbumIdsInStore(store);
    // Do not save hidden albums
    albumIds.filter((albumId) => !isAlbumHidden(store, albumId));
    let albumData = saveSatchelAlbumsToData(store, albumIds);
    await writeGoogleAppFile('satchel_album_v3', JSON.stringify(albumData));
  } catch (e) {
    LOGGER.error('Failed to save albums to Google', e);
  }
}

function onActionPeer() {
  startCloud();
}

async function tryUploadJSONFile() {
  let file;
  try {
    let files = await uploadFile$1('.json');
    file = files[0];
  } catch (e) {
    notify('Upload cancelled.');
    return null;
  }
  let jsonData;
  try {
    jsonData = JSON.parse(await file.text());
  } catch (e) {
    notify(`Error! Could not upload file.\nFile must end with '.json'.\n${e}`);
    return null;
  }
  return jsonData;
}

async function tryLoadJSONFile(store, jsonData) {
  switch (jsonData._type) {
    case 'satchel_v2':
    case 'satchel_v1':
      {
        if (!window.confirm('This will ERASE and OVERWRITE all data. Do you want to continue?')) {
          notify('Upload cancelled.');
          return;
        }
        try {
          forceEmptyStorage(true);
          loadSatchelFromData(store, jsonData, true);
          // Make sure to open the album
          openAlbumPane();
        } catch (e) {
          notify(`Error! Failed to load album file.\n${e}`);
        } finally {
          forceEmptyStorage(false);
        }
      }
      break;
    case 'profile_v2':
    case 'profile_v1':
      {
        try {
          let loadedProfileIds = loadSatchelProfilesFromData(store, jsonData, false);
          if (loadedProfileIds) {
            let profileId = loadedProfileIds[0];
            if (profileId) {
              setActiveProfileInStore(store, profileId);
            }
          }
        } catch (e) {
          notify(`Error! Failed to load satchel file.\n${e}`);
        }
      }
      break;
    case 'album_v3':
    case 'album_v2':
    case 'album_v1':
      {
        try {
          const album = importAlbumFromJSON(jsonData);
          if (isInvInStore(store, album.invId)) {
            const newAlbum = copyInventory(album);
            addInvInStore(store, newAlbum.invId, newAlbum);
          } else {
            addInvInStore(store, album.invId, album);
          }
          // Make sure to open the container
          openAlbumPane();
        } catch (e) {
          notify(`Error! Failed to load album file.\n${e}`);
        }
      }
      break;
    case 'item_v2':
    case 'item_v1':
      {
        try {
          let freeItem = copyItem(importItemFromJSON(jsonData));
          dropItemOnGround(freeItem);
        } catch (e) {
          notify(`Error! Failed to load item file.\n${e}`);
        }
      }
      break;
    default:
      notify(`Error! Could not upload file.\nUnknown data format: ${jsonData._type}`);
      break;
  }
}

async function uploadSatchelFile() {
  try {
    startBusyWork();
    let result = await tryUploadJSONFile();
    if (!result) {
      return;
    }
    const store = getSatchelStore();
    tryLoadJSONFile(store, result);
    notify('Upload completed!');
  } finally {
    stopBusyWork();
  }
}

function setupAlbum() {
  el('#actionAlbumOpen', 'click', onActionAlbumOpen);
  el('#actionAlbumNew', 'click', onActionAlbumNew);
  el('#actionAlbumImport', 'click', uploadSatchelFile);
  el('.albumContainer', 'mouseup', onAlbumItemDrop);
  addInventoryListChangeListener(getSatchelStore(), onAlbumListUpdate);
}

function openAlbumPane() {
  // Make sure to open the container
  let albumContainer = document.querySelector('.albumContainer');
  if (!albumContainer.classList.contains('open')) {
    onActionAlbumOpen();
  }
}

function onActionAlbumOpen() {
  let albumContainer = document.querySelector('.albumContainer');
  albumContainer.classList.toggle('open');
  let isOpen = albumContainer.classList.contains('open');
  if (isOpen) {
    playSound('openBag');
  } else {
    playSound('closeBag');
  }
}

function onAlbumItemDrop(e) {
  const store = getSatchelStore();
  const albums = getAlbumsInStore(store)
    .filter((a) => !isAlbumLocked(store, a.invId))
    .filter((a) => !isGroundAlbum(a))
    .filter((a) => !isTrashAlbum(a))
    .filter((a) => !isAlbumHidden(store, a.invId));
  let cursor = getCursor();
  // HACK: This is so single clicks won't create albums
  // @ts-ignore
  if (cursor.hasHeldItem() && !cursor.ignoreFirstPutDown) {
    let albumId;
    if (albums.length > 0) {
      albumId = albums[0].invId;
    } else {
      albumId = onActionAlbumNew();
    }
    let result = cursor.putDownInAlbum(albumId);
    if (result) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
}

function onAlbumListUpdate() {
  const store = getSatchelStore();
  const list = getAlbumsInStore(store)
    .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''))
    .filter((a) => !isGroundAlbum(a))
    .filter((a) => !isTrashAlbum(a))
    .filter((a) => !isAlbumHidden(store, a.invId))
    .map((a) => a.invId)
    .reverse();
  const albumList = document.querySelector('#albumList');
  const factoryCreate = (key) => new AlbumPackElement(key);
  updateList(albumList, list, factoryCreate);
}

function onActionAlbumNew() {
  const store = getSatchelStore();
  const albumId = uuid();
  createAlbumInStore(store, albumId);
  const albumList = document.querySelector('#albumList');
  albumList.scrollTo(0, 0);
  return albumId;
}

/** @typedef {import('../components/lib/BannerPromptElement.js').BannerPromptElement} BannerPromptElement */

function setupProfile() {
  el('#actionProfile', 'click', onActionProfile);
  el('#actionProfileNew', 'click', onActionProfileNew);
  el('#actionProfileImport', 'click', onActionProfileImport);
  el('#actionProfileInvNew', 'click', onActionProfileInvNew);
  el('#actionProfileInvSubmit', 'click', onActionProfileInvSubmit);
  el('#actionProfileEditName', 'input', onActionProfileEditName);
}

function onActionProfile() {
  const store = getSatchelStore();
  const profileIds = getProfileIdsInStore(store);
  const activeProfile = resolveActiveProfile(store);
  const rootContainerElement = document.querySelector('#activeProfileList');
  rootContainerElement.innerHTML = '';
  for (let profileId of profileIds) {
    let profile = getProfileInStore(store, profileId);
    let elementId = `activeProfile-${profileId}`;
    let element = document.createElement('input');
    element.type = 'radio';
    element.name = 'activeProfile';
    element.id = elementId;
    element.value = profileId;
    let isActive = profileId === activeProfile.profileId;
    if (isActive) {
      element.checked = true;
    }
    element.addEventListener('click', onActionProfileActive);
    let labelElement = document.createElement('label');
    labelElement.setAttribute('for', elementId);
    labelElement.textContent = profile.displayName;
    let editElement = document.createElement('icon-button');
    editElement.setAttribute('data-profile', profileId);
    editElement.setAttribute('icon', 'res/edit.svg');
    editElement.setAttribute('alt', 'edit');
    editElement.setAttribute('title', 'Edit Profile');
    editElement.addEventListener('click', onActionProfileEdit);
    let exportElement = document.createElement('icon-button');
    exportElement.setAttribute('data-profile', profileId);
    exportElement.setAttribute('icon', 'res/download.svg');
    exportElement.setAttribute('alt', 'export');
    exportElement.setAttribute('title', 'Export Profile');
    exportElement.addEventListener('click', onActionProfileExport);
    let deleteElement = document.createElement('icon-button');
    deleteElement.setAttribute('data-profile', profileId);
    deleteElement.setAttribute('icon', 'res/delete.svg');
    deleteElement.setAttribute('alt', 'delete');
    deleteElement.setAttribute('title', 'Delete Profile');
    deleteElement.toggleAttribute('disabled', profileIds.length <= 1);
    deleteElement.addEventListener('click', onActionProfileDelete);
    let containerElement = document.createElement('div');
    containerElement.appendChild(element);
    containerElement.appendChild(labelElement);
    containerElement.appendChild(editElement);
    containerElement.appendChild(exportElement);
    containerElement.appendChild(deleteElement);
    rootContainerElement.appendChild(containerElement);
  }
  /** @type {BannerPromptElement} */
  const profilesDialog = document.querySelector('#profilesDialog');
  profilesDialog.toggleAttribute('open', true);
}

function onActionProfileActive(e) {
  const store = getSatchelStore();
  let profileId = e.target.value;
  if (!isProfileInStore(store, profileId)) {
    return;
  }
  let activeProfile = getActiveProfileInStore(store);
  if (activeProfile && activeProfile.profileId === profileId) {
    return;
  }
  setActiveProfileInStore(store, profileId);
  onActionProfile();
}

function onActionProfileNew() {
  const store = getSatchelStore();
  const profileIds = getProfileIdsInStore(store);
  const displayName = `Satchel ${profileIds.length + 1}`;
  let newProfile = createProfile(uuid());
  newProfile.displayName = displayName;
  let newInv = createGridInvInStore(store, uuid(), 12, 9);
  newProfile.invs.push(newInv.invId);
  addProfileInStore(store, newProfile.profileId, newProfile);
  setActiveProfileInStore(store, newProfile.profileId);
  onActionProfile();
}

function onActionProfileEdit(e) {
  const store = getSatchelStore();
  /** @type {HTMLButtonElement} */
  const target = e.target;
  const profileId = target.getAttribute('data-profile');
  if (!isProfileInStore(store, profileId)) {
    return;
  }
  const activeProfile = getActiveProfileInStore(store);
  if (activeProfile.profileId !== profileId) {
    setActiveProfileInStore(store, profileId);
  }

  // Prepare edit dialog
  prepareEditProfileDialog(store, profileId);

  /** @type {BannerPromptElement} */
  const inventoriesDialog = document.querySelector('#inventoriesDialog');
  inventoriesDialog.toggleAttribute('open', true);
}

function onActionProfileEditName(e) {
  const store = getSatchelStore();
  const activeProfile = getActiveProfileInStore(store);
  if (!activeProfile) {
    return;
  }
  activeProfile.displayName = e.target.value;
  dispatchProfileChange(store, activeProfile.profileId);
}

function prepareEditProfileDialog(store, profileId) {
  const profile = getProfileInStore(store, profileId);
  const rootContainerElement = document.querySelector('#activeInventoryList');
  rootContainerElement.innerHTML = '';
  for (let invId of profile.invs) {
    let inv = getInvInStore(store, invId);
    let labelElement = document.createElement('label');
    labelElement.textContent = `${inv.displayName || 'Inventory'} | ${inv.width}⨯${inv.height}`;
    let deleteElement = document.createElement('icon-button');
    deleteElement.setAttribute('data-profile', profileId);
    deleteElement.setAttribute('data-inv', invId);
    deleteElement.setAttribute('icon', 'res/delete.svg');
    deleteElement.setAttribute('alt', 'delete');
    deleteElement.setAttribute('title', 'Delete Inventory');
    deleteElement.addEventListener('click', onActionProfileInvDelete);
    let containerElement = document.createElement('div');
    containerElement.appendChild(labelElement);
    containerElement.appendChild(deleteElement);
    rootContainerElement.appendChild(containerElement);
  }
  for (let albumId of profile.albums) {
    let album = getInvInStore(store, albumId);
    let labelElement = document.createElement('label');
    labelElement.textContent = `${album.displayName || 'Inventory'} | ∞`;
    let deleteElement = document.createElement('icon-button');
    deleteElement.setAttribute('data-profile', profileId);
    deleteElement.setAttribute('data-album', albumId);
    deleteElement.setAttribute('icon', 'res/delete.svg');
    deleteElement.setAttribute('alt', 'delete');
    deleteElement.setAttribute('title', 'Delete Inventory');
    deleteElement.addEventListener('click', onActionProfileAlbumDelete);
    let containerElement = document.createElement('div');
    containerElement.appendChild(labelElement);
    containerElement.appendChild(deleteElement);
    rootContainerElement.appendChild(containerElement);
  }
  /** @type {HTMLInputElement} */
  const titleElement = document.querySelector('#actionProfileEditName');
  titleElement.value = profile.displayName;
  /** @type {HTMLOutputElement} */
  const outputElement = document.querySelector('#outputProfileEditId');
  outputElement.textContent = profileId;
}

async function onActionProfileImport() {
  await uploadSatchelFile();
  onActionProfile();
}

function onActionProfileExport(e) {
  const store = getSatchelStore();
  /** @type {HTMLButtonElement} */
  const target = e.target;
  const profileId = target.getAttribute('data-profile');
  if (!isProfileInStore(store, profileId)) {
    return;
  }
  const profile = getProfileInStore(store, profileId);
  const name = profile.displayName || 'Profile';
  const json = saveSatchelProfilesToData(store, [profile.profileId]);
  downloadText(`${name}-profile.json`, JSON.stringify(json, null, 4));
}

function onActionProfileDelete(e) {
  if (!window.confirm('Are you sure you want to delete this profile?')) {
    return;
  }
  const store = getSatchelStore();
  /** @type {HTMLButtonElement} */
  const target = e.target;
  const profileId = target.getAttribute('data-profile');
  if (!isProfileInStore(store, profileId)) {
    return;
  }
  let profile = getProfileInStore(store, profileId);
  for (let invId of profile.invs) {
    let inv = getInvInStore(store, invId);
    deleteInvInStore(store, invId, inv);
  }
  deleteProfileInStore(store, profile.profileId, profile);
  onActionProfile();
}

function onActionProfileAlbumDelete(e) {
  if (!window.confirm('Are you sure you want to delete this inventory?')) {
    return;
  }
  const store = getSatchelStore();
  const profileId = e.target.getAttribute('data-profile');
  if (!isProfileInStore(store, profileId)) {
    return;
  }
  const albumId = e.target.getAttribute('data-album');
  if (!isInvInStore(store, albumId)) {
    return;
  }
  let profile = getProfileInStore(store, profileId);
  let i = profile.albums.indexOf(albumId);
  if (i >= 0) {
    profile.albums.splice(i, 1);
    dispatchProfileChange(store, profileId);
  }
  let album = getInvInStore(store, albumId);
  deleteInvInStore(store, albumId, album);
  prepareEditProfileDialog(store, profileId);
}

function onActionProfileInvDelete(e) {
  if (!window.confirm('Are you sure you want to delete this inventory?')) {
    return;
  }
  const store = getSatchelStore();
  const profileId = e.target.getAttribute('data-profile');
  if (!isProfileInStore(store, profileId)) {
    return;
  }
  const invId = e.target.getAttribute('data-inv');
  if (!isInvInStore(store, invId)) {
    return;
  }
  let profile = getProfileInStore(store, profileId);
  let i = profile.invs.indexOf(invId);
  if (i >= 0) {
    profile.invs.splice(i, 1);
    dispatchProfileChange(store, profileId);
  }
  let inv = getInvInStore(store, invId);
  deleteInvInStore(store, invId, inv);
  prepareEditProfileDialog(store, profileId);
}

function onActionProfileInvNew() {
  const store = getSatchelStore();
  const activeProfile = getActiveProfileInStore(store);
  if (!activeProfile) {
    return;
  }
  /** @type {BannerPromptElement} */
  const profileInventoryDialog = document.querySelector('#profileInventoryDialog');
  profileInventoryDialog.toggleAttribute('open', true);
}

function onActionProfileInvSubmit() {
  const store = getSatchelStore();
  let activeProfile = getActiveProfileInStore(store);
  if (!activeProfile) {
    return;
  }
  /** @type {HTMLInputElement} */
  const actionProfileInvType = document.querySelector('#actionProfileInvType');
  /** @type {HTMLInputElement} */
  const actionProfileInvTitle = document.querySelector('#actionProfileInvTitle');
  /** @type {HTMLInputElement} */
  const actionProfileInvWidth = document.querySelector('#actionProfileInvWidth');
  /** @type {HTMLInputElement} */
  const actionProfileInvHeight = document.querySelector('#actionProfileInvHeight');
  let type = actionProfileInvType.value;
  let title = actionProfileInvTitle.value.trim();
  let width = Math.min(99, Math.max(1, Number(actionProfileInvWidth.value) || 0));
  let height = Math.min(99, Math.max(1, Number(actionProfileInvHeight.value) || 0));
  const newInvId = uuid();
  if (type === 'space') {
    const newAlbumId = uuid();
    const newAlbum = createAlbum(newAlbumId);
    newAlbum.displayName = title;
    newAlbum.flags |= ALBUM_FLAG_HIDDEN_BIT;
    addInvInStore(store, newAlbumId, newAlbum);
    activeProfile.albums.push(newAlbumId);
  } else {
    let newInv;
    switch (type) {
      case 'grid':
        newInv = createGridInventory(newInvId, width, height);
        break;
      case 'socket':
        newInv = createSocketInventory(newInvId);
        break;
      default:
        throw new Error('Unknown inventory type.');
    }
    newInv.displayName = title;
    addInvInStore(store, newInv.invId, newInv);
    activeProfile.invs.push(newInvId);
  }
  dispatchProfileChange(store, activeProfile.profileId);
  prepareEditProfileDialog(store, activeProfile.profileId);

  /** @type {BannerPromptElement} */
  const profileInventoryDialog = document.querySelector('#profileInventoryDialog');
  profileInventoryDialog.toggleAttribute('open', false);
}

async function setupTutorial() {
  let skipTutorial = loadFromStorage('skipTutorial') === 'true';
  if (skipTutorial) {
    return;
  }
  setupTutorial01();
}

function resetTutorial() {
  saveToStorage('skipTutorial', 'false');
  closeFoundry();
  teardownTutorial01();
  teardownTutorial02();
  teardownTutorial03();
}

function openTutorial(target, tooltip) {
  let rect = target.getBoundingClientRect();
  let x = rect.x + rect.width / 2;
  let y = rect.y + rect.height + 10;
  tooltip.x = x;
  tooltip.y = y;
  tooltip.toggleAttribute('open', true);
}

function openTooltip(target, tooltip, offsetX = 0, offsetY = 0) {
  let rect = target.getBoundingClientRect();
  let x = rect.x + rect.width / 2 + offsetX;
  let y = rect.y + rect.height / 2 + offsetY;
  tooltip.x = x;
  tooltip.y = y;
  tooltip.toggleAttribute('open', true);
}

function closeTutorial(target, tooltip) {
  tooltip.toggleAttribute('open', false);
}

function setupTutorialClick(target, tooltip, callback) {
  openTutorial(target, tooltip);
  target.addEventListener('click', callback);
}

function teardownTutorialClick(target, tooltip, callback) {
  target.removeEventListener('click', callback);
  closeTutorial(target, tooltip);
}

function setupTutorial01() {
  let target = document.querySelector('#actionItemEdit');
  let tooltip = document.querySelector('#tooltipTutorial01');
  setupTutorialClick(target, tooltip, onTutorial01);
}

function teardownTutorial01() {
  let target = document.querySelector('#actionItemEdit');
  let tooltip = document.querySelector('#tooltipTutorial01');
  teardownTutorialClick(target, tooltip, onTutorial01);
}

function onTutorial01() {
  teardownTutorial01();
  setupTutorial02();
}

function setupTutorial02() {
  let target = document.querySelector('#actionFoundryNew');
  let tooltip = document.querySelector('#tooltipTutorial02');
  setupTutorialClick(target, tooltip, onTutorial02);
}

function teardownTutorial02() {
  let target = document.querySelector('#actionFoundryNew');
  let tooltip = document.querySelector('#tooltipTutorial02');
  teardownTutorialClick(target, tooltip, onTutorial02);
}

function onTutorial02() {
  teardownTutorial02();
  setupTutorial03();
}

function setupTutorial03() {
  let target = document.querySelector('#editorWatermark');
  let tooltip = document.querySelector('#tooltipTutorial03');
  let rect = target.getBoundingClientRect();
  let x = rect.x + rect.width / 2;
  let y = rect.y + rect.height / 3;
  tooltip.x = x;
  tooltip.y = y;
  tooltip.toggleAttribute('open', true);
  let editor = document.querySelector('#itemEditor');
  // HACK: This is to get the underlying inventory id for the item editor
  // @ts-ignore
  let invId = editor.socket.invId;
  const store = getSatchelStore();
  addInventoryChangeListener(store, invId, onTutorial03);
}

function teardownTutorial03() {
  let target = document.querySelector('#editorWatermark');
  let tooltip = document.querySelector('#tooltipTutorial03');
  closeTutorial(target, tooltip);
  let editor = document.querySelector('#itemEditor');
  // HACK: This is to get the underlying inventory id for the item editor
  // @ts-ignore
  let invId = editor.socket.invId;
  const store = getSatchelStore();
  removeInventoryChangeListener(store, invId, onTutorial03);
}

// NOTE: Since creating a new item calls clear then put. This can be called twice by "+ Item" button.
let tutorial03DebounceHandle = null;
function onTutorial03(store, invId) {
  if (tutorial03DebounceHandle) {
    return;
  }
  tutorial03DebounceHandle = setTimeout(() => {
    if (isInventoryEmpty(store, invId)) {
      teardownTutorial03();
      saveToStorage('skipTutorial', 'true');
      setupTutorial04();
    }
    tutorial03DebounceHandle = null;
  });
}

function setupTutorial04() {
  let tooltipDelete = document.querySelector('#tooltipDelete');
  let targetDelete = document.querySelector('#actionGroundDelete');
  let tooltipFoundry = document.querySelector('#tooltipFoundry');
  let targetFoundry = document.querySelector('#actionItemEdit');
  let tooltipAlbums = document.querySelector('#tooltipAlbums');
  let targetAlbums = document.querySelector('#actionAlbumOpen');
  let tooltipSettings = document.querySelector('#tooltipSettings');
  let targetSettings = document.querySelector('#actionSettings');
  openTooltip(targetDelete, tooltipDelete, -30, -35);
  openTooltip(targetFoundry, tooltipFoundry, 0, 10);
  openTooltip(targetAlbums, tooltipAlbums, 30, 20);
  openTooltip(targetSettings, tooltipSettings, 0, 30);
}

window.addEventListener('DOMContentLoaded', () => {
  el('#downloadButton', 'click', onDownloadClick);
  el('#uploadButton', 'click', uploadSatchelFile);
  el('#actionSoundToggle', 'click', onActionSoundToggle);
  el('#cloudButton', 'click', onCloudClick);
  el('#actionEraseAll', 'click', onActionEraseAll);

  el('#actionShareItem', 'click', onActionShareItem);
  el('#actionSettings', 'click', onActionSettings);

  el('#actionItemCodeImport', 'click', onActionItemCodeImport);
  el('#actionItemCodeExport', 'click', onActionItemCodeExport);
  el('#actionItemDuplicate', 'click', onActionItemDuplicate);
  el('#actionFoundryReset', 'mouseup', onActionFoundryReset);
  el('#actionFoundryNew', 'click', onActionFoundryNew);
  el('#giftCodeExport', 'click', onGiftCodeExport);
  el('#giftSubmit', 'click', onGiftSubmit);

  el('#itemCodeSubmit', 'click', onActionItemCodeSubmit);
  el('#actionGroundDelete', 'contextmenu', onTrashClick);
  el('#actionFoundryReset', 'contextmenu', onTrashClick);
  el('#actionGroundDelete', 'dblclick', onActionGroundClear);
  el('#actionTrashClear', 'click', onActionTrashClear);
  el('#trashAlbum', 'mouseup', onActionTrashDrop);
  el('#actionTutorialReset', 'click', onActionTutorialReset);

  setupProfile();
  setupSync();
  setupAlbum();
  setupTutorial();

  document.addEventListener('itemcontext', onItemContext);
});

function onActionGroundClear() {
  const store = getSatchelStore();
  if (!hasGroundAlbum(store)) {
    return;
  }
  let albumId = getGroundAlbumId(store);
  let itemIds = getItemIdsInInv(store, albumId);
  if (itemIds.length <= 0) {
    return;
  }
  if (!window.confirm('Clear all items on the ground?')) {
    return;
  }
  for (let itemId of itemIds) {
    let item = getItemInInv(store, albumId, itemId);
    saveItemToTrashAlbum(item);
  }
  clearItemsOnGround();
}

function onTrashClick(e) {
  /** @type {import('./components/lib/ContextMenuElement.js').ContextMenuElement} */
  const trashDialog = document.querySelector('#trashDialog');
  let rect = e.target.getBoundingClientRect();
  trashDialog.x = rect.x + rect.width / 2;
  trashDialog.y = rect.y + rect.height / 2;
  trashDialog.toggleAttribute('open', true);
  e.preventDefault();
  e.stopPropagation();
  return false;
}

function onActionTrashDrop(e) {
  const cursor = getCursor();
  const store = getSatchelStore();
  const albumId = getTrashAlbumId(store);
  if (!isInvInStore(store, albumId)) {
    return;
  }
  if (cursor.putDownInAlbum(albumId)) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}

function onActionTrashClear() {
  const store = getSatchelStore();
  const trashAlbumId = getTrashAlbumId(store);
  let itemIds = getItemIdsInInv(store, trashAlbumId);
  if (itemIds.length <= 0) {
    return;
  }
  if (!window.confirm('This will destroy all items in the trash. Are you sure?')) {
    return;
  }
  clearItemsInInventory(store, trashAlbumId);
  playSound('clearItem');
}

function onActionShareItem() {
  /** @type {import('./components/itemeditor/ItemDialogElement.js').ItemDialogElement} */
  const itemEditor = document.querySelector('#itemDialog');
  const socketedItem = itemEditor.copySocketedItem();
  try {
    if (socketedItem) {
      /** @type {HTMLSelectElement} */
      let giftTarget = document.querySelector('#giftTarget');
      let ctx = getCursorContext();
      if (ctx.server && ctx.server.instance) {
        const localServer = /** @type {import('./satchel/peer/PeerSatchel.js').SatchelServer} */ (
          ctx.server.instance
        );
        const playerNames = ActivityPlayerList.getPlayerNameListOnServer(localServer);
        let content = playerNames
          .map((clientName) => `<option>${clientName.toLowerCase()}</option>`)
          .join('\n');
        giftTarget.innerHTML = content;
      } else if (ctx.client && ctx.client.instance) {
        const localClient = /** @type {import('./satchel/peer/PeerSatchel.js').SatchelClient} */ (
          ctx.client.instance
        );
        const playerNames = ActivityPlayerList.getPlayerNameListOnClient(localClient);
        let content = playerNames
          .map((clientName) => `<option>${clientName.toLowerCase()}</option>`)
          .join('\n');
        giftTarget.innerHTML = content;
      } else {
        giftTarget.innerHTML = '';
      }
      let giftDialog = document.querySelector('#giftDialog');
      giftDialog.toggleAttribute('open', true);
    }
  } catch (e) {
    console.error('Failed to export item', e);
  }
}

function onGiftSubmit() {
  /** @type {HTMLSelectElement} */
  let giftTarget = document.querySelector('#giftTarget');
  if (giftTarget.value) {
    /** @type {import('./components/itemeditor/ItemDialogElement.js').ItemDialogElement} */
    const itemDialog = document.querySelector('#itemDialog');
    const socketedItem = itemDialog.copySocketedItem();
    const target = giftTarget.value;
    const ctx = getCursorContext();
    if (ctx.server && ctx.server.instance) {
      ctx.server.instance.sendItemTo(target, socketedItem);
    } else if (ctx.client && ctx.client.instance) {
      ctx.client.instance.sendItemTo(target, socketedItem);
    }
  }
  let giftDialog = document.querySelector('#giftDialog');
  giftDialog.toggleAttribute('open', false);
}

function onGiftCodeExport() {
  /** @type {import('./components/itemeditor/ItemDialogElement.js').ItemDialogElement} */
  const itemDialog = document.querySelector('#itemDialog');
  const socketedItem = itemDialog.copySocketedItem();
  const itemString = exportItemToString(socketedItem);
  copyToClipboard(itemString).then(() => {
    window.alert(
      'Copied to clipboard!\n\nShare this code with a friend, then import item by pasting in Foundry.'
    );
  });
}

function onActionEraseAll() {
  if (!window.confirm('This will erase all content. Are you sure?')) {
    return;
  }
  forceEmptyStorage();
  window.location.reload();
}

function onActionItemDuplicate(e) {
  if (!isFoundryOpen()) {
    return;
  }
  const newItem = copyFoundry();
  if (newItem) {
    const clientRect = e.target.getBoundingClientRect();
    dropFallingItem(newItem, clientRect.x, clientRect.y);
  }
}

function onActionFoundryNew() {
  if (!isFoundryOpen()) {
    return;
  }
  clearFoundry();
  const newItem = new ItemBuilder().fromDefault().width(2).height(2).build();
  openFoundry(newItem);
  playSound('spawnItem');
}

function onDownloadClick() {
  const timestamp = Date.now();
  const store = getSatchelStore();
  const json = saveSatchelToData(store);
  downloadText(`satchel-data-${timestamp}.json`, JSON.stringify(json, null, 4));
}

async function onCloudClick(e) {
  /** @type {import('./components/lib/ContextMenuElement.js').ContextMenuElement} */
  let cloudDialog = document.querySelector('#cloudDialog');
  let rect = e.target.getBoundingClientRect();
  let x = rect.x + rect.width / 2;
  let y = rect.y + rect.height / 2;
  cloudDialog.x = x;
  cloudDialog.y = y;
  cloudDialog.toggleAttribute('open', true);
}

function onActionSettings() {
  let settingsDialog = document.querySelector('#settingsDialog');
  settingsDialog.toggleAttribute('open', true);
}

function onItemContext(e) {
  e.preventDefault();
  e.stopPropagation();

  /** @type {import('./components/itemeditor/ItemDialogElement.js').ItemDialogElement} */
  const itemDialog = document.querySelector('#itemDialog');
  // @ts-ignore
  const { container, invId, itemId, clientX, clientY } = e.detail;
  if (invId && itemId) {
    itemDialog.openDialog(container, invId, itemId, clientX, clientY);
  }
  return false;
}

function onActionItemCodeExport() {
  /** @type {import('./components/itemeditor/ItemEditorElement.js').ItemEditorElement} */
  const itemEditor = document.querySelector('#itemEditor');
  let item = itemEditor.getSocketedItem();
  if (!item) {
    window.alert('No item to copy :(\n\nPut an item in Foundry to copy item code.');
    return;
  }
  let itemString = exportItemToString(item);
  copyToClipboard(itemString).then(() => {
    window.alert(
      `Copied to clipboard! Share this with a friend, then paste the code in Foundry.\n\n${itemString}`
    );
  });
}

async function onActionItemCodeImport(e) {
  let newItem;
  try {
    let itemString = await pasteFromClipboard();
    newItem = importItemFromString(itemString);
  } catch (e) {
    // Do nothing.
  }
  if (newItem) {
    /** @type {import('./components/itemeditor/ItemEditorElement.js').ItemEditorElement} */
    const itemEditor = document.querySelector('#itemEditor');
    itemEditor.clearSocketedItem();
    itemEditor.putSocketedItem(newItem, true);
  } else {
    /** @type {import('./components/lib/ContextMenuElement.js').ContextMenuElement} */
    const itemCodeDialog = document.querySelector('#itemCodeDialog');
    let rect = e.target.getBoundingClientRect();
    itemCodeDialog.x = rect.x + rect.width / 2;
    itemCodeDialog.y = rect.y + rect.height / 2;
    itemCodeDialog.toggleAttribute('open', true);
  }
}

async function onActionItemCodeSubmit() {
  /** @type {HTMLInputElement} */
  let itemCodeInput = document.querySelector('#itemCodeInput');
  let itemString = itemCodeInput.value;
  itemCodeInput.value = '';
  let newItem;
  try {
    newItem = importItemFromString(itemString);
  } catch (e) {
    notify(
      'Sorry! That is not a valid item code. Try copy a valid item code text then click this button again.\n\n' +
        e
    );
  }
  if (newItem) {
    /** @type {import('./components/itemeditor/ItemEditorElement.js').ItemEditorElement} */
    const itemEditor = document.querySelector('#itemEditor');
    itemEditor.clearSocketedItem();
    itemEditor.putSocketedItem(newItem, true);
  } else {
    const itemCodeDialog = document.querySelector('#itemCodeDialog');
    itemCodeDialog.toggleAttribute('open', true);
  }
}

function onActionFoundryReset(e) {
  if (!isFoundryOpen()) {
    return;
  }
  if (e.button === 2) {
    return;
  }
  const prevItem = clearFoundry();
  if (!prevItem) {
    closeFoundry();
  } else {
    saveItemToTrashAlbum(prevItem);
  }
}

function onActionSoundToggle() {
  toggleSound();
}

function onActionTutorialReset() {
  resetTutorial();
  setupTutorial();
}

async function connect() {
  let session = resolveSessionStatus();
  let ctx = getCursorContext();
  ctx.sessionId = session.sessionId;
  ctx.remoteId = session.remoteId;
  try {
    if (session.sessionId === session.remoteId) {
      // Start a server...when they click the cloud.
    } else {
      // Start a client...now.
      await connectAsClient(ctx, session.remoteId);
    }
    document.querySelector('#cloudButton').toggleAttribute('disabled', false);
  } catch (e) {
    throw e;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // Set build version
  document.querySelector('#appVersion').textContent = `v${BUILD_VERSION}`;

  if (document.hasFocus()) {
    setTimeout(onDocumentFocusUpdate, 300);
  } else {
    onDocumentFocusUpdate();
  }
});

async function onDocumentFocusUpdate() {
  if (!document.hasFocus()) {
    setTimeout(onDocumentFocusUpdate, 300);
    return;
  }
  // Connect session
  try {
    await connect();
  } catch (e) {
    window.alert('Could not connect: ' + e);
  } finally {
    // Initialize satchel from storage.
    loadSatchelFromStorage();
    // Set up active profile
    setupActiveProfile();
    // Set up autosave
    setInterval(() => {
      saveSatchelToStorage();
    }, 1_000);
  }
}
