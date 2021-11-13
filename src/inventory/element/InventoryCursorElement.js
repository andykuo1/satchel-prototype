import { distanceSquared } from '../../util/math.js';
import { setCursorElement } from '../CursorHelper.js';
import { createSocketInventoryInStore, deleteInventoryFromStore, getInventoryInStore, getInventoryStore, isInventoryInStore } from '../InventoryStore.js';

const CURSOR_OFFSET_PIXELS = 24;
const PLACE_BUFFER_RANGE_SQUARED = 8 * 8;
const PLACE_BUFFER_TIMEOUT_MILLIS = 300;

const INNER_HTML = `
<inventory-grid name="cursor"></inventory-grid>
`;
const INNER_STYLE = `
:host {
  position: absolute;
  display: none;
  filter: brightness(70%);
}
`;

export class InventoryCursorElement extends HTMLElement {
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
    customElements.define('inventory-cursor', this);
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
    this.unitSize = 48;

    /** @private */
    this.animationHandle = null;
    /** @private */
    this.clientX = 0;
    /** @private */
    this.clientY = 0;

    /** @private */
    this.localX = 0;
    /** @private */
    this.localY = 0;

    /** @private */
    this.pickX = 0;
    /** @private */
    this.pickY = 0;

    /** @private */
    this.pickOffsetX = 0;
    /** @private */
    this.pickOffsetY = 0;

    /** @private */
    this.placeDownBuffer = false;

    /** @private */
    this.inventoryElement = this.shadowRoot.querySelector('inventory-grid');

    /** @private */
    this.onAnimationFrame = this.onAnimationFrame.bind(this);
    /** @private */
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  get name() {
    return this.inventoryElement.name;
  }

  /** @protected */
  connectedCallback() {
    let store = getInventoryStore();
    const invId = this.inventoryElement.name;
    if (!isInventoryInStore(store, invId)) {
      createSocketInventoryInStore(store, invId);
    }

    // TODO: This is a global var :(
    setCursorElement(this);

    document.addEventListener('mousemove', this.onMouseMove);
    this.animationHandle = requestAnimationFrame(this.onAnimationFrame);
  }

  /** @protected */
  disconnectedCallback() {
    document.removeEventListener('mousemove', this.onMouseMove);
    cancelAnimationFrame(this.animationHandle);
    this.animationHandle = null;
    clearTimeout(this.placeDownBufferTimeoutHandle);
    this.placeDownBufferTimeoutHandle = null;

    let store = getInventoryStore();
    const invId = this.inventoryElement.name;
    if (isInventoryInStore(store, invId)) {
      deleteInventoryFromStore(store, invId, getInventoryInStore(store, invId));
    }
  }

  /** @private */
  onAnimationFrame() {
    // Update cursor position
    const posX = this.clientX + this.pickOffsetX * this.unitSize;
    const posY = this.clientY + this.pickOffsetY * this.unitSize;
    this.localX = posX;
    this.localY = posY;
    this.style.setProperty('left', `${posX - CURSOR_OFFSET_PIXELS}px`);
    this.style.setProperty('top', `${posY - CURSOR_OFFSET_PIXELS}px`);
    if (this.placeDownBuffer && distanceSquared(posX, posY, this.pickX, this.pickY) >= PLACE_BUFFER_RANGE_SQUARED) {
      this.clearPlaceDownBuffer();
    }
    // Wait for another frame...
    this.animationHandle = requestAnimationFrame(this.onAnimationFrame);
  }

  /** @private */
  onMouseMove(e) {
    this.clientX = e.clientX;
    this.clientY = e.clientY;
  }

  getPickOffset() {
    return [
      this.pickOffsetX,
      this.pickOffsetY,
    ];
  }

  setPickOffset(x, y) {
    this.pickOffsetX = x;
    this.pickOffsetY = y;
  }

  startPlaceDownBuffer() {
    this.placeDownBuffer = true;
    this.pickX = this.localX;
    this.pickY = this.localY;
  }

  isPlaceDownBuffering() {
    return this.placeDownBuffer;
  }

  clearPlaceDownBuffer() {
    this.placeDownBuffer = false;
  }
}
InventoryCursorElement.define();
