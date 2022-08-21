import { exportDataToJSON, importDataFromJSON } from './DataLoader.js';
import { exportItemToJSON, importItemFromJSON } from './ItemLoader.js';
import { compressInventoryJson, decompressInventoryJson } from './InvLoader.js';
import { cloneInventory } from '../satchel/inv/Inv.js';
import { uuid } from '../util/uuid.js';
import { createAlbum } from '../satchel/album/Album.js';
import { cloneItem, copyItem } from '../satchel/item/Item.js';

/**
 * @typedef {import('../satchel/album/Album.js').Album} Album
 * @typedef {import('./DataLoader.js').ImportDataFormat} ImportDataFormat
 */

/**
 * @param {Album} album
 * @param {object} [dst]
 * @returns {ImportDataFormat}
 */
export function exportAlbumToJSON(album, dst = undefined) {
  return exportDataToJSON('album_v3', compressInventoryJson(cloneInventory(album)), {}, dst);
}

/**
 * @param {object} jsonData
 * @param {Album} [dst]
 * @returns {Album}
 */
export function importAlbumFromJSON(jsonData, dst = undefined) {
  switch (jsonData._type) {
    case 'album_v1':
      return importDataFromJSON(jsonData, 'album_v1', (data) => cloneAlbum(data, dst));
    case 'album_v2':
      return importDataFromJSON(jsonData, 'album_v2', (data) => cloneAlbum(decompressAlbumJson(data), dst));
    case 'album_v3':
      return importDataFromJSON(jsonData, 'album_v3', (data) => cloneInventory(decompressInventoryJson(data), dst));
    default:
      throw new Error(`Unsupported album version '${jsonData._type}'.`);
  }
}
function toAlbumV3(data, dst = undefined) {
  if (data._type === 'album_v1') {
    cloneAlbum(data, dst);
  }
}

function cloneAlbum(other, dst, opts) {
  const { preserveItemId = true } = opts;
  const albumId = other.albumId || uuid();
  if (!dst) {
    dst = createAlbum(albumId);
  } else {
    dst.albumId = albumId;
  }
  if (typeof other.items === 'object') {
    if (preserveItemId) {
      for (let item of Object.values(other.items)) {
        let newItem = cloneItem(item);
        dst.items[newItem.itemId] = newItem;
      }
    } else {
      for (let item of Object.values(other.items)) {
        let newItem = copyItem(item);
        dst.items[newItem.itemId] = newItem;
      }
    }
  }
  dst.displayName = String(other.displayName);
  dst.locked = Boolean(other.locked);
  dst.hidden = Boolean(other.hidden);
  dst.expand = typeof other.expand === 'boolean' ? other.expand : true;
  return dst;
}

/**
 * @param {object} uncompressedJson
 * @returns {object}
 */
export function compressAlbumJson(uncompressedJson) {
  let items = Object.values(uncompressedJson.items);
  if (items.length <= 0) {
    return {
      ...uncompressedJson,
      items: {
        t: '!',
        d: [],
      },
    };
  }
  let newItemDatas = [];
  let newItemType;
  for (let item of items) {
    let newItem = exportItemToJSON(item);
    if (typeof newItemType === 'undefined') {
      newItemType = newItem._type;
      if (!newItemType) {
        throw new Error('Missing item data format.');
      }
    } else if (newItemType !== newItem._type) {
      throw new Error('Found conflicting item data format.');
    }
    newItemDatas.push(newItem._data);
  }
  return {
    ...uncompressedJson,
    items: {
      t: newItemType,
      d: newItemDatas,
    },
  };
}

/**
 * @param {object} compressedJson
 * @returns {object}
 */
export function decompressAlbumJson(compressedJson) {
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
