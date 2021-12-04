/**
 * @typedef {import('./ActivityContext.js').LocalActivityContext} LocalActivityContext
 * @typedef {import('./ActivityContext.js').LocalServerActivityContext} LocalServerActivityContext
 * @typedef {import('./ActivityContext.js').LocalClientActivityContext} LocalClientActivityContext
 * @typedef {import('./ActivityContext.js').RemoteServerActivityContext} RemoteServerActivityContext
 * @typedef {import('./ActivityContext.js').RemoteClientActivityContext} RemoteClientActivityContext
 */
export class ListPlayersActivity {
  /**
   * @param {LocalServerActivityContext} local 
   * @param {RemoteClientActivityContext} remote 
   */
  onServerRemoteNanny(local, remote) {
    remote.connection.send(JSON.stringify({type: 'listPlayers', message: getPlayerList(local)}));
  }

  /**
   * @param {LocalClientActivityContext} local 
   */
  onClientStart(local) {
    local.cache.playerList = [];
  }

  /**
   * @param {LocalClientActivityContext} local 
   * @param {RemoteServerActivityContext} remote
   * @param {string} messageType
   * @param {object} messageData 
   */
  onClientMessage(local, remote, messageType, messageData) {
    switch(messageType) {
      case 'listPlayers':
        if (Array.isArray(messageData)) {
          local.cache.playerList = [
            ...messageData
          ];
        } else {
          local.cache.playerList = [];
        }
        return true;
    }
    return false;
  }
}

/**
 * @param {LocalActivityContext} local 
 * @returns {Array<string>}
 */
export function getPlayerList(local) {
  if (local.isServer) {
    return [ ...local.cache.playerList ];
  } else {
    return local.remotes.map(remote => remote.name);
  }
}
