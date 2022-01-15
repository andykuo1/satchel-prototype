import { getSatchelStore } from '../../store/SatchelStore.js';
import { addItemToInventory, getItemAtSlotIndex } from '../../satchel/inv/InventoryTransfer.js';
import { uuid } from '../../util/uuid.js';
import { upgradeProperty } from '../../util/wc.js';
import { getCursor } from '../cursor/index.js';
import { cloneItem } from '../../satchel/item/Item.js';
import { getAlbumInStore, isAlbumInStore } from '../../store/AlbumStore.js';
import { addAlbumChangeListener, removeAlbumChangeListener } from '../../events/AlbumEvents.js';
import { addInventoryChangeListener, removeInventoryChangeListener } from '../../events/InvEvents.js';
import { getItemIdsInAlbum, getItemInAlbum, getItemsInAlbum, hasItemInAlbum, removeItemFromAlbum } from '../../satchel/album/AlbumItems.js';
import { isInvInStore, getInvInStore, deleteInvInStore, createSocketInvInStore } from '../../store/InvStore.js';
import { updateList } from '../ElementListHelper.js';

/**
 * @typedef {import('../invgrid/InventoryGridElement.js').InventoryGridElement} InventoryGridElement
 */

const INNER_HTML = /* html */`
<fieldset>
  <legend></legend>
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
    this.containerTitle = shadowRoot.querySelector('legend');

    /**
     * @private
     * @type {HTMLSlotElement}
     */
    this.slotItems = shadowRoot.querySelector('slot[name="items"]');

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
    upgradeProperty(this, 'albumId');

    this.container.addEventListener('mouseup', this.onMouseUp);
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

    this.container.removeEventListener('mouseup', this.onMouseUp);
    
    this.cleanUp();
  }

  /** @private */
  cleanUp() {
    const store = getSatchelStore();

    // Remove all temp inv listeners
    for(let invId of Object.keys(this.socketedIds)) {
      removeInventoryChangeListener(store, invId, this.onSocketInventoryChange);
    }
    this.socketedIds = {};

    // Destroy all items
    for (const node of this.slotItems.children) {
      const invNode = /** @type {InventoryGridElement} */ (node);
      const invId = invNode.invId;
      const inv = getInvInStore(store, invId);
      if (inv) {
        deleteInvInStore(store, invId, inv);
        node.remove();
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
          this.cleanUp();
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
      invElement.toggleAttribute('noinput', true);
      invElement.toggleAttribute('temp', true);
      this.socketedIds[invId] = newItem.itemId;
      addInventoryChangeListener(store, invId, this.onSocketInventoryChange);
      return invElement;
    };
    updateList(this.slotItems, list, factoryCreate);
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
AlbumSpaceElement.define();
