import { addInventoryChangeListener, createSocketInventoryInStore, deleteInventoryFromStore, getInventoryInStore, getInventoryStore, isInventoryInStore, removeInventoryChangeListener } from '../inventory/InventoryStore.js';
import { addItemToInventory, getItemAtSlotIndex } from '../inventory/InventoryTransfer.js';
import { createInventoryView } from '../inventory/InvView.js';
import { cloneItem } from '../item/Item.js';
import { uuid } from '../util/uuid.js';
import { getItemIdsInAlbum, getItemInAlbum } from './Album.js';
import { removeItemFromAlbum } from './Album.js';
import { getCursor } from '../inventory/element/InventoryCursorElement.js';
import { dropOnGround } from '../inventory/GroundHelper.js';
import { getAlbumInStore } from './AlbumStore.js';
import { addAlbumChangeListener, removeAlbumChangeListener } from './AlbumEvents.js';


const INNER_HTML = /* html */`
<slot name="items"></slot>
`;
const INNER_STYLE = /* css */`
slot[name="items"] {
  display: flex;
  flex-direction: column;
}
`;

export class AlbumGroundElement extends HTMLElement {
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
    customElements.define('album-ground', this);
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

  get albumId() {
    return 'ground';
  }

  /** @protected */
  connectedCallback() {
    const store = getInventoryStore();
    const albumId = this.albumId;
    addAlbumChangeListener(albumId, this.onAlbumChange);
    this.onAlbumChange(store, albumId);

    document.addEventListener('mouseup', this.onMouseUp);
  }

  /** @protected */
  disconnectedCallback() {
    const albumId = this.albumId;
    removeAlbumChangeListener(albumId, this.onAlbumChange);

    document.removeEventListener('mouseup', this.onMouseUp);
    
    // Destroy all items
    const store = getInventoryStore();
    for (const node of this.slotItems.assignedNodes()) {
      const invNode =
        /** @type {import('../inventory/element/InventoryGridElement.js').InventoryGridElement} */ (node);
      const invId = invNode.invId;
      const inv = getInventoryInStore(store, invId);
      if (inv) {
        deleteInventoryFromStore(store, invId, inv);
      }
    }
  }

  /** @private */
  onMouseUp(e) {
    const cursor = getCursor();
    const item = cursor.getHeldItem();
    if (!item) {
      return;
    }
    cursor.clearHeldItem();
    dropOnGround(item);
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

    // Preserve unchanged items in slot
    const preservedInvs = {};
    for (const node of this.slotItems.assignedNodes()) {
      const invNode =
        /** @type {import('../inventory/element/InventoryGridElement.js').InventoryGridElement} */ (node);
      const invId = invNode.invId;
      const item = getItemAtSlotIndex(getInventoryStore(), invId, 0);
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
        let store = getInventoryStore();
        let albumItem = getItemInAlbum(store, albumId, itemId);
        let newItem = cloneItem(albumItem);
        element = createItemInv(store, newItem, albumId);
      }
      emptySlot.append(element);
    }

    // Delete remaining inventories
    for(let invElement of Object.values(preservedInvs)) {
      const invId = invElement.invId;
      const inv = getInventoryInStore(store, invId);
      if (inv) {
        deleteInventoryFromStore(store, invId, inv);
      }
    }

    this.slotItems.replaceWith(emptySlot);
    this.slotItems = emptySlot;
  }
}
AlbumGroundElement.define();

function createItemInv(store, item, albumId) {
  const invId = uuid();
  const itemId = item.itemId;
  createSocketInventoryInStore(store, invId);
  addItemToInventory(store, invId, item, 0, 0);
  const invElement = createInventoryView(store, invId);
  invElement.fixed = true;
  invElement.toggleAttribute('noinput', true);
  invElement.toggleAttribute('temp', true);
  const onChange = (store, invId) => {
    removeInventoryChangeListener(invId, onChange);
    if (!isInventoryInStore(store, invId)) {
      removeItemFromAlbum(store, albumId, itemId);
    }
  }
  addInventoryChangeListener(invId, onChange);
  return invElement;
}
