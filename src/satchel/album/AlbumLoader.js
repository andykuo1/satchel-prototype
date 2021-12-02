import { exportDataToJSON, importDataFromJSON } from '../../session/SatchelDataLoader.js';
import { cloneAlbum } from './Album.js';

export function exportAlbumToJSON(album, dst = undefined) {
  return exportDataToJSON('album_v1', cloneAlbum(album), {}, dst);
}

export function importAlbumFromJSON(jsonData, dst = undefined) {
  return importDataFromJSON(jsonData, 'album_v1', (data) => cloneAlbum(data, dst));
}
