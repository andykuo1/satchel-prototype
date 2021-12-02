import { upgradeProperty } from '../util/wc.js';
import { exportItemToJSON, importItemFromJSON } from '../inventory/InventoryLoader.js';
import { stringHash } from '../util/hash.js';
import { dropOnGround } from '../inventory/GroundHelper.js';
import { addItemToInventory } from '../inventory/InventoryTransfer.js';
import { getInventoryStore } from '../inventory/InventoryStore.js';
import { removeItemFromAlbum } from '../album/Album.js';
import { downloadText } from '../util/downloader.js';

const INNER_HTML = /* html */`
<div class="container">
  <article class="front">
    <h2>
      <span class="headerTitle" id="itemName">Item</span>
      <span class="headerIcon"></span>
    </h2>
    <section class="portrait" id="itemImage"></section>
    <section class="subtitle">
      <label>
        <span>Item | Physical | Crafted</span>
      </label>
      <span class="spacer"></span>
      <output id="itemSize">
        <span>(</span>
        <span id="itemWidth"></span>
        <span>,</span>
        <span id="itemHeight"></span>
        <span>)</span>
      </output>
      <output id="itemStackable">
        <span>&nbsp;⨯</span>
        <span id="itemStackSize"></span>
      </output>
    </section>
    <section class="description" id="itemDescription"></section>
    <section class="credits" id="itemAuthor"></section>
  </article>
</div>
<div class="toolbar">
  <button id="create">Create</button>
  <button id="modify">Modify</button>
  <button id="export">Export</button>
  <button id="delete">Delete</button>
</div>
`;
const INNER_STYLE = /* css */`
:host {
  display: inline-block;
  position: relative;
  width: 18em;
  height: 22em;
  --text-color: #ffffff;
  --outline-color: #333333;
  --background-image: url(res/images/paper.jpg);
  --portrait-image: url(res/images/potion.png);
}

.hidden {
  display: none;
}

/* TOOLBAR */

.toolbar {
  position: absolute;
  top: 0;
  right: 0;
}

/* DIFFERENT VIEWS */

:host(:not([detailed])) section.description {
  display: none;
}

:host([minified]) {
  height: unset;
}
:host([minified]) .front {
  position: relative;
}
:host([minified]) .back {
  display: none;
}
:host([minified]) .front h2 {
  display: flex;
}
:host([minified]) section.portrait {
  display: none;
}
:host([minified]) .headerTitle {
  flex: 1;
  margin-right: 0.25em;
}
:host([minified]) .headerIcon {
  display: inline-block;
  width: 20%;
  background: var(--portrait-image);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  border-radius: 0.5em;
  transform: scale(150%);
}

.front {
  width: calc(100% - 2em);
  height: calc(100% - 2em);

  border-radius: 1em;
  border-color: var(--outline-color);
  border-style: solid;
  border-width: 0.5em;

  padding: 0.5em;
}

/* CARD LAYOUT */

.container {
  width: 100%;
  height: 100%;
}

/* FRONT CARD LAYOUT */

.front {
  background: var(--background-image);
  color: var(--outline-color);
  display: flex;
  flex-direction: column;
}

.front h2 {
  margin: 0;
  margin-bottom: 0.25em;
  padding: 0.5em;

  border-radius: 0.5em;
  background-color: var(--outline-color);
  color: var(--text-color);

  text-align: left;
}

section.portrait {
  background: var(--portrait-image);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  flex: 1;

  border-radius: 0.5em;
}

section.subtitle {
  display: flex;
  position: relative;
  margin-top: 0.25em;

  font-size: 0.6em;

  border-radius: 0.5em;
  background-color: var(--outline-color);
  color: var(--text-color);
  padding: 0.5em;
}
section.subtitle > * {
  text-align: left;
}
section.subtitle > *:last-child {
  text-align: right;
}
.spacer {
  flex: 1;
}

section.description {
  background-color: var(--text-color);
  color: var(--outline-color);
  margin: 0 0.25em;
  margin-top: 0.75em;
  margin-bottom: 0.25em;
  padding: 0.5em;
  border-radius: 0.5em;
  flex: 1;
  overflow-y: auto;
  text-align: left;
  outline: 4px ridge var(--outline-color);
}

section.description p {
  margin: 0;
}

section.credits {
  text-align: left;
  font-size: 0.5em;
  margin-bottom: -1em;
  opacity: 0.8;
}

/* BACK CARD LAYOUT */

.back {
  background-color: var(--outline-color);
  color: var(--text-color);
}
`;

export class CardStockElement extends HTMLElement {
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
    /** @type {import('../inventory/element/ItemEditorElement.js').ItemEditorElement} */
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
