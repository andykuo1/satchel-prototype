import { DEFAULT_ITEM_UNIT_SIZE, itemMouseDownCallback } from './InventoryElementMouseHelper.js';
import { getSatchelStore } from '../../store/SatchelStore.js';
import { getExistingInventory } from '../../satchel/inv/InventoryTransfer.js';
import { hasItem, getItemByItemId } from '../../satchel/inv/InvItems.js';
import { getSlotCoordsByIndex, getSlotIndexByItemId } from '../../satchel/inv/InvSlots.js';
import { addItemChangeListener, removeItemChangeListener } from '../../events/ItemEvents.js';

/** @typedef {import('./InventoryGridElement.js').InventoryGridElement} InventoryGridElement */

const INNER_HTML = /* html */`
<figure class="container">
  <div class="innerContainer">
    <img src="res/images/potion.png">
    <figcaption></figcaption>
    <label id="stackSize">1</label>
  </div>
</figure>
`;
const INNER_STYLE = /* css */`
:host {
  --background-color: rgba(0, 0, 0, 0.1);
  --hover-color: rgba(0, 0, 0, 0.2);
  --itemX: 0;
  --itemY: 0;
  --itemWidth: 1;
  --itemHeight: 1;
  --itemBackground: unset;
  /* var(--item-unit-size) is inherited from parent container. */
}
.container {
  display: inline-block;
  position: absolute;
  left: calc(var(--itemX) * var(--item-unit-size));
  top: calc(var(--itemY) * var(--item-unit-size));
  width: calc(var(--itemWidth) * var(--item-unit-size));
  height: calc(var(--itemHeight) * var(--item-unit-size));
  padding: 0;
  margin: 0;
  user-select: none;
  box-shadow: 0 0 0 rgba(0, 0, 0, 0);
  transition: box-shadow 0.1s ease;
  background: var(--itemBackground, var(--background-color));
}
.container:hover {
  z-index: 1;
}
.container:hover .innerContainer {
  background-color: var(--hover-color);
}

.innerContainer {
  position: relative;
  width: 100%;
  height: 100%;
}
img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
figcaption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: unset;
  color: #ffffff;
  background-color: rgba(0, 0, 0, 0.1);
  text-align: center;
  text-overflow: clip;
  text-shadow: 0.1em 0.1em 0.05em #000000;
  white-space: nowrap;
  overflow: hidden;
  /*
  opacity: 0;
  */
}
figcaption.vertical {
  top: 0;
  bottom: 0;
  left: 0;
  right: unset;
  writing-mode: vertical-rl;
}
/*
.container:hover figcaption {
  opacity: 1;
}
*/

#stackSize {
  position: absolute;
  right: 0.2em;
  top: 0;
  text-align: right;
  text-shadow: 1px 1px 3px black;
}
`;

export class InventoryItemElement extends HTMLElement {
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
    customElements.define('inventory-item', this);
  }

  get invId() {
    return this._invId;
  }

  get itemId() {
    return this._itemId;
  }

  get container() {
    return this._containerElement;
  }

  /**
   * @param {InventoryGridElement} containerElement
   * @param {string} invId
   * @param {string} itemId
   */
  constructor(containerElement, invId, itemId) {
    super();
    if (!containerElement) {
      throw new Error('Missing container for item element.');
    }
    if (!invId) {
      throw new Error('Missing inventory id for item element.');
    }
    if (!itemId) {
      throw new Error('Missing item id for item element.');
    }
    if (containerElement.invId !== invId) {
      throw new Error(
        'Cannot create item element with mismatched container and inventory id.'
      );
    }
    const inv = getExistingInventory(getSatchelStore(), invId);
    if (!hasItem(inv, itemId)) {
      throw new Error(
        'Cannot create item element with item id not in given inventory.'
      );
    }
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(
      this.constructor[Symbol.for('templateNode')].content.cloneNode(true)
    );
    shadowRoot.append(
      this.constructor[Symbol.for('styleNode')].cloneNode(true)
    );

    /** @private */
    this._containerElement = containerElement;
    /** @private */
    this._invId = invId;
    /** @private */
    this._itemId = itemId;

    /** @private */
    this._image = this.shadowRoot.querySelector('img');
    /** @private */
    this._caption = this.shadowRoot.querySelector('figcaption');
    /** @private */
    this._stackSize = this.shadowRoot.querySelector('#stackSize');

    /** @protected */
    this.onItemChange = this.onItemChange.bind(this);
    /** @protected */
    this.onMouseDown = this.onMouseDown.bind(this);
    /** @protected */
    this.onContextMenu = this.onContextMenu.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.addEventListener('mousedown', this.onMouseDown);
    this.addEventListener('contextmenu', this.onContextMenu);
    addItemChangeListener(this.itemId, this.onItemChange);
    this.onItemChange(getSatchelStore(), this.itemId);
  }

  /** @protected */
  disconnectedCallback() {
    this.removeEventListener('mousedown', this.onMouseDown);
    this.removeEventListener('contextmenu', this.onContextMenu);
    removeItemChangeListener(
      this.itemId,
      this.onItemChange
    );
  }

  /**
   * @param store
   * @param itemId
   * @protected
   */
  onItemChange(store, itemId) {
    const fixed = this._containerElement.fixed;
    const invId = this._containerElement.invId;
    const inv = getExistingInventory(store, invId);
    const slotIndex = getSlotIndexByItemId(inv, itemId);
    const [x, y] = getSlotCoordsByIndex(inv, slotIndex);
    const item = getItemByItemId(inv, itemId);
    this.style.setProperty('--itemX', `${x}`);
    this.style.setProperty('--itemY', `${y}`);
    if (fixed) {
      this.style.setProperty('--itemWidth', '1');
      this.style.setProperty('--itemHeight', '1');
    } else {
      this.style.setProperty('--itemWidth', `${item.width}`);
      this.style.setProperty('--itemHeight', `${item.height}`);
    }
    if (item.background) {
      try {
        let hex = Number.parseInt(item.background.substring(1), 16);
        let r = (hex >> 16) & 0xFF;
        let g = (hex >> 8) & 0xFF;
        let b = (hex & 0xFF);
        let a = hex === 0 ? 0.1 : 0.3;
        let background = `rgba(${r}, ${g}, ${b}, ${a})`;
        this.style.setProperty('--itemBackground', background);
      } catch (e) {
        this.style.removeProperty('--itemBackground');
      }
    } else {
      this.style.removeProperty('--itemBackground');
    }
    const title = item.displayName || 'Item';
    this.title = title;
    this._image.src = item.imgSrc;
    this._image.alt = title;
    this._caption.textContent = item.displayName;
    this._caption.classList.toggle('vertical', item.width < item.height);
    // Stack size
    if (item.stackSize >= 0) {
      this._stackSize.textContent = `⨯${item.stackSize}`;
    } else {
      this._stackSize.textContent = '';
    }
  }

  /**
   * @param e
   * @protected
   */
  onMouseDown(e) {
    if (e.button === 0) {
      return itemMouseDownCallback(e, this, DEFAULT_ITEM_UNIT_SIZE);
    }
  }

  /**
   * @param {MouseEvent} e
   * @protected
   */
  onContextMenu(e) {
    if (this._containerElement.hasAttribute('noedit')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    let event = new CustomEvent('itemcontext', {
      bubbles: true,
      composed: true,
      detail: {
        clientX: e.clientX,
        clientY: e.clientY,
        element: this,
        container: this.container,
        invId: this.invId,
        itemId: this.itemId,
      },
    });
    this.dispatchEvent(event);
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}
InventoryItemElement.define();
