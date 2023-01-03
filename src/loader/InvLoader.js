import { cloneInventory } from '../satchel/inv/Inv.js';
import { exportDataToJSON, importDataFromJSON } from './DataLoader.js';

export const CURRENT_INV_VERSION = 'inv_v3';

export function exportInventoryToJSON(inv, dst = undefined) {
  return exportDataToJSON(CURRENT_INV_VERSION, compressInventoryJson(cloneInventory(inv)), {}, dst);
}

export function importInventoryFromJSON(jsonData, dst = undefined) {
  switch (jsonData._type) {
    case 'inv_v1':
      return importDataFromJSON(jsonData, 'inv_v1', (data) => cloneInventory(data, dst));
    case 'inv_v2':
      return importDataFromJSON(jsonData, 'inv_v2', (data) =>
        cloneInventory(decompressInventoryJson(data), dst)
      );
    case 'inv_v3': // Added `flags` field
      return importDataFromJSON(jsonData, 'inv_v3', (data) =>
        cloneInventory(decompressInventoryJson(data), dst)
      );
    default:
      throw new Error(`Unsupported inventory version '${jsonData._type}'.`);
  }
}

export function compressInventoryJson(uncompressedJson) {
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

export function decompressInventoryJson(compressedJson) {
  const { __slotsMap: slotsMapping, slots, ...json } = compressedJson;
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
