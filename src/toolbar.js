import { el } from './ToolbarHelper.js';
import { downloadText } from './util/downloader.js';
import { getSatchelStore } from './store/SatchelStore.js';
import { getCursorContext } from './satchel/inv/CursorHelper.js';
import { copyToClipboard, pasteFromClipboard } from './util/clipboard.js';
import { ItemBuilder } from './satchel/item/Item.js';
import { exportItemToString, importItemFromString } from './loader/ItemLoader.js';
import { clearFoundry, closeFoundry, copyFoundry, isFoundryOpen, openFoundry } from './satchel/inv/FoundryHelper.js';
import { ActivityPlayerList } from './satchel/peer/ActivityPlayerList.js';
import { forceEmptyStorage } from './Storage.js';
import { saveSatchelToData } from './loader/SatchelLoader.js';
import { dropFallingItem } from './components/cursor/FallingItemElement.js';
import { playSound, toggleSound } from './sounds.js';
import { getTrashAlbumId, saveItemToTrashAlbum } from './satchel/TrashAlbum.js';

import { setupProfile } from './toolbar/profile.js';
import { setupSync } from './toolbar/sync.js';
import { notify } from './components/NotifyPrompt.js';
import { setupAlbum } from './toolbar/album.js';
import { uploadSatchelFile } from './toolbar/upload.js';
import { clearItemsOnGround, getGroundAlbumId, hasGroundAlbum } from './satchel/GroundAlbum.js';
import { resetTutorial, setupTutorial } from './toolbar/tutorial.js';
import { getCursor } from './components/index.js';
import { getItemIdsInInv, getItemInInv } from './satchel/inv/InventoryItems.js';
import { clearItemsInInventory } from './satchel/inv/InventoryTransfer.js';
import { isInvInStore } from './store/InvStore.js';

window.addEventListener('DOMContentLoaded', () => {
  el('#downloadButton', 'click', onDownloadClick);
  el('#uploadButton', 'click', uploadSatchelFile);
  el('#actionSoundToggle', 'click', onActionSoundToggle);
  el('#cloudButton', 'click', onCloudClick);
  el('#actionEraseAll', 'click', onActionEraseAll);

  el('#actionShareItem', 'click', onActionShareItem);
  el('#actionSettings', 'click', onActionSettings);

  el('#actionItemCodeImport', 'click', onActionItemCodeImport);
  el('#actionItemCodeExport', 'click', onActionItemCodeExport);
  el('#actionItemDuplicate', 'click', onActionItemDuplicate);
  el('#actionFoundryReset', 'mouseup', onActionFoundryReset);
  el('#actionFoundryNew', 'click', onActionFoundryNew);
  el('#giftCodeExport', 'click', onGiftCodeExport);
  el('#giftSubmit', 'click', onGiftSubmit);

  el('#itemCodeSubmit', 'click', onActionItemCodeSubmit);
  el('#actionGroundDelete', 'contextmenu', onTrashClick);
  el('#actionFoundryReset', 'contextmenu', onTrashClick);
  el('#actionGroundDelete', 'dblclick', onActionGroundClear);
  el('#actionTrashClear', 'click', onActionTrashClear);
  el('#trashAlbum', 'mouseup', onActionTrashDrop);
  el('#actionTutorialReset', 'click', onActionTutorialReset);

  setupProfile();
  setupSync();
  setupAlbum();
  setupTutorial();

  document.addEventListener('itemcontext', onItemContext);
});

function onActionGroundClear() {
  const store = getSatchelStore();
  if (!hasGroundAlbum(store)) {
    return;
  }
  let albumId = getGroundAlbumId(store);
  let itemIds = getItemIdsInInv(store, albumId);
  if (itemIds.length <= 0) {
    return;
  }
  if (!window.confirm('Clear all items on the ground?')) {
    return;
  }
  for (let itemId of itemIds) {
    let item = getItemInInv(store, albumId, itemId);
    saveItemToTrashAlbum(item);
  }
  clearItemsOnGround();
}

function onTrashClick(e) {
  /** @type {import('./components/lib/ContextMenuElement.js').ContextMenuElement} */
  const trashDialog = document.querySelector('#trashDialog');
  let rect = e.target.getBoundingClientRect();
  trashDialog.x = rect.x + rect.width / 2;
  trashDialog.y = rect.y + rect.height / 2;
  trashDialog.toggleAttribute('open', true);
  e.preventDefault();
  e.stopPropagation();
  return false;
}

function onActionTrashDrop(e) {
  const cursor = getCursor();
  const store = getSatchelStore();
  const albumId = getTrashAlbumId(store);
  if (!isInvInStore(store, albumId)) {
    return;
  }
  if (cursor.putDownInAlbum(albumId)) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}

function onActionTrashClear() {
  const store = getSatchelStore();
  const trashAlbumId = getTrashAlbumId(store);
  let itemIds = getItemIdsInInv(store, trashAlbumId);
  if (itemIds.length <= 0) {
    return;
  }
  if (!window.confirm('This will destroy all items in the trash. Are you sure?')) {
    return;
  }
  clearItemsInInventory(store, trashAlbumId);
  playSound('clearItem');
}

function onActionShareItem() {
  /** @type {import('./components/itemeditor/ItemDialogElement.js').ItemDialogElement} */
  const itemEditor = document.querySelector('#itemDialog');
  const socketedItem = itemEditor.copySocketedItem();
  try {
    if (socketedItem) {
      /** @type {HTMLSelectElement} */
      let giftTarget = document.querySelector('#giftTarget');
      let ctx = getCursorContext();
      if (ctx.server && ctx.server.instance) {
        const localServer = /** @type {import('./satchel/peer/PeerSatchel.js').SatchelServer} */ (ctx.server.instance);
        const playerNames = ActivityPlayerList.getPlayerNameListOnServer(localServer);
        let content = playerNames.map(clientName => `<option>${clientName.toLowerCase()}</option>`).join('\n');
        giftTarget.innerHTML = content;
      } else if (ctx.client && ctx.client.instance) {
        const localClient = /** @type {import('./satchel/peer/PeerSatchel.js').SatchelClient} */ (ctx.client.instance);
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

function onGiftSubmit() {
  /** @type {HTMLSelectElement} */
  let giftTarget = document.querySelector('#giftTarget');
  if (giftTarget.value) {
    /** @type {import('./components/itemeditor/ItemDialogElement.js').ItemDialogElement} */
    const itemDialog = document.querySelector('#itemDialog');
    const socketedItem = itemDialog.copySocketedItem();
    const target = giftTarget.value;
    const ctx = getCursorContext();
    if (ctx.server && ctx.server.instance) {
      ctx.server.instance.sendItemTo(target, socketedItem);
    } else if (ctx.client && ctx.client.instance) {
      ctx.client.instance.sendItemTo(target, socketedItem);
    }
  }
  let giftDialog = document.querySelector('#giftDialog');
  giftDialog.toggleAttribute('open', false);
}

function onGiftCodeExport() {
  /** @type {import('./components/itemeditor/ItemDialogElement.js').ItemDialogElement} */
  const itemDialog = document.querySelector('#itemDialog');
  const socketedItem = itemDialog.copySocketedItem();
  const itemString = exportItemToString(socketedItem);
  copyToClipboard(itemString).then(() => {
    window.alert('Copied to clipboard!\n\nShare this code with a friend, then import item by pasting in Foundry.');
  });
}

function onActionEraseAll() {
  if (!window.confirm('This will erase all content. Are you sure?')) {
    return;
  }
  forceEmptyStorage();
  window.location.reload();
}

function onActionItemDuplicate(e) {
  if (!isFoundryOpen()) {
    return;
  }
  const newItem = copyFoundry();
  if (newItem) {
    const clientRect = e.target.getBoundingClientRect();
    dropFallingItem(newItem, clientRect.x, clientRect.y);
  }
}

function onActionFoundryNew() {
  if (!isFoundryOpen()) {
    return;
  }
  clearFoundry();
  const newItem = new ItemBuilder().fromDefault().width(2).height(2).build();
  openFoundry(newItem);
  playSound('spawnItem');
}

function onDownloadClick() {
  const timestamp = Date.now();
  const store = getSatchelStore();
  const json = saveSatchelToData(store);
  downloadText(`satchel-data-${timestamp}.json`, JSON.stringify(json, null, 4));
}

async function onCloudClick(e) {
  /** @type {import('./components/lib/ContextMenuElement.js').ContextMenuElement} */
  let cloudDialog = document.querySelector('#cloudDialog');
  let rect = e.target.getBoundingClientRect();
  let x = rect.x + rect.width / 2;
  let y = rect.y + rect.height / 2;
  cloudDialog.x = x;
  cloudDialog.y = y;
  cloudDialog.toggleAttribute('open', true);
}

function onActionSettings() {
  let settingsDialog = document.querySelector('#settingsDialog');
  settingsDialog.toggleAttribute('open', true);
}

function onItemContext(e) {
  e.preventDefault();
  e.stopPropagation();

  /** @type {import('./components/itemeditor/ItemDialogElement.js').ItemDialogElement} */
  const itemDialog = document.querySelector('#itemDialog');
  // @ts-ignore
  const { container, invId, itemId, clientX, clientY } = e.detail;
  if (invId && itemId) {
    itemDialog.openDialog(container, invId, itemId, clientX, clientY);
  }
  return false;
}

function onActionItemCodeExport() {
  /** @type {import('./components/itemeditor/ItemEditorElement.js').ItemEditorElement} */
  const itemEditor = document.querySelector('#itemEditor');
  let item = itemEditor.getSocketedItem();
  if (!item) {
    window.alert('No item to copy :(\n\nPut an item in Foundry to copy item code.');
    return;
  }
  let itemString = exportItemToString(item);
  copyToClipboard(itemString).then(() => {
    window.alert(`Copied to clipboard! Share this with a friend, then paste the code in Foundry.\n\n${itemString}`);
  });
}

async function onActionItemCodeImport(e) {
  let newItem;
  try {
    let itemString = await pasteFromClipboard();
    newItem = importItemFromString(itemString);
  } catch (e) {
    // Do nothing.
  }
  if (newItem) {
    /** @type {import('./components/itemeditor/ItemEditorElement.js').ItemEditorElement} */
    const itemEditor = document.querySelector('#itemEditor');
    itemEditor.clearSocketedItem();
    itemEditor.putSocketedItem(newItem, true);
  } else {
    /** @type {import('./components/lib/ContextMenuElement.js').ContextMenuElement} */
    const itemCodeDialog = document.querySelector('#itemCodeDialog');
    let rect = e.target.getBoundingClientRect();
    itemCodeDialog.x = rect.x + rect.width / 2;
    itemCodeDialog.y = rect.y + rect.height / 2;
    itemCodeDialog.toggleAttribute('open', true);
  }
}

async function onActionItemCodeSubmit() {
  /** @type {HTMLInputElement} */
  let itemCodeInput = document.querySelector('#itemCodeInput');
  let itemString = itemCodeInput.value;
  itemCodeInput.value = '';
  let newItem;
  try {
    newItem = importItemFromString(itemString);
  } catch (e) {
    notify('Sorry! That is not a valid item code. Try copy a valid item code text then click this button again.\n\n' + e);
  }
  if (newItem) {
    /** @type {import('./components/itemeditor/ItemEditorElement.js').ItemEditorElement} */
    const itemEditor = document.querySelector('#itemEditor');
    itemEditor.clearSocketedItem();
    itemEditor.putSocketedItem(newItem, true);
  } else {
    const itemCodeDialog = document.querySelector('#itemCodeDialog');
    itemCodeDialog.toggleAttribute('open', true);
  }
}

function onActionFoundryReset(e) {
  if (!isFoundryOpen()) {
    return;
  }
  if (e.button === 2) {
    return;
  }
  const prevItem = clearFoundry();
  if (!prevItem) {
    closeFoundry();
  } else {
    saveItemToTrashAlbum(prevItem);
  }
}

function onActionSoundToggle() {
  toggleSound();
}

function onActionTutorialReset() {
  resetTutorial();
  setupTutorial();
}
