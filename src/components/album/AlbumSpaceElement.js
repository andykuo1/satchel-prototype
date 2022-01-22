import { getSatchelStore } from '../../store/SatchelStore.js';
import { upgradeProperty } from '../../util/wc.js';
import { getCursor } from '../cursor/index.js';
import { getAlbumInStore, isAlbumInStore } from '../../store/AlbumStore.js';
import './AlbumListElement.js';

/**
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 */

const INNER_HTML = /* html */`
<fieldset>
  <legend></legend>
  <album-list></album-list>
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
  text-align: center;
}
:host([mini]) fieldset {
  padding: 0;
}
:host([mini]) legend {
  display: none;
}
album-list {
  text-align: center;
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

  get albumId() {
    return this.albumList.getAttribute('albumid');
  }

  set albumId(value) {
    this.albumList.setAttribute('albumid', value);
  }

  get init() {
    return this.albumList.getAttribute('init');
  }

  set init(value) {
    this.albumList.setAttribute('init', value);
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
    this.container = shadowRoot.querySelector('fieldset');
    /** @private */
    this.containerTitle = shadowRoot.querySelector('legend');

    /** @private */
    this.albumList = shadowRoot.querySelector('album-list');

    /** @private */
    this.onMouseUp = this.onMouseUp.bind(this);
    /** @private */
    this.onAlbumListChange = this.onAlbumListChange.bind(this);
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'albumId');
    upgradeProperty(this, 'init');

    this.container.addEventListener('mouseup', this.onMouseUp);
    this.albumList.addEventListener('change', this.onAlbumListChange);
  }

  /** @protected */
  disconnectedCallback() {
    this.albumList.removeEventListener('change', this.onAlbumListChange);
    this.container.removeEventListener('mouseup', this.onMouseUp);
  }

  /** @private */
  onAlbumListChange(e) {
    const store = getSatchelStore();
    const album = getAlbumInStore(store, e.detail.albumId);
    // Update name
    const name = album.displayName;
    this.containerTitle.textContent = name;
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
}
AlbumSpaceElement.define();
