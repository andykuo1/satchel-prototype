import { getSatchelStore } from '../../store/SatchelStore.js';
import { addItemToInventory } from '../../satchel/inv/InventoryTransfer.js';
import { cloneItem } from '../../satchel/item/Item.js';
import { uuid } from '../../util/uuid.js';
import { getCursor } from '../cursor/index.js';
import { getAlbumInStore } from '../../store/AlbumStore.js';
import { addAlbumChangeListener, removeAlbumChangeListener } from '../../events/AlbumEvents.js';
import { addInventoryChangeListener, removeInventoryChangeListener } from '../../events/InvEvents.js';
import { getItemInAlbum, getItemsInAlbum, hasItemInAlbum, removeItemFromAlbum } from '../../satchel/album/AlbumItems.js';
import { getGroundAlbumId } from '../../satchel/GroundAlbum.js';
import { isInvInStore, getInvInStore, deleteInvInStore, createSocketInvInStore } from '../../store/InvStore.js';
import { updateList } from '../ElementListHelper.js';

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

  get albumId() {
    return this._albumId;
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

    const store = getSatchelStore();
    /** @private */
    this._albumId = getGroundAlbumId(store);

    /**
     * @private
     * @type {HTMLSlotElement}
     */
    this.slotItems = this.shadowRoot.querySelector('slot[name="items"]');

    /** @private */
    this.socketedIds = {};

    /** @private */
    this.onAlbumChange = this.onAlbumChange.bind(this);
    /** @private */
    this.onMouseUp = this.onMouseUp.bind(this);
    /** @private */
    this.onSocketInventoryChange = this.onSocketInventoryChange.bind(this);
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
    if (albumId) {
      removeAlbumChangeListener(
        store,
        albumId,
        this.onAlbumChange
      );
    }

    document.removeEventListener('mouseup', this.onMouseUp);

    // Remove all temp inv listeners
    for(let invId of Object.keys(this.socketedIds)) {
      removeInventoryChangeListener(store, invId, this.onSocketInventoryChange);
    }
    
    // Destroy all items
    for (const node of this.slotItems.children) {
      const invNode = /** @type {InventoryGridElement} */ (node);
      const invId = invNode.invId;
      const inv = getInvInStore(store, invId);
      if (inv) {
        deleteInvInStore(store, invId, inv);
      }
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

    const list = getItemsInAlbum(store, albumId)
      .sort((a, b) => (a.displayName||'').localeCompare(b.displayName||''))
      .map(a => a.itemId);
    const factoryCreate = (key) => {
      let store = getSatchelStore();
      let albumItem = getItemInAlbum(store, albumId, key);
      let newItem = cloneItem(albumItem);

      const invId = uuid();
      createSocketInvInStore(store, invId);
      addItemToInventory(store, invId, newItem, 0, 0);
      const invElement = /** @type {InventoryGridElement} */ (document.createElement('inventory-grid'));
      invElement.invId = invId;
      invElement.toggleAttribute('fixed', true);
      invElement.toggleAttribute('noinput', true);
      invElement.toggleAttribute('temp', true);
      invElement.classList.add('shaking');
      this.socketedIds[invId] = newItem.itemId;
      addInventoryChangeListener(store, invId, this.onSocketInventoryChange);
      return invElement;
    };
    updateList(this.slotItems, list, factoryCreate);
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

  /** @private */
  onSocketInventoryChange(store, invId) {
    if (!isInvInStore(store, invId)) {
      removeInventoryChangeListener(store, invId, this.onSocketInventoryChange);
      const albumId = this.albumId;
      const itemId = this.socketedIds[invId];
      if (hasItemInAlbum(store, albumId, itemId)) {
        removeItemFromAlbum(store, albumId, itemId);
      }
    }
  }
}
AlbumGroundElement.define();
