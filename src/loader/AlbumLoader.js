import { exportDataToJSON, importDataFromJSON } from './DataLoader.js';
import { cloneAlbum } from '../satchel/album/Album.js';

/** @typedef {import('../satchel/album/Album.js').Album} Album */

/**
 * @param {Album} album
 * @param {object} [dst]
 * @returns {object}
 */
export function exportAlbumToJSON(album, dst = undefined) {
  return exportDataToJSON('album_v1', cloneAlbum(album), {}, dst);
}

/**
 * @param {object} jsonData
 * @param {Album} [dst]
 * @returns {Album}
 */
export function importAlbumFromJSON(jsonData, dst = undefined) {
  return importDataFromJSON(jsonData, 'album_v1', (data) => cloneAlbum(data, dst));
}
