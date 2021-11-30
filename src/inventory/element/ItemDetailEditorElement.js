import { upgradeProperty } from '../../util/wc.js';
import { dispatchItemChange, getInventoryStore } from '../InventoryStore.js';
import { getExistingInventory } from '../InventoryTransfer.js';
import { getItemByItemId } from '../InvItems.js';

const INNER_HTML = /* html */`
<dialog>
  <textarea id="detail" placeholder="Notes..."></textarea>
</dialog>
`;
const INNER_STYLE = /* css */`
:host {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  --foreground-color: #FFFFFF;
  --background-color: #444444;
  --outline-color: #333333;
}

dialog {
  padding: 0.2em;
  border: none;
  border-radius: 0.2em;
  background-color: var(--background-color);
  box-shadow: 0.4rem 0.4rem 0 0 var(--outline-color);
  overflow: hidden;
}

dialog[open] {
  display: flex;
}

textarea {
  flex: 1;
  outline: none;
  border: none;
  background: none;
  height: 10em;
  color: var(--foreground-color);
}
`;

const STACK_SIZE_PATTERN = /(.*)\s+x([0-9]+)\s*$/;

export class ItemDetailEditorElement extends HTMLElement {
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
    customElements.define('item-detail-editor', this);
  }

  static get observedAttributes() {
    return [
      'open'
    ];
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

    this._invId = null;
    this._itemId = null;

    /** @private */
    this.dialog = this.shadowRoot.querySelector('dialog');
    /**
     * @private
     * @type {HTMLTextAreaElement}
     */
    this.inputDetail = this.shadowRoot.querySelector('#detail');

    /** @private */
    this.onBlur = this.onBlur.bind(this);
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'open');

    this.inputDetail.addEventListener('blur', this.onBlur);
  }

  /** @protected */
  disconnectedCallback() {
    this.inputDetail.removeEventListener('blur', this.onBlur);
  }

  /** @protected */
  attributeChangedCallback(attribute, prev, next) {
    switch(attribute) {
      case 'open':
        this.dialog.toggleAttribute('open', next !== null);
        break;
    }
  }

  onBlur() {
    this.open(0, 0, false);
    if (!this._invId || !this._itemId) {
      return;
    }

    const invId = this._invId;
    const itemId = this._itemId;
    this._invId = null;
    this._itemId = null;

    let store = getInventoryStore();
    let inv = getExistingInventory(store, invId);
    let item = getItemByItemId(inv, itemId);
    let content = this.inputDetail.value;
    let titleStartIndex = content.indexOf('#');
    if (titleStartIndex >= 0) {
      let titleEndIndex = content.indexOf('\n');
      if (titleEndIndex < 0) {
        titleEndIndex = content.length;
      }
      let fullTitle = content.substring(titleStartIndex + 1, titleEndIndex);
      let stackSize;
      try {
        let [
          // eslint-disable-next-line no-unused-vars
          _,
          displayNameText,
          stackSizeText
        ] = STACK_SIZE_PATTERN.exec(fullTitle);
        stackSize = Number.parseInt(stackSizeText);
        fullTitle = displayNameText;
      } catch (e) {
        stackSize = -1;
      }
      item.stackSize = stackSize;
      item.displayName = fullTitle.trim();
      content = content.substring(titleEndIndex + 1);
    } else {
      item.stackSize = -1;
      item.displayName = '';
    }
    item.description = content;
    dispatchItemChange(store, itemId);
  }

  open(invId, itemId, clientX, clientY, force = undefined) {
    if (!force) {
      this.dialog.toggleAttribute('open', false);
      return;
    }

    this._invId = invId;
    this._itemId = itemId;
    
    this.style.left = `${clientX}px`;
    this.style.top = `${clientY}px`;
    this.dialog.toggleAttribute('open', force);
    
    let inv = getExistingInventory(getInventoryStore(), invId);
    let item = getItemByItemId(inv, itemId);
    let content = '';
    const title = item.displayName;
    const stackSize = item.stackSize;
    const description = item.description;
    if (title || stackSize >= 0) {
      content += '#';
      if (title) {
        content += ` ${title}`;
      }
      if (stackSize >= 0) {
        content += ` x${stackSize}`;
      }
    }
    if (description) {
      content += `\n${description}`;
    }
    this.inputDetail.value = content;
    this.inputDetail.focus();
    this.inputDetail.setSelectionRange(content.length, content.length);
    this.inputDetail.scrollTo({ top: 0 });
  }
}
ItemDetailEditorElement.define();
