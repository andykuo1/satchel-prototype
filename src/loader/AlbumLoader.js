import { exportDataToJSON, importDataFromJSON } from './DataLoader.js';
import { exportItemToJSON, importItemFromJSON } from './ItemLoader.js';
import { compressInventoryJson, decompressInventoryJson } from './InvLoader.js';
import { cloneInventory } from '../satchel/inv/Inv.js';
import { uuid } from '../util/uuid.js';
import { ALBUM_FLAG_EXPAND_BIT, ALBUM_FLAG_HIDDEN_BIT, ALBUM_FLAG_LOCKED_BIT, createAlbum } from '../satchel/album/Album.js';

/**
 * @typedef {import('../satchel/album/Album.js').Album} Album
 * @typedef {import('./DataLoader.js').ImportDataFormat} ImportDataFormat
 */

export const CURRENT_ALBUM_VERSION = 'album_v3';

/**
 * @param {Album} album
 * @param {object} [dst]
 * @returns {ImportDataFormat}
 */
export function exportAlbumToJSON(album, dst = undefined) {
  return exportDataToJSON(CURRENT_ALBUM_VERSION, compressInventoryJson(cloneInventory(album)), {}, dst);
}

/**
 * @param {object} jsonData
 * @param {Album} [dst]
 * @returns {Album}
 */
export function importAlbumFromJSON(jsonData, dst = undefined) {
  switch (jsonData._type) {
    case 'album_v1':
      return importDataFromJSON(jsonData, 'album_v1', (data) => cloneInventory(albumV1ToV3(data, dst)));
    case 'album_v2':
      return importDataFromJSON(jsonData, 'album_v2', (data) => cloneInventory(albumV1ToV3(decompressAlbumJsonV2(data), dst)));
    case 'album_v3':
      return importDataFromJSON(jsonData, 'album_v3', (data) => cloneInventory(decompressInventoryJson(data), dst));
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
export function decompressAlbumJsonV2(compressedJson) {
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
