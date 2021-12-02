import Template from './ItemEditorElement.template.html.js';
import Style from './ItemEditorElement.module.css.js';

import { getInventoryStore, isInventoryInStore } from '../InventoryStore.js';
import { addItemToInventory, clearItemsInInventory, getItemAtSlotIndex, isInventoryEmpty } from '../InventoryTransfer.js';
import { getCursor } from './InventoryCursorElement.js';
import { ItemBuilder } from '../../satchel/item/Item.js';
import { dropOnGround } from '../GroundHelper.js';
import { uuid } from '../../util/uuid.js';
import { dispatchItemChange } from '../../satchel/item/ItemEvents.js';
import { addInventoryChangeListener, dispatchInventoryChange, removeInventoryChangeListener } from '../../satchel/inv/InvEvents.js';

/** @typedef {import('./InventoryGridElement.js').InventoryGridElement} InventoryGridElement */

const SATCHEL_IMAGE_PREFIX = 'satchel:';
const VALID_SATCHEL_IMAGES = {
  'satchel:blade': 'res/images/blade.png',
  'satchel:potion': 'res/images/potion.png',
  'satchel:scroll': 'res/images/scroll.png',
};

export class ItemEditorElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = Template;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = Style;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('item-editor', this);
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

    /** @type {InventoryGridElement} */
    this.socketInventory = this.shadowRoot.querySelector('#socketInventory');
    
    // Modifiable properties

    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemSize1 = this.shadowRoot.querySelector('#itemSize1');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemSize2 = this.shadowRoot.querySelector('#itemSize2');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemSize3 = this.shadowRoot.querySelector('#itemSize3');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemStackable = this.shadowRoot.querySelector('#itemStackable');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemFlat = this.shadowRoot.querySelector('#itemFlat');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemLong = this.shadowRoot.querySelector('#itemLong');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemHeavy = this.shadowRoot.querySelector('#itemHeavy');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemImage = this.shadowRoot.querySelector('#itemImage');

    // Hidden properties

    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemItemId = this.shadowRoot.querySelector('#itemItemId');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemInvId = this.shadowRoot.querySelector('#itemInvId');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemWidth = this.shadowRoot.querySelector('#itemWidth');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemHeight = this.shadowRoot.querySelector('#itemHeight');

    // Labels

    /** @private */
    this.labelSize1 = this.shadowRoot.querySelector('label[for="itemSize1"]');
    /** @private */
    this.labelSize2 = this.shadowRoot.querySelector('label[for="itemSize2"]');
    /** @private */
    this.labelSize3 = this.shadowRoot.querySelector('label[for="itemSize3"]');
    /** @private */
    this.labelStackable = this.shadowRoot.querySelector('label[for="itemStackable"]');
    /** @private */
    this.labelFlat = this.shadowRoot.querySelector('label[for="itemFlat"]');
    /** @private */
    this.labelLong = this.shadowRoot.querySelector('label[for="itemLong"]');
    /** @private */
    this.labelHeavy = this.shadowRoot.querySelector('label[for="itemHeavy"]');

    // Outputs

    /** @private */
    this.outputSizeWidth = this.shadowRoot.querySelector('#outputSizeWidth');
    /** @private */
    this.outputSizeHeight = this.shadowRoot.querySelector('#outputSizeHeight');

    // Actions

    /** @private */
    this.buttonNew = this.shadowRoot.querySelector('#newItem');
    /** @private */
    this.buttonDelete = this.shadowRoot.querySelector('#deleteItem');

    // Groups

    /** @private */
    this.container = this.shadowRoot.querySelector('.container');
    /** @private */
    this.fieldsetSize = this.shadowRoot.querySelector('#fieldsetSize');
    /** @private */
    this.fieldsetShape = this.shadowRoot.querySelector('#fieldsetShape');
    /** @private */
    this.fieldsetStyle = this.shadowRoot.querySelector('#fieldsetStyle');
    /** @private */
    this.outputSize = this.shadowRoot.querySelector('#outputSize');

    // Handlers

    /** @private */
    this.onSizeChange = this.onSizeChange.bind(this);
    /** @private */
    this.onStackableChange = this.onStackableChange.bind(this);
    /** @private */
    this.onImageChange = this.onImageChange.bind(this);
    /** @private */
    this.onButtonNew = this.onButtonNew.bind(this);
    /** @private */
    this.onButtonDelete = this.onButtonDelete.bind(this);
    /** @private */
    this.onItemDrop = this.onItemDrop.bind(this);
    /** @private */
    this.onLabelKeyUp = this.onLabelKeyUp.bind(this);
    /** @private */
    this.onSocketInventoryChange = this.onSocketInventoryChange.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.itemSize1.addEventListener('click', this.onSizeChange);
    this.itemSize2.addEventListener('click', this.onSizeChange);
    this.itemSize3.addEventListener('click', this.onSizeChange);
    this.itemStackable.addEventListener('change', this.onStackableChange);
    this.itemFlat.addEventListener('change', this.onSizeChange);
    this.itemLong.addEventListener('change', this.onSizeChange);
    this.itemHeavy.addEventListener('change', this.onSizeChange);
    this.itemImage.addEventListener('change', this.onImageChange);

    this.labelSize1.addEventListener('keyup', this.onLabelKeyUp);
    this.labelSize2.addEventListener('keyup', this.onLabelKeyUp);
    this.labelSize3.addEventListener('keyup', this.onLabelKeyUp);
    this.labelStackable.addEventListener('keyup', this.onLabelKeyUp);
    this.labelFlat.addEventListener('keyup', this.onLabelKeyUp);
    this.labelLong.addEventListener('keyup', this.onLabelKeyUp);
    this.labelHeavy.addEventListener('keyup', this.onLabelKeyUp);

    this.buttonNew.addEventListener('click', this.onButtonNew);
    this.buttonDelete.addEventListener('click', this.onButtonDelete);
    this.container.addEventListener('mouseup', this.onItemDrop);

    addInventoryChangeListener(this.socketInventory.invId, this.onSocketInventoryChange);
  }

  /** @protected */
  disconnectedCallback() {
    this.itemSize1.removeEventListener('click', this.onSizeChange);
    this.itemSize2.removeEventListener('click', this.onSizeChange);
    this.itemSize3.removeEventListener('click', this.onSizeChange);
    this.itemStackable.removeEventListener('change', this.onStackableChange);
    this.itemFlat.removeEventListener('change', this.onSizeChange);
    this.itemLong.removeEventListener('change', this.onSizeChange);
    this.itemHeavy.removeEventListener('change', this.onSizeChange);
    this.itemImage.removeEventListener('change', this.onImageChange);

    this.labelSize1.removeEventListener('keyup', this.onLabelKeyUp);
    this.labelSize2.removeEventListener('keyup', this.onLabelKeyUp);
    this.labelSize3.removeEventListener('keyup', this.onLabelKeyUp);
    this.labelStackable.removeEventListener('keyup', this.onLabelKeyUp);
    this.labelFlat.removeEventListener('keyup', this.onLabelKeyUp);
    this.labelLong.removeEventListener('keyup', this.onLabelKeyUp);
    this.labelHeavy.removeEventListener('keyup', this.onLabelKeyUp);

    this.buttonNew.removeEventListener('click', this.onButtonNew);
    this.buttonDelete.removeEventListener('click', this.onButtonDelete);
    this.container.removeEventListener('mouseup', this.onItemDrop);

    removeInventoryChangeListener(this.socketInventory.invId, this.onSocketInventoryChange);
  }

  newEditor() {
    const itemBuilder = new ItemBuilder();
    const item = this.getSocketedItem();
    let store = getInventoryStore();
    if (item) {
      let newItem = itemBuilder.fromItem(item).itemId(uuid()).build();
      dropOnGround(newItem);
    } else {
      let newItem = itemBuilder.fromDefault().width(2).height(2).build();
      addItemToInventory(store, this.socketInventory.invId, newItem, 0, 0);
    }
  }

  setupEditor(invId, itemId, item) {
    const width = item.width;
    const height = item.height;
    const stackable = item.stackSize >= 0;

    // Update hidden properties
    this.itemInvId.value = invId;
    this.itemItemId.value = itemId;
    this.itemWidth.value = width;
    this.itemHeight.value = height;

    const defaultImgSrc = getDefaultImageSourceByDimensions(width, height, stackable);
    if (defaultImgSrc !== item.imgSrc) {
      this.itemImage.value = item.imgSrc;
    } else {
      this.itemImage.value = '';
    }

    // Update modifiable properties
    let sizeIndex = item.metadata.sizeIndex;
    if (!sizeIndex) {
      if (width === height) {
        switch(width) {
          case 1:
            sizeIndex = 1;
            break;
          case 2:
            sizeIndex = 2;
            break;
          case 4:
            sizeIndex = 3;
            break;
          default:
            sizeIndex = 0;
        }
      } else {
        sizeIndex = 0;
      }
    }
    this.itemSize1.checked = sizeIndex === 1;
    this.itemSize2.checked = sizeIndex === 2;
    this.itemSize3.checked = sizeIndex === 3;
    this.itemFlat.checked = item.metadata.flat || false;
    this.itemLong.checked = item.metadata.long || false;
    this.itemHeavy.checked = item.metadata.heavy || false;
    this.itemStackable.checked = stackable;

    // Update outputs
    this.outputSizeWidth.textContent = `${width}`;
    this.outputSizeHeight.textContent = `${height}`;

    // Show knobs
    this.fieldsetSize.toggleAttribute('disabled', false);
    this.fieldsetShape.toggleAttribute('disabled', false);
    this.fieldsetStyle.toggleAttribute('disabled', false);
    this.outputSize.toggleAttribute('disabled', false);
  }

  clearEditor() {
    // Clear these just in case to prevent illegal access
    this.itemInvId.value = '';
    this.itemItemId.value = '';
    const store = getInventoryStore();
    const invId = this.socketInventory.invId;
    if (!isInventoryEmpty(store, invId)) {
      clearItemsInInventory(store, invId);
    }
    // Hide knobs
    this.fieldsetSize.toggleAttribute('disabled', true);
    this.fieldsetShape.toggleAttribute('disabled', true);
    this.fieldsetStyle.toggleAttribute('disabled', true);
    this.outputSize.toggleAttribute('disabled', true);
  }

  isEditing() {
    const store = getInventoryStore();
    const invId = this.socketInventory.invId;
    if (!isInventoryInStore(store, invId)) {
      return false;
    }
    return !isInventoryEmpty(store, invId);
  }

  getSocketedItem() {
    const store = getInventoryStore();
    const invId = this.socketInventory.invId;
    if (!isInventoryInStore(store, invId)) {
      return null;
    }
    return getItemAtSlotIndex(store, invId, 0);
  }

  /** @private */
  onSocketInventoryChange() {
    let item = this.getSocketedItem();
    if (item) {
      this.setupEditor(this.socketInventory.invId, item.itemId, item);
    } else {
      this.clearEditor();
    }
  }

  /** @private */
  onButtonNew(e) {
    e.stopPropagation();
    e.preventDefault();
    this.newEditor();
    return false;
  }

  /** @private */
  onButtonDelete(e) {
    e.stopPropagation();
    e.preventDefault();
    let item = this.getSocketedItem();
    if (item) {
      this.clearEditor();
    }
    return false;
  }

  /** @private */
  onLabelKeyUp(e) {
    if (e.code === 'Enter') {
      e.target.click();
    }
  }

  /** @private */
  onSizeChange() {
    const sizeIndex = this.itemSize1.checked ? 1 : this.itemSize2.checked ? 2 : this.itemSize3.checked ? 3 : 0;
    const flat = this.itemFlat.checked;
    const long = this.itemLong.checked;
    const heavy = this.itemHeavy.checked;
    const stackable = this.itemStackable.checked;
    const [width, height] = getComputedSize(sizeIndex, flat, long, heavy);
    this.outputSizeWidth.textContent = `${width}`;
    this.outputSizeHeight.textContent = `${height}`;
    this.itemWidth.value = `${width}`;
    this.itemHeight.value = `${height}`;
    this.itemImage.placeholder = getDefaultImageSourceByDimensions(width, height, stackable);
    const socketedItem = this.getSocketedItem();
    if (socketedItem) {
      socketedItem.width = width;
      socketedItem.height = height;
      socketedItem.metadata.sizeIndex = sizeIndex;
      socketedItem.metadata.flat = flat;
      socketedItem.metadata.long = long;
      socketedItem.metadata.heavy = heavy;
      socketedItem.imgSrc = this.itemImage.value || this.itemImage.placeholder;
      const store = getInventoryStore();
      dispatchItemChange(store, socketedItem.itemId);
      dispatchInventoryChange(store, this.socketInventory.invId);
    }
  }

  /** @private */
  onStackableChange() {
    let item = this.getSocketedItem();
    if (item) {
      let checked = this.itemStackable.checked;
      let stackSize;
      if (checked) {
        stackSize = 1;
      } else {
        stackSize = -1;
      }
      item.stackSize = stackSize;
      dispatchItemChange(getInventoryStore(), item.itemId);
    }
  }

  /** @private */
  onImageChange() {
    let item = this.getSocketedItem();
    if (item) {
      let width = item.width;
      let height = item.height;
      let imgSrc = this.itemImage.value;
      if (imgSrc) {
        if (imgSrc.length < 64) {
          let key = imgSrc.toLowerCase().trim();
          if (key in VALID_SATCHEL_IMAGES) {
            imgSrc = VALID_SATCHEL_IMAGES[key];
          } else if (key.startsWith(SATCHEL_IMAGE_PREFIX)) {
            imgSrc = undefined;
            let message = `Invalid satchel image file '${key}'. Can only be one of:\n - ${Object.keys(VALID_SATCHEL_IMAGES).join('\n - ')}`;
            window.alert(message);
            // TODO: This is nasty. We should handle errors better.
            throw new Error(message);
          }
        } else {
          // This is probably a data blob... just let it be.
        }
      }
      if (!imgSrc) {
        imgSrc = getDefaultImageSourceByDimensions(width, height, this.itemStackable.checked);
      }
      item.imgSrc = imgSrc;
      dispatchItemChange(getInventoryStore(), item.itemId);
    }
  }

  /** @private */
  onItemDrop(e) {
    const containerElement = this.socketInventory;
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

function getComputedSize(sizeIndex, flat, long, heavy) {
  let width;
  let height;
  sizeIndex = Math.max(1, Math.trunc(sizeIndex));
  if (heavy) {
    sizeIndex += 1;
  }
  if (sizeIndex <= 1) {
    width = 1;
    height = 1;
  } else {
    let dim = (sizeIndex - 1) * 2;
    width = dim;
    height = dim;
  }
  if (flat && !long) {
    width += 1;
    height = Math.ceil(height / 2);
  }
  if (long && !flat) {
    width = Math.ceil(width / 2);
    height += 1;
  }
  return [width, height];
}

function getDefaultImageSourceByDimensions(width, height, stackable) {
  if (width < height) {
    return 'res/images/blade.png';
  } else if (width > height) {
    return 'res/images/scroll.png';
  } else {
    return 'res/images/potion.png';
  }
}
