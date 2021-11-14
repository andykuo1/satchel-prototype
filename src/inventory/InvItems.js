import { getInventorySlotCount } from './Inv.js';
import { clearSlots, getSlotCoordsByIndex, setSlots } from './InvSlots.js';

export function hasItem(inv, itemId) {
  let item = inv.items[itemId];
  if (item) {
    return true;
  } else {
    return false;
  }
}

export function putItem(inv, item, coordX, coordY) {
  if (!inv) {
    throw new Error('Cannot put item to non-existant inventory.');
  }
  if (!item) {
    throw new Error('Cannot put null item.');
  }
  const itemId = item.itemId;
  if (itemId in inv.items) {
    throw new Error(`Cannot put item '${itemId}' that already exists in inventory '${inv.invId}'.`);
  }
  inv.items[itemId] = item;
  setSlots(inv, coordX, coordY, coordX + item.width - 1, coordY + item.height - 1, itemId);
}

export function removeItem(inv, itemId) {
  if (!inv) {
    throw new Error('Cannot remove item from non-existant inventory.');
  }
  if (!(itemId in inv.items)) {
    throw new Error(`Cannot remove item '${itemId}' that does not exist in inventory '${inv.invId}'.`);
  }
  let slotIndex = getSlotIndexByItemId(inv, itemId);
  if (slotIndex < 0) {
    return null;
  }
  let item = getItemByItemId(inv, itemId);
  let [fromX, fromY] = getSlotCoordsByIndex(inv, slotIndex);
  let toX = fromX + item.width - 1;
  let toY = fromY + item.height - 1;
  clearSlots(inv, fromX, fromY, toX, toY);
  delete inv.items[itemId];
}

export function clearItems(inv) {
  clearSlots(inv, 0, 0, inv.width - 1, inv.height - 1);
  inv.items = {};
}

export function getItemByItemId(inv, itemId) {
  return inv.items[itemId];
}

export function getItemIds(inv) {
  return Object.keys(inv.items);
}

export function getItems(inv) {
  return Object.values(inv.items);
}

function getSlotIndexByItemId(inv, itemId, startIndex = 0) {
  const length = getInventorySlotCount(inv);
  for(let i = startIndex; i < length; ++i) {
    let invItemId = inv.slots[i];
    if (invItemId && invItemId === itemId) {
      return i;
    }
  }
  return -1;
}
