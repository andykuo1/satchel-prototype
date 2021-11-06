import { upgradeProperty } from '../util/wc.js';
import { itemMouseDownCallback } from './ContainerHelper.js';
import {
  addItemChangeListener,
  getInventoryStore,
  getItem,
  removeItemChangeListener,
  updateItem,
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

export class InventoryItem extends HTMLElement {
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

  static get observedAttributes() {
    return ['itemId'];
  }

  get itemId() {
    return this._itemId;
  }

  set itemId(value) {
    this.setAttribute('itemId', value);
  }

  get x() {
    const item = getItem(getInventoryStore(), this.itemId);
    return item.x;
  }

  set x(value) {
    updateItem(getInventoryStore(), this.itemId, { x: value });
  }

  get y() {
    const item = getItem(getInventoryStore(), this.itemId);
    return item.y;
  }

  set y(value) {
    updateItem(getInventoryStore(), this.itemId, { y: value });
  }

  get w() {
    const item = getItem(getInventoryStore(), this.itemId);
    return item.w;
  }

  set w(value) {
    updateItem(getInventoryStore(), this.itemId, { w: value });
  }

  get h() {
    const item = getItem(getInventoryStore(), this.itemId);
    return item.h;
  }

  set h(value) {
    updateItem(getInventoryStore(), this.itemId, { h: value });
  }

  get src() {
    const item = getItem(getInventoryStore(), this.itemId);
    return item.imgSrc;
  }

  set src(value) {
    updateItem(getInventoryStore(), this.itemId, { imgSrc: value });
  }

  get name() {
    const item = getItem(getInventoryStore(), this.itemId);
    return item.displayName;
  }

  set name(value) {
    updateItem(getInventoryStore(), this.itemId, { displayName: value });
  }

  constructor(itemId = undefined) {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(
      this.constructor[Symbol.for('templateNode')].content.cloneNode(true)
    );
    this.shadowRoot.append(
      this.constructor[Symbol.for('styleNode')].cloneNode(true)
    );

    /** @private */
    this._itemId = itemId;

    /** @private */
    this._image = this.shadowRoot.querySelector('img');
    /** @private */
    this._caption = this.shadowRoot.querySelector('figcaption');

    this.container = null;

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
    if (this._itemId) {
      const itemId = this._itemId;
      addItemChangeListener(getInventoryStore(), itemId, this.onItemChange);
      this.onItemChange(getInventoryStore(), itemId);
    }

    upgradeProperty(this, 'itemId');
  }

  /** @protected */
  disconnectedCallback() {
    this.removeEventListener('mousedown', this.onMouseDown);
    this.removeEventListener('contextmenu', this.onContextMenu);
    if (this._itemId) {
      const itemId = this._itemId;
      removeItemChangeListener(getInventoryStore(), itemId, this.onItemChange);
    }
  }

  /**
   * @param attribute
   * @param previous
   * @param value
   * @protected
   */
  attributeChangedCallback(attribute, previous, value) {
    switch (attribute) {
    case 'itemId':
      {
        const store = getInventoryStore();
        const previousId = this._itemId;
        const nextId = value;
        this._itemId = nextId;
        if (previousId) {
          removeItemChangeListener(store, previousId, this.onItemChange);
        }

        if (nextId) {
          addItemChangeListener(store, nextId, this.onItemChange);
          this.onItemChange(store, nextId);
        }
      }

      break;
    }
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
        detail: { itemId: this.itemId },
      })
    );
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}
InventoryItem.define();
