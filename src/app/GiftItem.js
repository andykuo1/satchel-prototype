import { dropOnGround } from '../inventory/GroundHelper.js';
import { exportItemToJSON, importItemFromJSON } from '../satchel/item/ItemLoader.js';

export function onServerMessage(localServer, remoteClient, messageType, messageData) {
  switch(messageType) {
    case 'gift': {
      const target = messageData.target;
      let client = getActiveClientByName(localServer, target);
      if (client) {
        // Forward the request to the target client.
        client.connection.send(JSON.stringify({ type: 'gift', message: messageData }));
      } else {
        remoteClient.connection.send(JSON.stringify({ type: 'giftnak' }));
      }
    } return true;
    case 'giftack': {
      const from = messageData.from;
      if (from) {
        let client = getActiveClientByName(localServer, from);
        if (client) {
          // Forward the request to the source client.
          client.connection.send(JSON.stringify({ type: 'giftack', message: messageData }));
        } else {
          // Consume this request.
        }
      } else {
        // This is a server gift.
        let { target } = messageData;
        window.alert(`Gift sent to ${target}!`);
      }
    } return true;
  }
  return false;
}

export function onClientMessage(localClient, remoteServer, messageType, messageData) {
  switch (messageType) {
    case 'gift':
      {
        let { from, target, item } = messageData;
        let newItem = importItemFromJSON(item);
        dropOnGround(newItem);
        window.alert(
          `You received a gift from ${from || 'the server'
          }! Remember to pick it up before closing the browser!`
        );
        remoteServer.connection.send(
          JSON.stringify({ type: 'giftack', message: { from, target } })
        );
      }
      return true;
    case 'giftack':
      {
        let { target } = messageData;
        window.alert(`Gift sent to ${target}!`);
      }
      return true;
    case 'giftnak':
      {
        let { target } = messageData;
        window.alert(`Gift failed to send to ${target}!`);
      }
      return true;
  }
  return false;
}

export function getActiveClientNames(localServer) {
  return localServer.remoteClients.map((client) => client.name);
}

export function getActiveClientByName(localServer, clientName) {
  for (let client of localServer.remoteClients) {
    if (client.name === clientName) {
      return client;
    }
  }
  return null;
}

export function sendItemTo(localServer, clientName, item) {
  let client = getActiveClientByName(localServer, clientName);
  if (!client || !client.connection) {
    return false;
  }
  console.log('Sending item to client...', clientName);
  let dataToSend = {
    type: 'gift',
    message: { from: '', target: clientName, item: exportItemToJSON(item) },
  };
  let stringToSend = JSON.stringify(dataToSend);
  client.connection.send(stringToSend);
  return true;
}
