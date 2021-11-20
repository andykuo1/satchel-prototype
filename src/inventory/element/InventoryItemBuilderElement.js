import { ItemBuilder } from '../Item.js';

const INNER_HTML = `
<form autocomplete="off">
  <fieldset>
    <legend>Item</legend>
    <fieldset id="fieldsetSize">
      <legend>Size</legend>
      <div class="slider">
        <div class="labels">
          <label for="itemSize" id="labelSizeSmall" title="small">
            <img src="res/spoke.svg">
          </label>
          <label for="itemSize" id="labelSizeMedium" title="medium">
            <img src="res/onehand.svg">
          </label>
          <label for="itemSize" id="labelSizeLarge" title="large">
            <img src="res/twohand.svg">
          </label>
        </div>
        <input type="range" name="sizeIndex" id="itemSize" min=1 max=3 value=2>
        <input type="number" name="width" id="itemWidth" hidden value=2>
        <input type="number" name="height" id="itemHeight" hidden value=2>
      </div>
      <output>
        <span id="outputSizeWidth">2</span>
        <span>⨯</span>
        <span id="outputSizeHeight">2</span>
      </output>
    </fieldset>
    <fieldset id="fieldsetShape">
      <legend>Shape</legend>
      <div class="labels">
        <span class="toggle">
          <input type="checkbox" name="stackable" id="itemStackable">
          <label for="itemStackable">
            <img src="res/grain.svg" title="stackable">
          </label>
        </span>
        <span class="toggle">
          <input type="checkbox" name="long" id="itemLong">
          <label for="itemLong">
            <img src="res/height.svg" title="long">
          </label>
        </span>
        <span class="toggle">
          <input type="checkbox" name="flat" id="itemFlat">
          <label for="itemFlat">
            <img src="res/flatten.svg" title="flat">
          </label>
        </span>
        <span class="toggle">
          <input type="checkbox" name="heavy" id="itemHeavy">
          <label for="itemHeavy">
            <img src="res/scale.svg" title="heavy">
          </label>
        </span>
      </div>
    </fieldset>
    <fieldset disabled id="fieldsetStyle">
      <legend>Style</legend>
      <input name="imageSrc" id="itemImage">
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
  </fieldset>
  <fieldset>
    <legend>Actions</legend>
    <input name="invId" id="itemInvId" hidden>
    <input name="itemId" id="itemItemId" hidden>
    <div>
      <input type="submit">
      <input type="reset">
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
}
form input {
  font-family: monospace;
}
input[type="submit"], input[type="reset"], button {
  font-family: unset;
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

.slider > input {
  width: 80%;
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
    this.itemSize = this.shadowRoot.querySelector('#itemSize');
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
    this.labelSizeSmall = this.shadowRoot.querySelector('#labelSizeSmall');
    /** @private */
    this.labelSizeMedium = this.shadowRoot.querySelector('#labelSizeMedium');
    /** @private */
    this.labelSizeLarge = this.shadowRoot.querySelector('#labelSizeLarge');

    /** @private */
    this.outputSizeWidth = this.shadowRoot.querySelector('#outputSizeWidth');
    /** @private */
    this.outputSizeHeight = this.shadowRoot.querySelector('#outputSizeHeight');

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
    this.onSizeSmallLabel = this.onSizeSmallLabel.bind(this);
    /** @private */
    this.onSizeMediumLabel = this.onSizeMediumLabel.bind(this);
    /** @private */
    this.onSizeLargeLabel = this.onSizeLargeLabel.bind(this);

    /** @private */
    this.onSizeChange = this.onSizeChange.bind(this);
    /** @private */
    this.onStackableChange = this.onStackableChange.bind(this);

    /** @private */
    this.onSubmit = this.onSubmit.bind(this);
    /** @private */
    this.onReset = this.onReset.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.labelSizeSmall.addEventListener('click', this.onSizeSmallLabel);
    this.labelSizeMedium.addEventListener('click', this.onSizeMediumLabel);
    this.labelSizeLarge.addEventListener('click', this.onSizeLargeLabel);

    this.itemSize.addEventListener('input', this.onSizeChange);
    this.itemStackable.addEventListener('change', this.onStackableChange);
    this.itemFlat.addEventListener('change', this.onSizeChange);
    this.itemLong.addEventListener('change', this.onSizeChange);
    this.itemHeavy.addEventListener('change', this.onSizeChange);

    this.form.addEventListener('submit', this.onSubmit);
    this.form.addEventListener('reset', this.onReset);
  }

  /** @protected */
  disconnectedCallback() {
    this.labelSizeSmall.removeEventListener('click', this.onSizeSmallLabel);
    this.labelSizeMedium.removeEventListener('click', this.onSizeMediumLabel);
    this.labelSizeLarge.removeEventListener('click', this.onSizeLargeLabel);

    this.itemSize.removeEventListener('input', this.onSizeChange);
    this.itemStackable.removeEventListener('change', this.onStackableChange);
    this.itemFlat.removeEventListener('change', this.onSizeChange);
    this.itemLong.removeEventListener('change', this.onSizeChange);
    this.itemHeavy.removeEventListener('change', this.onSizeChange);

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
    this.fieldsetStyle.toggleAttribute('disabled', true);
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
    if (this.itemImage.value) {
      builder.imageSrc(this.itemImage.value);
    } else {
      let imgSrc;
      if (width < height) {
        imgSrc = 'res/images/blade.png';
      } else if (width > height) {
        imgSrc = 'res/images/scroll.png';
      } else {
        imgSrc = 'res/images/potion.png';
      }
      builder.imageSrc(imgSrc);
    }
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
  onSizeSmallLabel() {
    this.itemSize.value = '1';
    this.onSizeChange();
  }

  /** @private */
  onSizeMediumLabel() {
    this.itemSize.value = '2';
    this.onSizeChange();
  }
  
  /** @private */
  onSizeLargeLabel() {
    this.itemSize.value = '3';
    this.onSizeChange();
  }

  /** @private */
  onSizeChange() {
    let [width, height] = getComputedSize(Number(this.itemSize.value), this.itemFlat.checked, this.itemLong.checked, this.itemHeavy.checked);
    this.outputSizeWidth.textContent = `${width}`;
    this.outputSizeHeight.textContent = `${height}`;
    this.itemWidth.value = `${width}`;
    this.itemHeight.value = `${height}`;
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
  onSubmit(e) {
    e.preventDefault();
    const detail = {
      data: new FormData(this.form)
    };
    this.dispatchEvent(new CustomEvent('submit', { composed: true, detail }));
  }

  /** @private */
  onReset() {
    this.itemSize.value = '2';
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
