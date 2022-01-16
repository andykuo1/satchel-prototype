import { exportItemToJSON } from '../../loader/ItemLoader.js';

import { ActivityPlayerGift } from '../peer/ActivityPlayerGift.js';
import { ActivityPlayerList } from '../peer/ActivityPlayerList.js';
import { ActivityPlayerHandshake } from '../peer/ActivityPlayerHandshake.js';
import { ActivityPlayerInventory } from '../peer/ActivityPlayerInventory.js';
import { SatchelLocal } from '../peer/SatchelLocal.js';
import { ActivityError } from '../peer/ActivityError.js';
import { getPlayerName } from '../peer/PlayerState.js';
import { ActivityProfileMap, ActivityProfileReset, ActivityProfileSelect, ActivityProfileSync } from '../peer/ActivityProfile.js';

/**
 * @typedef {import('../../peerful/PeerfulConnection.js').PeerfulConnection} PeerfulConnection
 * @typedef {import('../../components/invgrid/InventoryGridElement.js').InventoryGridElement} InventoryGridElement
 * @typedef {import('../peer/SatchelLocal.js').SatchelRemote} SatchelRemote
 */

const ACTIVITY_REGISTRY = [
  ActivityError,
  ActivityProfileMap,
  ActivityProfileSelect,
  ActivityProfileSync,
  ActivityProfileReset,
];

export class SatchelServer extends SatchelLocal {
  constructor(peerful) {
    super(peerful);
    /** @protected */
    this.activities = [];

    this.initialize();
  }

  /** @protected */
  initialize() {
    const toBeCreated = ACTIVITY_REGISTRY;
    for (let activity of toBeCreated) {
      try {
        activity.onLocalServerCreated(this);
        this.activities.push(activity);
      } catch (e) {
        console.error(e);
      }
    }
  }

  destroy() {
    const toBeDestroyed = this.activities.slice().reverse();
    this.activities.length = 0;
    for (let activity of toBeDestroyed) {
      try {
        activity.onLocalServerDestroyed(this);
      } catch (e) {
        console.error(e);
      }
    }
  }

  /** @override */
  onRemoteConnected(remoteClient) {
    console.log('Remote connection established.');
    for (let activity of this.activities) {
      try {
        activity.onRemoteClientConnected(this, remoteClient);
      } catch (e) {
        console.error(e);
      }
    }
  }

  /** @override */
  onRemoteDisconnected(remoteClient) {
    const reversedActivities = this.activities.slice().reverse();
    for (let activity of reversedActivities) {
      try {
        activity.onRemoteClientDisconnected(this, remoteClient);
      } catch (e) {
        console.error(e);
      }
    }
  }

  /**
   * @override
   * @param {SatchelRemote} remote
   * @param {string} type
   * @param {object} data
   */
  onRemoteMessage(remote, type, data) {
    for (let activity of this.activities) {
      try {
        let result = activity.onRemoteClientMessage(this, remote, type, data);
        if (result) {
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (remote.handleMessage(type, data)) {
      return;
    }
    console.error(`Found unknown message from client - ${data}`);
    ActivityError.sendError(remote, 'Unknown message.');
  }

  /** @override */
  onRemoteNanny(remote) {
    if (remote.connection.closed) {
      console.log('Closing connection since already closed.');
      return;
    }
    const now = performance.now();
    for (let activity of this.activities) {
      try {
        activity.onRemoteClientNanny(this, remote, now);
      } catch (e) {
        console.error(e);
      }
    }
  }

  sendItemTo(clientName, item) {
    const client = ActivityPlayerHandshake.getActiveClientByName(this, clientName);
    if (!client || !client.connection) {
      return false;
    }
    ActivityPlayerGift.sendPlayerItem(client, clientName, item);
  }
}

export class SatchelClient extends SatchelLocal {
  /** @returns {SatchelRemote} */
  get remoteServer() {
    return this.remotes[0];
  }

  constructor(peerful) {
    super(peerful);
    /** @protected */
    this.activities = [];

    this.initialize();
  }

  /** @protected */
  initialize() {
    const toBeCreated = ACTIVITY_REGISTRY;
    for (let activity of toBeCreated) {
      try {
        activity.onLocalClientCreated(this);
        this.activities.push(activity);
      } catch (e) {
        console.error(e);
      }
    }
  }

  destroy() {
    const toBeDestroyed = this.activities.slice().reverse();
    this.activities.length = 0;
    for (let activity of toBeDestroyed) {
      try {
        activity.onLocalClientDestroyed(this);
      } catch (e) {
        console.error(e);
      }
    }
  }

  /** @override */
  onRemoteConnected(remoteServer) {
    console.log('Local connection established.');
    for (let activity of this.activities) {
      try {
        activity.onRemoteServerConnected(this, remoteServer);
      } catch (e) {
        console.error(e);
      }
    }
  }

  /** @override */
  onRemoteDisconnected(remoteServer) {
    console.error('Local connection closed.');
    const reversedActivities = this.activities.slice().reverse();
    for (let activity of reversedActivities) {
      activity.onRemoteServerDisconnected(this, remoteServer);
    }
    window.alert('Connection lost! Please refresh the browser and try again.');
  }

  /** @override */
  onRemoteMessage(remoteServer, type, data) {
    for (let activity of this.activities) {
      try {
        let result = activity.onRemoteServerMessage(this, remoteServer, type, data);
        if (result) {
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (remoteServer.handleMessage(type, data)) {
      return;
    }
    console.error(`Found unknown message from server - ${data}`);
  }

  /** @override */
  onRemoteNanny(remoteServer) {
    const now = performance.now();
    for (let activity of this.activities) {
      try {
        activity.onRemoteServerNanny(this, remoteServer, now);
      } catch (e) {
        console.error(e);
      }
    }
  }

  sendItemTo(clientName, item) {
    const playerNames = ActivityPlayerList.getPlayerNameListOnClient(this);
    if (!playerNames.includes(clientName)) {
      return false;
    }
    console.log('Sending item to client...', clientName);
    const localClientName = getPlayerName(this);
    this.remoteServer.sendMessage('gift', {
      from: localClientName,
      target: clientName,
      item: exportItemToJSON(item),
    });
    return true;
  }
}
