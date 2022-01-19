import { exportDataToJSON, importDataFromJSON } from './DataLoader.js';
import { cloneInventory } from '../satchel/inv/Inv.js';

export function exportInventoryToJSON(inv, dst = undefined) {
  return exportDataToJSON('inv_v2', compressInventoryJson(cloneInventory(inv)), {}, dst);
}

export function importInventoryFromJSON(jsonData, dst = undefined) {
  switch (jsonData._type) {
    case 'inv_v1':
      return importDataFromJSON(jsonData, 'inv_v1', (data) => cloneInventory(data, dst));
    case 'inv_v2':
      return importDataFromJSON(jsonData, 'inv_v2', (data) =>
        cloneInventory(decompressInventoryJson(data), dst)
      );
    default:
      throw new Error(`Unsupported inventory version '${jsonData._type}'.`);
  }
}

function compressInventoryJson(uncompressedJson) {
  const slots = uncompressedJson.slots;
  const length = uncompressedJson.length;
  let newSlots = new Array(length).fill(0);
  let nextAvailableSlottedId = 1;
  let itemMapping = {};
  let slotsMapping = {};
  for (let i = 0; i < length; ++i) {
    let itemId = slots[i];
    if (itemId) {
      if (!(itemId in itemMapping)) {
        itemMapping[itemId] = nextAvailableSlottedId;
        slotsMapping[nextAvailableSlottedId] = itemId;
        nextAvailableSlottedId += 1;
      }
      newSlots[i] = itemMapping[itemId];
    }
  }
  return {
    ...uncompressedJson,
    __slotsMap: slotsMapping,
    slots: newSlots,
  };
}

function decompressInventoryJson(compressedJson) {
  const { __slotsMap: slotsMapping, ...json } = compressedJson;
  const slots = compressedJson.slots;
  const length = compressedJson.length;
  let newSlots = new Array(length).fill(null);
  for (let i = 0; i < length; ++i) {
    let slottedId = slots[i];
    if (slottedId) {
      let itemId = slotsMapping[slottedId];
      newSlots[i] = itemId;
    }
  }
  return {
    ...json,
    slots: newSlots,
  };
}
