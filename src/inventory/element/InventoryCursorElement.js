import { dijkstra2d } from '../../util/dijkstra2d.js';
import { distanceSquared } from '../../util/math.js';
import {
  createSocketInventoryInStore,
  deleteInventoryFromStore,
  getInventory,
  getInventoryInStore,
  getInventoryStore,
  isInventoryInStore,
} from '../InventoryStore.js';
import {
  clearItems,
  getInventoryItemAt,
  getInventoryItemIdAt,
  getInventoryType,
  getItemSlotCoords,
  isInventorySlotEmpty,
  putItem,
  removeItem,
} from '../InventoryTransfer.js';

/**
 * @typedef {import('../Inv.js').Inventory} Inventory
 * @typedef {import('../Inv.js').InventoryId} InventoryId
 * @typedef {import('../InventoryStore.js').InventoryStore} InventoryStore
 *
 * @typedef {import('../Item.js').Item} Item
 * @typedef {import('../Item.js').ItemId} ItemId
 */

const CURSOR_OFFSET_PIXELS = 24;
const PLACE_BUFFER_RANGE = 10;
const PLACE_BUFFER_RANGE_SQUARED = PLACE_BUFFER_RANGE * PLACE_BUFFER_RANGE;
const CURSOR_INV_ID = 'cursor';

const INNER_HTML = `
<inventory-grid name="${CURSOR_INV_ID}"></inventory-grid>
`;
const INNER_STYLE = `
:host {
  position: absolute;
  display: none;
  filter: brightness(70%);
}
`;

export class InventoryCursorElement extends HTMLElement {
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
    customElements.define('inventory-cursor', this);
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

    /** @private */
    this.unitSize = 48;

    /** @private */
    this.animationHandle = null;
    /** @private */
    this.clientX = 0;
    /** @private */
    this.clientY = 0;

    /** @private */
    this.startHeldX = 0;
    /** @private */
    this.startHeldY = 0;
    /** @private */
    this.heldOffsetX = 0;
    /** @private */
    this.heldOffsetY = 0;

    /**
     * This allows drag-n-drop or click-n-deposit gestures.
     * 
     * @private
     */
    this.ignoreFirstPutDown = false;

    /** @private */
    this.inventoryElement = this.shadowRoot.querySelector('inventory-grid');

    /** @private */
    this.onAnimationFrame = this.onAnimationFrame.bind(this);
    /** @private */
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  get name() {
    return this.inventoryElement.name;
  }

  get invId() {
    return this.name;
  }

  /** @protected */
  connectedCallback() {
    let store = getInventoryStore();
    const invId = this.inventoryElement.name;
    if (!isInventoryInStore(store, invId)) {
      createSocketInventoryInStore(store, invId);
    }

    document.addEventListener('mousemove', this.onMouseMove);
    this.animationHandle = requestAnimationFrame(this.onAnimationFrame);
  }

  /** @protected */
  disconnectedCallback() {
    document.removeEventListener('mousemove', this.onMouseMove);
    cancelAnimationFrame(this.animationHandle);
    this.animationHandle = null;

    let store = getInventoryStore();
    const invId = this.inventoryElement.name;
    if (isInventoryInStore(store, invId)) {
      deleteInventoryFromStore(store, invId, getInventoryInStore(store, invId));
    }
  }

  /** @private */
  onAnimationFrame() {
    // Update cursor position
    const clientX = this.clientX;
    const clientY = this.clientY;
    const posX = clientX + this.heldOffsetX * this.unitSize;
    const posY = clientY + this.heldOffsetY * this.unitSize;
    this.style.setProperty('left', `${posX - CURSOR_OFFSET_PIXELS}px`);
    this.style.setProperty('top', `${posY - CURSOR_OFFSET_PIXELS}px`);
    if (
      this.ignoreFirstPutDown &&
      distanceSquared(clientX, clientY, this.startHeldX, this.startHeldY) >=
        PLACE_BUFFER_RANGE_SQUARED
    ) {
      // This is a drag motion. Next putDown should be intentful.
      this.ignoreFirstPutDown = false;
    }
    // Wait for another frame...
    this.animationHandle = requestAnimationFrame(this.onAnimationFrame);
  }

  /** @private */
  onMouseMove(e) {
    this.clientX = e.clientX;
    this.clientY = e.clientY;
  }

  /**
   * Pick up from target inventory to cursor if able to.
   *
   * @param {InventoryId} invId The inventory to pick up from
   * @param {ItemId} itemId The item to pick up
   * @param {number} coordX The cursor pick up coordinates from the inventory
   * @param {number} coordY The cursor pick up coordinates from the inventory
   * @returns {boolean} Whether the transfer to cursor was successful.
   */
  pickUp(invId, itemId, coordX = 0, coordY = 0) {
    if (this.hasHeldItem()) {
      return false;
    }
    let store = getInventoryStore();
    if (itemId) {
      const [fromItemX, fromItemY] = getItemSlotCoords(store, invId, itemId);
      const item = removeItem(store, itemId, invId);
      this.setHeldItem(item, fromItemX - coordX, fromItemY - coordY);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Put down from cursor to destination inventory.
   *
   * @param {InventoryId} invId
   * @param {number} coordX
   * @param {number} coordY
   */
  putDown(invId, coordX, coordY) {
    let store = getInventoryStore();
    const heldItem = this.getHeldItem();
    if (!heldItem) {
      return false;
    }
    if (this.ignoreFirstPutDown) {
      // First put down has been ignored. Don't ignore the next intentful one.
      this.ignoreFirstPutDown = false;
      return true;
    }
    const toInventory = getInventory(store, invId);
    const invType = getInventoryType(store, invId, toInventory);
    switch (invType) {
      case 'socket':
        // TODO: Force fail placing items in sockets.
        return false;
        // return putDownItemInSocketInventory(store, invId, this, coordX, coordY);
      case 'grid':
        return putDownItemInGridInventory(
          store,
          invId,
          this,
          coordX + this.heldOffsetX,
          coordY + this.heldOffsetY
        );
      default:
        throw new Error('Unsupported inventory type.');
    }
  }

  hasHeldItem() {
    let store = getInventoryStore();
    return !isInventorySlotEmpty(store, this.invId, 0, 0);
  }

  getHeldItem() {
    let store = getInventoryStore();
    return getInventoryItemAt(store, this.invId, 0, 0);
  }

  /**
   * @param {Item} item The item to hold
   * @param {number} offsetX The held offset from root item slot (can only be non-positive)
   * @param {number} offsetY The held offset from root item slot (can only be non-positive)
   */
  setHeldItem(item, offsetX = 0, offsetY = 0) {
    if (!item) {
      throw new Error(
        'Cannot set held item to null - use clearHeldItem() instead.'
      );
    }
    if (this.hasHeldItem()) {
      throw new Error('Cannot set held item - already holding another item.');
    }
    let store = getInventoryStore();
    putItem(store, this.invId, item, 0, 0);
    this.style.display = 'unset';
    this.ignoreFirstPutDown = true;
    this.startHeldX = this.clientX;
    this.startHeldY = this.clientY;
    this.heldOffsetX = Math.min(0, offsetX);
    this.heldOffsetY = Math.min(0, offsetY);
  }

  clearHeldItem() {
    let store = getInventoryStore();
    clearItems(store, this.invId);
    this.style.display = 'none';
    this.ignoreFirstPutDown = false;
  }
}
InventoryCursorElement.define();

/**
 * @returns {InventoryCursorElement}
 */
export function getCursor() {
  return document.querySelector('inventory-cursor');
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} toInventoryId
 * @param {InventoryCursorElement} cursorElement
 * @param {number} coordX
 * @param {number} coordY
 */
function putDownItemInSocketInventory(
  store,
  toInventoryId,
  cursorElement,
  coordX,
  coordY
) {
  let heldItem = cursorElement.getHeldItem();
  let prevItem = getInventoryItemAt(store, toInventoryId, 0, 0);
  let prevItemId = prevItem.itemId;
  let prevItemX = -1;
  let prevItemY = -1;
  if (prevItem) {
    // Has an item to swap. So pick up this one for later.
    let [x, y] = getItemSlotCoords(store, toInventoryId, prevItemId);
    prevItemX = x;
    prevItemY = y;
    prevItem = removeItem(store, prevItemId, toInventoryId);
  }
  // Now there are no items in the way. Place it down!
  cursorElement.clearHeldItem();
  putItem(store, toInventoryId, heldItem, 0, 0);
  // ...finally put the remaining item back now that there is space.
  if (prevItem) {
    cursorElement.setHeldItem(prevItem, Math.min(0, prevItemX - coordX), Math.min(0, prevItemY - coordY));
  }
  return true;
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} toInventoryId
 * @param {InventoryCursorElement} cursorElement
 * @param {number} itemX The root slot coordinates to place item (includes holding offset)
 * @param {number} itemY The root slot coordinates to place item (includes holding offset)
 */
function putDownItemInGridInventory(
  store,
  toInventoryId,
  cursorElement,
  itemX,
  itemY
) {
  const toInventory = getInventoryInStore(store, toInventoryId);
  const heldItem = cursorElement.getHeldItem();
  const invWidth = toInventory.width;
  const invHeight = toInventory.height;
  const itemWidth = heldItem.width;
  const itemHeight = heldItem.height;
  const maxCoordX = invWidth - itemWidth;
  const maxCoordY = invHeight - itemHeight;
  if (maxCoordX < 0 || maxCoordY < 0) {
    return false;
  }
  const targetCoordX = Math.min(Math.max(0, itemX), maxCoordX);
  const targetCoordY = Math.min(Math.max(0, itemY), maxCoordY);

  let swappable = true;
  let prevItemId = null;
  for (let y = 0; y < itemHeight; ++y) {
    for (let x = 0; x < itemWidth; ++x) {
      let itemId = getInventoryItemIdAt(
        store,
        toInventoryId,
        targetCoordX + x,
        targetCoordY + y
      );
      if (itemId) {
        if (prevItemId) {
          if (itemId !== prevItemId) {
            swappable = false;
          } else {
            // It's the same item, keep going...
          }
        } else {
          prevItemId = itemId;
        }
      }
    }
  }

  if (swappable) {
    let prevItem = null;
    let prevItemX = -1;
    let prevItemY = -1;
    if (prevItemId) {
      // Has an item to swap. So pick up this one for later.
      let [x, y] = getItemSlotCoords(store, toInventoryId, prevItemId);
      prevItemX = x;
      prevItemY = y;
      prevItem = removeItem(store, prevItemId, toInventoryId);
    }
    // Now there are no items in the way. Place it down!
    cursorElement.clearHeldItem();
    putItem(store, toInventoryId, heldItem, targetCoordX, targetCoordY);
    // ...finally put the remaining item back now that there is space.
    if (prevItem) {
      cursorElement.setHeldItem(
        prevItem,
        Math.min(0, prevItemX - targetCoordX),
        Math.min(0, prevItemY - targetCoordY)
      );
    }
    return true;
  } else {
    // Cannot swap here. Find somehwere close?
    const [x, y] = findEmptyCoords(
      targetCoordX,
      targetCoordY,
      maxCoordX,
      maxCoordY,
      (x, y) => canPlaceAt(store, toInventoryId, x, y, itemWidth, itemHeight)
    );
    if (x >= 0 && y >= 0) {
      cursorElement.clearHeldItem();
      putItem(store, toInventoryId, heldItem, x, y);
      return true;
    }
    // No can do :(
    return false;
  }
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 * @param coordX
 * @param coordY
 * @param itemWidth
 * @param itemHeight
 * @param exclude
 */
function canPlaceAt(
  store,
  invId,
  coordX,
  coordY,
  itemWidth,
  itemHeight,
  exclude = null
) {
  for (let y = 0; y < itemHeight; ++y) {
    for (let x = 0; x < itemWidth; ++x) {
      const item = getInventoryItemAt(store, invId, coordX + x, coordY + y);
      if (item && (!exclude || item !== exclude)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * @param coordX
 * @param coordY
 * @param maxCoordX
 * @param maxCoordY
 * @param isEmptyCallback
 */
function findEmptyCoords(
  coordX,
  coordY,
  maxCoordX,
  maxCoordY,
  isEmptyCallback = () => true
) {
  return dijkstra2d(
    coordX,
    coordY,
    0,
    0,
    maxCoordX,
    maxCoordY,
    isEmptyCallback,
    getNeighborsFromCoords,
    fromCoordsToNode,
    toCoordsFromNode
  );
}

/**
 * @param coordX
 * @param coordY
 */
function fromCoordsToNode(coordX, coordY) {
  return ((coordX & 0xff_ff) << 16) | (coordY & 0xff_ff);
}

/**
 * @param node
 * @param out
 */
function toCoordsFromNode(node, out) {
  out[0] = node >> 16;
  out[1] = node & 0xff_ff;
  return out;
}

/**
 * @param coordX
 * @param coordY
 * @param out
 */
function getNeighborsFromCoords(coordX, coordY, out) {
  out[0] = fromCoordsToNode(coordX - 1, coordY);
  out[1] = fromCoordsToNode(coordX, coordY - 1);
  out[2] = fromCoordsToNode(coordX + 1, coordY);
  out[3] = fromCoordsToNode(coordX, coordY + 1);
  return out;
}
