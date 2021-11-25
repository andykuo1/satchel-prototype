import Template from './InventoryGridElement.template.html';
import Style from './InventoryGridElement.module.css';

import { upgradeProperty } from '../../util/wc.js';
import { containerMouseUpCallback, DEFAULT_ITEM_UNIT_SIZE } from './InventoryElementMouseHelper.js';
import {
  addInventoryChangeListener,
  createGridInventoryInStore,
  createSocketInventoryInStore,
  getInventoryInStore,
  getInventoryStore,
  removeInventoryChangeListener,
} from '../InventoryStore.js';
import { InventoryItemElement } from './InventoryItemElement.js';
import {
  getItemAtSlotIndex,
} from '../InventoryTransfer.js';
import { getItemIds } from '../InvItems.js';
import { uuid } from '../../util/uuid.js';

export class InventoryGridElement extends HTMLElement {
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
    customElements.define('inventory-grid', this);
  }

  static get observedAttributes() {
    return ['invid', 'init'];
  }

  get invId() {
    return this._invId;
  }

  set invId(value) {
    this.setAttribute('invid', value);
  }

  get init() {
    return this._init;
  }

  set init(value) {
    this.setAttribute('init', value);
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
    this._invId = undefined;
    /** @private */
    this._init = undefined;

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
    let invId = this._invId;
    if (invId) {
      let store = getInventoryStore();
      addInventoryChangeListener(
        invId,
        this.onInventoryChange
      );
      this.onInventoryChange(store, invId);
    }
    upgradeProperty(this, 'invId');
    upgradeProperty(this, 'init');
  }

  /** @protected */
  disconnectedCallback() {
    this._container.removeEventListener('mouseup', this.onMouseUp);
    this._container.removeEventListener('contextmenu', this.onContextMenu);
    const invId = this._invId;
    if (invId) {
      removeInventoryChangeListener(
        invId,
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
      case 'init': {
        const store = getInventoryStore();
        let invId = this.invId;
        if (!invId) {
          invId = uuid();
          this.invId = invId;
        }
        if (value === 'socket') {
          createSocketInventoryInStore(store, invId);
        } else if (value.startsWith('grid')) {
          let i = value.indexOf('x');
          let w = Number(value.substring(4, i)) || 1;
          let h = Number(value.substring(i + 1)) || 1;
          createGridInventoryInStore(store, invId, w, h);
        } else {
          throw new Error('Unknown init type for inventory-grid.');
        }
      } break;
      case 'invid': {
        const store = getInventoryStore();
        const prevInvId = this._invId;
        const nextInvId = value;
        if (prevInvId !== nextInvId) {
          this._invId = nextInvId;
          if (prevInvId) {
            removeInventoryChangeListener(
              prevInvId,
              this.onInventoryChange
            );
          }
          if (nextInvId) {
            addInventoryChangeListener(nextInvId, this.onInventoryChange);
            this.onInventoryChange(store, nextInvId);
          }
        }
      } break;
    }
  }

  /**
   * @param store
   * @param invId
   * @protected
   */
  onInventoryChange(store, invId) {
    const inv = getInventoryInStore(store, invId);
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
      const item = getItemAtSlotIndex(store, invId, 0);
      if (item) {
        invWidth = item.width;
        invHeight = item.height;
      } else {
        invWidth = 1;
        invHeight = 1;
      }
    }

    this.style.setProperty('--container-width', `${invWidth}`);
    this.style.setProperty('--container-height', `${invHeight}`);

    // Set display name
    const displayName = inv.displayName;
    this._containerTitle.textContent = displayName;
    this._container.classList.toggle('flattop', Boolean(displayName));

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
    for (const itemId of getItemIds(inv)) {
      let element;
      element =
        itemId in preservedItems
          ? preservedItems[itemId]
          : new InventoryItemElement(this, invId, itemId);
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
      return containerMouseUpCallback(e, this, DEFAULT_ITEM_UNIT_SIZE);
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
