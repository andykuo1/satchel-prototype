/**
 * @typedef {import('../../satchel/item/Item.js').Item} Item
 */

import { dropItemOnGround } from '../../satchel/GroundAlbum.js';
import { playSound } from '../../sounds.js';
import { DEFAULT_ITEM_UNIT_SIZE } from '../invgrid/InventoryElementMouseHelper.js';

const INNER_HTML = /* html */`
<div class="outer">
  <img>
</div>
`;
const INNER_STYLE = /* css */`
:host {
  display: inline-block;
  pointer-events: none;
}
.outer {
  position: absolute;
  left: 0;
  top: 0;
  width: ${DEFAULT_ITEM_UNIT_SIZE}px;
  height: ${DEFAULT_ITEM_UNIT_SIZE}px;
  animation-duration: 1s;
  animation-timing-function: cubic-bezier(0.6, -0.18, 0.735, 0.045);
  animation-fill-mode: forwards;
  overflow: hidden;
  transform: scale(0);
}
img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.falling {
  animation-name: itemfall;
}
@keyframes itemfall {
  0% {
    transform: scale(1.5);
  }
  20% {
    transform: scale(3);
  }
  to {
    transform: scale(0);
    top: 10%;
    left: 100%;
  }
}
`;

export class FallingItemElement extends HTMLElement {
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
    customElements.define('falling-item', this);
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
    this.containerElement = shadowRoot.querySelector('.outer');
    /** @private */
    this.imageElement = shadowRoot.querySelector('img');
  }

  /**
   * @param {Item} item 
   */
  animateItem(item, clientX, clientY) {
    const img = this.imageElement;
    img.src = item.imgSrc;
    img.alt = item.displayName;
    const root = this.containerElement;
    root.style.setProperty('left', `${clientX}px`);
    root.style.setProperty('top', `${clientY}px`);
    root.classList.remove('falling');
    void root.offsetWidth;
    root.classList.add('falling');
  }
}
FallingItemElement.define();

/**
 * @returns {FallingItemElement}
 */
export function getFalling() {
  return document.querySelector('falling-item');
}

export function dropFallingItem(item, clientX, clientY) {
  playSound('putdownGround');
  dropItemOnGround(item);
  getFalling().animateItem(item, clientX, clientY);
}
