import { dropOnGround } from './GroundHelper.js';
import {
  getInventoryStore,
  getItem,
  createItem,
  updateItem,
} from './InventoryStore.js';

/**
 * @param formElement
 * @param itemId
 */
export function openItemBuilder(formElement, itemId = undefined) {
  if (itemId) {
    formElement.reset();
    formElement.querySelector('#itemSizeSet').toggleAttribute('disabled', true);
    formElement
      .querySelector('#itemTraitSet')
      .toggleAttribute('disabled', true);
    formElement.querySelector('#itemId').value = itemId;
    formElement.querySelector('input[type="submit"]').value = 'Save';

    const item = getItem(getInventoryStore(), itemId);
    formElement.querySelector('#itemName').value = item.displayName;
    formElement.querySelector('#itemDetail').value = item.metadata.detail;
  } else {
    formElement.reset();
    formElement
      .querySelector('#itemSizeSet')
      .toggleAttribute('disabled', false);
    formElement
      .querySelector('#itemTraitSet')
      .toggleAttribute('disabled', false);
    formElement.querySelector('#itemId').value = '';
    formElement.querySelector('input[type="submit"]').value = 'Create';
  }
}

/**
 * @param formElement
 */
export function applyItemBuilder(formElement) {
  const formData = new FormData(formElement);
  const itemId = formElement.querySelector('#itemId').value;

  const item = getItem(getInventoryStore(), itemId);
  if (item) {
    // Editing
    editItem(formData, itemId);
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
  const result = {};
  for (const entry of formData) {
    const [key, value] = entry;
    switch (key) {
      case 'itemId':
        itemId = value;
        break;
      case 'itemName':
        result.displayName = value;
        break;
      case 'itemDetail':
        result.metadata = {
          detail: value,
        };
        break;
    }
  }

  updateItem(getInventoryStore(), itemId, result);
}

/**
 * @param formData
 */
function buildItem(formData) {
  const result = {
    w: 1,
    h: 1,
    displayName: 'Item',
    imgSrc: 'res/images/potion.png',
    metadata: {
      detail: 'A mundane item.',
      category: 'Container',
      size: 'small',
      traits: [],
    },
  };
  for (const entry of formData) {
    const [key, value] = entry;
    switch (key) {
      case 'itemSize':
        result.metadata.size = value;
        break;
      case 'itemTrait':
        result.metadata.traits.push(value);
        break;
      case 'itemName':
        result.displayName = value;
        break;
      case 'itemPortrait':
        result.imgSrc = value;
        break;
      case 'itemDetail':
        result.metadata.detail = value;
        break;
    }
  }

  let { size } = result.metadata;
  if (result.metadata.traits.includes('heavy')) {
    size = getNextItemSize(size);
  }

  let imgSrc = 'res/images/potion.png';
  let [width, height] = getDefaultItemSizeDimensions(size);
  if (result.metadata.traits.includes('long')) {
    width = Math.ceil(width / 2);
    height += 1;
    imgSrc = 'res/images/blade.png';
  }

  if (result.metadata.traits.includes('flat')) {
    width += 1;
    height = Math.ceil(height / 2);
    imgSrc = 'res/images/scroll.png';
  }

  result.w = width;
  result.h = height;
  result.imgSrc = imgSrc;

  spawnItem(result);
}

/**
 * @param options
 */
function spawnItem(options) {
  const item = createItem(getInventoryStore(), options);
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
