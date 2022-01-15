import { playSound } from '../../sounds.js';
import { copyItem } from '../item/Item.js';

export function openFoundry(item = undefined) {
  let editorContainer = document.querySelector('.editorContainer');
  let wasOpen = editorContainer.classList.contains('open');
  editorContainer.classList.toggle('open', true);
  /** @type {import('../../components/itemeditor/ItemEditorElement.js').ItemEditorElement} */
  let itemEditor = document.querySelector('#itemEditor');
  itemEditor.putSocketedItem(item, true);
  if (!wasOpen) {
    playSound('openAnvil');
  }
}

export function closeFoundry() {
  let editorContainer = document.querySelector('.editorContainer');
  let wasOpen = editorContainer.classList.contains('open');
  editorContainer.classList.toggle('open', false);
  if (wasOpen) {
    playSound('closeAnvil');
  }
}

export function isFoundryOpen() {
  let editorContainer = document.querySelector('.editorContainer');
  return editorContainer.classList.contains('open');
}

export function copyFoundry() {
  /** @type {import('../../components/itemeditor/ItemEditorElement.js').ItemEditorElement} */
  let itemEditor = document.querySelector('#itemEditor');
  let item = itemEditor.getSocketedItem();
  if (item) {
    return copyItem(item);
  } else {
    return null;
  }
}

export function clearFoundry() {
  /** @type {import('../../components/itemeditor/ItemEditorElement.js').ItemEditorElement} */
  let itemEditor = document.querySelector('#itemEditor');
  let item = itemEditor.getSocketedItem();
  if (item) {
    itemEditor.clearSocketedItem();
    return item;
  } else {
    return null;
  }
}
