import Template from './CardStockElement.template.html';
import Style from './CardStockElement.module.css';

import { upgradeProperty } from '../../util/wc.js';
import { exportItemToJSON, importItemFromJSON } from '../../inventory/InventoryLoader.js';
import { stringHash } from '../../util/hash.js';
import { dropOnGround } from '../../inventory/GroundHelper.js';
import { addItemToInventory } from '../../inventory/InventoryTransfer.js';
import { getInventoryStore } from '../../inventory/InventoryStore.js';
import { removeItemFromAlbum } from '../CardAlbum.js';
import { downloadText } from '../../util/downloader.js';

export class CardStockElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = Template;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = Style;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('card-stock', this);
  }

  static get observedAttributes() {
    return ['minified', 'detailed'];
  }

  get minified() {
    return this._minified;
  }

  set minified(value) {
    this.setAttribute('minified', value ? 'true' : 'false');
  }

  get detailed() {
    return this._detailed;
  }

  set detailed(value) {
    this.setAttribute('detailed', value ? 'true' : 'false');
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    this.shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    this.itemData = null;
    this.itemId = '';

    /** @private */
    this._minified = false;
    /** @private */
    this._detailed = false;

    /** @private */
    this.itemName = this.shadowRoot.querySelector('#itemName');
    /** @private */
    this.itemDescription = this.shadowRoot.querySelector('#itemDescription');
    /** @private */
    this.itemWidth = this.shadowRoot.querySelector('#itemWidth');
    /** @private */
    this.itemHeight = this.shadowRoot.querySelector('#itemHeight');
    /** @private */
    this.itemStackSize = this.shadowRoot.querySelector('#itemStackSize');
    /** @private */
    this.itemStackable = this.shadowRoot.querySelector('#itemStackable');
    /** @private */
    this.itemAuthor = this.shadowRoot.querySelector('#itemAuthor');
    /** @private */
    this.itemImage = this.shadowRoot.querySelector('#itemImage');

    /** @private */
    this.toolbarCreate = this.shadowRoot.querySelector('#create');
    /** @private */
    this.toolbarModify = this.shadowRoot.querySelector('#modify');
    /** @private */
    this.toolbarDelete = this.shadowRoot.querySelector('#delete');
    /** @private */
    this.toolbarExport = this.shadowRoot.querySelector('#export');

    /** @private */
    this.onToolbarCreate = this.onToolbarCreate.bind(this);
    /** @private */
    this.onToolbarModify = this.onToolbarModify.bind(this);
    /** @private */
    this.onToolbarDelete = this.onToolbarDelete.bind(this);
    /** @private */
    this.onToolbarExport = this.onToolbarExport.bind(this);
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'flipped');
    upgradeProperty(this, 'minified');
    upgradeProperty(this, 'detailed');

    this.toolbarCreate.addEventListener('click', this.onToolbarCreate);
    this.toolbarModify.addEventListener('click', this.onToolbarModify);
    this.toolbarDelete.addEventListener('click', this.onToolbarDelete);
    this.toolbarExport.addEventListener('click', this.onToolbarExport);
  }

  /** @protected */
  disconnectedCallback() {
    this.toolbarCreate.removeEventListener('click', this.onToolbarCreate);
    this.toolbarModify.removeEventListener('click', this.onToolbarModify);
    this.toolbarDelete.removeEventListener('click', this.onToolbarDelete);
    this.toolbarExport.removeEventListener('click', this.onToolbarExport);
  }

  setItem(item) {
    this.itemName.textContent = item.displayName || 'Item';
    this.itemDescription.textContent = item.description;
    this.itemWidth.textContent = item.width;
    this.itemHeight.textContent = item.height;
    if (item.stackSize >= 0) {
      this.itemStackable.classList.toggle('hidden', false);
      this.itemStackSize.textContent = item.stackSize;
    } else {
      this.itemStackable.classList.toggle('hidden', true);
    }
    this.style.setProperty('--portrait-image', `url(${item.imgSrc})`);
    let jsonData = exportItemToJSON(item);
    let hash = stringHash(JSON.stringify(jsonData._data));
    this.itemAuthor.textContent = `#${hash} DungeonMaster`;
    this.itemData = jsonData;
    this.itemId = item.itemId;
    return this;
  }

  getItem() {
    return importItemFromJSON(this.itemData);
  }

  /** @private */
  onToolbarCreate() {
    const item = this.getItem();
    dropOnGround(item);
  }

  /** @private */
  onToolbarModify() {
    const item = this.getItem();
    /** @type {import('../../inventory/element/ItemEditorElement.js').ItemEditorElement} */
    const editor = document.querySelector('item-editor');
    if (editor) {
      const invId = editor.socketInventory.invId;
      addItemToInventory(getInventoryStore(), invId, item, 0, 0);
    }
    this.onToolbarDelete();
  }

  /** @private */
  onToolbarDelete() {
    if (this.itemId) {
      let store = getInventoryStore();
      removeItemFromAlbum(store, 'main', this.itemId);
    }
  }

  /** @private */
  onToolbarExport() {
    const item = this.getItem();
    let jsonData = exportItemToJSON(item);
    downloadText(`${item.displayName || 'New Item'}.json`, JSON.stringify(jsonData, null, 4));
  }
}
CardStockElement.define();
