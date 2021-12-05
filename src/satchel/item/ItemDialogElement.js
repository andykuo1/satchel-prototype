import { DialogPromptElement } from '../../app/DialogPromptElement.js';
import { InventoryGridElement } from '../../inventory/element/InventoryGridElement.js';
import { getInventoryInStore, getInventoryStore } from '../../inventory/InventoryStore.js';
import { addItemToInventory, clearItemsInInventory, getItemAtSlotIndex } from '../../inventory/InventoryTransfer.js';
import { getItemByItemId } from '../inv/InvItems.js';
import { cloneItem } from './Item.js';
import { dispatchItemChange } from './ItemEvents.js';

const INNER_HTML = /* html */`
<dialog-prompt>
  <fieldset>
    <legend>Item</legend>
    <inventory-grid init="socket" id="socketInventory" noedit nooutput noinput></inventory-grid>
    <p class="styleContainer">
      <input type="text" id="itemImage">
      <img src="res/image.svg" title="image">
    </p>
  </fieldset>
  <fieldset class="detail">
    <legend>Detail</legend>
    <p class="titleContainer">
      <input type="text" id="itemTitle">
      <span id="itemStackSizeContainer">
        <span>⨯</span><input type="number" id="itemStackSize">
      </span>
    </p>
    <p class="textContainer">
      <textarea id="itemDesc" placeholder="Notes..."></textarea>
    </p>
  </fieldset>
</dialog-prompt>
`;
const INNER_STYLE = /* css */`
dialog-prompt {
  text-align: center;
}

textarea {
  flex: 1;
  outline: none;
  border: none;
  background: none;
  height: 10em;
  color: var(--foreground-color);
}

p {
  padding: 0;
  margin: 0;
}

.detail {
  position: relative;
  display: flex;
  flex-direction: column;
}

.titleContainer {
  display: flex;
}

.textContainer {
  display: flex;
}

.styleContainer {
  display: flex;
  vertical-align: middle;
  margin-top: 0.5em;
}

#itemImage {
  flex: 1;
}

#itemStackSize {
  width: 2.5em;
}

#itemTitle {
  margin-bottom: 0.5em;
}
`;

export class ItemDialogElement extends HTMLElement {
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
    customElements.define('item-dialog', this);
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

    this._invId = null;
    this._itemId = null;

    /**
     * @private
     * @type {InventoryGridElement}
     */
    this.socket = shadowRoot.querySelector('inventory-grid');
    /**
     * @private
     * @type {DialogPromptElement}
     */
    this.dialog = shadowRoot.querySelector('dialog-prompt');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemImage = shadowRoot.querySelector('#itemImage');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemStackSize = shadowRoot.querySelector('#itemStackSize');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemTitle = shadowRoot.querySelector('#itemTitle');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemDesc = shadowRoot.querySelector('#itemDesc');

    /** @private */
    this.onItemTitle = this.onItemTitle.bind(this);
    /** @private */
    this.onItemDesc = this.onItemDesc.bind(this);
    /** @private */
    this.onItemStackSize = this.onItemStackSize.bind(this);
    /** @private */
    this.onItemImage = this.onItemImage.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.itemTitle.addEventListener('input', this.onItemTitle);
    this.itemDesc.addEventListener('input', this.onItemDesc);
    this.itemStackSize.addEventListener('change', this.onItemStackSize);
    this.itemImage.addEventListener('change', this.onItemImage);
  }

  /** @protected */
  disconnectedCallback() {
    this.itemTitle.removeEventListener('change', this.onItemTitle);
    this.itemDesc.removeEventListener('input', this.onItemDesc);
    this.itemStackSize.removeEventListener('change', this.onItemStackSize);
    this.itemImage.removeEventListener('change', this.onItemImage);
  }

  openDialog(invId, itemId, clientX, clientY) {
    this._invId = invId;
    this._itemId = itemId;

    const store = getInventoryStore();
    const inv = getInventoryInStore(store, invId);
    const item = getItemByItemId(inv, itemId);

    const newItem = cloneItem(item);
    const socketInvId = this.socket.invId;
    clearItemsInInventory(store, socketInvId);
    addItemToInventory(store, socketInvId, newItem, 0, 0);

    this.itemTitle.value = newItem.displayName;
    this.itemDesc.textContent = newItem.description;
    this.itemStackSize.value = String(newItem.stackSize);
    this.itemImage.value = newItem.imgSrc;

    this.dialog.toggleAttribute('open', true);
  }

  /** @private */
  onItemImage() {
    const imgSrc = this.itemImage.value;
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const sourceInv = getInventoryInStore(store, this._invId);
    const sourceItem = getItemByItemId(sourceInv, this._itemId);
    socketItem.imgSrc = imgSrc;
    sourceItem.imgSrc = imgSrc;
    dispatchItemChange(store, socketItem.itemId);
    dispatchItemChange(store, sourceItem.itemId);
  }
  /** @private */
  onItemStackSize() {
    let stackSize = Number(this.itemStackSize.value);
    if (Number.isSafeInteger(stackSize) && stackSize < 0) {
      stackSize = -1;
    }
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const sourceInv = getInventoryInStore(store, this._invId);
    const sourceItem = getItemByItemId(sourceInv, this._itemId);
    socketItem.stackSize = stackSize;
    sourceItem.stackSize = stackSize;
    dispatchItemChange(store, socketItem.itemId);
    dispatchItemChange(store, sourceItem.itemId);
  }
  /** @private */
  onItemTitle() {
    const title = this.itemTitle.value.trim();
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const sourceInv = getInventoryInStore(store, this._invId);
    const sourceItem = getItemByItemId(sourceInv, this._itemId);
    socketItem.displayName = title;
    sourceItem.displayName = title;
    dispatchItemChange(store, socketItem.itemId);
    dispatchItemChange(store, sourceItem.itemId);
  }
  /** @private */
  onItemDesc() {
    const desc = this.itemDesc.textContent;
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const sourceInv = getInventoryInStore(store, this._invId);
    const sourceItem = getItemByItemId(sourceInv, this._itemId);
    socketItem.description = desc;
    sourceItem.description = desc;
    dispatchItemChange(store, socketItem.itemId);
    dispatchItemChange(store, sourceItem.itemId);
  }
}
ItemDialogElement.define();
