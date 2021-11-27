import { upgradeProperty } from '../../util/wc.js';
import { containerMouseUpCallback, DEFAULT_ITEM_UNIT_SIZE } from './InventoryElementMouseHelper.js';
import {
  addInventoryChangeListener,
  createGridInventoryInStore,
  createSocketInventoryInStore,
  getInventoryInStore,
  getInventoryStore,
  removeInventoryChangeListener,
} from '../InventoryStore.js';
import { InventoryItemElement } from './InventoryItemElement.js';
import {
  getItemAtSlotIndex,
} from '../InventoryTransfer.js';
import { getItemIds } from '../InvItems.js';
import { uuid } from '../../util/uuid.js';

const INNER_HTML = /* html */`
<article>
  <h2><slot name="header"></slot></h2>
  <section class="container grid flattop">
    <slot name="items"></slot>
  </section>
</article>
`;
const INNER_STYLE = /* css */`
:host {
  --background-color: #7f6b50;
  --outline-color: #352e25;
  --title-color: #662200;
  --grid-color: rgba(0, 0, 0, 0.2);
  --container-width: 1;
  --container-height: 1;
  --item-unit-size: ${DEFAULT_ITEM_UNIT_SIZE}px;
}
article {
  position: relative;
  display: inline-block;
  width: calc(var(--container-width) * var(--item-unit-size));
  transition: width var(--transition-duration) ease;
  margin-top: 0;
  margin-right: 0.5em;
  margin-bottom: 0.5em;
}
article.topmargin {
  margin-top: 2em;
}
h2 {
  position: absolute;
  top: 2rem;
  left: 0;
  right: 0;
  font-size: 0.9rem;
  padding-bottom: 2rem;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 1em;
  text-align: center;
  color: white;
  background-color: var(--title-color);
  transform: translateY(-100%);
  box-shadow: 0.4rem 0.4rem 0 0 var(--outline-color);
}
.container {
  position: relative;
  width: 100%;
  height: calc(var(--container-height) * var(--item-unit-size));
  background-color: var(--background-color);
  border-radius: 1rem;
  box-shadow: 0.4rem 0.4rem 0 0 var(--outline-color);
  overflow: hidden;
}
.container.flattop {
  border-top-right-radius: 0rem;
  border-top-left-radius: 0rem;
}
.grid {
  background-size: var(--item-unit-size) var(--item-unit-size);
  background-position: -1px -1px;
  background-image:
    linear-gradient(to right, var(--grid-color), transparent 1px),
    linear-gradient(to bottom, var(--grid-color), transparent 1px);
}
`;

export class InventoryGridElement extends HTMLElement {
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
    customElements.define('inventory-grid', this);
  }

  static get observedAttributes() {
    return ['invid', 'init'];
  }

  get invId() {
    return this._invId;
  }

  set invId(value) {
    this.setAttribute('invid', value);
  }

  get init() {
    return this._init;
  }

  set init(value) {
    this.setAttribute('init', value);
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
    this._invId = undefined;
    /** @private */
    this._init = undefined;

    /** @private */
    this._root = this.shadowRoot.querySelector('article');
    /** @private */
    this._container = this.shadowRoot.querySelector('.container');

    /**
     * @private
     * @type {HTMLSlotElement}
     */
    this.slotItems = this.shadowRoot.querySelector('slot[name="items"]');
    /**
     * @private
     * @type {HTMLSlotElement}
     */
    this.slotHeader = this.shadowRoot.querySelector('slot[name="header"]');

    /** @private */
    this.onInventoryChange = this.onInventoryChange.bind(this);
    /** @private */
    this.onMouseUp = this.onMouseUp.bind(this);
    /** @private */
    this.onContextMenu = this.onContextMenu.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this._container.addEventListener('mouseup', this.onMouseUp);
    this._container.addEventListener('contextmenu', this.onContextMenu);
    let invId = this._invId;
    if (invId) {
      let store = getInventoryStore();
      addInventoryChangeListener(
        invId,
        this.onInventoryChange
      );
      this.onInventoryChange(store, invId);
    }
    upgradeProperty(this, 'invId');
    upgradeProperty(this, 'init');
  }

  /** @protected */
  disconnectedCallback() {
    this._container.removeEventListener('mouseup', this.onMouseUp);
    this._container.removeEventListener('contextmenu', this.onContextMenu);
    const invId = this._invId;
    if (invId) {
      removeInventoryChangeListener(
        invId,
        this.onInventoryChange
      );
    }
  }

  /**
   * @protected
   * @param attribute
   * @param previous
   * @param value
   */
  attributeChangedCallback(attribute, previous, value) {
    switch (attribute) {
      case 'init': {
        const store = getInventoryStore();
        let invId = this.invId;
        if (!invId) {
          invId = uuid();
          this.invId = invId;
        }
        if (value === 'socket') {
          createSocketInventoryInStore(store, invId);
        } else if (value.startsWith('grid')) {
          let i = value.indexOf('x');
          let w = Number(value.substring(4, i)) || 1;
          let h = Number(value.substring(i + 1)) || 1;
          createGridInventoryInStore(store, invId, w, h);
        } else {
          throw new Error('Unknown init type for inventory-grid.');
        }
      } break;
      case 'invid': {
        const store = getInventoryStore();
        const prevInvId = this._invId;
        const nextInvId = value;
        if (prevInvId !== nextInvId) {
          this._invId = nextInvId;
          if (prevInvId) {
            removeInventoryChangeListener(
              prevInvId,
              this.onInventoryChange
            );
          }
          if (nextInvId) {
            addInventoryChangeListener(nextInvId, this.onInventoryChange);
            this.onInventoryChange(store, nextInvId);
          }
        }
      } break;
    }
  }

  /**
   * @private
   * @param store
   * @param invId
   */
  onInventoryChange(store, invId) {
    const inv = getInventoryInStore(store, invId);
    if (!inv) {
      // The inventory has been deleted.
      this.style.setProperty('--container-width', '0');
      this.style.setProperty('--container-height', '0');
      return;
    }

    const invType = inv.type;
    let invWidth = inv.width;
    let invHeight = inv.height;
    if (invType === 'socket') {
      const item = getItemAtSlotIndex(store, invId, 0);
      if (item) {
        invWidth = item.width;
        invHeight = item.height;
      } else {
        invWidth = 1;
        invHeight = 1;
      }
    }

    this.style.setProperty('--container-width', `${invWidth}`);
    this.style.setProperty('--container-height', `${invHeight}`);

    // Set display name
    const displayName = inv.displayName;
    this.slotHeader.textContent = displayName;
    this._root.classList.toggle('topmargin', Boolean(displayName));
    this._container.classList.toggle('flattop', Boolean(displayName));

    // Preserve unchanged items in slot
    const preservedItems = {};
    for (const node of this.slotItems.assignedNodes()) {
      const itemNode =
        /** @type {import('./InventoryItemElement.js').InventoryItemElement} */ (node);
      const itemId = itemNode.itemId;
      if (typeof itemId === 'string') {
        preservedItems[itemId] = node;
      }
    }

    // Add new items into slot.
    const emptySlot = /** @type {HTMLSlotElement} */ (
      this.slotItems.cloneNode(false)
    );
    for (const itemId of getItemIds(inv)) {
      let element;
      element =
        itemId in preservedItems
          ? preservedItems[itemId]
          : new InventoryItemElement(this, invId, itemId);
      emptySlot.append(element);
    }

    this.slotItems.replaceWith(emptySlot);
    this.slotItems = emptySlot;
    this.dispatchEvent(
      new CustomEvent('itemchange', { composed: true, bubbles: false })
    );
  }

  /**
   * @private
   * @param {MouseEvent} e
   */
  onMouseUp(e) {
    if (e.button === 0) {
      return containerMouseUpCallback(e, this, DEFAULT_ITEM_UNIT_SIZE);
    }
  }

  /**
   * @private
   * @param {MouseEvent} e
   */
  onContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}
InventoryGridElement.define();
