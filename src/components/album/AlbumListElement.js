import { addInventoryChangeListener, removeInventoryChangeListener } from '../../events/InvEvents.js';
import { getGroundAlbumId, isGroundAlbum } from '../../satchel/GroundAlbum.js';
import { getTrashAlbumId, isTrashAlbum } from '../../satchel/TrashAlbum.js';
import { getItemInInv, getItemsInInv } from '../../satchel/inv/InventoryItems.js';
import { hasItemInInventory, removeItemFromInventory } from '../../satchel/inv/InventoryTransfer.js';
import { createAlbumInStore } from '../../store/AlbumStore.js';
import { deleteInvInStore, getInvInStore, isInvInStore } from '../../store/InvStore.js';
import { getSatchelStore } from '../../store/SatchelStore.js';
import { uuid } from '../../util/uuid.js';
import { upgradeProperty } from '../../util/wc.js';
import { updateList } from '../ElementListHelper.js';
import {
  cleanUpItemInvElements,
  itemAlphabeticalComparator,
  setUpItemInvElement,
  tearDownItemInvElement,
} from './AlbumElementHelper.js';

/**
 * @typedef {import('../invgrid/InvSocketElement.js').InvSocketElement} InvSocketElement
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 * @typedef {import('../../satchel/album/Album.js').AlbumId} AlbumId
 * @typedef {import('../../store/SatchelStore.js').SatchelStore} Store
 */

const INNER_HTML = /* html */ `
`;
const INNER_STYLE = /* css */ `
:host {
  display: inline-block;
  vertical-align: top;
}
.shaking {
  animation-name: shake;
  animation-fill-mode: forwards;
  animation-duration: var(--animation-duration, 0);
  animation-delay: var(--animation-delay, 0);
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

/**
 * @fires change When album changes and element requires update
 */
export class AlbumListElement extends HTMLElement {
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
    customElements.define('album-list', this);
  }

  static get observedAttributes() {
    return ['albumid', 'locked'];
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
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this._albumId = null;

    /** @private */
    this.itemList = shadowRoot;
    /** @private */
    this.itemListEntryIds = {};

    /** @private */
    this.onAlbumChange = this.onAlbumChange.bind(this);
    /** @private */
    this.onItemListEntryCreate = this.onItemListEntryCreate.bind(this);
    /** @private */
    this.onItemListEntryUpdate = this.onItemListEntryUpdate.bind(this);
    /** @private */
    this.onItemListEntryInventoryChange = this.onItemListEntryInventoryChange.bind(this);
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'albumId');
    upgradeProperty(this, 'init');

    const store = getSatchelStore();
    const init = this.init;

    // Only start init once.
    let albumId;
    switch (init) {
      case 'ground':
        albumId = getGroundAlbumId(store);
        break;
      case 'trash':
        albumId = getTrashAlbumId(store);
        break;
      case 'album':
        albumId = uuid();
        createAlbumInStore(store, albumId);
        break;
      default:
        if (init && init !== 'null') {
          throw new Error(`Unknown init type '${init}' for album-list.`);
        } else {
          // Only if not init, use albumId attribute
          albumId = this.albumId;
        }
        break;
    }
    this.internallyChangeAlbumId(store, albumId);
  }

  /** @protected */
  disconnectedCallback() {
    const store = getSatchelStore();
    const init = this.init;
    const albumId = this.albumId;
    this.internallyChangeAlbumId(store, null);

    // Only stop init if initialized.
    if (init) {
      const album = getInvInStore(store, albumId);
      if (!isTrashAlbum(album) && !isGroundAlbum(album)) {
        deleteInvInStore(store, albumId, album);
      }
    }
  }

  /**
   * @protected
   * @param {string} attribute
   * @param previous
   * @param value
   */
  attributeChangedCallback(attribute, previous, value) {
    switch (attribute) {
      case 'albumid':
        {
          if (value && this.init) {
            throw new Error(`Cannot set album id '${value}' for init type '${this.init}' albums.`);
          }
          const store = getSatchelStore();
          this.internallyChangeAlbumId(store, value);
        }
        break;
      case 'locked':
        {
          const store = getSatchelStore();
          this.onAlbumChange(store, this._albumId);
        }
        break;
    }
  }

  /**
   * @private
   * @param {Store} store
   * @param {AlbumId} newAlbumId
   */
  internallyChangeAlbumId(store, newAlbumId) {
    const prevAlbumId = this._albumId;
    if (prevAlbumId !== newAlbumId) {
      this._albumId = newAlbumId;
      if (prevAlbumId) {
        removeInventoryChangeListener(store, prevAlbumId, this.onAlbumChange);
        cleanUpItemInvElements(
          store,
          this.itemList.children,
          this.itemListEntryIds,
          this.onItemListEntryInventoryChange
        );
      }
      if (newAlbumId) {
        addInventoryChangeListener(store, newAlbumId, this.onAlbumChange);
        this.onAlbumChange(store, newAlbumId);
      }
    }
  }

  /**
   * @private
   * @param store
   * @param albumId
   */
  onAlbumChange(store, albumId) {
    if (!isInvInStore(store, albumId)) {
      // The album has been deleted.
      return;
    }
    const list = getItemsInInv(store, albumId)
      .sort(itemAlphabeticalComparator)
      .map((a) => a.itemId);
    const [created, deleted] = updateList(
      this.itemList,
      list,
      this.onItemListEntryCreate,
      undefined,
      this.onItemListEntryUpdate
    );
    this.dispatchEvent(
      new CustomEvent('change', {
        composed: true,
        bubbles: false,
        detail: {
          albumId,
          created,
          deleted,
        },
      })
    );
  }

  /**
   * @private
   * @param {ItemId} key
   * @returns {InvSocketElement}
   */
  onItemListEntryCreate(key) {
    const albumId = this.albumId;
    const store = getSatchelStore();

    let albumItem = getItemInInv(store, albumId, key);
    let element = setUpItemInvElement(
      store,
      albumItem,
      this.itemListEntryIds,
      this.onItemListEntryInventoryChange
    );
    element.toggleAttribute('fixed', this.hasAttribute('fixed'));
    element.classList.add('shaking');
    return element;
  }

  /**
   * @private
   * @param {ItemId} key
   * @param {InvSocketElement} element
   */
  onItemListEntryUpdate(key, element) {
    if (this.hasAttribute('locked')) {
      element.toggleAttribute('copyoutput', true);
      element.toggleAttribute('temp', false);
    } else {
      element.toggleAttribute('copyoutput', false);
      element.toggleAttribute('temp', true);
    }
  }

  /** @private */
  onItemListEntryInventoryChange(store, invId) {
    if (isInvInStore(store, invId)) {
      // It still exists. Continue as normal.
      return;
    }
    const itemId = tearDownItemInvElement(
      store,
      invId,
      this.itemListEntryIds,
      this.onItemListEntryInventoryChange
    );
    const albumId = this.albumId;
    if (hasItemInInventory(store, albumId, itemId)) {
      removeItemFromInventory(store, albumId, itemId);
    }
  }
}
AlbumListElement.define();
