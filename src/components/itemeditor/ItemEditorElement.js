import { getCursor } from '../cursor/index.js';
import { InventoryGridElement } from '../invgrid/InventoryGridElement.js';
import { getSatchelStore } from '../../store/SatchelStore.js';
import { addItemToInventory, clearItemsInInventory, getItemAtSlotIndex, isInventoryEmpty } from '../../satchel/inv/InventoryTransfer.js';
import { getFoundryAlbumId, hasFoundryAlbum, saveItemToFoundryAlbum, shouldSaveItemToFoundryAlbum } from '../../satchel/FoundryAlbum.js';
import { addInventoryChangeListener, dispatchInventoryChange, removeInventoryChangeListener } from '../../events/InvEvents.js';
import { ItemBuilder } from '../../satchel/item/Item.js';
import { dispatchItemChange } from '../../events/ItemEvents.js';
import { dropFallingItem } from '../cursor/FallingItemElement.js';
import { playSound } from '../../sounds.js';
import { updateList } from '../ElementListHelper.js';
import { getItemsInAlbum } from '../../satchel/album/AlbumItems.js';
import { addAlbumChangeListener, removeAlbumChangeListener } from '../../events/AlbumEvents.js';
import '../lib/ContextMenuElement.js';

/**
 * @typedef {import('../lib/ContextMenuElement.js').ContextMenuElement} ContextMenuElement
 * @typedef {import('../../satchel/item/Item.js').Item} Item
 */

const MAX_ITEM_WIDTH = 8;
const MAX_ITEM_HEIGHT = 8;

const INNER_HTML = /* html */`
<div class="rootContainer">
  <fieldset class="portraitContainer">
    <div class="foundrySocketContainer">
      <div class="foundryContainer">
        <icon-button id="actionEnlarge" icon="res/more.svg" alt="more" title="Enlarge"></icon-button>
        <icon-button id="actionShrink" icon="res/less.svg" alt="less" title="Shrink"></icon-button>
        <icon-button id="actionFlatten" icon="res/flatten.svg" alt="flat" title="Flatten"></icon-button>
        <icon-button id="actionFlattenRotated" icon="res/flatten.svg" alt="long" title="Elongate" style="transform: rotate(90deg);"></icon-button>
        <icon-button id="actionFit" icon="res/aspectratio.svg" alt="fit" title="Fit"></icon-button>
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
        <icon-button id="actionImage" icon="res/image.svg" alt="image" title="Image"></icon-button>
      </label>
      <input type="url" id="itemImage">
      <input type="color" id="itemBackground">
    </p>
  </fieldset>
  <fieldset class="detailContainer">
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

<context-menu id="imageContextMenu"></context-menu>
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
  border: none;
}
.detailContainer {
  flex: 2;
  position: relative;
  display: flex;
  flex-direction: column;
  margin-top: 0.5em;
  border: none;
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
.styleContainer icon-button {
  width: 2em;
  height: 2em;
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

#imageContextMenu {
  text-align: left;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(3em, 1fr));
}
#imageContextMenu img {
  width: 100%;
  height: 100%;
  max-width: 3em;
  max-height: 3em;
  margin: 0 0.1em;
  object-fit: contain;
}
#imageContextMenu img:hover {
  outline: 0.1em solid #666666;
  background-color: #666666;
  cursor: pointer;
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
    /** @private */
    this.imageContextMenu = /** @type {ContextMenuElement} */ (shadowRoot.querySelector('#imageContextMenu'));

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
    this.actionFlattenRotated = shadowRoot.querySelector('#actionFlattenRotated');
    /** @private */
    this.actionFit = shadowRoot.querySelector('#actionFit');
    /** @private */
    this.actionImage = shadowRoot.querySelector('#actionImage');

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
    this.onActionFlattenRotated = this.onActionFlattenRotated.bind(this);
    /** @private */
    this.onActionFit = this.onActionFit.bind(this);
    /** @private */
    this.onActionImage = this.onActionImage.bind(this);
    /** @private */
    this.onFoundryAlbumChange = this.onFoundryAlbumChange.bind(this);
    /** @private */
    this.onFoundryAlbumImageClick = this.onFoundryAlbumImageClick.bind(this);
    /** @private */
    this.onItemWidth = this.onItemWidth.bind(this);
    /** @private */
    this.onItemHeight = this.onItemHeight.bind(this);
    /** @private */
    this.onImageContextMenuClick = this.onImageContextMenuClick.bind(this);

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
    this.actionFlattenRotated.addEventListener('click', this.onActionFlattenRotated);
    this.actionFit.addEventListener('click', this.onActionFit);
    this.actionImage.addEventListener('click', this.onActionImage);
    this.itemWidth.addEventListener('change', this.onItemWidth);
    this.itemHeight.addEventListener('change', this.onItemHeight);
    this.portraitContainer.addEventListener('mouseup', this.onItemDrop);
    this.imageContextMenu.addEventListener('click', this.onImageContextMenuClick);
    this.itemImage.addEventListener('contextmenu', this.onActionImage);

    const store = getSatchelStore();
    addInventoryChangeListener(store, this.socket.invId, this.onSocketInventoryChange);
    addAlbumChangeListener(store, getFoundryAlbumId(store), this.onFoundryAlbumChange);

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
    this.actionFlattenRotated.removeEventListener('click', this.onActionFlattenRotated);
    this.actionFit.removeEventListener('click', this.onActionFit);
    this.actionImage.removeEventListener('click', this.onActionImage);
    this.itemWidth.removeEventListener('change', this.onItemWidth);
    this.itemHeight.removeEventListener('change', this.onItemHeight);
    this.portraitContainer.removeEventListener('mouseup', this.onItemDrop);
    this.imageContextMenu.removeEventListener('click', this.onImageContextMenuClick);
    this.itemImage.removeEventListener('contextmenu', this.onActionImage);

    const store = getSatchelStore();
    removeInventoryChangeListener(store, this.socket.invId, this.onSocketInventoryChange);
    removeAlbumChangeListener(store, getFoundryAlbumId(store), this.onFoundryAlbumChange);
  }

  grabDefaultFocus() {
    this.itemDesc.focus();
  }

  clearSocketedItem() {
    const store = getSatchelStore();
    const socketInvId = this.socket.invId;
    clearItemsInInventory(store, socketInvId);
    this.setupSocketInventory(false);
  }

  putSocketedItem(item, resizable = false) {
    const store = getSatchelStore();
    const socketInvId = this.socket.invId;
    if (item && !isInventoryEmpty(store, socketInvId)) {
      const item = getItemAtSlotIndex(store, socketInvId, 0);
      clearItemsInInventory(store, socketInvId);
      const clientRect = this.getBoundingClientRect();
      dropFallingItem(item, clientRect.x + clientRect.width / 2, clientRect.y + clientRect.height / 2);
    }
    if (item) {
      removeInventoryChangeListener(store, socketInvId, this.onSocketInventoryChange);
      addItemToInventory(store, socketInvId, item, 0, 0);
      addInventoryChangeListener(store, socketInvId, this.onSocketInventoryChange);
    }
    this.setupSocketInventory(resizable);
  }

  getSocketedItem() {
    const store = getSatchelStore();
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
      // Only save items that have a custom image
      if (this.itemImage.value) {
        let currentItem = this.createItemFromInputs();
        if (shouldSaveItemToFoundryAlbum(currentItem)) {
          saveItemToFoundryAlbum(currentItem);
        }
      }
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
    this.actionFlattenRotated.toggleAttribute('disabled', force);
    this.actionFit.toggleAttribute('disabled', force);
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
    this.actionFlattenRotated.toggleAttribute('disabled', !resizable);
    this.actionFit.toggleAttribute('disabled', !resizable);
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
    playSound('sizeItem');
  }

  /** @private */
  onActionEnlarge() {
    const store = getSatchelStore();
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
    const store = getSatchelStore();
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
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const oldWidth = socketItem.width;
    const oldHeight = socketItem.height;
    let newWidth;
    let newHeight;
    if (oldHeight > oldWidth) {
      // Rotate it
      newWidth = oldHeight;
      newHeight = oldWidth;
    } else if (oldHeight === 1) {
      if (oldWidth === 1) {
        // Flat & Tiny
        newWidth = 2;
        newHeight = 1;
      } else {
        // No change
        return;
      }
    } else {
      // Flatten it
      newWidth = oldWidth + 1;
      newHeight = Math.ceil(oldHeight / 2);
      if (newWidth === newHeight && newWidth !== 1) {
        newWidth -= 1;
        newHeight -= 1;
      }
    }
    this.updateItemSize(store, socketItem, newWidth, newHeight);
  }

  /** @private */
  onActionFlattenRotated() {
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const oldWidth = socketItem.width;
    const oldHeight = socketItem.height;
    let newWidth;
    let newHeight;
    if (oldWidth > oldHeight) {
      // Rotate it
      newWidth = oldHeight;
      newHeight = oldWidth;
    } else if (oldWidth === 1) {
      if (oldHeight === 1) {
        // Flat & Tiny
        newWidth = 1;
        newHeight = 2;
      } else {
        // No change
        return;
      }
    } else {
      // Flatten it
      newWidth = Math.ceil(oldWidth / 2);
      newHeight = oldHeight + 1;
      if (newWidth === newHeight && newHeight !== 1) {
        newWidth -= 1;
        newHeight -= 1;
      }
    }
    this.updateItemSize(store, socketItem, newWidth, newHeight);
  }

  /** @private */
  onActionFit() {
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const oldWidth = socketItem.width;
    const oldHeight = socketItem.height;
    // NOTE: Finds the nearest square size that is even (min 1)
    let newSize = Math.max(1, Math.floor(Math.floor((oldWidth + oldHeight) / 2) / 2) * 2);
    this.updateItemSize(store, socketItem, newSize, newSize);
  }

  /** @private */
  onActionImage(e) {
    const contextMenu = this.imageContextMenu;
    contextMenu.x = e.clientX;
    contextMenu.y = e.clientY;
    contextMenu.toggleAttribute('open', true);
    this.onFoundryAlbumChange();
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  /** @private */
  onImageContextMenuClick() {
    const contextMenu = this.imageContextMenu;
    contextMenu.toggleAttribute('open', false);
  }

  /** @private */
  onFoundryAlbumImageClick(e) {
    const contextMenu = this.imageContextMenu;
    const src = e.target.getAttribute('data-imgsrc');
    this.itemImage.value = src;
    this.onItemImage();
    contextMenu.close();
  }

  /** @private */
  onFoundryAlbumChange() {
    const store = getSatchelStore();
    if (!hasFoundryAlbum(store)) {
      return;
    }
    const albumId = getFoundryAlbumId(store);
    const contextMenu = this.imageContextMenu;
    const items = getItemsInAlbum(store, albumId);
    const list = new Set([
      'res/images/potion.png',
      'res/images/blade.png',
      'res/images/scroll.png',
      ...items.map(item => item.imgSrc).filter(Boolean)
    ]);
    const create = (key) => {
      let element = document.createElement('img');
      element.setAttribute('data-imgsrc', key);
      element.src = key;
      element.alt = key;
      element.title = key;
      element.addEventListener('click', this.onFoundryAlbumImageClick);
      return element;
    };
    const destroy = (key, element) => {
      element.removeEventListener('click', this.onFoundryAlbumImageClick);
    };
    updateList(contextMenu, list, create, destroy);
  }

  /** @private */
  onClickSelectAll(e) {
    e.target.select();
  }

  /** @private */
  onItemWidth() {
    const width = this.parseItemWidth();
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    this.updateItemSize(store, socketItem, width, socketItem.height);
  }

  /** @private */
  onItemHeight() {
    const height = this.parseItemHeight();
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    this.updateItemSize(store, socketItem, socketItem.width, height);
  }

  /** @private */
  onItemBackground() {
    const background = this.parseItemBackground();
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    socketItem.background = background;
    dispatchItemChange(store, socketItem.itemId);
  }

  /** @private */
  onItemImage() {
    const imgSrc = this.parseItemImage();
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    const defaultImgSrc = getDefaultImageSourceByDimensions(socketItem.width, socketItem.height, socketItem.stackSize);
    socketItem.imgSrc = imgSrc || defaultImgSrc;
    dispatchItemChange(store, socketItem.itemId);
  }

  /** @private */
  onItemStackSize() {
    const stackSize = this.parseItemStackSize();
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    socketItem.stackSize = stackSize;
    dispatchItemChange(store, socketItem.itemId);
    if (stackSize < 0) {
      this.itemStackSize.value = '';
    }
  }

  /** @private */
  onItemTitle() {
    const title = this.parseItemTitle();
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    socketItem.displayName = title;
    dispatchItemChange(store, socketItem.itemId);
  }

  /** @private */
  onItemDesc() {
    const desc = this.parseItemDesc();
    const store = getSatchelStore();
    const socketItem = getItemAtSlotIndex(store, this.socket.invId, 0);
    socketItem.description = desc;
    dispatchItemChange(store, socketItem.itemId);
  }

  /** @private */
  onItemDrop(e) {
    if (!this.hasAttribute('editable')) {
      return;
    }
    let cursor = getCursor();
    let result = cursor.putDown(this.socket.invId, 0, 0, true);
    if (result) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  /** @private */
  parseItemWidth() {
    return Math.min(Math.max(Number(this.itemWidth.value) || 1, 1), MAX_ITEM_WIDTH);
  }
  
  /** @private */
  parseItemHeight() {
    return Math.min(Math.max(Number(this.itemHeight.value) || 1, 1), MAX_ITEM_HEIGHT);
  }

  /** @private */
  parseItemBackground() {
    const background = this.itemBackground.value;
    if (background === '#000000') {
      return '';
    }
    return background;
  }

  /** @private */
  parseItemImage() {
    return this.itemImage.value;
  }

  /** @private */
  parseItemStackSize() {
    let stackSize;
    try {
      stackSize = Number.parseInt(this.itemStackSize.value);
      if (!Number.isSafeInteger(stackSize) || stackSize < 0) {
        return -1;
      }
    } catch (e) {
      return -1;
    }
    return stackSize;
  }

  /** @private */
  parseItemTitle() {
    return this.itemTitle.value.trim();
  }

  /** @private */
  parseItemDesc() {
    return this.itemDesc.value;
  }

  /** @private */
  createItemFromInputs() {
    const width = this.parseItemWidth();
    const height = this.parseItemHeight();
    const stackSize = this.parseItemStackSize();
    const background = this.parseItemBackground();
    const image = this.parseItemImage() || getDefaultImageSourceByDimensions(width, height, stackSize);
    const title = this.parseItemTitle();
    const desc = this.parseItemDesc();
    return new ItemBuilder()
      .fromDefault()
      .width(width)
      .height(height)
      .stackSize(stackSize)
      .background(background)
      .imageSrc(image)
      .displayName(title)
      .description(desc)
      .build();
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
