import { upgradeProperty } from '../../util/wc.js';
import { containerMouseUpCallback } from './InventoryElementMouseHelper.js';
import {
  addInventoryChangeListener,
  getInventory,
  getInventoryStore,
  removeInventoryChangeListener,
} from '../InventoryStore.js';
import { InventoryItemElement } from './InventoryItemElement.js';
import {
  getInventoryItemAt,
  getInventoryItemIds,
} from '../InventoryTransfer.js';

const DEFAULT_ITEM_UNIT_SIZE = 48;

const INNER_HTML = `
<article>
    <h2><span class="innerTitle"><slot name="title"></slot></span></h2>
    <section class="container grid">
        <slot></slot>
    </section>
</article>
`;
const INNER_STYLE = `
:host {
    --background-color: #7f6b50;
    --outline-color: #352e25;
    --grid-color: rgba(0, 0, 0, 0.2);
    --container-width: 1;
    --container-height: 1;
    --item-unit-size: ${DEFAULT_ITEM_UNIT_SIZE}px;
    --transition-duration: 0.1s;
}
article {
    display: inline-block;
    width: calc(var(--container-width) * var(--item-unit-size));
    transition: width var(--transition-duration) ease;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
}
h2 {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    font-size: 0.9rem;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    border-radius: ${DEFAULT_ITEM_UNIT_SIZE / 16}rem;
    text-align: center;
    color: white;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 1;
    transform: translateY(-100%);
}
h2:empty {
    display: none;
}
.container {
    position: relative;
    width: 100%;
    height: calc(var(--container-height) * var(--item-unit-size));
    background-color: var(--background-color);
    border: 1px solid var(--outline-color);
    border-radius: 1rem;
    box-shadow: 0.2rem 0.2rem 0 0 var(--outline-color);
    overflow: hidden;
    transition: height var(--transition-duration) ease;
}
.grid {
    background-size: var(--item-unit-size) var(--item-unit-size);
    background-position: -1px -1px;
    background-image:
        linear-gradient(to right, var(--grid-color), transparent 1px),
        linear-gradient(to bottom, var(--grid-color), transparent 1px);
}
.hidden {
    display: none;
}
`;

export class InventoryGridElement extends HTMLElement {
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
    customElements.define('inventory-grid', this);
  }

  static get observedAttributes() {
    return ['name'];
  }

  get name() {
    return this._name;
  }

  set name(value) {
    this.setAttribute('name', value);
  }

  get rows() {
    const inventory = getInventory(getInventoryStore(), this.name);
    return inventory.height;
  }

  get cols() {
    const inventory = getInventory(getInventoryStore(), this.name);
    return inventory.width;
  }

  get type() {
    const inventory = getInventory(getInventoryStore(), this.name);
    return inventory.type;
  }

  constructor(inventoryId = undefined) {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(
      this.constructor[Symbol.for('templateNode')].content.cloneNode(true)
    );
    this.shadowRoot.append(
      this.constructor[Symbol.for('styleNode')].cloneNode(true)
    );

    /** @private */
    this._name = inventoryId;

    /** @private */
    this._root = this.shadowRoot.querySelector('article');
    /** @private */
    this._itemSlot = /** @type {HTMLSlotElement} */ (
      this.shadowRoot.querySelector('.container slot')
    );
    this._container = this.shadowRoot.querySelector('.container');
    /** @private */
    this._containerTitle = this.shadowRoot.querySelector('h2');

    /** @protected */
    this.onInventoryChange = this.onInventoryChange.bind(this);
    /** @protected */
    this.onMouseUp = this.onMouseUp.bind(this);
    /** @protected */
    this.onContextMenu = this.onContextMenu.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this._container.addEventListener('mouseup', this.onMouseUp);
    this._container.addEventListener('contextmenu', this.onContextMenu);
    if (this._name) {
      const name = this._name;
      addInventoryChangeListener(
        getInventoryStore(),
        name,
        this.onInventoryChange
      );
      this.onInventoryChange(getInventoryStore(), name);
    }

    upgradeProperty(this, 'name');
  }

  /** @protected */
  disconnectedCallback() {
    this._container.removeEventListener('mouseup', this.onMouseUp);
    this._container.removeEventListener('contextmenu', this.onContextMenu);
    if (this._name) {
      const name = this._name;
      removeInventoryChangeListener(
        getInventoryStore(),
        name,
        this.onInventoryChange
      );
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
      case 'name':
        {
          const store = getInventoryStore();
          const previousName = this._name;
          const nextName = value;
          this._name = nextName;
          if (previousName) {
            removeInventoryChangeListener(
              store,
              previousName,
              this.onInventoryChange
            );
          }

          if (nextName) {
            addInventoryChangeListener(store, nextName, this.onInventoryChange);
            this.onInventoryChange(store, nextName);
          }
        }

        break;
    }
  }

  /**
   * @param store
   * @param inventoryId
   * @protected
   */
  onInventoryChange(store, inventoryId) {
    const inv = getInventory(getInventoryStore(), inventoryId);
    if (!inv) {
      // The inventory has been deleted.
      this.style.setProperty('--container-width', '0');
      this.style.setProperty('--container-height', '0');
      return;
    }

    const invType = inv.type;
    let invWidth = inv.width;
    let invHeight = inv.height;
    if (invType === 'socket') {
      const item = getInventoryItemAt(store, inventoryId, 0, 0);
      if (item) {
        invWidth = item.width;
        invHeight = item.height;
      } else {
        invWidth = 1;
        invHeight = 1;
      }
    }

    this.style.setProperty('--container-width', invWidth);
    this.style.setProperty('--container-height', invHeight);

    // Preserve unchanged items in slot
    const preservedItems = {};
    for (const node of this._itemSlot.assignedNodes()) {
      const itemNode =
        /** @type {import('./InventoryItemElement.js').InventoryItemElement} */ (node);
      const itemId = itemNode.itemId;
      if (typeof itemId === 'string') {
        preservedItems[itemId] = node;
      }
    }

    // Add new items into slot.
    const emptySlot = /** @type {HTMLSlotElement} */ (
      this._itemSlot.cloneNode(false)
    );
    for (const itemId of getInventoryItemIds(store, inventoryId)) {
      let element;
      element =
        itemId in preservedItems
          ? preservedItems[itemId]
          : new InventoryItemElement(this, inventoryId, itemId);
      emptySlot.append(element);
    }

    this._itemSlot.replaceWith(emptySlot);
    this._itemSlot = emptySlot;
    this.dispatchEvent(
      new CustomEvent('itemchange', { composed: true, bubbles: false })
    );
  }

  /**
   * @param e
   * @protected
   */
  onMouseUp(e) {
    if (e.button === 0) {
      return containerMouseUpCallback(e, this, 48);
    }
  }

  /**
   * @param e
   * @protected
   */
  onContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}
InventoryGridElement.define();