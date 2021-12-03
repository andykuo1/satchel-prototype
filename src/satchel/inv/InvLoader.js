import { exportDataToJSON, importDataFromJSON } from '../../session/SatchelDataLoader.js';
import { cloneInventory } from './Inv.js';

export function importInventoryFromJSON(jsonData, dst = undefined) {
  switch(jsonData._type) {
    case 'inv_v1':
      return importDataFromJSON(jsonData, 'inv_v1', data => cloneInventory(data, dst));
    case 'inv_v2':
    default:
      // Current version.
      break;
  }
  return importDataFromJSON(jsonData, 'inv_v2', data => cloneInventoryWithSlotted(data, dst));
}

export function exportInventoryToJSON(inv, dst = undefined) {
  return exportDataToJSON('inv_v2', cloneInventoryWithSlotted(inv), {}, dst);
}

export function cloneInventoryWithSlotted(inv, dst = undefined) {
  if ('__slotsMap' in inv) {
    const slots = inv.slots;
    const slotsMapping = inv['__slotsMap'];
    const length = inv.length;
    let newSlots = new Array(length).fill(null);
    for(let i = 0; i < length; ++i) {
      let slottedId = slots[i];
      if (slottedId) {
        let itemId = slotsMapping[slottedId];
        newSlots[i] = itemId;
      }
    }
    delete inv['__slotsMap'];
    inv.slots = newSlots;
    let result = cloneInventory(inv, dst);
    return result;
  } else {
    let result = cloneInventory(inv, dst);
    const slots = result.slots;
    const length = result.length;
    let newSlots = new Array(length).fill(0);
    let nextAvailableSlottedId = 1;
    let itemMapping = {};
    let slotsMapping = {};
    for(let i = 0; i < length; ++i) {
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
    result['__slotsMap'] = slotsMapping;
    result.slots = newSlots;
    return result;
  }
}
