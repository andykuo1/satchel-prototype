/**
 * @typedef {import('../peerful/PeerfulConnection.js').PeerfulConnection} PeerfulConnection
 * 
 * @typedef {LocalActivityContext|RemoteActivityContext} ActivityContext
 * @typedef {LocalServerActivityContext|RemoteServerActivityContext} ServerActivityContext
 * @typedef {LocalClientActivityContext|RemoteClientActivityContext} ClientActivityContext
 * 
 * @typedef LocalActivityContext
 * @property {string} id
 * @property {string} name
 * @property {false} isRemote
 * @property {boolean} isServer
 * @property {object} cache
 * @property {Array<RemoteActivityContext>} remotes
 * 
 * @typedef LocalServerActivityContext
 * @property {string} id
 * @property {string} name
 * @property {false} isRemote
 * @property {true} isServer
 * @property {object} cache
 * @property {Array<RemoteClientActivityContext>} remotes
 * 
 * @typedef LocalClientActivityContext
 * @property {string} id
 * @property {string} name
 * @property {false} isRemote
 * @property {false} isServer
 * @property {object} cache
 * @property {Array<RemoteServerActivityContext>} remotes
 * 
 * @typedef RemoteActivityContext
 * @property {string} id
 * @property {string} name
 * @property {true} isRemote
 * @property {boolean} isServer
 * @property {object} cache
 * @property {PeerfulConnection} connection
 * 
 * @typedef RemoteClientActivityContext
 * @property {string} id
 * @property {string} name
 * @property {true} isRemote
 * @property {false} isServer
 * @property {object} cache
 * @property {PeerfulConnection} connection
 * 
 * @typedef RemoteServerActivityContext
 * @property {string} id
 * @property {string} name
 * @property {true} isRemote
 * @property {true} isServer
 * @property {object} cache
 * @property {PeerfulConnection} connection
 */

/**
 * @param {string} id
 * @returns {LocalServerActivityContext}
 */
export function createLocalServerActivityContext(id) {
  return {
    id,
    name: '',
    isRemote: false,
    isServer: true,
    cache: {},
    remotes: [],
  };
}

/**
 * @param {string} id
 * @returns {LocalClientActivityContext}
 */
 export function createLocalClientActivityContext(id) {
  return {
    id,
    name: '',
    isRemote: false,
    isServer: false,
    cache: {},
    remotes: [],
  };
}

/**
 * @param {string} id
 * @returns {RemoteServerActivityContext}
 */
export function createRemoteServerActivityContext(id) {
  return {
    id,
    name: '',
    isRemote: true,
    isServer: true,
    cache: {},
    connection: null,
  };
}

/**
 * @param {string} id
 * @returns {RemoteClientActivityContext}
 */
 export function createRemoteClientActivityContext(id) {
  return {
    id,
    name: '',
    isRemote: true,
    isServer: false,
    cache: {},
    connection: null,
  };
}
