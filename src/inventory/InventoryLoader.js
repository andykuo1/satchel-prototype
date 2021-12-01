import { copyInventory } from './Inv.js';
import { copyItem } from './Item.js';

const LATEST_INVENTORY_DATA_VERSION = 'inv_v2';
const LATEST_ITEM_DATA_VERSION = 'item_v1';

export function importInventoryFromJSON(jsonData, dst = undefined) {
  if (LATEST_INVENTORY_DATA_VERSION !== jsonData._type) {
    jsonData = convertInventoryDataToLatestVersion(jsonData);
  }
  return importDataFromJSON(jsonData, LATEST_INVENTORY_DATA_VERSION, data => copyInventory(data, dst));
}

export function exportInventoryToJSON(inv, dst = undefined) {
  return exportDataToJSON(LATEST_INVENTORY_DATA_VERSION, copyInventory(inv), {}, dst);
}

export function importItemFromJSON(jsonData, dst = undefined) {
  if (LATEST_ITEM_DATA_VERSION !== jsonData._type) {
    jsonData = convertItemDataToLatestVersion(jsonData);
  }
  return importDataFromJSON(jsonData, LATEST_ITEM_DATA_VERSION, data => copyItem(data, dst));
}

export function exportItemToJSON(item, dst = undefined) {
  let data = copyItem(item);
  delete data.itemId;
  return exportDataToJSON(LATEST_ITEM_DATA_VERSION, data, {}, dst);
}

export function importDataFromJSON(jsonData, expectedType, dataCallback) {
  if (jsonData._type === expectedType) {
    return dataCallback(jsonData._data);
  } else {
    throw new Error(`Invalid json data format for imported type '${expectedType}'.`);
  }
}

export function exportDataToJSON(type, data, metadata, dst = undefined) {
  if (!dst) {
    dst = {};
  }
  dst._type = type;
  dst._data = data;
  dst._metadata = {
    timestamp: Date.now(),
    ...metadata,
  };
  return dst;
}

export function convertInventoryDataToLatestVersion(jsonData) {
  switch(jsonData._type) {
    case 'inv_v2':
      // This is the current latest version.
      return jsonData;
    case 'inv_v1':
      let oldItems = { ...jsonData._data.items };
      let oldSlots = jsonData._data.slots.slice();
      let newItems = {};
      let newSlots = new Array(oldSlots.length);
      let newSlottedId = 1;
      let itemIdToSlottedMapping = {};
      for(let i = 0; i < oldSlots.length; ++i) {
        let oldItemId = oldSlots[i];
        if (oldItemId) {
          let oldItem = oldItems[oldItemId];
          if (oldItem) {
            delete oldItems[oldItemId];
            newItems[newSlottedId] = oldItem;
            newSlots[i] = newSlottedId;
            newSlottedId += 1;
            itemIdToSlottedMapping[oldItemId] = newSlottedId;
          } else {
            let slottedId = itemIdToSlottedMapping[oldItemId];
            newSlots[i] = slottedId;
          }
        }
      }
      jsonData._data.items = newItems;
      jsonData._data.slots = newSlots;
      break;
    default:
      throw new Error('Cannot convert inventory for unknown json data type.');
  }
  jsonData._type = LATEST_INVENTORY_DATA_VERSION;
  return jsonData;
}

export function convertItemDataToLatestVersion(jsonData) {
  switch(jsonData._type) {
    case 'item_v1':
      // This is the current latest version.
      return jsonData;
    default:
      throw new Error('Cannot convert item for unknown json data type.');
  }
  jsonData._type = LATEST_INVENTORY_DATA_VERSION;
  return jsonData;
}
