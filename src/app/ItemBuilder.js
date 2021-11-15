import { dropOnGround } from '../inventory/GroundHelper.js';
import {
  getInventoryStore,
} from '../inventory/InventoryStore.js';
import { getExistingInventory, updateItem } from '../inventory/InventoryTransfer.js';
import { getItemByItemId } from '../inventory/InvItems.js';
import { ItemBuilder } from '../inventory/Item.js';

/** @typedef {import('../inventory/Item.js').Item} Item */

/**
 * @param formElement
 * @param itemId
 */
export function openItemBuilder(formElement, invId = undefined, itemId = undefined) {
  if (invId && itemId) {
    formElement.reset();
    formElement.querySelector('#itemSizeSet').toggleAttribute('disabled', true);
    formElement.querySelector('#itemTraitSet').toggleAttribute('disabled', true);
    formElement.querySelector('#itemId').value = itemId;
    formElement.querySelector('#invId').value = invId;
    formElement.querySelector('input[type="submit"]').value = 'Save';

    const inv = getExistingInventory(getInventoryStore(), invId);
    const item = getItemByItemId(inv, itemId);
    formElement.querySelector('#itemName').value = item.displayName;
    formElement.querySelector('#itemDetail').value = item.description;
  } else {
    formElement.reset();
    formElement.querySelector('#itemSizeSet').toggleAttribute('disabled', false);
    formElement.querySelector('#itemTraitSet').toggleAttribute('disabled', false);
    formElement.querySelector('#itemId').value = '';
    formElement.querySelector('#invId').value = '';
    formElement.querySelector('input[type="submit"]').value = 'Create';
  }
}

/**
 * @param formElement
 */
export function applyItemBuilder(formElement) {
  const formData = new FormData(formElement);
  const itemId = formElement.querySelector('#itemId').value;
  const invId = formElement.querySelector('#invId').value;
  if (itemId && invId) {
    // Editing
    editItem(formData);
  } else {
    // Creating
    buildItem(formData);
  }
}

/**
 * @param formElement
 */
export function resetItemBuilder(formElement) {
  formElement.reset();
}

/**
 * @param formData
 */
function editItem(formData) {
  let itemId = '';
  let invId = '';
  const result = {};
  for (const entry of formData) {
    const [key, value] = entry;
    switch (key) {
      case 'itemId':
        itemId = value;
        break;
      case 'invId':
        invId = value;
        break;
      case 'itemName':
        result.displayName = value;
        break;
      case 'itemDetail':
        result.description = value;
        break;
    }
  }

  updateItem(getInventoryStore(), invId, itemId, result);
}

/**
 * @param formData
 */
function buildItem(formData) {
  const builder = new ItemBuilder();

  let size;
  let traits = [];
  for (const entry of formData) {
    const [key, value] = entry;
    switch (key) {
      case 'itemSize':
        size = value;
        break;
      case 'itemTrait':
        traits.push(value);
        break;
      case 'itemName':
        builder.displayName(value);
        break;
      case 'itemPortrait':
        builder.imageSrc(value);
        break;
      case 'itemDetail':
        builder.description(value);
        break;
    }
  }

  if (traits.includes('heavy')) {
    size = getNextItemSize(size);
  }

  let imgSrc = 'res/images/potion.png';
  let [width, height] = getDefaultItemSizeDimensions(size);
  if (traits.includes('long')) {
    width = Math.ceil(width / 2);
    height += 1;
    imgSrc = 'res/images/blade.png';
  }

  if (traits.includes('flat')) {
    width += 1;
    height = Math.ceil(height / 2);
    imgSrc = 'res/images/scroll.png';
  }

  let item = builder.width(width).height(height).imageSrc(imgSrc).build();
  spawnItem(item);
}

/**
 * @param {Item} item
 */
function spawnItem(item) {
  dropOnGround(item);
}

/**
 * @param itemSize
 */
function getNextItemSize(itemSize) {
  switch (itemSize) {
    case 'tiny':
      return 'small';
    case 'small':
      return 'medium';
    case 'medium':
      return 'large';
    case 'large':
      return 'huge';
    case 'huge':
      throw new Error('No item size bigger than huge.');
    default:
      throw new Error(`Unknown item size '${itemSize}'`);
  }
}

/**
 * @param itemSize
 */
function getDefaultItemSizeDimensions(itemSize) {
  switch (itemSize) {
    case 'tiny':
      return [1, 1];
    case 'small':
      return [1, 1];
    case 'medium':
      return [2, 2];
    case 'large':
      return [4, 4];
    case 'huge':
      return [6, 6];
    default:
      throw new Error(`Unknown item size '${itemSize}'`);
  }
}
