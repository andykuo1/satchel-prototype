import { containerMouseUpCallback, DEFAULT_ITEM_UNIT_SIZE } from './InventoryElementMouseHelper.js';
import {
  getSatchelStore,
} from '../../store/SatchelStore.js';
import { InventoryItemElement } from './InventoryItemElement.js';
import {
 getItemIdsInSlots
} from '../../satchel/inv/InventoryTransfer.js';
import { addInventoryChangeListener, removeInventoryChangeListener } from '../../events/InvEvents.js';
import { getInvInStore, isInvInStore } from '../../store/InvStore.js';
import { getItemInInv } from '../../satchel/inv/InventoryItems.js';
import { updateList } from '../ElementListHelper.js';
import { upgradeProperty } from '../../util/wc.js';

/**
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 * @typedef {import('../../satchel/inv/Inv.js').InvId} InvId
 * @typedef {import('../../store/SatchelStore.js').SatchelStore} Store
 */

const INNER_HTML = /* html */`
<div class="container grid">
  <p class="itemList"></p>
</div>
`;
const INNER_STYLE = /* css */`
:host {
  display: inline-block;
  position: relative;

  --grid-color: var(--satchel-grid-color);

  --inv-width: 1;
  --inv-height: 1;
  --item-unit-size: ${DEFAULT_ITEM_UNIT_SIZE}px;

  width: calc(var(--inv-width) * var(--item-unit-size));
  height: calc(var(--inv-height) * var(--item-unit-size));
  background-color: white;
}
p {
  margin: 0;
  padding: 0;
}
.container {
  width: 100%;
  height: 100%;
}
.grid {
  background-size: calc(100% / var(--inv-width)) calc(100% / var(--inv-height));
  background-position: -1px -1px;
  background-image:
    linear-gradient(to right, var(--grid-color), transparent 1px),
    linear-gradient(to bottom, var(--grid-color), transparent 1px);
}
`;

/**
 * - init - create a new inventory on add
 * - fixed - force single unit size
 * - temp - delete the inventory on remove
 * - noinput - no adding items
 * - nooutput - no removing items
 * - copyoutput - only copy items on remove (does not actually remove)
 */
export class ItemGridElement extends HTMLElement {
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
    customElements.define('item-grid', this);
  }

  /** @protected */
  static get observedAttributes() {
    return ['invid'];
  }

  get invId() {
    return this._invId;
  }

  set invId(value) {
    this.setAttribute('invid', value);
  }

  get _container() {
    return this.containerElement;
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));
    
    /** @private */
    this._invId = null;

    /** @private */
    this.containerElement = shadowRoot.querySelector('.container');

    /** @private */
    this.itemList = shadowRoot.querySelector('.itemList');

    /** @private */
    this.onItemListEntryCreate = this.onItemListEntryCreate.bind(this);
    /** @private */
    this.onInventoryChange = this.onInventoryChange.bind(this);
    /** @private */
    this.onMouseUp = this.onMouseUp.bind(this);
    /** @private */
    this.onContextMenu = this.onContextMenu.bind(this);
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'invId');

    const store = getSatchelStore();
    const invId = this.getAttribute('invid');
    if (!invId) {
      throw new Error(`Missing attribute 'invid' for inv-grid element.`);
    }
    this.internallyChangeInvId(store, invId);
    this.containerElement.addEventListener('mouseup', this.onMouseUp);
    this.containerElement.addEventListener('contextmenu', this.onContextMenu);
  }

  /** @protected */
  disconnectedCallback() {
    const store = getSatchelStore();
    this.internallyChangeInvId(store, null);
    this.containerElement.removeEventListener('mouseup', this.onMouseUp);
    this.containerElement.removeEventListener('contextmenu', this.onContextMenu);
  }

  /**
   * @protected
   * @param {string} attribute
   * @param {string} previous
   * @param {string} value
   */
  attributeChangedCallback(attribute, previous, value) {
    switch (attribute) {
      case 'invid': {
        const store = getSatchelStore();
        this.internallyChangeInvId(store, value);
      } break;
    }
  }

  /**
   * @private
   * @param {Store} store 
   * @param {InvId} newInvId 
   */
  internallyChangeInvId(store, newInvId) {
    const prevInvId = this._invId;
    if (prevInvId !== newInvId) {
      this._invId = newInvId;
      if (prevInvId) {
        removeInventoryChangeListener(
          store,
          prevInvId,
          this.onInventoryChange
        );
      }
      if (newInvId) {
        addInventoryChangeListener(store, newInvId, this.onInventoryChange);
        this.onInventoryChange(store, newInvId);
      }
    }
  }

  /**
   * @private
   * @param {Store} store
   * @param {InvId} invId
   */
  onInventoryChange(store, invId) {
    if (!isInvInStore(store, invId)) {
      // The inv has been deleted.
      this.style.setProperty('--inv-width', '0');
      this.style.setProperty('--inv-height', '0');
      return;
    }

    const inv = getInvInStore(store, invId);
    const invType = inv.type;
    if (invType !== 'grid') {
      throw new Error('Trying to display non-grid inventory with inv-grid.');
    }
    
    // Set inv dimensions
    let invWidth = inv.width;
    let invHeight = inv.height;
    this.style.setProperty('--inv-width', `${invWidth}`);
    this.style.setProperty('--inv-height', `${invHeight}`);
    
    // Update items
    const list = getItemIdsInSlots(store, invId);
    const [created, deleted] = updateList(this.itemList, list, this.onItemListEntryCreate);
    this.dispatchEvent(new CustomEvent('change', {
      composed: true,
      bubbles: false,
      detail: {
        invId,
        created,
        deleted,
      }
    }));
  }

  /**
   * @private
   * @param {ItemId} key 
   * @returns {InventoryItemElement}
   */
  onItemListEntryCreate(key) {
    const invId = this.invId;
    const store = getSatchelStore();

    let invItem = getItemInInv(store, invId, key);
    let element = new InventoryItemElement(this, invId, invItem.itemId);
    return element;
  }

  /**
   * @private
   * @param {MouseEvent} e
   */
  onMouseUp(e) {
    if (e.button === 0) {
      return containerMouseUpCallback(e, this, DEFAULT_ITEM_UNIT_SIZE);
    }
  }

  /**
   * @private
   * @param {MouseEvent} e
   */
  onContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}
ItemGridElement.define();

