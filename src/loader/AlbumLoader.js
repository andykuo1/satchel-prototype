import { exportDataToJSON, importDataFromJSON } from './DataLoader.js';
import { exportItemToJSON, importItemFromJSON } from './ItemLoader.js';
import { cloneAlbum } from '../satchel/album/Album.js';

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
  return exportDataToJSON('album_v2', compressAlbumJson(cloneAlbum(album)), {}, dst);
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
    default:
      throw new Error(`Unsupported album version '${jsonData._type}'.`);
  }
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
