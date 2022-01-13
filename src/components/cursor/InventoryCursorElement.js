import { distanceSquared } from '../../util/math.js';
import {
  getSatchelStore,
} from '../../store/SatchelStore.js';
import {
  getExistingInventory,
  removeItemFromInventory,
  clearItemsInInventory,
  addItemToInventory,
  getItemAtSlotIndex
} from '../../satchel/inv/InventoryTransfer.js';
import { getItemByItemId } from '../../satchel/inv/InvItems.js';
import { getSlotCoordsByIndex, getSlotIndexByItemId, isSlotIndexEmpty } from '../../satchel/inv/InvSlots.js';
import { putDownToGridInventory, putDownToSocketInventory } from './InventoryCursorElementHelper.js';
import { DEFAULT_ITEM_UNIT_SIZE } from '../invgrid/InventoryElementMouseHelper.js';
import { isInvInStore, getInvInStore, createSocketInvInStore, deleteInvInStore } from '../../store/InvStore.js';
import { dropItemOnGround } from '../../satchel/GroundAlbum.js';

/**
 * @typedef {import('../invgrid/InventoryGridElement.js').InventoryGridElement} InventoryGridElement
 * 
 * @typedef {import('../../satchel/inv/Inv.js').Inventory} Inventory
 * @typedef {import('../../satchel/inv/Inv.js').InvId} InvId
 * @typedef {import('../../store/SatchelStore.js').SatchelStore} SatchelStore
 *
 * @typedef {import('../../satchel/item/Item.js').Item} Item
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 */

const CURSOR_OFFSET_PIXELS = 24;
const PLACE_BUFFER_RANGE = 10;
const PLACE_BUFFER_RANGE_SQUARED = PLACE_BUFFER_RANGE * PLACE_BUFFER_RANGE;
const CURSOR_INV_ID = 'cursor';

const INNER_HTML = /* html */`
<inventory-grid invid="${CURSOR_INV_ID}"></inventory-grid>
`;
const INNER_STYLE = /* css */`
:host {
  position: absolute;
  display: none;
  filter: brightness(70%);
  opacity: 1;
}
/* This is only used externally and for style. */
:host([danger]) {
  opacity: 0.8;
  filter: brightness(70%) drop-shadow(0 0 0.5em red);
}
`;

export class InventoryCursorElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('inventory-cursor', this);
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(
      this.constructor[Symbol.for('templateNode')].content.cloneNode(true)
    );
    this.shadowRoot.append(
      this.constructor[Symbol.for('styleNode')].cloneNode(true)
    );

    /** @private */
    this.animationHandle = null;
    /** @private */
    this.clientX = 0;
    /** @private */
    this.clientY = 0;

    /** @private */
    this.startHeldX = 0;
    /** @private */
    this.startHeldY = 0;
    /** @private */
    this.heldOffsetX = 0;
    /** @private */
    this.heldOffsetY = 0;

    /**
     * This allows drag-n-drop or click-n-deposit gestures.
     * 
     * @private
     */
    this.ignoreFirstPutDown = false;

    /** @private */
    this.inventoryElement = /** @type {InventoryGridElement} */ (this.shadowRoot.querySelector('inventory-grid'));

    /** @private */
    this.onAnimationFrame = this.onAnimationFrame.bind(this);
    /** @private */
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  get invId() {
    return this.inventoryElement.invId;
  }

  /** @protected */
  connectedCallback() {
    let store = getSatchelStore();
    if (!isInvInStore(store, CURSOR_INV_ID)) {
      createSocketInvInStore(store, CURSOR_INV_ID);
    }

    document.addEventListener('mousemove', this.onMouseMove);
    this.animationHandle = requestAnimationFrame(this.onAnimationFrame);
  }

  /** @protected */
  disconnectedCallback() {
    document.removeEventListener('mousemove', this.onMouseMove);
    cancelAnimationFrame(this.animationHandle);
    this.animationHandle = null;

    let store = getSatchelStore();
    if (isInvInStore(store, CURSOR_INV_ID)) {
      deleteInvInStore(store, CURSOR_INV_ID, getInvInStore(store, CURSOR_INV_ID));
    }
  }

  /** @private */
  onAnimationFrame() {
    // Update cursor position
    const clientX = this.clientX;
    const clientY = this.clientY;
    const posX = clientX + this.heldOffsetX * DEFAULT_ITEM_UNIT_SIZE;
    const posY = clientY + this.heldOffsetY * DEFAULT_ITEM_UNIT_SIZE;
    this.style.setProperty('left', `${posX - CURSOR_OFFSET_PIXELS}px`);
    // TODO: Maybe add 2rem from InventoryGridElement's title margin?
    this.style.setProperty('top', `calc(${posY - CURSOR_OFFSET_PIXELS}px)`);
    if (
      this.ignoreFirstPutDown &&
      distanceSquared(clientX, clientY, this.startHeldX, this.startHeldY) >=
        PLACE_BUFFER_RANGE_SQUARED
    ) {
      // This is a drag motion. Next putDown should be intentful.
      this.ignoreFirstPutDown = false;
    }
    // Wait for another frame...
    this.animationHandle = requestAnimationFrame(this.onAnimationFrame);
  }

  /** @private */
  onMouseMove(e) {
    this.clientX = e.clientX;
    this.clientY = e.clientY;
  }

  /**
   * Pick up from target inventory to cursor if able to.
   *
   * @param {InvId} invId The inventory to pick up from
   * @param {ItemId} itemId The item to pick up
   * @param {number} coordX The cursor pick up coordinates from the inventory
   * @param {number} coordY The cursor pick up coordinates from the inventory
   * @returns {boolean} Whether the transfer to cursor was successful.
   */
  pickUp(invId, itemId, coordX = 0, coordY = 0) {
    if (!itemId) {
      return false;
    }
    if (this.hasHeldItem()) {
      // NOTE: Swapping is performed on putDown(), so ignore for pick up.
      return false;
    }
    let store = getSatchelStore();
    let inv = getExistingInventory(store, invId);
    const slotIndex = getSlotIndexByItemId(inv, itemId);
    const [fromItemX, fromItemY] = getSlotCoordsByIndex(inv, slotIndex);
    const item = getItemByItemId(inv, itemId);
    removeItemFromInventory(store, invId, itemId);
    this.setHeldItem(item, fromItemX - coordX, fromItemY - coordY);
    return true;
  }

  /**
   * Put down from cursor to destination inventory.
   *
   * @param {InvId} invId
   * @param {number} coordX
   * @param {number} coordY
   * @param {boolean} swappable
   */
  putDown(invId, coordX, coordY, swappable) {
    let store = getSatchelStore();
    const heldItem = this.getHeldItem();
    if (!heldItem) {
      return false;
    }
    if (this.ignoreFirstPutDown) {
      // First put down has been ignored. Don't ignore the next intentful one.
      this.ignoreFirstPutDown = false;
      return true;
    }
    const toInventory = getExistingInventory(store, invId);
    const invType = toInventory.type;
    switch (invType) {
      case 'socket':
        return putDownToSocketInventory(this, store, invId, coordX, coordY, swappable);
      case 'grid':
        return putDownToGridInventory(
          this,
          store,
          invId,
          coordX + this.heldOffsetX,
          coordY + this.heldOffsetY,
          swappable
        );
      default:
        throw new Error('Unsupported inventory type.');
    }
  }

  /**
   * Drop from cursor to ground.
   */
  dropDown() {
    let store = getSatchelStore();
    const heldItem = this.getHeldItem();
    if (!heldItem) {
      return false;
    }
    if (this.ignoreFirstPutDown) {
      // First put down has been ignored. Don't ignore the next intentful one.
      this.ignoreFirstPutDown = false;
      return true;
    }
    this.clearHeldItem();
    dropItemOnGround(heldItem);
  }

  hasHeldItem() {
    let store = getSatchelStore();
    let inv = getExistingInventory(store, this.invId);
    return !isSlotIndexEmpty(inv, 0);
  }

  getHeldItem() {
    let store = getSatchelStore();
    return getItemAtSlotIndex(store, this.invId, 0);
  }

  /**
   * @param {Item} item The item to hold
   * @param {number} offsetX The held offset from root item slot (can only be non-positive)
   * @param {number} offsetY The held offset from root item slot (can only be non-positive)
   */
  setHeldItem(item, offsetX = 0, offsetY = 0) {
    if (!item) {
      throw new Error(
        'Cannot set held item to null - use clearHeldItem() instead.'
      );
    }
    if (this.hasHeldItem()) {
      throw new Error('Cannot set held item - already holding another item.');
    }
    let store = getSatchelStore();
    addItemToInventory(store, this.invId, item, 0, 0);
    this.style.display = 'unset';
    this.ignoreFirstPutDown = true;
    this.startHeldX = this.clientX;
    this.startHeldY = this.clientY;
    this.heldOffsetX = Math.min(0, offsetX);
    this.heldOffsetY = Math.min(0, offsetY);
  }

  clearHeldItem() {
    let store = getSatchelStore();
    clearItemsInInventory(store, this.invId);
    this.style.display = 'none';
    this.ignoreFirstPutDown = false;
  }
}
InventoryCursorElement.define();

/**
 * @returns {InventoryCursorElement}
 */
export function getCursor() {
  return document.querySelector('inventory-cursor');
}
