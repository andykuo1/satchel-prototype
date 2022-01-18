import { getCursorContext } from '../../satchel/inv/CursorHelper.js';
import { openFoundry } from '../../satchel/inv/FoundryHelper.js';
import { getSatchelStore } from '../../store/SatchelStore.js';
import { removeItemFromInventory } from '../../satchel/inv/InventoryTransfer.js';
import { getItemByItemId } from '../../satchel/inv/InvItems.js';
import { ActivityPlayerList } from '../../satchel/peer/ActivityPlayerList.js';
import { cloneItem, copyItem } from '../../satchel/item/Item.js';
import { ItemEditorElement } from './ItemEditorElement.js';
import { dispatchItemChange } from '../../events/ItemEvents.js';
import { getInvInStore } from '../../store/InvStore.js';
import { dropFallingItem } from '../cursor/FallingItemElement.js';

/**
 * @typedef {import('../../satchel/item/Item.js').Item} Item
 * @typedef {import('../lib/BannerPromptElement.js').BannerPromptElement} BannerPromptElement
 */

const INNER_HTML = /* html */`
<banner-prompt>
  <item-editor>
    <icon-button slot="actions" id="actionFoundry" icon="res/anvil.svg" alt="foundry" title="Edit in Foundry"></icon-button>
    <icon-button slot="actions" id="actionFoundryShare" icon="res/share.svg" alt="share" title="Share Item"></icon-button>
    <icon-button slot="actions" id="actionDuplicate" icon="res/duplicate.svg" alt="duplicate" title="Duplicate Item"></icon-button>
  </item-editor>
</banner-prompt>
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
     * @type {BannerPromptElement}
     */
     this.dialog = shadowRoot.querySelector('banner-prompt');
    /**
     * @private
     * @type {ItemEditorElement}
     */
    this.itemEditor = shadowRoot.querySelector('item-editor');

    /** @private */
    this.actionDuplicate = shadowRoot.querySelector('#actionDuplicate');
    /** @private */
    this.actionFoundry = shadowRoot.querySelector('#actionFoundry');
    /** @private */
    this.actionFoundryShare = shadowRoot.querySelector('#actionFoundryShare');

    /** @private */
    this.onDialogClose = this.onDialogClose.bind(this);
    /** @private */
    this.onActionDuplicate = this.onActionDuplicate.bind(this);
    /** @private */
    this.onActionFoundry = this.onActionFoundry.bind(this);
    /** @private */
    this.onActionFoundryShare = this.onActionFoundryShare.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.dialog.addEventListener('close', this.onDialogClose);
    this.actionDuplicate.addEventListener('click', this.onActionDuplicate);
    this.actionFoundry.addEventListener('click', this.onActionFoundry);
    this.actionFoundryShare.addEventListener('click', this.onActionFoundryShare);
  }

  /** @protected */
  disconnectedCallback() {
    this.dialog.removeEventListener('close', this.onDialogClose);
    this.actionDuplicate.removeEventListener('click', this.onActionDuplicate);
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

    const store = getSatchelStore();
    const inv = getInvInStore(store, invId);
    const item = getItemByItemId(inv, itemId);
    const newItem = cloneItem(item);
    this.itemEditor.clearSocketedItem();
    this.itemEditor.putSocketedItem(newItem, false);
    this.dialog.toggleAttribute('open', true);
    this.itemEditor.grabDefaultFocus();
  }

  copySocketedItem() {
    const item = this.itemEditor.getSocketedItem();
    if (!item) {
      return null;
    } else {
      return copyItem(item);
    }
  }

  /** @private */
  applyChanges() {
    const invId = this._invId;
    const itemId = this._itemId;
    const store = getSatchelStore();
    const inv = getInvInStore(store, invId);
    const sourceItem = getItemByItemId(inv, itemId);
    const socketItem = this.itemEditor.getSocketedItem();
    cloneItem(socketItem, sourceItem);
    dispatchItemChange(store, itemId);
  }

  /** @private */
  onActionDuplicate(e) {
    if (!this._containerElement || !this._invId || !this._itemId) {
      return;
    }
    this.applyChanges();

    const socketedItem = this.itemEditor.getSocketedItem();
    if (socketedItem) {
      let newItem = copyItem(socketedItem);
      const clientRect = e.target.getBoundingClientRect();
      dropFallingItem(newItem, clientRect.x, clientRect.y);
    }
  }

  /** @private */
  onActionFoundry() {
    if (!this._containerElement || !this._invId || !this._itemId) {
      return;
    }
    this.applyChanges();
    this.dialog.toggleAttribute('open', false);

    const store = getSatchelStore();
    const item = tryTakeItemFromInventory(store, this._containerElement, this._itemId);
    if (item) {
      let newItem = copyItem(item);
      openFoundry(newItem);
    }
  }

  /** @private */
  onActionFoundryShare() {
    const socketedItem = this.itemEditor.getSocketedItem();
    try {
      if (socketedItem) {
        /** @type {HTMLSelectElement} */
        let giftTarget = document.querySelector('#giftTarget');
        let ctx = getCursorContext();
        if (ctx.server && ctx.server.instance) {
          const localServer = /** @type {import('../../satchel/peer/PeerSatchel.js').SatchelServer} */ (ctx.server.instance);
          const playerNames = ActivityPlayerList.getPlayerNameListOnServer(localServer);
          let content = playerNames.map(clientName => `<option>${clientName.toLowerCase()}</option>`).join('\n');
          giftTarget.innerHTML = content;
        } else if (ctx.client && ctx.client.instance) {
          const localClient = /** @type {import('../../satchel/peer/PeerSatchel.js').SatchelClient} */ (ctx.client.instance);
          const playerNames = ActivityPlayerList.getPlayerNameListOnClient(localClient);
          let content = playerNames.map(clientName => `<option>${clientName.toLowerCase()}</option>`).join('\n');
          giftTarget.innerHTML = content;
        } else {
          giftTarget.innerHTML = '';
        }
        let giftDialog = document.querySelector('#giftDialog');
        giftDialog.toggleAttribute('open', true);
      }
    } catch (e) {
      console.error('Failed to export item', e);
    }
  }

  /** @private */
  onDialogClose(e) {
    this.applyChanges();
  }
}
ItemDialogElement.define();

function tryTakeItemFromInventory(store, containerElement, itemId) {
  const containerInvId = containerElement.invId;
  if (containerElement.hasAttribute('nooutput')) {
    return null;
  }
  const inv = getInvInStore(store, containerInvId);
  const item = getItemByItemId(inv, itemId);
  if (containerElement.hasAttribute('copyoutput')) {
    return copyItem(item);
  }
  removeItemFromInventory(store, containerInvId, itemId);
  return item;
}
