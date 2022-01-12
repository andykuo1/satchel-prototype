import { createSocketInventoryInStore, deleteInventoryFromStore, getInventoryInStore, getInventoryStore, isInventoryInStore } from '../../store/SatchelStore.js';
import { addItemToInventory, getItemAtSlotIndex } from '../../satchel/inv/InventoryTransfer.js';
import { createInventoryView } from '../../satchel/inv/InvView.js';
import { uuid } from '../../util/uuid.js';
import { upgradeProperty } from '../../util/wc.js';
import { isAlbumLocked, setAlbumLocked } from '../../satchel/album/Album.js';
import { getCursor } from '../cursor/index.js';
import { downloadText } from '../../util/downloader.js';
import { cloneItem } from '../../satchel/item/Item.js';
import { exportAlbumToJSON } from '../../loader/AlbumLoader.js';
import { deleteAlbumInStore, getAlbumInStore, isAlbumInStore } from '../../store/AlbumStore.js';
import { addAlbumChangeListener, dispatchAlbumChange, removeAlbumChangeListener } from '../../events/AlbumEvents.js';
import { IconButtonElement } from '../lib/IconButtonElement.js';
import { addInventoryChangeListener, removeInventoryChangeListener } from '../../events/InvEvents.js';
import { addItemToAlbum, clearItemsInAlbum, getItemIdsInAlbum, getItemInAlbum, removeItemFromAlbum } from '../../satchel/album/AlbumItems.js';
import { isGroundAlbum } from '../../satchel/GroundAlbum.js';
import { isFoundryAlbum } from '../../satchel/FoundryAlbum.js';

const INNER_HTML = /* html */`
<fieldset>
  <legend contenteditable></legend>
  <span class="actionbar">
    <icon-button class="button" id="buttonDelete" icon="res/delete.svg" alt="clear" title="Clear Album"></icon-button>
    <icon-button class="button" id="buttonExport" icon="res/download.svg" alt="export" title="Export Album"></icon-button>
    <icon-button class="button" id="buttonSend" icon="res/share.svg" alt="send" title="Send Album" disabled></icon-button>
    <icon-button class="button" id="buttonLock" icon="res/unlock.svg" alt="lock" title="Lock Album"></icon-button>
  </span>
  <slot name="items"></slot>
</fieldset>
`;
const INNER_STYLE = /* css */`
:host {
  margin: 0.5em;
}
fieldset {
  position: relative;
  width: 15em;
  min-height: 2em;
  border-color: #444444;
}
fieldset.unlocked {
  border-color: #ffffff;
}
legend {
  display: flex;
  flex-direction: row;
  border-bottom: 2px solid transparent;
}
legend[contenteditable] {
  border-color: #ffffff;
}
.actionbar {
  position: absolute;
  top: -1.3em;
  right: 0.5em;
  background-color: #333333;
  padding: 0 0.1em;
}
.button {
  display: inline-block;
  width: 1.5em;
  height: 1.5em;
  margin: 0;
}
.internal {
  opacity: 0.3;
}
`;

export class ItemAlbumElement extends HTMLElement {
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
    customElements.define('item-album', this);
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
    this.inputTitle = shadowRoot.querySelector('legend');

    /** @private */
    this.container = shadowRoot.querySelector('fieldset');

    /** @private */
    this.buttonDelete = shadowRoot.querySelector('#buttonDelete');
    /** @private */
    this.buttonExport = shadowRoot.querySelector('#buttonExport');
    /**
     * @private
     * @type {IconButtonElement}
     */
    this.buttonLock = shadowRoot.querySelector('#buttonLock');
    /** @private */
    this.buttonSend = shadowRoot.querySelector('#buttonSend');

    /**
     * @private
     * @type {HTMLSlotElement}
     */
    this.slotItems = this.shadowRoot.querySelector('slot[name="items"]');

    /** @private */
    this.onAlbumChange = this.onAlbumChange.bind(this);

    /** @private */
    this.onInputTitle = this.onInputTitle.bind(this);
    /** @private */
    this.onButtonLock = this.onButtonLock.bind(this);
    /** @private */
    this.onButtonExport = this.onButtonExport.bind(this);
    /** @private */
    this.onButtonDelete = this.onButtonDelete.bind(this);
    /** @private */
    this.onButtonSend = this.onButtonSend.bind(this);
    
    /** @private */
    this.onItemDrop = this.onItemDrop.bind(this);
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'albumId');

    this.inputTitle.addEventListener('input', this.onInputTitle);
    this.buttonLock.addEventListener('click', this.onButtonLock);
    this.buttonExport.addEventListener('click', this.onButtonExport);
    this.buttonDelete.addEventListener('click', this.onButtonDelete);
    this.buttonSend.addEventListener('click', this.onButtonSend);
    this.container.addEventListener('mouseup', this.onItemDrop);
  }

  /** @protected */
  disconnectedCallback() {
    const albumId = this._albumId;
    if (albumId) {
      removeAlbumChangeListener(
        albumId,
        this.onAlbumChange
      );
    }
    
    // Destroy all items
    const store = getInventoryStore();
    for (const node of this.slotItems.assignedNodes()) {
      const invNode =
        /** @type {import('../invgrid/InventoryGridElement.js').InventoryGridElement} */ (node);
      const invId = invNode.invId;
      const inv = getInventoryInStore(store, invId);
      if (inv) {
        deleteInventoryFromStore(store, invId, inv);
      }
    }

    this.inputTitle.removeEventListener('input', this.onInputTitle);
    this.buttonLock.removeEventListener('click', this.onButtonLock);
    this.buttonExport.removeEventListener('click', this.onButtonExport);
    this.buttonDelete.removeEventListener('click', this.onButtonDelete);
    this.buttonSend.removeEventListener('click', this.onButtonSend);
    this.container.removeEventListener('mouseup', this.onItemDrop);
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
        const store = getInventoryStore();
        const prevAlbumId = this._albumId;
        const nextAlbumId = value;
        if (prevAlbumId !== nextAlbumId) {
          this._albumId = nextAlbumId;
          if (prevAlbumId) {
            removeAlbumChangeListener(
              prevAlbumId,
              this.onAlbumChange
            );
          }
          if (nextAlbumId) {
            addAlbumChangeListener(nextAlbumId, this.onAlbumChange);
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
    const locked = isAlbumLocked(store, albumId);
    const name = album.displayName;

    if (isGroundAlbum(album)) {
      // Cannot change lock state for a ground album
      this.buttonLock.toggleAttribute('disabled', true);
    }

    // Update lock status
    this.buttonLock.icon = locked ? 'res/lock.svg' : 'res/unlock.svg';
    this.buttonLock.alt = locked ? 'unlock' : 'lock';
    this.buttonLock.title = locked ? 'Unlock Album' : 'Lock Album';
    this.buttonDelete.toggleAttribute('disabled', locked);
    this.inputTitle.toggleAttribute('contenteditable', !locked);
    this.container.classList.toggle('unlocked', !locked);

    // Change style for internal albums
    let isInternalAlbum = isFoundryAlbum(album) || isGroundAlbum(album);
    this.inputTitle.classList.toggle('internal', isInternalAlbum);

    // Update name
    this.inputTitle.textContent = name;

    // Preserve unchanged items in slot
    const preservedInvs = {};
    for (const node of this.slotItems.assignedNodes()) {
      const invNode =
        /** @type {import('../invgrid/InventoryGridElement.js').InventoryGridElement} */ (node);
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
        element = createItemInv(store, newItem, albumId, locked);
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

  /** @private */
  onInputTitle(e) {
    const store = getInventoryStore();
    const albumId = this.albumId;
    if (isAlbumInStore(store, albumId)) {
      const name = this.inputTitle.textContent;
      const album = getAlbumInStore(store, albumId);
      album.displayName = name;
      dispatchAlbumChange(store, albumId);
    }
  }

  /** @private */
  onButtonLock() {
    const store = getInventoryStore();
    const albumId = this.albumId;
    if (isAlbumInStore(store, albumId)) {
      const locked = isAlbumLocked(store, albumId);
      setAlbumLocked(store, albumId, !locked);
    }
  }

  /** @private */
  onButtonExport() {
    const store = getInventoryStore();
    const album = getAlbumInStore(store, this.albumId);
    if (album) {
      try {
        const jsonData = exportAlbumToJSON(album);
        const name = album.displayName;
        downloadText(`${name}-album.json`, JSON.stringify(jsonData, null, 4));
      } catch (e) {
        console.error(e);
      }
    }
  }

  /** @private */
  onButtonDelete() {
    const store = getInventoryStore();
    const albumId = this.albumId;
    clearItemsInAlbum(store, albumId);
    const album = getAlbumInStore(store, albumId);
    deleteAlbumInStore(store, albumId, album);
    this.remove();
  }

  /** @private */
  onButtonSend() {
    // TODO: Implement sending a whole album of items to a player.
  }

  /** @private */
  onItemDrop(e) {
    const store = getInventoryStore();
    const albumId = this.albumId;
    if (!isAlbumInStore(store, albumId)) {
      return;
    }
    if (isAlbumLocked(store, albumId)) {
      return;
    }
    let cursor = getCursor();
    if (cursor.hasHeldItem()) {
      const item = cursor.getHeldItem();
      cursor.clearHeldItem();
      addItemToAlbum(store, albumId, item);
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
}
ItemAlbumElement.define();

function createItemInv(store, item, albumId, locked) {
  const invId = uuid();
  const itemId = item.itemId;
  createSocketInventoryInStore(store, invId);
  addItemToInventory(store, invId, item, 0, 0);
  const invElement = createInventoryView(store, invId);
  invElement.fixed = true;
  invElement.toggleAttribute('noinput', true);
  if (locked) {
    invElement.toggleAttribute('copyoutput', true);
  } else {
    invElement.toggleAttribute('temp', true);
    const onChange = (store, invId) => {
      removeInventoryChangeListener(invId, onChange);
      if (!isInventoryInStore(store, invId)) {
        removeItemFromAlbum(store, albumId, itemId);
      }
    }
    addInventoryChangeListener(invId, onChange);
  }
  return invElement;
}
