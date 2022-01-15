import { getSatchelStore } from '../../store/SatchelStore.js';
import { addItemToInventory, getItemAtSlotIndex } from '../../satchel/inv/InventoryTransfer.js';
import { uuid } from '../../util/uuid.js';
import { upgradeProperty } from '../../util/wc.js';
import { getCursor } from '../cursor/index.js';
import { cloneItem } from '../../satchel/item/Item.js';
import { getAlbumInStore, isAlbumInStore } from '../../store/AlbumStore.js';
import { addAlbumChangeListener, removeAlbumChangeListener } from '../../events/AlbumEvents.js';
import { addInventoryChangeListener, removeInventoryChangeListener } from '../../events/InvEvents.js';
import { getItemIdsInAlbum, getItemInAlbum, hasItemInAlbum, removeItemFromAlbum } from '../../satchel/album/AlbumItems.js';
import { isInvInStore, getInvInStore, deleteInvInStore, createSocketInvInStore } from '../../store/InvStore.js';

/**
 * @typedef {import('../invgrid/InventoryGridElement.js').InventoryGridElement} InventoryGridElement
 */

const INNER_HTML = /* html */`
<fieldset>
  <legend id="title"></legend>
  <slot name="items"></slot>
</fieldset>
`;
const INNER_STYLE = /* css */`
:host {
  display: inline-block;
  margin: 0.5em;
  text-align: left;
}
fieldset {
  position: relative;
  min-width: 2em;
  min-height: 2em;
  max-width: 20em;
  border: 0.5em dashed #333333;
}
`;

export class AlbumSpaceElement extends HTMLElement {
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
    customElements.define('album-space', this);
  }

  static get observedAttributes() {
    return ['albumid'];
  }

  get albumId() {
    return this._albumId;
  }

  set albumId(value) {
    this.setAttribute('albumid', value);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(
      this.constructor[Symbol.for('templateNode')].content.cloneNode(true)
    );
    shadowRoot.append(
      this.constructor[Symbol.for('styleNode')].cloneNode(true)
    );
    
    /** @private */
    this._albumId = undefined;

    /** @private */
    this.container = shadowRoot.querySelector('fieldset');
    /** @private */
    this.containerTitle = shadowRoot.querySelector('#title');

    /**
     * @private
     * @type {HTMLSlotElement}
     */
    this.slotItems = this.shadowRoot.querySelector('slot[name="items"]');

    /** @private */
    this.onAlbumChange = this.onAlbumChange.bind(this);
    /** @private */
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'albumId');

    this.container.addEventListener('mouseup', this.onMouseUp);
  }

  /** @protected */
  disconnectedCallback() {
    const albumId = this._albumId;
    if (albumId) {
      const store = getSatchelStore();
      removeAlbumChangeListener(
        store,
        albumId,
        this.onAlbumChange
      );
    }

    this.container.removeEventListener('mouseup', this.onMouseUp);
    
    // Destroy all items
    const store = getSatchelStore();
    const children = [
      ...this.slotItems.childNodes,
      ...this.slotItems.assignedNodes(),
    ];
    for (const node of children) {
      const invNode =
        /** @type {import('../invgrid/InventoryGridElement.js').InventoryGridElement} */ (node);
      const invId = invNode.invId;
      const inv = getInvInStore(store, invId);
      if (inv) {
        deleteInvInStore(store, invId, inv);
      }
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
      case 'albumid': {
        const store = getSatchelStore();
        const prevAlbumId = this._albumId;
        const nextAlbumId = value;
        if (prevAlbumId !== nextAlbumId) {
          this._albumId = nextAlbumId;
          if (prevAlbumId) {
            removeAlbumChangeListener(
              store,
              prevAlbumId,
              this.onAlbumChange
            );
          }
          if (nextAlbumId) {
            addAlbumChangeListener(store, nextAlbumId, this.onAlbumChange);
            this.onAlbumChange(store, nextAlbumId);
          }
        }
      } break;
    }
  }

  /**
   * @param store
   * @param albumId
   * @protected
   */
  onAlbumChange(store, albumId) {
    const album = getAlbumInStore(store, albumId);
    if (!album) {
      // The album has been deleted.
      return;
    }
    const name = album.displayName;

    // Update name
    this.containerTitle.textContent = name;

    // Preserve unchanged items in slot
    const preservedInvs = {};
    const children = [
      ...this.slotItems.childNodes,
      ...this.slotItems.assignedNodes(),
    ];
    for (const node of children) {
      const invNode =
        /** @type {import('../invgrid/InventoryGridElement.js').InventoryGridElement} */ (node);
      const invId = invNode.invId;
      const item = getItemAtSlotIndex(getSatchelStore(), invId, 0);
      if (item) {
        preservedInvs[item.itemId] = invNode;
      }
    }

    // Add new items into slot.
    const emptySlot = /** @type {HTMLSlotElement} */ (
      this.slotItems.cloneNode(false)
    );
    let itemIds = getItemIdsInAlbum(store, albumId)
      .sort((a, b) => (getItemInAlbum(store, albumId, a).displayName||'')
        .localeCompare(getItemInAlbum(store, albumId, b).displayName||''));
    for (const itemId of itemIds) {
      let element;
      if (itemId in preservedInvs) {
        element = preservedInvs[itemId];
        delete preservedInvs[itemId];
      } else {
        let store = getSatchelStore();
        let albumItem = getItemInAlbum(store, albumId, itemId);
        let newItem = cloneItem(albumItem);
        element = createItemInv(store, newItem, albumId);
      }
      emptySlot.append(element);
    }

    // Delete remaining inventories
    for(let invElement of Object.values(preservedInvs)) {
      const invId = invElement.invId;
      const inv = getInvInStore(store, invId);
      if (inv) {
        deleteInvInStore(store, invId, inv);
      }
    }

    this.slotItems.replaceWith(emptySlot);
    this.slotItems = emptySlot;
  }

  /** @private */
  onMouseUp(e) {
    const cursor = getCursor();
    const store = getSatchelStore();
    const albumId = this.albumId;
    if (!isAlbumInStore(store, albumId)) {
      return;
    }
    if (cursor.putDownInAlbum(albumId)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
}
AlbumSpaceElement.define();

function createItemInv(store, item, albumId) {
  const invId = uuid();
  const itemId = item.itemId;
  createSocketInvInStore(store, invId);
  addItemToInventory(store, invId, item, 0, 0);
  const invElement = /** @type {InventoryGridElement} */ (document.createElement('inventory-grid'));
  invElement.invId = invId;
  invElement.toggleAttribute('noinput', true);
  invElement.toggleAttribute('temp', true);
  const onChange = (store, invId) => {
    removeInventoryChangeListener(store, invId, onChange);
    if (!isInvInStore(store, invId)) {
      removeItemFromAlbum(store, albumId, itemId);
    }
  }
  addInventoryChangeListener(store, invId, onChange);
  return invElement;
}
