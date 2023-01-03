import { cloneProfile } from '../satchel/profile/Profile.js';
import { exportDataToJSON, importDataFromJSON } from './DataLoader.js';

/**
 * @typedef {import('../satchel/profile/Profile.js').Profile} Profile
 */

export const CURRENT_PROFILE_VERSION = 'profile_links_v1';

/**
 * @param {Profile} profile
 * @param {object} dst
 * @returns {object}
 */
export function exportProfileToJSON(profile, dst = undefined) {
  return exportDataToJSON(CURRENT_PROFILE_VERSION, cloneProfile(profile), {}, dst);
}

/**
 * @param {object} jsonData
 * @param {Profile} dst
 * @returns {Profile}
 */
export function importProfileFromJSON(jsonData, dst = undefined) {
  return importDataFromJSON(jsonData, 'profile_links_v1', (data) => cloneProfile(data, dst));
}
