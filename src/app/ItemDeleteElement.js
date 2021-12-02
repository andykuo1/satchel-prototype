import { clearGround } from '../inventory/GroundHelper.js';

/** @typedef {import('../inventory/element/InventoryCursorElement.js').InventoryCursorElement} InventoryCursorElement */

const INNER_HTML = /* html */ `
<icon-button id="actionDelete" icon="res/delete.svg" alt="delete" title="Delete Item"></icon-button>
`;
const INNER_STYLE = /* css */ `
:host {
  opacity: 0;
  transition: opacity 0.3s ease;
}
`;

export class ItemDeleteElement extends HTMLElement {
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
    customElements.define('item-delete', this);
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
    this.onActionDeleteUp = this.onActionDeleteUp.bind(this);
    /** @private */
    this.onActionDeleteEnter = this.onActionDeleteEnter.bind(this);
    /** @private */
    this.onActionDeleteLeave = this.onActionDeleteLeave.bind(this);
    /** @private */
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.actionDelete.addEventListener('mouseup', this.onActionDeleteUp);
    this.actionDelete.addEventListener('mousedown', this.onActionDelete);
    this.actionDelete.addEventListener('mouseenter', this.onActionDeleteEnter);
    this.actionDelete.addEventListener('mouseleave', this.onActionDeleteLeave);
    document.addEventListener('mousemove', this.onMouseMove);
  }

  /** @protected */
  disconnectedCallback() {
    this.actionDelete.removeEventListener('mouseup', this.onActionDeleteUp);
    this.actionDelete.removeEventListener('mousedown', this.onActionDelete);
    this.actionDelete.removeEventListener('mouseenter', this.onActionDeleteEnter);
    this.actionDelete.removeEventListener('mouseleave', this.onActionDeleteLeave);
    document.removeEventListener('mousemove', this.onMouseMove);
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

  /** @private */
  onMouseMove(e) {
    let rect = this.getBoundingClientRect();
    let ratio = Math.abs(e.clientY - rect.y) / document.body.clientHeight;
    if (ratio < 0.1) {
      this.style.opacity = '1';
    } else {
      this.style.opacity = '0';
    }
  }
}
ItemDeleteElement.define();