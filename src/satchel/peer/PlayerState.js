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
export function setupPlayer(client) {
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
export function isPlayer(client) {
  return Boolean(client.detail.player);
}

/**
 * @param {PlayerClient} client 
 * @returns {string}
 */
export function getPlayerName(client) {
  return getPlayer(client).name;
}

/**
 * @param {PlayerClient} client 
 * @param {string} name 
 */
export function setPlayerName(client, name) {
  if (!validatePlayerName(name)) {
    throw new Error('Invalid player name.');
  }
  getPlayer(client).name = name;
}

/**
 * @param {string} name 
 * @returns {string} The valid formatted name or an empty string if invalid.
 */
export function validatePlayerName(name) {
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
export function hasPlayerHeartbeat(client) {
  return getPlayer(client).lastHeartbeat >= 0;
}

/**
 * @param {PlayerClient} client 
 * @param {number} value
 */
export function setPlayerLastHeartbeat(client, value) {
  getPlayer(client).lastHeartbeat = value;
}

/**
 * @param {PlayerClient} client 
 * @returns {number}
 */
export function getPlayerLastHeartbeat(client) {
  return getPlayer(client).lastHeartbeat;
}
