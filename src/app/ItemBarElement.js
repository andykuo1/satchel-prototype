import { getAlbumInStore, getItemIdsInAlbum, getItemInAlbum } from '../cards/CardAlbum.js';
import { clearGround } from '../inventory/GroundHelper.js';
import { addAlbumChangeListener, getInventoryStore, removeAlbumChangeListener } from '../inventory/InventoryStore.js';
import { upgradeProperty } from '../util/wc.js';
import { ItemBarItemElement } from './ItemBarItemElement.js';

/** @typedef {import('../inventory/element/InventoryCursorElement.js').InventoryCursorElement} InventoryCursorElement */

const INNER_HTML = /* html */ `
<div class="root">
  <button id="actionExpand">
    <img src="res/bookmarks.svg" alt="Show" title="Show Items">
  </button>
  <button id="actionDelete">
    <img src="res/delete.svg" alt="Delete" title="Delete Item">
  </button>
  <ul class="container list hidden">
    <slot name="items"></slot>
  </ul>
</div>
`;
const INNER_STYLE = /* css */ `
:host {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  --primary-color: #222222;
  --secondary-color: #333333;
}

.root {
  position: relative;
}

#actionDelete {
  position: absolute;
  bottom: 1.25em;
  left: 0.5em;
  background-color: var(--secondary-color);
  border-radius: 1em;
}
#actionDelete:hover {
  filter: brightness(70%);
}
#actionExpand {
  position: absolute;
  bottom: 1.25em;
  right: 0.5em;
  background-color: var(--secondary-color);
  border-radius: 1em;
}
#actionExpand:hover {
  filter: brightness(70%);
}

.container {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 5em;
  width: calc(100% - 8em);
  padding: 0;
  margin: 0;
  margin-left: 4em;
  background-color: var(--primary-color);
  border-radius: 4em;
  overflow-x: auto;
  list-style-type: none;
}
.container.hidden {
  display: none;
}
slot[name="items"] > * {
  width: 4em;
  height: calc(100% - 1em);
  margin: 0;
  padding: 0 0.5em;
  text-align: center;
}

img {
  height: 100%;
}
button {
  height: 3em;
  background: none;
  border: none;
}
`;

export class ItemBarElement extends HTMLElement {
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
    customElements.define('item-bar', this);
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
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    this.shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this._albumId = undefined;
    
    /** @private */
    this.container = this.shadowRoot.querySelector('.container');
    /**
     * @private
     * @type {HTMLSlotElement}
     */
    this.slotItems = this.shadowRoot.querySelector('slot[name="items"]');
    /** @private */
    this.actionExpand = this.shadowRoot.querySelector('#actionExpand');
    /** @private */
    this.actionDelete = this.shadowRoot.querySelector('#actionDelete');

    /** @private */
    this.onActionDelete = this.onActionDelete.bind(this);
    /** @private */
    this.onActionDeleteUp = this.onActionDeleteUp.bind(this);
    /** @private */
    this.onActionDeleteEnter = this.onActionDeleteEnter.bind(this);
    /** @private */
    this.onActionDeleteLeave = this.onActionDeleteLeave.bind(this);
    /** @private */
    this.onActionExpand = this.onActionExpand.bind(this);
    /** @private */
    this.onActionExpandDouble = this.onActionExpandDouble.bind(this);

    /** @private */
    this.onAlbumChange = this.onAlbumChange.bind(this);
  }

  /** @protected */
  connectedCallback() {
    let albumId = this._albumId;
    if (albumId) {
      let store = getInventoryStore();
      addAlbumChangeListener(
        albumId,
        this.onAlbumChange
      );
      this.onAlbumChange(store, albumId);
    }
    upgradeProperty(this, 'albumId');

    this.actionExpand.addEventListener('contextmenu', this.onActionExpandDouble);
    this.actionExpand.addEventListener('click', this.onActionExpand);
    this.actionExpand.addEventListener('dblclick', this.onActionExpandDouble);
    this.actionDelete.addEventListener('mouseup', this.onActionDeleteUp);
    this.actionDelete.addEventListener('mousedown', this.onActionDelete);
    this.actionDelete.addEventListener('mouseenter', this.onActionDeleteEnter);
    this.actionDelete.addEventListener('mouseleave', this.onActionDeleteLeave);
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

    this.actionExpand.removeEventListener('contextmenu', this.onActionExpandDouble);
    this.actionExpand.removeEventListener('click', this.onActionExpand);
    this.actionExpand.removeEventListener('dblclick', this.onActionExpandDouble);
    this.actionDelete.removeEventListener('mouseup', this.onActionDeleteUp);
    this.actionDelete.removeEventListener('mousedown', this.onActionDelete);
    this.actionDelete.removeEventListener('mouseenter', this.onActionDeleteEnter);
    this.actionDelete.removeEventListener('mouseleave', this.onActionDeleteLeave);
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

  /** @private */
  onActionExpand(e) {
    this.container.classList.toggle('hidden');
  }

  /** @private */
  onActionExpandDouble(e) {
    // TODO: This shouldn't just reference .sidebar...
    let sidebar = document.querySelector('.sidebar');
    sidebar.classList.add('expand', 'open');
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  /** @private */
  onActionDelete(e) {
    /** @type {InventoryCursorElement} */
    let cursor = document.querySelector('inventory-cursor');
    if (cursor && cursor.hasHeldItem()) {
      cursor.clearHeldItem();
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  /** @private */
  onActionDeleteUp(e) {
    let result = this.onActionDelete(e);
    if (result !== false) {
      if (window.confirm('Clear all items on the ground?')) {
        clearGround();
      }
    }
  }

  /** @private */
  onActionDeleteEnter() {
    /** @type {InventoryCursorElement} */
    let cursor = document.querySelector('inventory-cursor');
    if (cursor) {
      cursor.toggleAttribute('danger', true);
    }
  }

  /** @private */
  onActionDeleteLeave() {
    /** @type {InventoryCursorElement} */
    let cursor = document.querySelector('inventory-cursor');
    if (cursor) {
      cursor.toggleAttribute('danger', false);
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
    const preservedItems = {};
    for (const node of this.slotItems.assignedNodes()) {
      const itemNode = /** @type {ItemBarItemElement} */ (node);
      const itemId = itemNode.itemId;
      if (typeof itemId === 'string') {
        preservedItems[itemId] = node;
      }
    }

    // Add new items into slot.
    const emptySlot = /** @type {HTMLSlotElement} */ (
      this.slotItems.cloneNode(false)
    );
    let itemIds = getItemIdsInAlbum(store, albumId)
      .sort((a, b) => (getItemInAlbum(store, albumId, a).displayName||'').localeCompare(getItemInAlbum(store, albumId, b).displayName||''));
    for (const itemId of itemIds) {
      let element;
      element =
        itemId in preservedItems
          ? preservedItems[itemId]
          : new ItemBarItemElement(itemId, getItemInAlbum(store, albumId, itemId));
      emptySlot.append(element);
    }

    this.slotItems.replaceWith(emptySlot);
    this.slotItems = emptySlot;
  }
}
ItemBarElement.define();
