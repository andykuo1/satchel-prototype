import { exportDataToJSON, importDataFromJSON } from '../satchel/session/SatchelDataLoader.js';
import { cloneProfile } from '../satchel/profile/Profile.js';

/**
 * @typedef {import('../satchel/profile/Profile.js').Profile} Profile
 */

/**
 * @param {Profile} profile 
 * @param {object} dst 
 * @returns {object}
 */
export function exportProfileToJSON(profile, dst = undefined) {
  return exportDataToJSON('profile_links_v1', cloneProfile(profile), {}, dst);
}

/**
 * @param {object} jsonData 
 * @param {Profile} dst 
 * @returns {Profile}
 */
export function importProfileFromJSON(jsonData, dst = undefined) {
  return importDataFromJSON(jsonData, 'profile_links_v1', (data) => cloneProfile(data, dst));
}
