import { getCursor } from '../../inventory/element/InventoryCursorElement.js';
import { InventoryGridElement } from '../../inventory/element/InventoryGridElement.js';
import { dropOnGround } from '../../inventory/GroundHelper.js';
import { getInventoryStore } from '../../inventory/InventoryStore.js';
import { addItemToInventory, clearItemsInInventory, getItemAtSlotIndex, isInventoryEmpty } from '../../inventory/InventoryTransfer.js';
import { addInventoryChangeListener, dispatchInventoryChange, removeInventoryChangeListener } from '../inv/InvEvents.js';
import { dispatchItemChange } from './ItemEvents.js';

/** @typedef {import('./Item.js').Item} Item */

const MAX_ITEM_WIDTH = 8;
const MAX_ITEM_HEIGHT = 8;

const INNER_HTML = /* html */`
<div class="rootContainer">
  <fieldset class="portraitContainer">
    <legend>Foundry</legend>
    <div class="foundrySocketContainer">
      <div class="foundryContainer">
        <icon-button id="actionEnlarge" icon="res/more.svg"></icon-button>
        <icon-button id="actionShrink" icon="res/less.svg"></icon-button>
        <icon-button id="actionFlatten" icon="res/flatten.svg"></icon-button>
        <icon-button id="actionRotate" icon="res/rotate.svg"></icon-button>
      </div>
      <div class="socketXContainer">
        <div class="socketSpacing"></div>
        <div class="socketYContainer">
          <div class="socketSpacing"></div>
          <div class="socketContainer">
            <inventory-grid init="socket" id="socketInventory" noedit></inventory-grid>
          </div>
          <div class="socketSpacing">
            <input type="number" min="1" max="${MAX_ITEM_WIDTH}" id="itemWidth">
          </div>
        </div>
        <div class="socketSpacing">
          <input type="number" min="1" max="${MAX_ITEM_HEIGHT}" id="itemHeight">
        </div>
      </div>
      <div class="foundrySocketMargin"></div>
    </div>
    <p class="styleContainer">
      <label for="itemImage">
        <img src="res/image.svg" alt="image" title="Change Image">
      </label>
      <input type="url" id="itemImage">
      <input type="color" id="itemBackground">
    </p>
  </fieldset>
  <fieldset class="detailContainer">
    <legend>Detail</legend>
    <p class="titleContainer">
      <input type="text" id="itemTitle" placeholder="Item">
      <span id="itemStackSizeContainer">
        <span>⨯</span><input type="number" id="itemStackSize" placeholder="--">
      </span>
    </p>
    <p class="textContainer">
      <textarea id="itemDesc" placeholder="Notes..."></textarea>
      <slot name="actions" class="actionContainer"></slot>
    </p>
  </fieldset>
</div>
`;
const INNER_STYLE = /* css */`
:host {
  text-align: center;
  height: 100%;
}

textarea {
  flex: 1;
  outline: none;
  border: none;
  background: none;
  min-height: 10em;
  color: var(--foreground-color);
}

p {
  padding: 0;
  margin: 0;
}

img {
  height: 100%;
}

.rootContainer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.portraitContainer {
  flex: 3;
  position: relative;
  display: flex;
  flex-direction: column;
}
.detailContainer {
  flex: 2;
  position: relative;
  display: flex;
  flex-direction: column;
}
.detailContainer:disabled {
  display: none;
}

.titleContainer {
  display: flex;
}
.textContainer {
  flex: 1;
  display: flex;
  flex-direction: row;
}
.styleContainer {
  display: flex;
  vertical-align: middle;
  margin-top: 0.5em;
}

.foundrySocketContainer {
  flex: 1;
  display: flex;
  flex-direction: row;
}
.foundrySocketMargin {
  width: 1em;
}

.foundryContainer {
  display: flex;
  flex-direction: column;
}
.foundryContainer icon-button {
  width: 2em;
  height: 2em;
  margin: 0.2em 0;
}
.foundryContainer icon-button[disabled] {
  visibility: hidden;
}

.socketContainer {
  max-width: 10em;
  max-height: 10em;
  overflow: auto;
}
.socketSpacing {
  flex: 1;
}
.socketXContainer {
  flex: 1;
  display: flex;
  flex-direction: row;
  text-align: left;
  align-items: center;
}
.socketYContainer {
  display: flex;
  flex-direction: column;
  text-align: center;
  align-items: center;
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
  z-index: 1;
  transform: translateX(30%);
}
#itemHeight {
  z-index: 1;
  transform: translateY(-80%);
}

#itemImage {
  flex: 1;
  background: none;
  border: none;
  color: #ffffff;
  margin-left: 0.5em;
}
.rootContainer[disabled] label[for="itemImage"] {
  opacity: 0.6;
  visibility: hidden;
}

#itemBackground:disabled {
  visibility: hidden;
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
  flex-direction: column;
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
    customElements.define('item-editor', this);
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
    this.rootContainer = shadowRoot.querySelector('.rootContainer');
    /** @private */
    this.portraitContainer = shadowRoot.querySelector('.portraitContainer');
    /** @private */
    this.detailContainer = shadowRoot.querySelector('.detailContainer');

    /**
     * @private
     * @type {InventoryGridElement}
     */
    this.socket = shadowRoot.querySelector('inventory-grid');
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

    /** @private */
    this.onSocketInventoryChange = this.onSocketInventoryChange.bind(this);
    /** @private */
    this.onItemDrop = this.onItemDrop.bind(this);
  }

  /** @protected */
  connectedCallback() {
    const editable = this.hasAttribute('editable');
    this.socket.toggleAttribute('noinput', !editable);
    this.socket.toggleAttribute('nooutput', !editable);

    this.itemTitle.addEventListener('input', this.onItemTitle);
    this.itemDesc.addEventListener('input', this.onItemDesc);
    this.itemStackSize.addEventListener('change', this.onItemStackSize);
    this.itemImage.addEventListener('change', this.onItemImage);
    this.itemImage.addEventListener('click', this.onClickSelectAll);
    this.itemBackground.addEventListener('input', this.onItemBackground);
    this.actionEnlarge.addEventListener('click', this.onActionEnlarge);
    this.actionShrink.addEventListener('click', this.onActionShrink);
    this.actionFlatten.addEventListener('click', this.onActionFlatten);
    this.actionRotate.addEventListener('click', this.onActionRotate);
    this.itemWidth.addEventListener('change', this.onItemWidth);
    this.itemHeight.addEventListener('change', this.onItemHeight);

    this.portraitContainer.addEventListener('mouseup', this.onItemDrop);
    addInventoryChangeListener(this.socket.invId, this.onSocketInventoryChange);

    this.disableInputs(true);
  }

  /** @protected */
  disconnectedCallback() {
    this.itemTitle.removeEventListener('change', this.onItemTitle);
    this.itemDesc.removeEventListener('input', this.onItemDesc);
    this.itemStackSize.removeEventListener('change', this.onItemStackSize);
    this.itemImage.removeEventListener('change', this.onItemImage);
    this.itemImage.removeEventListener('click', this.onClickSelectAll);
    this.itemBackground.removeEventListener('input', this.onItemBackground);
    this.actionEnlarge.removeEventListener('click', this.onActionEnlarge);
    this.actionShrink.removeEventListener('click', this.onActionShrink);
    this.actionFlatten.removeEventListener('click', this.onActionFlatten);
    this.actionRotate.removeEventListener('click', this.onActionRotate);
    this.itemWidth.removeEventListener('change', this.onItemWidth);
    this.itemHeight.removeEventListener('change', this.onItemHeight);

    this.portraitContainer.removeEventListener('mouseup', this.onItemDrop);
    removeInventoryChangeListener(this.socket.invId, this.onSocketInventoryChange);
  }

  clearSocketedItem() {
    const store = getInventoryStore();
    const socketInvId = this.socket.invId;
    clearItemsInInventory(store, socketInvId);
    this.setupSocketInventory(false);
  }

  putSocketedItem(item, resizable = false) {
    const store = getInventoryStore();
    const socketInvId = this.socket.invId;
    if (item && !isInventoryEmpty(store, socketInvId)) {
      const item = getItemAtSlotIndex(store, socketInvId, 0);
      clearItemsInInventory(store, socketInvId);
      dropOnGround(item);
    }
    if (item) {
      removeInventoryChangeListener(socketInvId, this.onSocketInventoryChange);
      addItemToInventory(store, socketInvId, item, 0, 0);
      addInventoryChangeListener(socketInvId, this.onSocketInventoryChange);
    }
    this.setupSocketInventory(resizable);
  }

  getSocketedItem() {
    const store = getInventoryStore();
    return getItemAtSlotIndex(store, this.socket.invId, 0);
  }

  /** @private */
  onSocketInventoryChange() {
    if (this.hasAttribute('editable')) {
      this.setupSocketInventory(true);
    }
  }

  /** @private */
  setupSocketInventory(resizable) {
    const item = this.getSocketedItem();
    if (!item) {
      this.disableInputs(true);
      this.clearInputs();
      return;
    }
    this.disableInputs(false);
    this.resetInputs(item);
    this.resetSizeInputs(resizable);
    const content = this.itemDesc.value;
    if (!this.contains(document.activeElement)) {
      this.itemDesc.focus({ preventScroll: true });
      this.itemDesc.setSelectionRange(content.length, content.length);
      this.itemDesc.scrollTo({ top: 0 });
    }
  }

  /** @private */
  disableInputs(force) {
    this.rootContainer.toggleAttribute('disabled', force);
    this.itemImage.toggleAttribute('disabled', force);
    this.itemBackground.toggleAttribute('disabled', force);
    this.itemWidth.toggleAttribute('disabled', force);
    this.itemHeight.toggleAttribute('disabled', force);
    this.actionEnlarge.toggleAttribute('disabled', force);
    this.actionShrink.toggleAttribute('disabled', force);
    this.actionFlatten.toggleAttribute('disabled', force);
    this.actionRotate.toggleAttribute('disabled', force);
    this.detailContainer.toggleAttribute('disabled', force);
  }

  /** @private */
  clearInputs() {
    this.itemTitle.value = '';
    this.itemDesc.value = '';
    this.itemWidth.value = '';
    this.itemHeight.value = '';
    this.itemBackground.value = '#000000';
    this.itemStackSize.value = '';
    this.itemImage.value = '';
    this.itemImage.placeholder = '';
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
    this.itemWidth.toggleAttribute('disabled', !resizable);
    this.itemHeight.toggleAttribute('disabled', !resizable);
    this.actionEnlarge.toggleAttribute('disabled', !resizable);
    this.actionShrink.toggleAttribute('disabled', !resizable);
    this.actionFlatten.toggleAttribute('disabled', !resizable);
    this.actionRotate.toggleAttribute('disabled', !resizable);
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

  /** @private */
  onItemDrop(e) {
    if (!this.hasAttribute('editable')) {
      return;
    }
    const containerElement = this.socket;
    let cursor = getCursor();
    let result = cursor.putDown(containerElement.invId, 0, 0, true);
    if (result) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
}
ItemEditorElement.define();

function getDefaultImageSourceByDimensions(width, height, stackSize) {
  if (width < height) {
    return 'res/images/blade.png';
  } else if (width > height) {
    return 'res/images/scroll.png';
  } else {
    return 'res/images/potion.png';
  }
}
