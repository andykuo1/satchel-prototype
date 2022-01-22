import { getSatchelStore } from '../../store/SatchelStore.js';
import { getCursor } from '../cursor/index.js';
import { getGroundAlbumId } from '../../satchel/GroundAlbum.js';
import './AlbumListElement.js';

/**
 * @typedef {import('../invgrid/InventoryGridElement.js').InventoryGridElement} InventoryGridElement
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 */

const INNER_HTML = /* html */`
<album-list init="ground" fixed></album-list>
`;
const INNER_STYLE = /* css */`
album-list {
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;

  --animation-delay: 0.3s;
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

    /** @private */
    this.albumList = shadowRoot.querySelector('album-list');

    /** @private */
    this.onAlbumListChange = this.onAlbumListChange.bind(this);
    /** @private */
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  /** @protected */
  connectedCallback() {
    document.addEventListener('mouseup', this.onMouseUp);
    this.albumList.addEventListener('change', this.onAlbumListChange);
  }

  /** @protected */
  disconnectedCallback() {
    document.removeEventListener('mouseup', this.onMouseUp);
    this.albumList.removeEventListener('change', this.onAlbumListChange);
  }

  /** @private */
  onAlbumListChange(e) {
    const { created } = e.detail;
    if (created && created.length > 0) {
      // Scroll to new items.
      let firstElement = created[0];
      let rect = firstElement.getBoundingClientRect();
      this.scrollTo(rect.x + rect.width, rect.y + rect.height);
    }
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
}
AlbumGroundElement.define();
