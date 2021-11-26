/**
 * @typedef {import('../inventory/element/InventoryCursorElement.js').InventoryCursorElement} InventoryCursorElement
 * @typedef {import('../inventory/Item.js').ItemId} ItemId
 * @typedef {import('../inventory/Item.js').Item} Item
 */

import { copyItem } from '../inventory/Item.js';

const INNER_HTML = /* html */ `
<img>
`;
const INNER_STYLE = /* css */ `
:host {
  display: inline-block;
}
img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
`;

export class ItemBarItemElement extends HTMLElement {
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
    customElements.define('item-bar-item', this);
  }

  /**
   * @param {ItemId} itemId 
   * @param {Item} itemData 
   */
  constructor(itemId, itemData) {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    this.shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    this.itemId = itemId;
    this.itemData = itemData;

    /** @private */
    this.image = this.shadowRoot.querySelector('img');

    /** @private */
    this.onMouseDown = this.onMouseDown.bind(this);
  }

  /** @protected */
  connectedCallback() {
    if (this.itemData) {
      this.image.src = this.itemData.imgSrc;
      this.image.title = this.itemData.displayName;
      this.image.alt = this.itemData.displayName;
    }
    this.image.addEventListener('mousedown', this.onMouseDown);
  }

  /** @protected */
  disconnectedCallback() {
    this.image.removeEventListener('mousedown', this.onMouseDown);
  }

  /** @private */
  onMouseDown(e) {
    if (e.button !== 0) {
      return;
    }
    if (!this.itemId || !this.itemData) {
      return;
    }
    /** @type {InventoryCursorElement} */
    let cursor = document.querySelector('inventory-cursor');
    if (cursor && !cursor.hasHeldItem()) {
      let newItem = copyItem(this.itemData);
      cursor.setHeldItem(newItem, 0, 0);
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
}
ItemBarItemElement.define();
