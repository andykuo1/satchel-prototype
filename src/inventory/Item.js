/**
 * @typedef {string} ItemId
 *
 * @typedef Item
 * @property {ItemId} itemId
 * @property {number} width
 * @property {number} height
 * @property {string} imgSrc
 * @property {string} displayName
 * @property {string} description
 * @property {object} metadata
 */

import { uuid } from '../util/uuid.js';

/**
 * @param {ItemId} itemId
 */
export function createItem(itemId) {
  let item = {
    itemId,
    width: 1,
    height: 1,
    imgSrc: '',
    displayName: '',
    description: '',
    metadata: {},
  };
  return item;
}

/**
 * @param {Item} other
 * @param {Item} [dst]
 * @returns {Item}
 */
export function copyItem(other, dst = undefined) {
  const itemId = other.itemId || uuid();
  if (!dst) {
    dst = createItem(itemId);
  } else {
    dst.itemId = itemId;
  }
  if (typeof other.width === 'number') {
    dst.width = other.width;
  }
  if (typeof other.height === 'number') {
    dst.height = other.height;
  }
  if (typeof other.imgSrc === 'string') {
    dst.imgSrc = other.imgSrc;
  }
  if (typeof other.displayName === 'string') {
    dst.displayName = other.displayName;
  }
  if (typeof other.description === 'string') {
    dst.description = other.description;
  }
  if (typeof other.metadata === 'object') {
    try {
      dst.metadata = JSON.parse(JSON.stringify(other.metadata));
    } catch (e) {
      dst.metadata = {};
    }
  }
  return dst;
}

export class ItemBuilder {
  static from(baseItem) {
    return new ItemBuilder().copyItem(baseItem);
  }

  constructor() {
    /** @private */
    this._itemId = null;
    /** @private */
    this._width = 1;
    /** @private */
    this._height = 1;
    /** @private */
    this._imageSrc = '';
    /** @private */
    this._displayName = '';
    /** @private */
    this._description = '';
    /** @private */
    this._metadata = {};
  }

  /**
   * @param {ItemBuilder} itemBuilder
   */
  copyItemBuilder(itemBuilder) {
    this._itemId = itemBuilder._itemId;
    this._width = itemBuilder._width;
    this._height = itemBuilder._height;
    this._imageSrc = itemBuilder._imageSrc;
    this._displayName = itemBuilder._displayName;
    this._description = itemBuilder._description;
    this._metadata = JSON.parse(JSON.stringify(itemBuilder._metadata));
    return this;
  }

  /**
   * @param {Item} item
   */
  copyItem(item) {
    let newItem = copyItem(item);
    this._itemId = newItem.itemId;
    this._width = newItem.width;
    this._height = newItem.height;
    this._imageSrc = newItem.imgSrc;
    this._displayName = newItem.displayName;
    this._description = newItem.description;
    this._metadata = newItem.metadata;
    return this;
  }

  default() {
    this._itemId = null;
    this._width = 1;
    this._height = 1;
    this._imageSrc = '';
    this._displayName = '';
    this._description = '';
    this._metadata = {};
    return this;
  }

  itemId(itemId) {
    this._itemId = itemId;
    return this;
  }

  width(width) {
    this._width = width;
    return this;
  }

  height(height) {
    this._height = height;
    return this;
  }

  imageSrc(src) {
    this._imageSrc = src;
    return this;
  }

  displayName(displayName) {
    this._displayName = displayName;
    return this;
  }

  description(description) {
    this._description = description;
    return this;
  }

  metadata(key, value) {
    this._metadata[key] = value;
    return this;
  }

  /**
   * @returns {Item}
   */
  build() {
    let itemId = this._itemId !== null ? this._itemId : uuid();
    if (!itemId) {
      throw new Error(`Invalid item id '${itemId}'.`);
    }
    let width = Number(this._width);
    let height = Number(this._height);
    if (!Number.isFinite(width) || !Number.isSafeInteger(width) || width <= 0) {
      throw new Error('Invalid item width - must be a finite positive integer.');
    }
    if (!Number.isFinite(height) || !Number.isSafeInteger(height) || height <= 0) {
      throw new Error('Invalid item height - must be a finite positive integer.');
    }
    let imgSrc = String(this._imageSrc);
    let displayName = String(this._displayName);
    let description = String(this._description);
    let metadata;
    try {
      metadata = JSON.parse(JSON.stringify(this._metadata));
    } catch (e) {
      throw new Error(`Invalid json for metadata - ${e}`);
    }
    let item = createItem(itemId);
    item.width = width;
    item.height = height;
    item.imgSrc = imgSrc;
    item.displayName = displayName;
    item.description = description;
    item.metadata = metadata;
    return item;
  }
}
