import { copyItem } from '../satchel/item/Item.js';

export function openFoundry(item = undefined) {
  let editorContainer = document.querySelector('.editorContainer');
  editorContainer.classList.toggle('open', true);
  /** @type {import('../satchel/item/ItemEditorElement.js').ItemEditorElement} */
  let itemEditor = document.querySelector('#itemEditor');
  itemEditor.putSocketedItem(item, true);
}

export function closeFoundry() {
  let editorContainer = document.querySelector('.editorContainer');
  editorContainer.classList.toggle('open', false);
  /** @type {import('../satchel/item/ItemEditorElement.js').ItemEditorElement} */
  let itemEditor = document.querySelector('#itemEditor');
  itemEditor.putSocketedItem(null);
}

export function isFoundryOpen() {
  let editorContainer = document.querySelector('.editorContainer');
  return editorContainer.classList.contains('open');
}

export function copyFoundry() {
  /** @type {import('../satchel/item/ItemEditorElement.js').ItemEditorElement} */
  let itemEditor = document.querySelector('#itemEditor');
  let item = itemEditor.getSocketedItem();
  if (item) {
    return copyItem(item);
  } else {
    return null;
  }
}
