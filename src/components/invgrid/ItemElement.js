import { DEFAULT_ITEM_UNIT_SIZE, itemMouseDownCallback } from './InvMouseHelper.js';
import { getSatchelStore } from '../../store/SatchelStore.js';
import { getExistingInventory } from '../../satchel/inv/InventoryTransfer.js';
import { hasItem, getItemByItemId } from '../../satchel/inv/InvItems.js';
import { getSlotCoordsByIndex, getSlotIndexByItemId } from '../../satchel/inv/InvSlots.js';
import { addItemChangeListener, removeItemChangeListener } from '../../events/ItemEvents.js';
import { isInventoryViewEditable, isInventoryViewUnitSized } from '../inventory/InventoryView.js';

/** @typedef {import('../inventory/InventoryView.js').InventoryView} InventoryView */

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
  --foreground-color: var(--item-foreground-color);
  --background-color: var(--item-background-color);
  --hover-color: var(--item-hover-color);
  --title-font: var(--item-title-font);
  
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
  background: var(--background-color);
}
.container.background {
  left: calc(var(--itemX) * var(--item-unit-size));
  top: calc(var(--itemY) * var(--item-unit-size));
  width: calc(var(--itemWidth) * var(--item-unit-size) - 0.2em);
  height: calc(var(--itemHeight) * var(--item-unit-size) - 0.2em);
  background: linear-gradient(to bottom right,
    var(--background-color), var(--itemBackground, var(--background-color)));
  border: 0.1em solid var(--itemBackground, var(--background-color));
}
.container.background, .container.background .innerContainer {
  border-radius: 1em;
}
.container:hover {
  z-index: 5;
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
  font-family: var(--title-font);
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: unset;
  color: var(--foreground-color);
  background-color: rgba(0, 0, 0, 0.1);
  text-align: center;
  text-overflow: clip;
  text-shadow: 0.1em 0.1em 0.05em #000000;
  white-space: nowrap;
  overflow: hidden;
}
figcaption.vertical {
  top: 0;
  bottom: 0;
  left: 0;
  right: unset;
  writing-mode: vertical-rl;
}

#stackSize {
  position: absolute;
  right: 0.2em;
  top: 0;
  text-align: right;
  text-shadow: 0.1em 0.1em 0.05em #000000;
}
`;

export class ItemElement extends HTMLElement {
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
    return this._invView.containerElement;
  }

  /**
   * @param {InventoryView} invView
   * @param {string} invId
   * @param {string} itemId
   */
  constructor(invView, invId, itemId) {
    super();
    if (!invView) {
      throw new Error('Missing view for item container.');
    }
    if (!invId) {
      throw new Error('Missing inventory id for item element.');
    }
    if (!itemId) {
      throw new Error('Missing item id for item element.');
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
    this._invView = invView;
    /** @private */
    this._invId = invId;
    /** @private */
    this._itemId = itemId;

    /** @private */
    this._container = shadowRoot.querySelector('.container');
    /** @private */
    this._image = shadowRoot.querySelector('img');
    /** @private */
    this._caption = shadowRoot.querySelector('figcaption');
    /** @private */
    this._stackSize = shadowRoot.querySelector('#stackSize');

    /** @protected */
    this.onItemChange = this.onItemChange.bind(this);
    /** @protected */
    this.onMouseDown = this.onMouseDown.bind(this);
    /** @protected */
    this.onContextMenu = this.onContextMenu.bind(this);
  }

  /** @protected */
  connectedCallback() {
    const store = getSatchelStore();
    this.addEventListener('mousedown', this.onMouseDown);
    this.addEventListener('contextmenu', this.onContextMenu);
    addItemChangeListener(store, this.itemId, this.onItemChange);
    this.onItemChange(store, this.itemId);
  }

  /** @protected */
  disconnectedCallback() {
    const store = getSatchelStore();
    this.removeEventListener('mousedown', this.onMouseDown);
    this.removeEventListener('contextmenu', this.onContextMenu);
    removeItemChangeListener(
      store,
      this.itemId,
      this.onItemChange
    );
  }

  /**
   * @private
   * @param store
   * @param itemId
   */
  onItemChange(store, itemId) {
    const unitSized = isInventoryViewUnitSized(this._invView);
    const invId = this._invId;
    const inv = getExistingInventory(store, invId);
    const slotIndex = getSlotIndexByItemId(inv, itemId);
    const [x, y] = getSlotCoordsByIndex(inv, slotIndex);
    const item = getItemByItemId(inv, itemId);
    this.style.setProperty('--itemX', `${x}`);
    this.style.setProperty('--itemY', `${y}`);
    if (unitSized) {
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
        this._container.classList.toggle('background', true);
      } catch (e) {
        this.style.removeProperty('--itemBackground');
        this._container.classList.toggle('background', false);
      }
    } else {
      this.style.removeProperty('--itemBackground');
      this._container.classList.toggle('background', false);
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
   * @private
   * @param {MouseEvent} e
   */
  onMouseDown(e) {
    if (e.button === 0) {
      return itemMouseDownCallback(e, this, DEFAULT_ITEM_UNIT_SIZE);
    }
  }

  /**
   * @private
   * @param {MouseEvent} e
   */
  onContextMenu(e) {
    if (isInventoryViewEditable(this._invView)) {
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
ItemElement.define();
