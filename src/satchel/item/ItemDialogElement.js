import { DialogPromptElement } from '../../app/DialogPromptElement.js';
import { openFoundry } from '../../inventory/FoundryHelper.js';
import { getInventoryInStore, getInventoryStore } from '../../inventory/InventoryStore.js';
import { removeItemFromInventory } from '../../inventory/InventoryTransfer.js';
import { getItemByItemId } from '../inv/InvItems.js';
import { cloneItem, copyItem } from './Item.js';
import { ItemEditorElement } from './ItemEditorElement.js';
import { dispatchItemChange } from './ItemEvents.js';

/** @typedef {import('./Item.js').Item} Item */

const INNER_HTML = /* html */`
<dialog-prompt>
  <item-editor>
    <icon-button slot="actions" id="actionFoundryShare" icon="res/share.svg" alt="send" title="Send Item" disabled></icon-button>
  </item-editor>
  <button id="actionSave">Save & Close</button>
  <button id="actionFoundry">Send to Foundry</button>
</dialog-prompt>
`;
const INNER_STYLE = /* css */`
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

    /** @private */
    this._containerElement = null;
    /** @private */
    this._invId = null;
    /** @private */
    this._itemId = null;

    /**
     * @private
     * @type {DialogPromptElement}
     */
     this.dialog = shadowRoot.querySelector('dialog-prompt');
    /**
     * @private
     * @type {ItemEditorElement}
     */
    this.itemEditor = shadowRoot.querySelector('item-editor');

    /** @private */
    this.actionSave = shadowRoot.querySelector('#actionSave');
    /** @private */
    this.actionFoundry = shadowRoot.querySelector('#actionFoundry');
    /** @private */
    this.actionFoundryShare = shadowRoot.querySelector('#actionFoundryShare');

    /** @private */
    this.onDialogClose = this.onDialogClose.bind(this);
    /** @private */
    this.onActionSave = this.onActionSave.bind(this);
    /** @private */
    this.onActionFoundry = this.onActionFoundry.bind(this);
    /** @private */
    this.onActionFoundryShare = this.onActionFoundryShare.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.dialog.addEventListener('close', this.onDialogClose);
    this.actionSave.addEventListener('click', this.onActionSave);
    this.actionFoundry.addEventListener('click', this.onActionFoundry);
    this.actionFoundryShare.addEventListener('click', this.onActionFoundryShare);
  }

  /** @protected */
  disconnectedCallback() {
    this.dialog.removeEventListener('close', this.onDialogClose);
    this.actionSave.removeEventListener('click', this.onActionSave);
    this.actionFoundry.removeEventListener('click', this.onActionFoundry);
    this.actionFoundryShare.removeEventListener('click', this.onActionFoundryShare);
  }

  openDialog(containerElement, invId, itemId, clientX = 0, clientY = 0) {
    if (!containerElement || !invId || !itemId) {
      throw new Error('Cannot open dialog for non-existant inventory item.');
    }
    this._containerElement = containerElement;
    this._invId = invId;
    this._itemId = itemId;

    const store = getInventoryStore();
    const inv = getInventoryInStore(store, invId);
    const item = getItemByItemId(inv, itemId);
    const newItem = cloneItem(item);
    this.itemEditor.putSocketedItem(newItem, false);
    this.dialog.toggleAttribute('open', true);
  }

  /** @private */
  applyChanges() {
    const socketItem = this.itemEditor.getSocketedItem();

    const invId = this._invId;
    const itemId = this._itemId;
    const store = getInventoryStore();
    const inv = getInventoryInStore(store, invId);
    const sourceItem = getItemByItemId(inv, itemId);
    cloneItem(socketItem, sourceItem);
    dispatchItemChange(store, itemId);
  }

  /** @private */
  onActionSave() {
    this.applyChanges();
    this.dialog.toggleAttribute('open', false);
  }

  /** @private */
  onActionFoundry() {
    if (!this._containerElement || !this._invId || !this._itemId) {
      return;
    }
    this.applyChanges();
    this.dialog.toggleAttribute('open', false);

    const store = getInventoryStore();
    const item = tryTakeItemFromInventory(store, this._containerElement, this._itemId);
    if (item) {
      let newItem = copyItem(item);
      openFoundry(newItem);
    }
  }

  /** @private */
  onActionFoundryShare() {
  }

  /** @private */
  onDialogClose(e) {
    if (e.detail.from !== 'cancel') {
      this.applyChanges();
    }
  }
}
ItemDialogElement.define();

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
