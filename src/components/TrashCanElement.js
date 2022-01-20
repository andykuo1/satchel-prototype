import { saveItemToTrashAlbum } from '../satchel/TrashAlbum.js';
import { getCursor } from './index.js';

/** @typedef {import('./cursor/InventoryCursorElement.js').InventoryCursorElement} InventoryCursorElement */

const INNER_HTML = /* html */ `
<icon-button id="actionDelete" icon="res/delete.svg" alt="delete" title="Delete Item"></icon-button>
`;
const INNER_STYLE = /* css */ `
`;

export class TrashCanElement extends HTMLElement {
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
    customElements.define('trash-can', this);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this.actionDelete = this.shadowRoot.querySelector('#actionDelete');

    /** @private */
    this.onActionDelete = this.onActionDelete.bind(this);
    /** @private */
    this.onActionDeleteEnter = this.onActionDeleteEnter.bind(this);
    /** @private */
    this.onActionDeleteLeave = this.onActionDeleteLeave.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.actionDelete.addEventListener('mouseup', this.onActionDelete);
    this.actionDelete.addEventListener('mouseenter', this.onActionDeleteEnter);
    this.actionDelete.addEventListener('mouseleave', this.onActionDeleteLeave);
  }

  /** @protected */
  disconnectedCallback() {
    this.actionDelete.removeEventListener('mouseup', this.onActionDelete);
    this.actionDelete.removeEventListener('mouseenter', this.onActionDeleteEnter);
    this.actionDelete.removeEventListener('mouseleave', this.onActionDeleteLeave);
  }

  /** @private */
  onActionDelete(e) {
    let cursor = getCursor();
    if (cursor && cursor.hasHeldItem()) {
      let heldItem = cursor.getHeldItem();
      cursor.clearHeldItem();
      saveItemToTrashAlbum(heldItem);
      e.preventDefault();
      e.stopPropagation();
      return false;
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
}
TrashCanElement.define();
