import { getInventoryStore } from '../inventory/InventoryStore.js';
import { upgradeProperty } from '../util/wc.js';
import { getItemIdsInAlbum, getItemInAlbum } from '../album/Album.js';
import { CardStockElement } from './CardStockElement.js';
import { getAlbumInStore } from '../album/AlbumStore.js';
import { addAlbumChangeListener, removeAlbumChangeListener } from '../album/AlbumEvents.js';

const INNER_HTML = /* html */`
<article>
  <slot></slot>
</article>
`;
const INNER_STYLE = /* css */`
`;

export class CardAlbumElement extends HTMLElement {
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
    customElements.define('card-album', this);
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
    this.shadowRoot.append(
      this.constructor[Symbol.for('templateNode')].content.cloneNode(true)
    );
    this.shadowRoot.append(
      this.constructor[Symbol.for('styleNode')].cloneNode(true)
    );
    
    /** @private */
    this._albumId = undefined;
    /** @private */
    this._viewMode = 'default';

    /** @private */
    this._root = this.shadowRoot.querySelector('article');
    /**
     * @private
     * @type {HTMLSlotElement}
     */
    this._itemSlot = this.shadowRoot.querySelector('slot');

    /** @protected */
    this.onAlbumChange = this.onAlbumChange.bind(this);
  }

  changeView(viewMode) {
    switch(viewMode) {
      case 'default':
        for(let card of this._itemSlot.querySelectorAll('card-stock')) {
          card.toggleAttribute('minified', false);
          card.toggleAttribute('detailed', false);
        }
        break;
      case 'compact':
        for(let card of this._itemSlot.querySelectorAll('card-stock')) {
          card.toggleAttribute('minified', true);
          card.toggleAttribute('detailed', false);
        }
        break;
      case 'detailed':
        for(let card of this._itemSlot.querySelectorAll('card-stock')) {
          card.toggleAttribute('minified', true);
          card.toggleAttribute('detailed', true);
        }
        break;
      case 'full':
        for(let card of this._itemSlot.querySelectorAll('card-stock')) {
          card.toggleAttribute('minified', false);
          card.toggleAttribute('detailed', true);
        }
        break;
    }
    this._viewMode = viewMode;
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

    // Preserve unchanged items in slot
    const preservedItems = {};
    for (const node of this._itemSlot.assignedNodes()) {
      const cardNode =
        /** @type {import('./CardStockElement.js').CardStockElement} */ (node);
      const itemId = cardNode.itemId;
      if (typeof itemId === 'string') {
        preservedItems[itemId] = node;
      }
    }

    // Add new items into slot.
    const emptySlot = /** @type {HTMLSlotElement} */ (
      this._itemSlot.cloneNode(false)
    );
    let itemIds = getItemIdsInAlbum(store, albumId)
      .sort((a, b) => (getItemInAlbum(store, albumId, a).displayName||'').localeCompare(getItemInAlbum(store, albumId, b).displayName||''));
    for (const itemId of itemIds) {
      let element;
      element =
        itemId in preservedItems
          ? preservedItems[itemId]
          : new CardStockElement().setItem(getItemInAlbum(store, albumId, itemId));
      emptySlot.append(element);
    }

    this._itemSlot.replaceWith(emptySlot);
    this._itemSlot = emptySlot;

    this.changeView(this._viewMode);
  }
}
CardAlbumElement.define();
