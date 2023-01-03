import { exportItemToJSON, importItemFromJSON } from '../../loader/ItemLoader.js';
import { dropItemOnGround } from '../GroundAlbum.js';
import { copyItem } from '../item/Item.js';
import { ActivityBase } from './ActivityBase.js';
import { ActivityPlayerHandshake } from './ActivityPlayerHandshake.js';
import { SatchelLocal, SatchelRemote } from './SatchelLocal.js';

/** @typedef {import('../item/Item.js').Item} Item */

export class ActivityPlayerGift extends ActivityBase {
  static get observedMessages() {
    return ['gift', 'giftack', 'giftnak'];
  }

  /**
   * @override
   * @param {SatchelLocal} localClient
   * @param {SatchelRemote} remoteServer
   * @param {string} messageType
   * @param {object} messageData
   */
  static onRemoteServerMessage(localClient, remoteServer, messageType, messageData) {
    const { from, target, item } = messageData;
    switch (messageType) {
      case 'gift':
        let freeItem = copyItem(importItemFromJSON(item));
        dropItemOnGround(freeItem);
        window.alert(`You received a gift from ${from || 'the server'}!`);
        remoteServer.sendMessage('giftack', { from, target });
        return true;
      case 'giftack':
        window.alert(`Gift sent to ${target}!`);
        return true;
      case 'giftnak':
        window.alert(`Gift failed to send to ${target}!`);
        return true;
    }
    return false;
  }

  /**
   * @override
   * @param {SatchelLocal} localServer
   * @param {SatchelRemote} remoteClient
   * @param {string} messageType
   * @param {object} messageData
   */
  static onRemoteClientMessage(localServer, remoteClient, messageType, messageData) {
    switch (messageType) {
      case 'gift':
        const target = messageData.target;
        const targetClient = ActivityPlayerHandshake.getActiveClientByName(localServer, target);
        if (targetClient) {
          // Forward the request to the target client.
          targetClient.sendMessage(messageType, messageData);
        } else {
          remoteClient.sendMessage('giftnack', undefined);
        }
        return true;
      case 'giftack':
        const from = messageData.from;
        if (from) {
          const fromClient = ActivityPlayerHandshake.getActiveClientByName(localServer, from);
          if (fromClient) {
            // Forward the request to the source client.
            fromClient.sendMessage(messageType, messageData);
          } else {
            // Consume this request.
          }
        } else {
          // This is a server gift.
          let { target } = messageData;
          window.alert(`Gift sent to ${target}!`);
        }
        return true;
    }
    return false;
  }

  /**
   * @param {SatchelRemote} remoteClient
   * @param {string} playerName
   * @param {Item} item
   */
  static sendPlayerItem(remoteClient, playerName, item) {
    console.log('Sending item to client...', playerName);
    remoteClient.sendMessage('gift', { from: '', target: playerName, item: exportItemToJSON(item) });
  }
}
