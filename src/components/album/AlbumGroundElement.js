import { getSatchelStore } from '../../store/SatchelStore.js';
import { addItemToInventory, getItemAtSlotIndex } from '../../satchel/inv/InventoryTransfer.js';
import { cloneItem } from '../../satchel/item/Item.js';
import { uuid } from '../../util/uuid.js';
import { getCursor } from '../cursor/index.js';
import { getAlbumInStore } from '../../store/AlbumStore.js';
import { addAlbumChangeListener, removeAlbumChangeListener } from '../../events/AlbumEvents.js';
import { addInventoryChangeListener, removeInventoryChangeListener } from '../../events/InvEvents.js';
import { getItemIdsInAlbum, getItemInAlbum, hasItemInAlbum, removeItemFromAlbum } from '../../satchel/album/AlbumItems.js';
import { getGroundAlbumId } from '../../satchel/GroundAlbum.js';
import { isInvInStore, getInvInStore, deleteInvInStore, createSocketInvInStore } from '../../store/InvStore.js';

/** @typedef {import('../invgrid/InventoryGridElement.js').InventoryGridElement} InventoryGridElement */

const INNER_HTML = /* html */`
<slot name="items"></slot>
`;
const INNER_STYLE = /* css */`
slot[name="items"] {
  display: flex;
  flex-direction: column;
}
.shaking {
  animation-name: shake;
  animation-fill-mode: forwards;
  animation-duration: 1.3s;
  animation-delay: 0.3s;
  transform: translate(0, 0) scale(0);
}

@keyframes shake {
  0% {
    transform: translate(0, 0) scale(0);
  }
  20% {
    transform: translate(10%, 0) scale(1);
  }
  40% {
    transform: translate(-10%, 0);
  }
  50% {
    transform: translate(10%, 0);
  }
  60% {
    transform: translate(-10%, 0);
  }
  80% {
    transform: translate(10%, 0);
  }
  100% {
    transform: translate(0, 0);
  }
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
    this.socketItems = {};

    /** @private */
    this.onAlbumChange = this.onAlbumChange.bind(this);
    /** @private */
    this.onMouseUp = this.onMouseUp.bind(this);
    /** @private */
    this.onSocketInventoryChange = this.onSocketInventoryChange.bind(this);
  }

  get albumId() {
    const store = getSatchelStore();
    return getGroundAlbumId(store);
  }

  /** @protected */
  connectedCallback() {
    const store = getSatchelStore();
    const albumId = this.albumId;
    addAlbumChangeListener(store, albumId, this.onAlbumChange);
    this.onAlbumChange(store, albumId);

    document.addEventListener('mouseup', this.onMouseUp);
  }

  /** @protected */
  disconnectedCallback() {
    const store = getSatchelStore();
    const albumId = this.albumId;
    removeAlbumChangeListener(store, albumId, this.onAlbumChange);

    document.removeEventListener('mouseup', this.onMouseUp);
    
    // Destroy all items
    for (const node of this.slotItems.assignedNodes()) {
      const invNode =
        /** @type {import('../invgrid/InventoryGridElement.js').InventoryGridElement} */ (node);
      const invId = invNode.invId;
      const inv = getInvInStore(store, invId);
      if (inv) {
        deleteInvInStore(store, invId, inv);
      }
    }
  }

  /** @private */
  onMouseUp(e) {
    const cursor = getCursor();
    if (cursor.putDownInGround(e.clientX, e.clientY)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
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
    let socketItems = {};
    for (const itemId of itemIds) {
      let element;
      if (itemId in preservedInvs) {
        element = preservedInvs[itemId];
        delete preservedInvs[itemId];
        element.classList.remove('shaking');
      } else {
        let store = getSatchelStore();
        let albumItem = getItemInAlbum(store, albumId, itemId);
        let newItem = cloneItem(albumItem);

        const invId = uuid();
        createSocketInvInStore(store, invId);
        addItemToInventory(store, invId, newItem, 0, 0);
        const invElement = /** @type {InventoryGridElement} */ (document.createElement('inventory-grid'));
        invElement.invId = invId;
        invElement.toggleAttribute('fixed', true);
        invElement.toggleAttribute('noinput', true);
        invElement.toggleAttribute('temp', true);
        addInventoryChangeListener(store, invId, this.onSocketInventoryChange);
        element = invElement;
        element.classList.add('shaking');
      }
      socketItems[element.invId] = itemId;
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

    this.socketItems = socketItems;
    this.slotItems.replaceWith(emptySlot);
    this.slotItems = emptySlot;
  }

  /** @private */
  onSocketInventoryChange(store, invId) {
    if (!isInvInStore(store, invId)) {
      removeInventoryChangeListener(store, invId, this.onSocketInventoryChange);
      const albumId = this.albumId;
      const itemId = this.socketItems[invId];
      if (hasItemInAlbum(store, albumId, itemId)) {
        removeItemFromAlbum(store, albumId, itemId);
      }
    }
  }
}
AlbumGroundElement.define();
