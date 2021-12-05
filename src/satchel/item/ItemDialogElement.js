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
      <label for="itemImage">
        <img src="res/image.svg" title="Image">
      </label>
      <input type="url" id="itemImage">
      <input type="color" id="itemBackground">
    </p>
  </fieldset>
  <fieldset class="detail">
    <legend>Detail</legend>
    <slot name="actions" class="actionContainer"></slot>
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

img {
  height: 100%;
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
  background: none;
  border: none;
  color: #aaaaaa;
  margin-left: 0.5em;
}

#itemStackSize {
  width: 2.5em;
}

#itemTitle {
  margin-bottom: 0.5em;
}

.actionContainer {
  display: flex;
  flex-direction: row-reverse;
  position: absolute;
  top: -2.1em;
  right: -1.2em;
}

.actionContainer::slotted(*) {
  width: 2em;
  height: 2em;
}
`;

export class ItemEditorElement extends HTMLElement {
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
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemBackground = shadowRoot.querySelector('#itemBackground');

    /** @private */
    this.onItemTitle = this.onItemTitle.bind(this);
    /** @private */
    this.onItemDesc = this.onItemDesc.bind(this);
    /** @private */
    this.onItemStackSize = this.onItemStackSize.bind(this);
    /** @private */
    this.onItemImage = this.onItemImage.bind(this);
    /** @private */
    this.onItemBackground = this.onItemBackground.bind(this);
    /** @private */
    this.onClickSelectAll = this.onClickSelectAll.bind(this);
    /** @private */
    this.onDialogClose = this.onDialogClose.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.itemTitle.addEventListener('input', this.onItemTitle);
    this.itemDesc.addEventListener('input', this.onItemDesc);
    this.itemStackSize.addEventListener('change', this.onItemStackSize);
    this.itemImage.addEventListener('change', this.onItemImage);
    this.itemImage.addEventListener('click', this.onClickSelectAll);
    this.itemBackground.addEventListener('input', this.onItemBackground);
    this.dialog.addEventListener('close', this.onDialogClose);
  }

  /** @protected */
  disconnectedCallback() {
    this.itemTitle.removeEventListener('change', this.onItemTitle);
    this.itemDesc.removeEventListener('input', this.onItemDesc);
    this.itemStackSize.removeEventListener('change', this.onItemStackSize);
    this.itemImage.removeEventListener('change', this.onItemImage);
    this.itemImage.removeEventListener('click', this.onClickSelectAll);
    this.itemBackground.removeEventListener('input', this.onItemBackground);
    this.dialog.removeEventListener('close', this.onDialogClose);
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

    this.resetInputs(newItem);

    this.dialog.toggleAttribute('open', true);
  }

  getSocketedItem() {
    if (!this.dialog.hasAttribute('open')) {
      return null;
    }
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    return socketItem;
  }

  /** @private */
  resetInputs(item) {
    this.itemTitle.value = item.displayName;
    this.itemDesc.textContent = item.description;
    if (item.stackSize < 0) {
      this.itemStackSize.value = '';
    } else {
      this.itemStackSize.value = String(item.stackSize);
    }
    this.itemImage.value = item.imgSrc;
    this.itemBackground.value = item.background;
  }

  /** @private */
  onDialogClose(e) {
    if (e.detail.from !== 'cancel') {
      const store = getInventoryStore();
      const sourceInv = getInventoryInStore(store, this._invId);
      const sourceItem = getItemByItemId(sourceInv, this._itemId);
      const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
      cloneItem(socketItem, sourceItem);
      dispatchItemChange(store, sourceItem.itemId);
    }
  }

  /** @private */
  onClickSelectAll(e) {
    e.target.select();
  }

  /** @private */
  onItemBackground() {
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    socketItem.background = this.itemBackground.value;
    dispatchItemChange(store, socketItem.itemId);
  }

  /** @private */
  onItemImage() {
    const imgSrc = this.itemImage.value;
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    socketItem.imgSrc = imgSrc;
    dispatchItemChange(store, socketItem.itemId);
  }

  /** @private */
  onItemStackSize() {
    let stackSize;
    try {
      stackSize = Number.parseInt(this.itemStackSize.value);
      if (!Number.isSafeInteger(stackSize) || stackSize < 0) {
        stackSize = -1;
      }
    } catch (e) {
      stackSize = -1;
    }
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    socketItem.stackSize = stackSize;
    dispatchItemChange(store, socketItem.itemId);

    if (stackSize < 0) {
      this.itemStackSize.value = '';
    }
  }

  /** @private */
  onItemTitle() {
    const title = this.itemTitle.value.trim();
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    socketItem.displayName = title;
    dispatchItemChange(store, socketItem.itemId);
  }

  /** @private */
  onItemDesc() {
    const desc = this.itemDesc.textContent;
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    socketItem.description = desc;
    dispatchItemChange(store, socketItem.itemId);
  }
}
ItemEditorElement.define();
