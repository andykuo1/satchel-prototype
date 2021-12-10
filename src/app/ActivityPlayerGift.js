import { ActivityBase } from './ActivityBase.js';

import { dropOnGround } from '../inventory/GroundHelper.js';
import { exportItemToJSON, importItemFromJSON } from '../satchel/item/ItemLoader.js';

export class ActivityPlayerGift extends ActivityBase {
  static get observedMessages() {
    return ['gift', 'giftack', 'giftnak'];
  }

  /** @override */
  static onRemoteServerMessage(localClient, remoteServer, messageType, messageData) {
    const { from, target, item } = messageData;
    switch (messageType) {
      case 'gift':
        let newItem = importItemFromJSON(item);
        dropOnGround(newItem);
        window.alert(
          `You received a gift from ${
            from || 'the server'
          }! Remember to pick it up before closing the browser!`
        );
        remoteServer.connection.send(
          JSON.stringify({ type: 'giftack', message: { from, target } })
        );
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

  /** @override */
  static onRemoteClientMessage(localServer, remoteClient, messageType, messageData) {
    switch(messageType) {
      case 'gift':
        const target = messageData.target;
        const targetClient = localServer.getActiveClientByName(target);
        if (targetClient) {
          // Forward the request to the target client.
          targetClient.connection.send(JSON.stringify({ type: messageType, message: messageData }));
        } else {
          remoteClient.connection.send(JSON.stringify({ type: 'giftnak' }));
        }
        return true;
      case 'giftack':
        const from = messageData.from;
        if (from) {
          const fromClient = localServer.getActiveClientByName(from);
          if (fromClient) {
            // Forward the request to the source client.
            fromClient.connection.send(JSON.stringify({ type: messageType, message: messageData }));
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

  static sendPlayerItem(remoteClient, playerName, item) {
    console.log('Sending item to client...', playerName);
    let dataToSend = {
      type: 'gift',
      message: { from: '', target: playerName, item: exportItemToJSON(item) },
    };
    let stringToSend = JSON.stringify(dataToSend);
    remoteClient.connection.send(stringToSend);
  }
}
