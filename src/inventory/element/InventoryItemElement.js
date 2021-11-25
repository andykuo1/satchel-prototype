import Template from './InventoryItemElement.template.html';
import Style from './InventoryItemElement.module.css';

import { DEFAULT_ITEM_UNIT_SIZE, itemMouseDownCallback } from './InventoryElementMouseHelper.js';
import {
  addItemChangeListener,
  getInventoryStore,
  removeItemChangeListener,
} from '../InventoryStore.js';
import { getExistingInventory } from '../InventoryTransfer.js';
import { hasItem, getItemByItemId } from '../InvItems.js';
import { getSlotCoordsByIndex, getSlotIndexByItemId } from '../InvSlots.js';

/** @typedef {import('./InventoryGridElement.js').InventoryGridElement} InventoryGridElement */

export class InventoryItemElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = Template;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = Style;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('inventory-item', this);
  }

  get invId() {
    return this._invId;
  }

  get itemId() {
    return this._itemId;
  }

  get container() {
    return this._containerElement;
  }

  /**
   * @param {InventoryGridElement} containerElement
   * @param {string} invId
   * @param {string} itemId
   */
  constructor(containerElement, invId, itemId) {
    super();
    if (!containerElement) {
      throw new Error('Missing container for item element.');
    }
    if (!invId) {
      throw new Error('Missing inventory id for item element.');
    }
    if (!itemId) {
      throw new Error('Missing item id for item element.');
    }
    if (containerElement.invId !== invId) {
      throw new Error(
        'Cannot create item element with mismatched container and inventory id.'
      );
    }
    const inv = getExistingInventory(getInventoryStore(), invId);
    if (!hasItem(inv, itemId)) {
      throw new Error(
        'Cannot create item element with item id not in given inventory.'
      );
    }
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(
      this.constructor[Symbol.for('templateNode')].content.cloneNode(true)
    );
    this.shadowRoot.append(
      this.constructor[Symbol.for('styleNode')].cloneNode(true)
    );

    /** @private */
    this._containerElement = containerElement;
    /** @private */
    this._invId = invId;
    /** @private */
    this._itemId = itemId;

    /** @private */
    this._image = this.shadowRoot.querySelector('img');
    /** @private */
    this._caption = this.shadowRoot.querySelector('figcaption');
    /** @private */
    this._stackSize = this.shadowRoot.querySelector('#stackSize');

    /** @protected */
    this.onItemChange = this.onItemChange.bind(this);
    /** @protected */
    this.onMouseDown = this.onMouseDown.bind(this);
    /** @protected */
    this.onContextMenu = this.onContextMenu.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.addEventListener('mousedown', this.onMouseDown);
    this.addEventListener('contextmenu', this.onContextMenu);
    addItemChangeListener(this.itemId, this.onItemChange);
    this.onItemChange(getInventoryStore(), this.itemId);
  }

  /** @protected */
  disconnectedCallback() {
    this.removeEventListener('mousedown', this.onMouseDown);
    this.removeEventListener('contextmenu', this.onContextMenu);
    removeItemChangeListener(
      this.itemId,
      this.onItemChange
    );
  }

  /**
   * @param store
   * @param itemId
   * @protected
   */
  onItemChange(store, itemId) {
    const invId = this._containerElement.invId;
    const inv = getExistingInventory(store, invId);
    const slotIndex = getSlotIndexByItemId(inv, itemId);
    const [x, y] = getSlotCoordsByIndex(inv, slotIndex);
    const item = getItemByItemId(inv, itemId);
    this.style.setProperty('--itemX', `${x}`);
    this.style.setProperty('--itemY', `${y}`);
    this.style.setProperty('--itemWidth', `${item.width}`);
    this.style.setProperty('--itemHeight', `${item.height}`);
    const title = item.displayName || 'Item';
    this.title = title;
    this._image.src = item.imgSrc;
    this._image.alt = title;
    this._caption.textContent = item.displayName;
    this._caption.classList.toggle('vertical', item.width < item.height);
    // Stack size
    if (item.stackSize >= 0) {
      this._stackSize.textContent = `⨯${item.stackSize}`;
    } else {
      this._stackSize.textContent = '';
    }
  }

  /**
   * @param e
   * @protected
   */
  onMouseDown(e) {
    if (e.button === 0) {
      return itemMouseDownCallback(e, this, DEFAULT_ITEM_UNIT_SIZE);
    }
  }

  /**
   * @param {MouseEvent} e
   * @protected
   */
  onContextMenu(e) {
    let event = new CustomEvent('itemcontext', {
      bubbles: true,
      composed: true,
      detail: {
        clientX: e.clientX,
        clientY: e.clientY,
        element: this,
        container: this.container,
        invId: this.invId,
        itemId: this.itemId,
      },
    });
    this.dispatchEvent(event);
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}
InventoryItemElement.define();
