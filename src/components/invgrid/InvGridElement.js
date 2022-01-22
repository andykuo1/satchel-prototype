import { upgradeProperty } from '../../util/wc.js';
import { containerMouseUpCallback, DEFAULT_ITEM_UNIT_SIZE } from './InventoryElementMouseHelper.js';
import {
  getSatchelStore,
} from '../../store/SatchelStore.js';
import { InventoryItemElement } from './InventoryItemElement.js';
import {
 getItemIdsInSlots, isInventoryEmpty,
} from '../../satchel/inv/InventoryTransfer.js';
import { addInventoryChangeListener, removeInventoryChangeListener } from '../../events/InvEvents.js';
import { createGridInvInStore, deleteInvInStore, getInvInStore, isInvInStore } from '../../store/InvStore.js';
import { getItemInInv } from '../../satchel/inv/InventoryItems.js';
import { updateList } from '../ElementListHelper.js';

/**
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 * @typedef {import('../../satchel/inv/Inv.js').InvId} InvId
 * @typedef {import('../../store/SatchelStore.js').SatchelStore} Store
 */

const INNER_HTML = /* html */`
<section class="root">
  <h2></h2>
  <p class="container grid flattop">
    <div class="itemList"></div>
  </p>
</section>
`;
const INNER_STYLE = /* css */`
:host {
  display: inline-block;

  --background-color: var(--satchel-background-color);
  --outline-color: var(--satchel-outline-color);
  --title-color: var(--satchel-title-color);
  --grid-color: var(--satchel-grid-color);

  --container-width: 1;
  --container-height: 1;
  --item-unit-size: ${DEFAULT_ITEM_UNIT_SIZE}px;
}
.root {
  position: relative;
  display: inline-block;
  width: calc(var(--container-width) * var(--item-unit-size));
  margin: 0;
  margin-right: 0.5em;
  margin-bottom: 0.5em;
}
.root.topmargin {
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
  text-overflow: clip;
  border-radius: 1em;
  text-align: center;
  color: white;
  background-color: var(--title-color);
  transform: translateY(-100%);
  box-shadow: 0.4rem 0.4rem 0 0 var(--outline-color);
}
p {
  margin: 0;
  padding: 0;
}
.hidden {
  visibility: hidden;
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

/**
 * - init - create a new inventory on add
 * - fixed - force single unit size
 * - temp - delete the inventory on remove
 * - noinput - no adding items
 * - nooutput - no removing items
 * - copyoutput - only copy items on remove (does not actually remove)
 */
export class InvGridElement extends HTMLElement {
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
    customElements.define('inv-grid', this);
  }

  static get observedAttributes() {
    return ['invid'];
  }

  get invId() {
    return this._invId;
  }

  set invId(value) {
    this.setAttribute('invid', value);
  }

  get init() {
    return this.getAttribute('init');
  }

  set init(value) {
    this.setAttribute('init', value);
  }

  get _container() {
    return this.innerContainer;
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));
    
    /** @private */
    this._invId = null;

    /** @private */
    this.rootContainer = shadowRoot.querySelector('.root');
    /** @private */
    this.innerContainer = shadowRoot.querySelector('.container');
    /** @private */
    this.invHeader = shadowRoot.querySelector('h2');

    /** @private */
    this.itemList = shadowRoot.querySelector('.itemList');

    /** @private */
    this.onInventoryChange = this.onInventoryChange.bind(this);
    /** @private */
    this.onItemListEntryCreate = this.onItemListEntryCreate.bind(this);
    /** @private */
    this.onMouseUp = this.onMouseUp.bind(this);
    /** @private */
    this.onContextMenu = this.onContextMenu.bind(this);
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'invId');
    upgradeProperty(this, 'init');
    
    const store = getSatchelStore();
    const init = this.init;

    // Only start init once.
    let invId;
    if (init && init.startsWith('grid')) {
      let i = init.indexOf('x');
      let w = Number(init.substring(4, i)) || 1;
      let h = Number(init.substring(i + 1)) || 1;
      createGridInvInStore(store, invId, w, h);
    } else if (init && init !== 'null') {
      throw new Error(`Unknown init type '${init}' for album-list.`);
    } else {
      // Only if not init, use invId attribute
      invId = this.invId;
    }
    this.internallyChangeInvId(store, invId);

    this.innerContainer.addEventListener('mouseup', this.onMouseUp);
    this.innerContainer.addEventListener('contextmenu', this.onContextMenu);
  }

  /** @protected */
  disconnectedCallback() {
    const store = getSatchelStore();
    const init = this.init;
    const invId = this._invId;
    this.internallyChangeInvId(store, null);
    
    // Only stop init if initialized.
    if (init) {
      const inventory = getInvInStore(store, invId);
      if (inventory) {
        deleteInvInStore(store, invId, inventory);
      }
    }

    this.innerContainer.removeEventListener('mouseup', this.onMouseUp);
    this.innerContainer.removeEventListener('contextmenu', this.onContextMenu);
  }

  /**
   * @protected
   * @param {string} attribute
   * @param {string} previous
   * @param {string} value
   */
  attributeChangedCallback(attribute, previous, value) {
    switch (attribute) {
      case 'invid': {
        if (value && this.init) {
          throw new Error(`Cannot set inv id '${value}' for init type '${this.init}' invs.`);
        }
        const store = getSatchelStore();
        this.internallyChangeInvId(store, value);
      } break;
    }
  }

  /**
   * @private
   * @param {Store} store 
   * @param {InvId} newInvId 
   */
  internallyChangeInvId(store, newInvId) {
    const prevInvId = this._invId;
    if (prevInvId !== newInvId) {
      this._invId = newInvId;
      if (prevInvId) {
        removeInventoryChangeListener(
          store,
          prevInvId,
          this.onInventoryChange
        );
      }
      if (newInvId) {
        addInventoryChangeListener(store, newInvId, this.onInventoryChange);
        this.onInventoryChange(store, newInvId);
      }
    }
  }

  /**
   * @private
   * @param {Store} store
   * @param {InvId} invId
   */
  onInventoryChange(store, invId) {
    if (!isInvInStore(store, invId)) {
      // The inv has been deleted.
      this.style.setProperty('--container-width', '0');
      this.style.setProperty('--container-height', '0');
      return;
    }

    const temp = this.hasAttribute('temp');

    const inv = getInvInStore(store, invId);
    const invType = inv.type;
    if (invType !== 'grid') {
      throw new Error('Trying to display non-grid inventory with inv-grid.');
    }
    if (temp && isInventoryEmpty(store, invId)) {
      this.internallyChangeInvId(store, null);
      this.remove();
      deleteInvInStore(store, invId, inv);
      return;
    }

    // Set inv dimensions
    let invWidth = inv.width;
    let invHeight = inv.height;
    this.style.setProperty('--container-width', `${invWidth}`);
    this.style.setProperty('--container-height', `${invHeight}`);

    // Set display name
    const displayName = inv.displayName;
    const isDisplayName = Boolean(displayName);
    this.invHeader.textContent = displayName;
    this.invHeader.classList.toggle('hidden', !isDisplayName);
    this.rootContainer.classList.toggle('topmargin', isDisplayName);
    this.innerContainer.classList.toggle('flattop', isDisplayName);
    
    // Update items
    const list = getItemIdsInSlots(store, invId);
    const [created, deleted] = updateList(this.itemList, list, this.onItemListEntryCreate);
    this.dispatchEvent(new CustomEvent('change', {
      composed: true,
      bubbles: false,
      detail: {
        invId,
        created,
        deleted,
      }
    }));
  }

  /**
   * @private
   * @param {ItemId} key 
   * @returns {InventoryItemElement}
   */
  onItemListEntryCreate(key) {
    const invId = this.invId;
    const store = getSatchelStore();

    let invItem = getItemInInv(store, invId, key);
    let element = new InventoryItemElement(this, invId, invItem.itemId);
    return element;
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
InvGridElement.define();
