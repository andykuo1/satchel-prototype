import { exportItemToJSON, importItemFromJSON } from '../../loader/ItemLoader.js';

export function exportItemToBase64(item) {
  let json = exportItemToJSON(item);
  let rawString = JSON.stringify(json);
  return window.btoa(rawString);
}

export function importItemFromBase64(base64String, dst = undefined) {
  let rawString = window.atob(base64String);
  let json = JSON.parse(rawString);
  return importItemFromJSON(json, dst);
}
