export function openFoundry(item = undefined) {
  let editorContainer = document.querySelector('.editorContainer');
  editorContainer.classList.toggle('open', true);
  /** @type {import('../satchel/item/ItemEditorElement.js').ItemEditorElement} */
  let itemEditor = document.querySelector('#itemEditor');
  itemEditor.putSocketedItem(item, true);
}
