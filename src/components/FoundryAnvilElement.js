import { closeFoundry, isFoundryOpen, openFoundry } from '../satchel/inv/FoundryHelper.js';
import { getCursor } from './index.js';

/** @typedef {import('./cursor/InventoryCursorElement.js').InventoryCursorElement} InventoryCursorElement */

const INNER_HTML = /* html */ `
<icon-button id="actionEdit" icon="res/anvil.svg" alt="edit" title="Edit Item"></icon-button>
`;
const INNER_STYLE = /* css */ `
`;

export class FoundryAnvilElement extends HTMLElement {
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
    customElements.define('foundry-anvil', this);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this.actionEdit = this.shadowRoot.querySelector('#actionEdit');

    /** @private */
    this.onActionEdit = this.onActionEdit.bind(this);
    /** @private */
    this.onActionEditEnter = this.onActionEditEnter.bind(this);
    /** @private */
    this.onActionEditLeave = this.onActionEditLeave.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.actionEdit.addEventListener('mouseup', this.onActionEdit);
    this.actionEdit.addEventListener('mouseenter', this.onActionEditEnter);
    this.actionEdit.addEventListener('mouseleave', this.onActionEditLeave);
  }

  /** @protected */
  disconnectedCallback() {
    this.actionEdit.removeEventListener('mouseup', this.onActionEdit);
    this.actionEdit.removeEventListener('mouseenter', this.onActionEditEnter);
    this.actionEdit.removeEventListener('mouseleave', this.onActionEditLeave);
  }

  /** @private */
  onActionEdit(e) {
    let cursor = getCursor();
    if (cursor && cursor.hasHeldItem()) {
      let heldItem = cursor.getHeldItem();
      cursor.clearHeldItem();
      openFoundry(heldItem);
      e.preventDefault();
      e.stopPropagation();
      return false;
    } else if (isFoundryOpen()) {
      closeFoundry();
    } else {
      openFoundry(null);
    }
  }

  /** @private */
  onActionEditEnter() {
    /** @type {InventoryCursorElement} */
    let cursor = document.querySelector('inventory-cursor');
    if (cursor) {
      cursor.toggleAttribute('important', true);
    }
  }

  /** @private */
  onActionEditLeave() {
    /** @type {InventoryCursorElement} */
    let cursor = document.querySelector('inventory-cursor');
    if (cursor) {
      cursor.toggleAttribute('important', false);
    }
  }
}
FoundryAnvilElement.define();
