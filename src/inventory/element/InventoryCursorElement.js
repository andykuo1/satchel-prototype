import { distanceSquared } from '../../util/math.js';
import {
  createSocketInventoryInStore,
  deleteInventoryFromStore,
  getInventory,
  getInventoryInStore,
  getInventoryStore,
  getItemInStore,
  isInventoryInStore,
} from '../InventoryStore.js';
import {
  clearItems,
  getInventoryItemAt,
  getItemSlotCoords,
  isInventorySlotEmpty,
  putItem,
  removeItem,
} from '../InventoryTransfer.js';
import { putDownToGridInventory } from './InventoryCursorElementHelper.js';

/**
 * @typedef {import('./InventoryGridElement.js').InventoryGridElement} InventoryGridElement
 * 
 * @typedef {import('../Inv.js').Inventory} Inventory
 * @typedef {import('../Inv.js').InventoryId} InventoryId
 * @typedef {import('../InventoryStore.js').InventoryStore} InventoryStore
 *
 * @typedef {import('../Item.js').Item} Item
 * @typedef {import('../Item.js').ItemId} ItemId
 */

const CURSOR_OFFSET_PIXELS = 24;
const PLACE_BUFFER_RANGE = 10;
const PLACE_BUFFER_RANGE_SQUARED = PLACE_BUFFER_RANGE * PLACE_BUFFER_RANGE;
const CURSOR_INV_ID = 'cursor';

const INNER_HTML = `
<inventory-grid invid="${CURSOR_INV_ID}"></inventory-grid>
`;
const INNER_STYLE = `
:host {
  position: absolute;
  display: none;
  filter: brightness(70%);
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
    this.unitSize = 48;

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
    let store = getInventoryStore();
    if (!isInventoryInStore(store, CURSOR_INV_ID)) {
      createSocketInventoryInStore(store, CURSOR_INV_ID);
    }

    document.addEventListener('mousemove', this.onMouseMove);
    this.animationHandle = requestAnimationFrame(this.onAnimationFrame);
  }

  /** @protected */
  disconnectedCallback() {
    document.removeEventListener('mousemove', this.onMouseMove);
    cancelAnimationFrame(this.animationHandle);
    this.animationHandle = null;

    let store = getInventoryStore();
    if (isInventoryInStore(store, CURSOR_INV_ID)) {
      deleteInventoryFromStore(store, CURSOR_INV_ID, getInventoryInStore(store, CURSOR_INV_ID));
    }
  }

  /** @private */
  onAnimationFrame() {
    // Update cursor position
    const clientX = this.clientX;
    const clientY = this.clientY;
    const posX = clientX + this.heldOffsetX * this.unitSize;
    const posY = clientY + this.heldOffsetY * this.unitSize;
    this.style.setProperty('left', `${posX - CURSOR_OFFSET_PIXELS}px`);
    // NOTE: Add 2rem from InventoryGridElement's title margin
    this.style.setProperty('top', `calc(${posY - CURSOR_OFFSET_PIXELS}px - 2rem)`);
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
   * @param {InventoryId} invId The inventory to pick up from
   * @param {ItemId} itemId The item to pick up
   * @param {number} coordX The cursor pick up coordinates from the inventory
   * @param {number} coordY The cursor pick up coordinates from the inventory
   * @returns {boolean} Whether the transfer to cursor was successful.
   */
  pickUp(invId, itemId, coordX = 0, coordY = 0) {
    if (this.hasHeldItem()) {
      return false;
    }
    let store = getInventoryStore();
    if (itemId) {
      const [fromItemX, fromItemY] = getItemSlotCoords(store, invId, itemId);
      const item = getItemInStore(store, itemId);
      removeItem(store, itemId, invId);
      this.setHeldItem(item, fromItemX - coordX, fromItemY - coordY);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Put down from cursor to destination inventory.
   *
   * @param {InventoryId} invId
   * @param {number} coordX
   * @param {number} coordY
   */
  putDown(invId, coordX, coordY) {
    let store = getInventoryStore();
    const heldItem = this.getHeldItem();
    if (!heldItem) {
      return false;
    }
    if (this.ignoreFirstPutDown) {
      // First put down has been ignored. Don't ignore the next intentful one.
      this.ignoreFirstPutDown = false;
      return true;
    }
    const toInventory = getInventory(store, invId);
    const invType = toInventory.type;
    switch (invType) {
      case 'socket':
        // TODO: Force fail placing items in sockets.
        return false;
        // return putDownItemInSocketInventory(this, store, invId, coordX, coordY);
      case 'grid':
        return putDownToGridInventory(
          this,
          store,
          invId,
          coordX + this.heldOffsetX,
          coordY + this.heldOffsetY
        );
      default:
        throw new Error('Unsupported inventory type.');
    }
  }

  hasHeldItem() {
    let store = getInventoryStore();
    return !isInventorySlotEmpty(store, this.invId, 0, 0);
  }

  getHeldItem() {
    let store = getInventoryStore();
    return getInventoryItemAt(store, this.invId, 0, 0);
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
    let store = getInventoryStore();
    putItem(store, this.invId, item, 0, 0);
    this.style.display = 'unset';
    this.ignoreFirstPutDown = true;
    this.startHeldX = this.clientX;
    this.startHeldY = this.clientY;
    this.heldOffsetX = Math.min(0, offsetX);
    this.heldOffsetY = Math.min(0, offsetY);
  }

  clearHeldItem() {
    let store = getInventoryStore();
    clearItems(store, this.invId);
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
