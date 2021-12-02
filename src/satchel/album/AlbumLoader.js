import { exportDataToJSON, importDataFromJSON } from '../../session/SatchelDataLoader.js';
import { copyAlbum } from './Album.js';

export function exportAlbumToJSON(album, dst = undefined) {
  return exportDataToJSON('album_v1', copyAlbum(album), {}, dst);
}

export function importAlbumFromJSON(jsonData, dst = undefined) {
  return importDataFromJSON(jsonData, 'album_v1', (data) => copyAlbum(data, dst));
}
