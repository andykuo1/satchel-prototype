import { ActivityBase } from './ActivityBase.js';

import { getInventoryStore, getInventoryInStore, deleteInventoryFromStore, createGridInventoryInStore } from '../../inventory/InventoryStore.js';
import { SatchelLocal, SatchelRemote } from './SatchelLocal.js';
import { getPlayerLastHeartbeat, getPlayerName, hasPlayerHeartbeat, setPlayerLastHeartbeat } from './PlayerState.js';
import { loadFromStorage, saveToStorage } from '../../Storage.js';
import { addProfileInStore, deleteProfileInStore, getProfileInStore, isProfileInStore, setActiveProfileInStore } from '../profile/ProfileStore.js';
import { createProfile } from '../profile/Profile.js';
import { uuid } from '../../util/uuid.js';
import { loadSatchelProfilesFromData, saveSatchelProfilesToData } from '../../session/SatchelLoader.js';

/** @typedef {import('../../inventory/element/InventoryGridElement.js').InventoryGridElement} InventoryGridElement */

function onAutoSave(localServer) {
  const serverData = ActivityPlayerInventory.getLocalServerData(localServer);
  saveToStorage('server_data', JSON.stringify(serverData));
}

export class ActivityPlayerInventory extends ActivityBase {
  static get observedMessages() {
    return ['reset', 'sync'];
  }

  /** @override */
  static onLocalServerCreated(localServer) {
    // Load server data from storage...
    let serverData;
    try {
      serverData = JSON.parse(loadFromStorage('server_data')) || {};
    } catch {
      serverData = {};
    }
    localServer.localData = serverData;
    console.log('Loading server data...', serverData);
    // Start saving server data to storage...
    localServer.autoSave = onAutoSave.bind(undefined, localServer);
    localServer.autoSaveHandle = setInterval(localServer.autoSave, 5_000);
  }

  /** @override */
  static onLocalServerDestroyed(localServer) {
    // Stop saving server data
    clearInterval(localServer.autoSaveHandle);
    localServer.autoSaveHandle = null;
    localServer.autoSave = null;
    // Reset server data
    localServer.localData = {};
  }

  /** @override */
  static onRemoteClientConnected(localServer, remoteClient) {
    remoteClient.element = null;
  }

  /** @override */
  static onRemoteServerConnected(localClient, remoteServer) {
    remoteServer.remoteData = {};
  }

  /** @override */
  static onRemoteServerMessage(localClient, remoteServer, messageType, messageData) {
    switch(messageType) {
      case 'reset':
        const store = getInventoryStore();
        const playerName = getPlayerName(localClient);
        const playerDataName = `remote-profile-${playerName}`;
        let profiles = loadSatchelProfilesFromData(store, messageData, true);
        if (profiles[0] !== playerDataName) {
          console.error('Server and client disagree on data name!');
        }
        setActiveProfileInStore(store, profiles[0]);
        return true;
    }
    return false;
  }

  /**
   * @override
   * @param {SatchelLocal} localClient
   * @param {SatchelRemote} remoteServer
   */
  static onRemoteServerNanny(localClient, remoteServer) {
    const store = getInventoryStore();
    const playerName = getPlayerName(localClient);
    const playerDataName = `remote-profile-${playerName}`;
    if (!isProfileInStore(store, playerDataName)) {
      return;
    }
    const satchelData = saveSatchelProfilesToData(store, [playerDataName]);
    remoteServer.sendMessage('sync', satchelData);
  }

  /**
   * @override
   * @param {SatchelLocal} local
   * @param {SatchelRemote} remote
   * @param {number} now
   */
  static onRemoteClientNanny(local, remote, now) {
    if (!hasPlayerHeartbeat(remote)) {
      return;
    }
    const lastHeartbeat = getPlayerLastHeartbeat(remote);
    let delta = now - lastHeartbeat;
    if (delta > 10_000) {
      console.log('Closing connection due to staleness.');
      remote.connection.close();
    }
  }

  /**
   * @override
   * @param {SatchelLocal} localServer
   * @param {SatchelRemote} remoteClient
   */
  static onRemoteClientMessage(localServer, remoteClient, messageType, messageData) {
    switch(messageType) {
      case 'sync':
        const remotePlayerName = getPlayerName(remoteClient);
        if (!remotePlayerName) {
          throw new Error('Missing remote player name.');
        }
        console.log('Syncing client...', remotePlayerName);
        const now = performance.now();
        setPlayerLastHeartbeat(remoteClient, now);
        // Update server's copy of client data
        const clientDataName = `remote-profile-${remotePlayerName}`;
        const clientData = messageData;
        let store = getInventoryStore();
        try {
          let profileIds = loadSatchelProfilesFromData(store, clientData, true);
          if (profileIds[0] !== clientDataName) {
            console.error('Server and client disagree on player data name!');
          }
        } catch (e) {
          console.error(`Failed to load client inventory - ${e}`);
        }
        return true;
    }
    return false;
  }

  /**
   * @param {SatchelRemote} remoteClient 
   * @param {string} profileId 
   */
  static sendPlayerReset(remoteClient, profileId) {
    const store = getInventoryStore();
    if (!isProfileInStore(store, profileId)) {
      let newProfile = createProfile(profileId);
      let newInv = createGridInventoryInStore(store, uuid(), 12, 9);
      newProfile.invs.push(newInv.invId);
      addProfileInStore(store, newProfile.profileId, newProfile);
    }
    let satchelData = saveSatchelProfilesToData(store, [profileId]);
    remoteClient.sendMessage('reset', satchelData);
  }

  static resetLocalServerData(localServer, serverData) {
    localServer.localData = serverData;
  }
  
  static getLocalServerData(localServer) {
    return localServer.localData;
  }
}
