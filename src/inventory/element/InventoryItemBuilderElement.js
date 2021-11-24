import { dispatchInventoryChange, dispatchItemChange, getInventoryStore, isInventoryInStore } from '../InventoryStore.js';
import { getItemAtSlotIndex } from '../InventoryTransfer.js';
import { ItemBuilder } from '../Item.js';
import { getCursor } from './InventoryCursorElement.js';

/** @typedef {import('./InventoryGridElement.js').InventoryGridElement} InventoryGridElement */

const SATCHEL_IMAGE_PREFIX = 'satchel:';
const VALID_SATCHEL_IMAGES = {
  'satchel:blade': 'res/images/blade.png',
  'satchel:potion': 'res/images/potion.png',
  'satchel:scroll': 'res/images/scroll.png',
};

const INNER_HTML = `
<form autocomplete="off">
  <fieldset>
    <fieldset id="fieldsetSocket">
      <legend>Item</legend>
      <!-- Content Elements -->
      <inventory-grid init="socket" id="socketInventory"></inventory-grid>
      <!-- UI Elements -->
      <fieldset id="fieldsetSize">
      <legend>Size</legend>
      <div class="labels">
        <span class="toggle">
          <input type="radio" name="sizeIndex" id="itemSize1" value=1 tabindex=-1>
          <label for="itemSize1" title="small" tabindex=0>
            <img src="res/spoke.svg">
          </label>
        </span>
        <span class="toggle">
          <input type="radio" name="sizeIndex" id="itemSize2" value=2 checked tabindex=-1>
          <label for="itemSize2" title="medium" tabindex=0>
            <img src="res/onehand.svg">
          </label>
        </span>
        <span class="toggle">
          <input type="radio" name="sizeIndex" id="itemSize3" value=3 tabindex=-1>
          <label for="itemSize3" title="large" tabindex=0>
            <img src="res/twohand.svg">
          </label>
        </span>
      </div>
      <input type="number" name="width" id="itemWidth" hidden value=2>
      <input type="number" name="height" id="itemHeight" hidden value=2>
    </fieldset>
    <output id="outputSize">
      <span id="outputSizeWidth">2</span>
      <span>⨯</span>
      <span id="outputSizeHeight">2</span>
    </output>
    <fieldset id="fieldsetShape">
      <legend>Shape</legend>
      <div class="labels">
        <span class="toggle">
          <input type="checkbox" name="stackable" id="itemStackable" tabindex=-1>
          <label for="itemStackable" tabindex=0>
            <img src="res/grain.svg" title="stackable">
          </label>
        </span>
        <span class="toggle">
          <input type="checkbox" name="long" id="itemLong" tabindex=-1>
          <label for="itemLong" tabindex=0>
            <img src="res/height.svg" title="long">
          </label>
        </span>
        <span class="toggle">
          <input type="checkbox" name="flat" id="itemFlat" tabindex=-1>
          <label for="itemFlat" tabindex=0>
            <img src="res/flatten.svg" title="flat">
          </label>
        </span>
        <span class="toggle">
          <input type="checkbox" name="heavy" id="itemHeavy" tabindex=-1>
          <label for="itemHeavy" tabindex=0>
            <img src="res/scale.svg" title="heavy">
          </label>
        </span>
      </div>
    </fieldset>
  </fieldset>
  <fieldset id="fieldsetStyle">
    <legend>Style</legend>
    <input type="url" name="imageSrc" id="itemImage">
    <img src="res/image.svg" title="image">
  </fieldset>
  <fieldset id="fieldsetDetail">
    <legend>Detail</legend>
    <div class="stackName">
      <input type="text" name="displayName" id="itemName" placeholder="Item">
      <span id="groupStackSize">
        <span class="prefix">⨯</span>
        <input type="number" name="stackSize" id="itemStackSize" value=1 min=0 max=99 disabled>
      </span>
    </div>
    <div class="stackDesc">
      <textarea name="description" id="itemDescription" placeholder="Description"></textarea>
    </div>
  </fieldset>
  <fieldset>
    <legend>Actions</legend>
    <input name="invId" id="itemInvId" hidden>
    <input name="itemId" id="itemItemId" hidden>
    <div>
      <input type="submit">
      <input type="reset" value="Cancel">
    </div>
    <div>
      <slot name="actions"></slot>
    </div>
  </fieldset>
</form>
`;
const INNER_STYLE = `
form {
  display: inline-block;
  position: relative;
}
form input {
  font-family: monospace;
}
input[type="submit"], input[type="reset"], button {
  font-family: unset;
}

#fieldsetSocket {
  position: relative;
}

#fieldsetSize {
  position: absolute;
  top: 0;
  left: 0;
  border: none;
  padding: 0;
}
#fieldsetSize > legend {
  display: none;
}
#outputSize {
  position: absolute;
  left: 0.5em;
  bottom: 0;
}

#fieldsetShape {
  position: absolute;
  top: 0;
  right: 0.25em;
  border: none;
  padding: 0;
}
#fieldsetShape > legend {
  display: none;
}

fieldset {
  display: block;
  text-align: center;
}
fieldset:disabled {
  opacity: 0.3;
}
fieldset:disabled > * {
  display: none;
}
fieldset:disabled > legend {
  display: unset;
}

.labels {
  display: flex;
  text-align: center;
}
.labels > * {
  flex: 1;
}

.toggle {
  margin-bottom: 0.2em;
}
.toggle > input {
  margin: 0;
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle > label {
  opacity: 0.3;
  border-bottom: 0.2em solid transparent;
}
.toggle > input:checked + label {
  opacity: 1;
  border-color: white;
}

.stackName {
  color: black;
  background-color: white;
}
.stackName input[type="text"] {
  background: none;
  border: none;
}
.stackName input[type="number"] {
  width: 2.5em;
  background: none;
  border: none;
}
.hidden {
  opacity: 0;
}

.stackDesc {
  display: flex;
  height: 8em;
}
.stackDesc > textarea {
  flex: 1;
  resize: none;
  border: none;
}
`;

export class InventoryItemBuilderElement extends HTMLElement {
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
    customElements.define('inventory-itembuilder', this);
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
    /**
     * @private
     * @type {InventoryGridElement}
     */
    this.socketInventory = this.shadowRoot.querySelector('#socketInventory');

    /**
     * @private
     * @type {HTMLFormElement}
     */
    this.form = this.shadowRoot.querySelector('form');
    /**
     * @private
     * @type {HTMLButtonElement}
     */
    this.formCancel = this.shadowRoot.querySelector('#formCancel');
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
    this.itemWidth = this.shadowRoot.querySelector('#itemWidth');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemHeight = this.shadowRoot.querySelector('#itemHeight');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemStackable = this.shadowRoot.querySelector('#itemStackable');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemStackSize = this.shadowRoot.querySelector('#itemStackSize');
    /**
     * @private
     * @type {HTMLInputElement}
     */
    this.itemName = this.shadowRoot.querySelector('#itemName');
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
    /**
     * @private
     * @type {HTMLTextAreaElement}
     */
    this.itemDescription = this.shadowRoot.querySelector('#itemDescription');
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

    /** @private */
    this.outputSizeWidth = this.shadowRoot.querySelector('#outputSizeWidth');
    /** @private */
    this.outputSizeHeight = this.shadowRoot.querySelector('#outputSizeHeight');

    /** @private */
    this.fieldsetSocket = this.shadowRoot.querySelector('#fieldsetSocket');
    /** @private */
    this.fieldsetSize = this.shadowRoot.querySelector('#fieldsetSize');
    /** @private */
    this.fieldsetShape = this.shadowRoot.querySelector('#fieldsetShape');
    /** @private */
    this.fieldsetStyle = this.shadowRoot.querySelector('#fieldsetStyle');
    /** @private */
    this.fieldsetDetail = this.shadowRoot.querySelector('#fieldsetDetail');

    /** @private */
    this.groupStackSize = this.shadowRoot.querySelector('#groupStackSize');

    /** @private */
    this.onSizeChange = this.onSizeChange.bind(this);
    /** @private */
    this.onStackableChange = this.onStackableChange.bind(this);
    /** @private */
    this.onItemDrop = this.onItemDrop.bind(this);
    /** @private */
    this.onLabelKeyUp = this.onLabelKeyUp.bind(this);

    /** @private */
    this.onSubmit = this.onSubmit.bind(this);
    /** @private */
    this.onReset = this.onReset.bind(this);
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

    this.labelSize1.addEventListener('keyup', this.onLabelKeyUp);
    this.labelSize2.addEventListener('keyup', this.onLabelKeyUp);
    this.labelSize3.addEventListener('keyup', this.onLabelKeyUp);
    this.labelStackable.addEventListener('keyup', this.onLabelKeyUp);
    this.labelFlat.addEventListener('keyup', this.onLabelKeyUp);
    this.labelLong.addEventListener('keyup', this.onLabelKeyUp);
    this.labelHeavy.addEventListener('keyup', this.onLabelKeyUp);

    this.fieldsetSocket.addEventListener('mouseup', this.onItemDrop);

    this.form.addEventListener('submit', this.onSubmit);
    this.form.addEventListener('reset', this.onReset);
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

    this.labelSize1.removeEventListener('keyup', this.onLabelKeyUp);
    this.labelSize2.removeEventListener('keyup', this.onLabelKeyUp);
    this.labelSize3.removeEventListener('keyup', this.onLabelKeyUp);
    this.labelStackable.removeEventListener('keyup', this.onLabelKeyUp);
    this.labelFlat.removeEventListener('keyup', this.onLabelKeyUp);
    this.labelLong.removeEventListener('keyup', this.onLabelKeyUp);
    this.labelHeavy.removeEventListener('keyup', this.onLabelKeyUp);

    this.fieldsetSocket.removeEventListener('mouseup', this.onItemDrop);

    this.form.removeEventListener('submit', this.onSubmit);
    this.form.removeEventListener('reset', this.onReset);
  }

  fromItem(invId, itemId, item) {
    this.reset();
    this.itemInvId.value = invId;
    this.itemItemId.value = itemId;
    this.itemName.value = item.displayName;
    this.itemWidth.value = `${item.width}`;
    this.itemHeight.value = `${item.height}`;
    this.itemImage.value = item.imgSrc;
    this.itemStackSize.value = `${item.stackSize}`;
    this.itemDescription.value = item.description;
    this.itemStackable.checked = item.stackSize >= 0;
    this.fieldsetSize.toggleAttribute('disabled', true);
    this.fieldsetShape.toggleAttribute('disabled', true);
    this.fieldsetStyle.toggleAttribute('disabled', true);
    this.fieldsetDetail.toggleAttribute('disabled', false);
    let stackSizeEditable = item.stackSize >= 0;
    this.itemStackSize.toggleAttribute('disabled', !stackSizeEditable);
    this.groupStackSize.classList.toggle('hidden', !stackSizeEditable);
  }

  fromNew() {
    this.reset();
    this.fieldsetSize.toggleAttribute('disabled', false);
    this.fieldsetShape.toggleAttribute('disabled', false);
    this.fieldsetStyle.toggleAttribute('disabled', false);
    this.fieldsetDetail.toggleAttribute('disabled', false);
    this.itemStackSize.toggleAttribute('disabled', true);
    this.groupStackSize.classList.toggle('hidden', true);
  }

  getSourceItemId() {
    return this.itemItemId.value;
  }

  getSourceInvId() {
    return this.itemInvId.value;
  }

  toItem() {
    const builder = new ItemBuilder();
    let width;
    let height;
    if (this.itemItemId.value) {
      builder.itemId(this.itemItemId.value);
    }
    if (this.itemWidth.value) {
      width = this.itemWidth.value;
      builder.width(this.itemWidth.value);
    }
    if (this.itemHeight.value) {
      height = this.itemHeight.value;
      builder.height(this.itemHeight.value);
    }
    if (this.itemName.value) {
      builder.displayName(this.itemName.value);
    }
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
    builder.imageSrc(imgSrc);
    if (this.itemStackable.checked && this.itemStackSize.value) {
      builder.stackSize(this.itemStackSize.value);
    }
    if (this.itemDescription.value) {
      builder.description(this.itemDescription.value);
    }
    return builder.build();
  }

  submit() {
    this.form.submit();
  }

  reset() {
    this.form.reset();
  }

  /** @private */
  onLabelKeyUp(e) {
    if (e.code === 'Enter') {
      e.target.click();
    }
  }

  /** @private */
  onSizeChange() {
    let itemSize = this.itemSize1.checked ? 1 : this.itemSize2.checked ? 2 : this.itemSize3.checked ? 3 : 0;
    let [width, height] = getComputedSize(Number(itemSize), this.itemFlat.checked, this.itemLong.checked, this.itemHeavy.checked);
    this.outputSizeWidth.textContent = `${width}`;
    this.outputSizeHeight.textContent = `${height}`;
    this.itemWidth.value = `${width}`;
    this.itemHeight.value = `${height}`;
    this.itemImage.placeholder = getDefaultImageSourceByDimensions(width, height, this.itemStackable.checked);
    const socketedItem = this.getSocketedItem();
    if (socketedItem) {
      socketedItem.width = width;
      socketedItem.height = height;
      let imgSrc = this.itemImage.value || this.itemImage.placeholder;
      socketedItem.imgSrc = imgSrc;
      const store = getInventoryStore();
      dispatchItemChange(store, socketedItem.itemId);
      dispatchInventoryChange(store, this.socketInventory.invId);
    }
  }

  /** @private */
  onStackableChange() {
    let checked = this.itemStackable.checked;
    this.itemStackSize.toggleAttribute('disabled', !checked);
    this.groupStackSize.classList.toggle('hidden', !checked);
    if (checked) {
      this.itemStackSize.focus();
      this.itemStackSize.select();
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

  getSocketedItem() {
    const store = getInventoryStore();
    const invId = this.socketInventory.invId;
    if (!isInventoryInStore(store, invId)) {
      return null;
    }
    return getItemAtSlotIndex(store, invId, 0);
  }

  /** @private */
  onSubmit(e) {
    e.preventDefault();
    const detail = {
      data: new FormData(this.form)
    };
    this.dispatchEvent(new CustomEvent('submit', { composed: true, detail }));
  }

  /** @private */
  onReset() {
    this.itemSize1.checked = false;
    this.itemSize2.checked = true;
    this.itemSize3.checked = false;
    this.itemWidth.value = '2';
    this.itemHeight.value = '2';
    this.itemStackable.checked = false;
    this.itemFlat.checked = false;
    this.itemLong.checked = false;
    this.itemHeavy.checked = false;
    this.itemStackSize.value = '1';
    this.onSizeChange();
    this.onStackableChange();
    this.dispatchEvent(new CustomEvent('reset', { composed: true }));
  }
}
InventoryItemBuilderElement.define();

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
  if (flat) {
    width += 1;
    height = Math.ceil(height / 2);
  }
  if (long) {
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
