import { updateList } from '../ElementListHelper.js';
import { ItemElement } from '../invgrid/ItemElement.js';
import { getItemIdsInSlots } from '../../satchel/inv/InventoryTransfer.js';
import { getItemInInv } from '../../satchel/inv/InventoryItems.js';
import { getInventoryViewInvId } from './InventoryView.js';
import { getSatchelStore } from '../../store/SatchelStore.js';

export function useInternalInventoryItemList(parent, invView) {
  return () => {
    const store = getSatchelStore();
    const invId = getInventoryViewInvId(invView);
    const list = getItemIdsInSlots(store, invId);
    const [created, deleted] = updateList(parent, list, (key) => {
      let invItem = getItemInInv(store, invId, key);
      return new ItemElement(invView, invId, invItem.itemId);
    });
    return [created, deleted];
  };
}

export class InventoryItemList {
  /**
   * @param {HTMLElement} parent The parent element to add all item elements under.
   */
  constructor(parent) {
    this.parent = parent;
  }
  
  update(store, invView) {
    const invId = getInventoryViewInvId(invView);
    const list = getItemIdsInSlots(store, invId);
    const [created, deleted] = updateList(this.parent, list, (key) => {
      let invItem = getItemInInv(store, invId, key);
      return new ItemElement(invView, invId, invItem.itemId);
    });
    return [created, deleted];
  }
}
