import { getSatchelStore } from '../../store/SatchelStore.js';
import { addItemToInventory } from '../../satchel/inv/InventoryTransfer.js';
import { uuid } from '../../util/uuid.js';
import { upgradeProperty } from '../../util/wc.js';
import { getCursor } from '../cursor/index.js';
import { cloneItem } from '../../satchel/item/Item.js';
import { createAlbumInStore, deleteAlbumInStore, getAlbumInStore, isAlbumInStore } from '../../store/AlbumStore.js';
import { addAlbumChangeListener, removeAlbumChangeListener } from '../../events/AlbumEvents.js';
import { addInventoryChangeListener, removeInventoryChangeListener } from '../../events/InvEvents.js';
import { getItemInAlbum, getItemsInAlbum, hasItemInAlbum, removeItemFromAlbum } from '../../satchel/album/AlbumItems.js';
import { isInvInStore, getInvInStore, deleteInvInStore, createSocketInvInStore } from '../../store/InvStore.js';
import { updateList } from '../ElementListHelper.js';
import { getTrashAlbumId, isTrashAlbum } from '../../satchel/TrashAlbum.js';

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
  min-width: 2em;
  min-height: 6em;
  text-align: left;
  vertical-align: top;
}
fieldset {
  position: relative;
  width: calc(100% - 1em);
  height: calc(100% - 1em);
  max-width: 20em;
  overflow-y: auto;
  border: 0.5em dashed #333333;
  padding: 2em 1em;
  scroll-behavior: smooth;
}
:host([mini]) fieldset {
  padding: 0;
}
:host([mini]) legend {
  display: none;
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

  get init() {
    return this.getAttribute('init');
  }

  set init(value) {
    this.setAttribute('init', value);
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
    upgradeProperty(this, 'init');

    this.container.addEventListener('mouseup', this.onMouseUp);

    // Only start init once.
    if (this.init) {
      const store = getSatchelStore();
      let initType = this.init;
      let albumId = this.albumId;
      if (initType === 'trash') {
        albumId = getTrashAlbumId(store);
        this.albumId = albumId;
      } else if (initType === 'album') {
        if (!albumId) {
          albumId = uuid();
          this.albumId = albumId;
        }
        createAlbumInStore(store, albumId);
      } else {
        throw new Error(`Unknown init type '${initType}' for album-space.`);
      }
    }
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
    let children = this.slotItems.children;
    for(let i = 0; i < children.length; ++i) {
      let child = children.item(i);
      const invNode = /** @type {InventoryGridElement} */ (child);
      const invId = invNode.invId;
      const inv = getInvInStore(store, invId);
      if (inv) {
        deleteInvInStore(store, invId, inv);
        child.remove();
      }
    }

    // Only stop init once.
    if (this.init) {
      const albumId = this.albumId;
      const album = getAlbumInStore(store, albumId);
      if (!isTrashAlbum(album)) {
        deleteAlbumInStore(getSatchelStore(), albumId, album);
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

    let flag = false;
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
      invElement.toggleAttribute('fixed', this.hasAttribute('fixed'));
      this.socketedIds[invId] = newItem.itemId;
      addInventoryChangeListener(store, invId, this.onSocketInventoryChange);
      flag = true;
      return invElement;
    };
    updateList(this.slotItems, list, factoryCreate);

    // Only scroll for new items.
    if (flag) {
      this.container.scrollTo(0, this.container.scrollHeight);
    }
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
