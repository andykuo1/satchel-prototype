import { itemMouseDownCallback } from './ContainerHelper.js';
import {
  addItemChangeListener,
  getInventoryStore,
  getItem,
  isItemInInventory,
  removeItemChangeListener,
} from './InventoryStore.js';

const INNER_HTML = `
<figure class="container">
    <img src="res/images/scroll.png">
    <figcaption></figcaption>
</figure>
`;
const INNER_STYLE = `
:host {
    --background-color: rgba(0, 0, 0, 0.1);
    --hover-color: rgba(0, 0, 0, 0.2);
    --itemX: 0;
    --itemY: 0;
    --itemWidth: 1;
    --itemHeight: 1;
    /* var(--item-unit-size) is inherited from parent container. */
}
.container {
    display: inline-block;
    position: absolute;
    left: calc(var(--itemX) * var(--item-unit-size, 48px));
    top: calc(var(--itemY) * var(--item-unit-size, 48px));
    width: calc(var(--itemWidth) * var(--item-unit-size, 48px));
    height: calc(var(--itemHeight) * var(--item-unit-size, 48px));
    padding: 0;
    margin: 0;
    user-select: none;
    box-shadow: 0 0 0 rgba(0, 0, 0, 0);
    transition: box-shadow 0.1s ease;
    background-color: var(--background-color);
}
.container:hover {
    background-color: var(--hover-color);
    z-index: 1;
}
img {
    width: 100%;
    height: 100%;
}
figcaption {
    position: absolute;
    left: 0;
    right: 0;
    bottom: calc(var(--item-unit-size, 48px) / 4);
    opacity: 0;
    text-align: center;
    color: white;
    font-size: 1.2em;
    background-color: rgba(0, 0, 0, 0.7);
}
.container:hover figcaption {
    opacity: 1;
}
`;

export class InventoryItemElement extends HTMLElement {
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
    customElements.define('inventory-item', this);
  }

  get inventoryName() {
    return this._inventoryName;
  }

  get itemId() {
    return this._itemId;
  }

  get container() {
    return this._containerElement;
  }

  /**
   * 
   * @param {import('./InventoryGrid.js').InventoryGridElement} containerElement 
   * @param {string} inventoryName 
   * @param {string} itemId 
   */
  constructor(containerElement, inventoryName, itemId) {
    super();
    if (!containerElement) {
      throw new Error('Missing container for item element.');
    }
    if (!inventoryName) {
      throw new Error('Missing inventory name for item element.');
    }
    if (!itemId) {
      throw new Error('Missing item id for item element.');
    }
    if (containerElement.name !== inventoryName) {
      throw new Error('Cannot create item element with mismatched container and inventory name.');
    }
    if (!isItemInInventory(getInventoryStore(), inventoryName, itemId)) {
      throw new Error('Cannot create item element with item id not in given inventory.');
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
    this._inventoryName = inventoryName;
    /** @private */
    this._itemId = itemId;

    /** @private */
    this._image = this.shadowRoot.querySelector('img');
    /** @private */
    this._caption = this.shadowRoot.querySelector('figcaption');

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
    addItemChangeListener(getInventoryStore(), this.itemId, this.onItemChange);
    this.onItemChange(getInventoryStore(), this.itemId);
  }

  /** @protected */
  disconnectedCallback() {
    this.removeEventListener('mousedown', this.onMouseDown);
    this.removeEventListener('contextmenu', this.onContextMenu);
    removeItemChangeListener(getInventoryStore(), this.itemId, this.onItemChange);
  }

  /**
   * @param store
   * @param itemId
   * @protected
   */
  onItemChange(store, itemId) {
    const item = getItem(store, itemId);
    this.style.setProperty('--itemX', item.x);
    this.style.setProperty('--itemY', item.y);
    this.style.setProperty('--itemWidth', item.w);
    this.style.setProperty('--itemHeight', item.h);
    this._image.src = item.imgSrc;
    this._image.alt = item.displayName;
    this._caption.textContent = item.displayName;
  }

  /**
   * @param e
   * @protected
   */
  onMouseDown(e) {
    if (e.button === 0) {
      return itemMouseDownCallback(e, this, 48);
    }
  }

  /**
   * @param e
   * @protected
   */
  onContextMenu(e) {
    this.dispatchEvent(
      new CustomEvent('itemcontext', {
        bubbles: true,
        composed: true,
        detail: {
          element: this,
          container: this.container,
          inventoryName: this.inventoryName,
          itemId: this.itemId
        },
      })
    );
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}
InventoryItemElement.define();
