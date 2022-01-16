import { loadSatchelProfilesFromData, saveSatchelProfilesToData } from '../../loader/SatchelLoader.js';
import { getProfileIdsInStore, getProfileInStore, setActiveProfileInStore } from '../../store/ProfileStore.js';
import { getSatchelStore } from '../../store/SatchelStore.js';
import { getClient, getServer } from '../app/PeerSatchelConnector.js';
import { ActivityBase } from './ActivityBase.js';
import { SatchelLocal, SatchelRemote } from './SatchelLocal.js';

/** @typedef {import('../../components/profile/DialogSelectElement.js').DialogSelectElement} DialogSelectElement */

export class ActivityProfileMap extends ActivityBase {
  /**
   * @override
   * @param {SatchelLocal} local
   * @param {SatchelRemote} remote
   */
  static onRemoteClientConnected(local, remote) {
    this.sendProfileMap(local, remote);
  }

  /** @override */
  static onRemoteClientNanny(local, remote, now) {
    this.sendProfileMap(local, remote);
  }

  /** @override */
  static onRemoteServerMessage(local, remote, messageType, messageData) {
    if (messageType !== 'profileMap') {
      return false;
    }
    let client = getClient();
    this.setProfileMap(client, messageData);
    return true;
  }

  static sendProfileMap(local, remote) {
    const store = getSatchelStore();
    const profileIds = getProfileIdsInStore(store);
    const profileMap = {};
    const usedProfiles = [];
    for(let remote of local.remotes) {
      let profileId = ActivityProfileSelect.getChosenProfile(remote);
      if (profileId) {
        usedProfiles.push(profileId);
      }
    }
    for(let profileId of profileIds) {
      let profile = getProfileInStore(store, profileId);
      profileMap[profileId] = {
        displayName: profile.displayName,
        locked: usedProfiles.includes(profileId),
      };
    }
    remote.sendMessage('profileMap', profileMap);
  }

  static setProfileMap(client, profileMap) {
    client.detail.profileMap = profileMap;
  }

  static getProfileMap(client) {
    return client.detail.profileMap;
  }
}

export class ActivityProfileSelect extends ActivityBase {
  /**
   * @override
   * @param {SatchelLocal} local
   * @param {SatchelRemote} remote
   */
  static onRemoteServerConnected(local, remote) {
    /** @type {import('../../components/profile/DialogSelectElement.js').DialogSelectElement} */
    let onlineDialog = document.querySelector('#profileOnlineDialog');
    onlineDialog.open();
  }

  /** @override */
  static onRemoteClientMessage(local, remote, messageType, messageData) {
    if (messageType !== 'profileSelect') {
      return false;
    }
    let server = getServer();
    let profileIds = [...server.remotes]
      .filter(other => other !== remote)
      .map(remote => this.getChosenProfile(remote));
    if (profileIds.includes(messageData)) {
      remote.sendMessage('profileSelectResponse', { result: false });
    } else {
      this.setChosenProfile(remote, messageData);
      const store = getSatchelStore();
      const data = saveSatchelProfilesToData(store, [messageData]);
      remote.sendMessage('profileSelectResponse', { result: true, data });
    }
    return true;
  }

  static async chooseProfile(client, profileId) {
    const remoteServer = client.remoteServer;
    remoteServer.sendMessage('profileSelect', profileId);
    try {
      const { result, data } = await remoteServer.awaitMessage('profileSelectResponse');
      if (result) {
        this.setChosenProfile(remoteServer, profileId);
        const store = getSatchelStore();
        loadSatchelProfilesFromData(store, data, true);
        setActiveProfileInStore(store, profileId);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  }

  static setChosenProfile(remote, profileId) {
    remote.detail.profileId = profileId;
  }

  static getChosenProfile(remote) {
    return remote.detail.profileId;
  }
}

export class ActivityProfileSync extends ActivityBase {
  /** @override */
  static onRemoteServerNanny(local, remote, now) {
    let profileId = ActivityProfileSelect.getChosenProfile(remote);
    if (profileId) {
      const store = getSatchelStore();
      const data = saveSatchelProfilesToData(store, [profileId]);
      remote.sendMessage('profileSync', data);
    }
  }

  /** @override */
  static onRemoteClientMessage(local, remote, messageType, messageData) {
    if (messageType !== 'profileSync') {
      return false;
    }
    const store = getSatchelStore();
    loadSatchelProfilesFromData(store, messageData, true);
    return true;
  }
}

export class ActivityProfileReset extends ActivityBase {
  /** @override */
  static onRemoteServerMessage(local, remote, messageType, messageData) {
    if (messageType !== 'profileReset') {
      return false;
    }
    const store = getSatchelStore();
    loadSatchelProfilesFromData(store, messageData, true);
    return true;
  }

  static async resetProfile(remote) {
    let profileId = ActivityProfileSelect.getChosenProfile(remote);
    if (profileId) {
      const store = getSatchelStore();
      const data = saveSatchelProfilesToData(store, [profileId]);
      remote.sendMessage('profileReset', data);
    }
  }
}
