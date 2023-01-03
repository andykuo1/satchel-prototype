import { ActivityBase } from './ActivityBase.js';
import { ActivityPlayerInventory } from './ActivityPlayerInventory.js';
import {
  getPlayerName,
  isPlayer,
  setPlayerLastHeartbeat,
  setPlayerName,
  setupPlayer,
  validatePlayerName,
} from './PlayerState.js';
import { SatchelLocal, SatchelRemote } from './SatchelLocal.js';

export class ActivityPlayerHandshake extends ActivityBase {
  static get observedMessages() {
    return ['handshake'];
  }

  /**
   * @override
   * @param {SatchelLocal} local
   * @param {SatchelRemote} remote
   */
  static onRemoteServerConnected(local, remote) {
    let name = '';
    while (!name) {
      name = window.prompt('Who Art Thou? (cannot be changed yet, sry)');
      name = validatePlayerName(name);
      if (!name) {
        window.alert('Invalid name.');
      }
    }
    setupPlayer(local);
    setPlayerName(local, name);
    remote.sendMessage('handshake', name);
  }

  /**
   * @override
   * @param {SatchelLocal} local
   * @param {SatchelRemote} remote
   */
  static onRemoteClientConnected(local, remote) {
    setupPlayer(remote);
  }

  /**
   * @override
   * @param {SatchelLocal} local
   * @param {SatchelRemote} remote
   */
  static onRemoteClientMessage(local, remote, messageType, messageData) {
    if (messageType !== 'handshake') {
      // Verify client already did handshake, otherwise do not process this message.
      if (!isPlayer(remote) || !getPlayerName(remote)) {
        console.log(messageData, remote);
        remote.sendMessage('error', 'Not yet signed in.');
        return true;
      }
      return false;
    }
    const remotePlayerName = validatePlayerName(messageData);
    if (!remotePlayerName) {
      remote.sendMessage('error', 'Invalid user name.');
      return;
    }
    console.log('Setting up client...', remotePlayerName);
    const now = performance.now();
    setPlayerName(remote, remotePlayerName);
    setPlayerLastHeartbeat(remote, now);
    // Send to client their first data store
    const playerDataName = `remote-profile-${remotePlayerName}`;
    ActivityPlayerInventory.sendPlayerReset(remote, playerDataName);
    return true;
  }

  /**
   * @param {SatchelLocal} localServer
   * @returns {Array<string>}
   */
  static getActiveClientNames(localServer) {
    return localServer.remotes.map(getPlayerName);
  }

  /**
   * @param {SatchelLocal} localServer
   * @returns {SatchelRemote|null}
   */
  static getActiveClientByName(localServer, playerName) {
    for (let client of localServer.remotes) {
      const clientName = getPlayerName(client);
      if (clientName === playerName) {
        return client;
      }
    }
    return null;
  }
}
