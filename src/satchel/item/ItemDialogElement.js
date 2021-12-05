import { DialogPromptElement } from '../../app/DialogPromptElement.js';
import { InventoryGridElement } from '../../inventory/element/InventoryGridElement.js';
import { dropOnGround } from '../../inventory/GroundHelper.js';
import { getInventoryInStore, getInventoryStore } from '../../inventory/InventoryStore.js';
import { addItemToInventory, clearItemsInInventory, getItemAtSlotIndex, hasItemInInventory, isInventoryEmpty, removeItemFromInventory } from '../../inventory/InventoryTransfer.js';
import { dispatchInventoryChange } from '../inv/InvEvents.js';
import { getItemByItemId } from '../inv/InvItems.js';
import { cloneItem, copyItem, ItemBuilder } from './Item.js';
import { dispatchItemChange } from './ItemEvents.js';

/** @typedef {import('./Item.js').Item} Item */

const MAX_ITEM_WIDTH = 8;
const MAX_ITEM_HEIGHT = 8;

const INNER_HTML = /* html */`
<dialog-prompt>
  <div class="container">
    <button id="actionFoundry">Send to Foundry</button>
    <fieldset class="portraitContainer">
      <legend>Item</legend>
      <div class="foundrySocketContainer">
        <div class="foundryContainer">
          <icon-button id="actionEnlarge" icon="res/more.svg"></icon-button>
          <icon-button id="actionShrink" icon="res/less.svg"></icon-button>
          <icon-button id="actionFlatten" icon="res/flatten.svg"></icon-button>
          <icon-button id="actionRotate" icon="res/rotate.svg"></icon-button>
        </div>
        <div class="socketMarginContainer">
          <div class="socketContainer">
            <input type="number" min="1" max="${MAX_ITEM_WIDTH}" id="itemWidth">
            <input type="number" min="1" max="${MAX_ITEM_HEIGHT}" id="itemHeight">
            <span class="socketInventoryContainer">
              <inventory-grid init="socket" id="socketInventory" noedit nooutput noinput></inventory-grid>
            </span>
          </div>
        </div>
      </div>
      <p class="styleContainer">
        <label for="itemImage">
          <img src="res/image.svg" title="Image">
        </label>
        <input type="url" id="itemImage">
        <input type="color" id="itemBackground">
      </p>
    </fieldset>
    <fieldset class="detailContainer">
      <legend>Detail</legend>
      <slot name="actions" class="actionContainer"></slot>
      <p class="titleContainer">
        <input type="text" id="itemTitle" placeholder="Item">
        <span id="itemStackSizeContainer">
          <span>⨯</span><input type="number" id="itemStackSize" placeholder="--">
        </span>
      </p>
      <p class="textContainer">
        <textarea id="itemDesc" placeholder="Notes..."></textarea>
      </p>
      <button id="actionSave">Save & Close</button>
    </fieldset>
  </div>
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

.container {
  display: inline-block;
  max-height: 80vh;
}

.portraitContainer {
  position: relative;
  display: flex;
  flex-direction: column;
}
.detailContainer {
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

.foundryContainer {
  position: absolute;
  display: flex;
  flex-direction: column;
}
.foundryContainer icon-button {
  width: 2em;
  height: 2em;
  margin: 0;
}
.foundryContainer icon-button[disabled] {
  display: none;
}
.foundrySocketContainer {
  display: flex;
  flex-direction: row;
}

.socketMarginContainer {
  flex: 1;
  margin: 1em 2em;
}
.socketFixedContainer {
  width: 30vw;
  height: 30vh;
}
.socketContainer {
  display: inline-block;
  position: relative;
  margin-left: auto;
  margin-right: auto;
}
.socketInventoryContainer {
  display: inline-block;
  max-width: 30vw;
  max-height: 30vh;
  overflow: auto;
}
#itemWidth, #itemHeight {
  color: #ffffff;
  width: 2.5em;
  background: none;
  border: none;
}
#itemWidth:disabled, #itemHeight:disabled {
  opacity: 0.3;
}
#itemWidth {
  position: absolute;
  left: calc(50% + 1em);
  bottom: -1.5em;
  z-index: 1;
  transform: translateX(-50%);
}
#itemHeight {
  position: absolute;
  top: 50%;
  right: -3em;
  z-index: 1;
  transform: translateY(-50%);
}

#actionFoundry {
  position: absolute;
  left: 0;
  top: 0;
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
  flex: 1;
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

    /** @private */
    this._containerElement = null;
    /** @private */
    this._invId = null;
    /** @private */
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
    this.actionSave = shadowRoot.querySelector('#actionSave');
    /** @private */
    this.actionFoundry = shadowRoot.querySelector('#actionFoundry');

    /** @private */
    this.socketMarginContainer = shadowRoot.querySelector('.socketMarginContainer');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemWidth = shadowRoot.querySelector('#itemWidth');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemHeight = shadowRoot.querySelector('#itemHeight');
    /** @private */
    this.actionEnlarge = shadowRoot.querySelector('#actionEnlarge');
    /** @private */
    this.actionShrink = shadowRoot.querySelector('#actionShrink');
    /** @private */
    this.actionFlatten = shadowRoot.querySelector('#actionFlatten');
    /** @private */
    this.actionRotate = shadowRoot.querySelector('#actionRotate');

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
    /** @private */
    this.onActionSave = this.onActionSave.bind(this);
    /** @private */
    this.onActionFoundry = this.onActionFoundry.bind(this);
    /** @private */
    this.onActionEnlarge = this.onActionEnlarge.bind(this);
    /** @private */
    this.onActionShrink = this.onActionShrink.bind(this);
    /** @private */
    this.onActionFlatten = this.onActionFlatten.bind(this);
    /** @private */
    this.onActionRotate = this.onActionRotate.bind(this);
    /** @private */
    this.onItemWidth = this.onItemWidth.bind(this);
    /** @private */
    this.onItemHeight = this.onItemHeight.bind(this);
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
    this.actionSave.addEventListener('click', this.onActionSave);
    this.actionFoundry.addEventListener('click', this.onActionFoundry);
    this.actionEnlarge.addEventListener('click', this.onActionEnlarge);
    this.actionShrink.addEventListener('click', this.onActionShrink);
    this.actionFlatten.addEventListener('click', this.onActionFlatten);
    this.actionRotate.addEventListener('click', this.onActionRotate);
    this.itemWidth.addEventListener('change', this.onItemWidth);
    this.itemHeight.addEventListener('change', this.onItemHeight);
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
    this.actionSave.removeEventListener('click', this.onActionSave);
    this.actionFoundry.removeEventListener('click', this.onActionFoundry);
    this.actionEnlarge.removeEventListener('click', this.onActionEnlarge);
    this.actionShrink.removeEventListener('click', this.onActionShrink);
    this.actionFlatten.removeEventListener('click', this.onActionFlatten);
    this.actionRotate.removeEventListener('click', this.onActionRotate);
    this.itemWidth.removeEventListener('change', this.onItemWidth);
    this.itemHeight.removeEventListener('change', this.onItemHeight);
  }

  openDialog(containerElement, invId, itemId, clientX = 0, clientY = 0, resizable = false) {
    this._containerElement = containerElement;
    this._invId = invId;
    this._itemId = itemId;

    const store = getInventoryStore();
    let newItem;
    if (invId && itemId) {
      const inv = getInventoryInStore(store, invId);
      const item = getItemByItemId(inv, itemId);
      newItem = cloneItem(item);
    } else {
      newItem = new ItemBuilder()
        .fromDefault()
        .width(2)
        .height(2)
        .build();
    }
    const socketInvId = this.socket.invId;
    clearItemsInInventory(store, socketInvId);
    addItemToInventory(store, socketInvId, newItem, 0, 0);

    this.resetInputs(newItem);
    this.resetSizeInputs(resizable);

    this.dialog.toggleAttribute('open', true);

    const content = this.itemDesc.value;
    this.itemDesc.focus();
    this.itemDesc.setSelectionRange(content.length, content.length);
    this.itemDesc.scrollTo({ top: 0 });
  }

  getSocketedItem() {
    if (!this.dialog.hasAttribute('open')) {
      return null;
    }
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    return socketItem;
  }

  /**
   * @private
   * @param {Item} item
   */
  resetInputs(item) {
    this.itemTitle.value = item.displayName;
    this.itemDesc.value = item.description;
    this.itemWidth.value = String(item.width);
    this.itemHeight.value = String(item.height);
    this.itemBackground.value = item.background || '#000000';
    if (item.stackSize < 0) {
      this.itemStackSize.value = '';
    } else {
      this.itemStackSize.value = String(item.stackSize);
    }
    const defaultImgSrc = getDefaultImageSourceByDimensions(item.width, item.height, item.stackSize);
    if (defaultImgSrc !== item.imgSrc) {
      this.itemImage.value = item.imgSrc;
    } else {
      this.itemImage.value = '';
    }
    this.itemImage.placeholder = getDefaultImageSourceByDimensions(item.width, item.height, item.stackSize);
  }

  /** @private */
  resetSizeInputs(resizable) {
    this.actionFoundry.toggleAttribute('disabled', resizable);
    this.itemWidth.toggleAttribute('disabled', !resizable);
    this.itemHeight.toggleAttribute('disabled', !resizable);
    this.actionEnlarge.toggleAttribute('disabled', !resizable);
    this.actionShrink.toggleAttribute('disabled', !resizable);
    this.actionFlatten.toggleAttribute('disabled', !resizable);
    this.actionRotate.toggleAttribute('disabled', !resizable);
    
    this.socketMarginContainer.classList.toggle('socketFixedContainer', resizable);
  }

  /** @private */
  saveInputs() {
    const invId = this._invId;
    const itemId = this._itemId;
    const socketInvId = this.socket.invId;
    const store = getInventoryStore();
    if (invId && itemId) {
      const sourceInv = getInventoryInStore(store, invId);
      const sourceItem = getItemByItemId(sourceInv, itemId);
      const socketItem = getItemAtSlotIndex(store, socketInvId, 0);
      cloneItem(socketItem, sourceItem);
      dispatchItemChange(store, sourceItem.itemId);
    } else {
      const socketItem = getItemAtSlotIndex(store, socketInvId, 0);
      clearItemsInInventory(store, socketInvId);
      dropOnGround(socketItem);
    }
  }

  /** @private */
  onActionFoundry() {
    if (!this._containerElement || !this._invId || !this._itemId) {
      return;
    }
    this.saveInputs();
    this.dialog.toggleAttribute('open', false);

    const store = getInventoryStore();
    const item = tryTakeItemFromInventory(store, this._containerElement, this._itemId);
    
    /** @type {import('../../inventory/element/ItemEditorElement.js').ItemEditorElement} */
    const itemEditor = document.querySelector('#editor');
    const targetInvId = itemEditor.socketInventory.invId;
    if (!isInventoryEmpty(store, targetInvId)) {
      let item = getItemAtSlotIndex(store, targetInvId, 0);
      clearItemsInInventory(store, targetInvId);
      dropOnGround(item);
    }
    addItemToInventory(store, targetInvId, item, 0, 0);

    let editorContainer = document.querySelector('.editorContainer');
    editorContainer.classList.toggle('open', true);
  }

  /**
   * @private
   * @param {*} store
   * @param {Item} item
   * @param {number} width
   * @param {number} height
   */
  updateItemSize(store, item, width, height) {
    width = Math.min(Math.max(width, 1), MAX_ITEM_WIDTH);
    height = Math.min(Math.max(height, 1), MAX_ITEM_HEIGHT);
    this.itemWidth.value = String(width);
    this.itemHeight.value = String(height);
    item.width = width;
    item.height = height;
    // Change image based on size
    const defaultImgSrc = getDefaultImageSourceByDimensions(item.width, item.height, item.stackSize);
    this.itemImage.placeholder = defaultImgSrc;
    if (!this.itemImage.value) {
      item.imgSrc = defaultImgSrc;
    }
    dispatchItemChange(store, item.itemId);
    dispatchInventoryChange(store, this.socket.invId);
  }

  /** @private */
  onActionEnlarge() {
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const oldWidth = socketItem.width;
    const oldHeight = socketItem.height;
    let newWidth = oldWidth + 1;
    let newHeight = oldHeight + 1;
    if (newWidth === newHeight && newWidth !== 2) {
      newWidth += 1;
      newHeight += 1;
    }
    this.updateItemSize(store, socketItem, newWidth, newHeight);
  }

  /** @private */
  onActionShrink() {
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const oldWidth = socketItem.width;
    const oldHeight = socketItem.height;
    let newWidth = oldWidth - 1;
    let newHeight = oldHeight - 1;
    if (newWidth === newHeight && newWidth !== 1) {
      newWidth -= 1;
      newHeight -= 1;
    }
    this.updateItemSize(store, socketItem, newWidth, newHeight);
  }

  /** @private */
  onActionFlatten() {
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const oldWidth = socketItem.width;
    const oldHeight = socketItem.height;
    let newWidth = oldWidth + 1;
    let newHeight = Math.ceil(oldHeight / 2);
    if (newWidth === newHeight && newWidth !== 1) {
      newWidth -= 1;
      newHeight -= 1;
    }
    this.updateItemSize(store, socketItem, newWidth, newHeight);
  }

  /** @private */
  onActionRotate() {
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const oldWidth = socketItem.width;
    const oldHeight = socketItem.height;
    let newWidth = oldHeight;
    let newHeight = oldWidth;
    this.updateItemSize(store, socketItem, newWidth, newHeight);
  }

  /** @private */
  onItemWidth() {
    const width = Math.min(Math.max(Number(this.itemWidth.value) || 1, 1), MAX_ITEM_WIDTH);
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    this.updateItemSize(store, socketItem, width, socketItem.height);
  }

  /** @private */
  onItemHeight() {
    const height = Math.min(Math.max(Number(this.itemHeight.value) || 1, 1), MAX_ITEM_HEIGHT);
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    this.updateItemSize(store, socketItem, socketItem.width, height);
  }

  /** @private */
  onActionSave() {
    this.saveInputs();
    this.dialog.toggleAttribute('open', false);
  }

  /** @private */
  onDialogClose(e) {
    if (e.detail.from !== 'cancel') {
      this.saveInputs();
    }
  }

  /** @private */
  onClickSelectAll(e) {
    e.target.select();
  }

  /** @private */
  onItemBackground() {
    const background = this.itemBackground.value;
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    if (background === '#000000') {
      socketItem.background = '';
    } else {
      socketItem.background = background;
    }
    dispatchItemChange(store, socketItem.itemId);
  }

  /** @private */
  onItemImage() {
    const imgSrc = this.itemImage.value;
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const defaultImgSrc = getDefaultImageSourceByDimensions(socketItem.width, socketItem.height, socketItem.stackSize);
    socketItem.imgSrc = imgSrc || defaultImgSrc;
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
    const desc = this.itemDesc.value;
    const store = getInventoryStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    socketItem.description = desc;
    dispatchItemChange(store, socketItem.itemId);
  }
}
ItemEditorElement.define();

function tryTakeItemFromInventory(store, containerElement, itemId) {
  const containerInvId = containerElement.invId;
  if (containerElement.hasAttribute('nooutput')) {
    return null;
  }
  const inv = getInventoryInStore(store, containerInvId);
  const item = getItemByItemId(inv, itemId);
  if (containerElement.hasAttribute('copyoutput')) {
    return copyItem(item);
  }
  removeItemFromInventory(store, containerInvId, itemId);
  return item;
}

function getDefaultImageSourceByDimensions(width, height, stackSize) {
  if (width < height) {
    return 'res/images/blade.png';
  } else if (width > height) {
    return 'res/images/scroll.png';
  } else {
    return 'res/images/potion.png';
  }
}
