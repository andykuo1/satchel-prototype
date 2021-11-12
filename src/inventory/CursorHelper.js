import { distanceSquared } from '../util/math.js';
import {
  clearInventory,
  getInventoryStore,
} from './InventoryStore.js';
import { getInventoryItemAt, putItem } from './InventoryTransfer.js';

const CURSOR_OFFSET_PIXELS = 24;
const PLACE_BUFFER_RANGE_SQUARED = 8 * 8;
const PLACE_BUFFER_TIMEOUT_MILLIS = 300;

const CURSOR_CONTEXT = {
  element: null,
  ground: null,
  clientX: 0,
  clientY: 0,
  x: 0,
  y: 0,
  pickX: 0,
  pickY: 0,
  pickOffsetX: 0,
  pickOffsetY: 0,
  placeDownBuffer: true,
  placeDownBufferTimeoutHandle: null,
  cursorAnimationFrameHandle: null,
};

/**
 * @param inventoryElement
 */
export function setCursorElement(inventoryElement) {
  const ctx = getCursorContext();
  if (ctx.element) {
    document.removeEventListener('mousemove', onMouseMove);
    cancelAnimationFrame(ctx.cursorAnimationFrameHandle);
    ctx.cursorAnimationFrameHandle = null;
    ctx.element = null;
  }

  if (inventoryElement) {
    inventoryElement.style.position = 'absolute';
    inventoryElement.style.display = 'none';
    ctx.element = inventoryElement;
    document.addEventListener('mousemove', onMouseMove);
    ctx.cursorAnimationFrameHandle = requestAnimationFrame(onAnimationFrame);
  }
}

/**
 * @param clientX
 * @param clientY
 * @param unitSize
 */
export function updateCursorPosition(clientX, clientY, unitSize) {
  const ctx = getCursorContext();
  const element = getCursorElement(ctx);
  const x = clientX + ctx.pickOffsetX * unitSize;
  const y = clientY + ctx.pickOffsetY * unitSize;
  ctx.x = x;
  ctx.y = y;
  element.style.setProperty('left', `${x - CURSOR_OFFSET_PIXELS}px`);
  element.style.setProperty('top', `${y - CURSOR_OFFSET_PIXELS}px`);
  if (
    distanceSquared(x, y, ctx.pickX, ctx.pickY) >= PLACE_BUFFER_RANGE_SQUARED
  ) {
    clearPlaceDownBuffer();
  }
}

function onAnimationFrame() {
  const ctx = getCursorContext();
  updateCursorPosition(ctx.clientX, ctx.clientY, 48);
  ctx.cursorAnimationFrameHandle = requestAnimationFrame(onAnimationFrame);
}

/**
 * @param e
 */
function onMouseMove(e) {
  const ctx = getCursorContext();
  ctx.clientX = e.clientX;
  ctx.clientY = e.clientY;
}

export function getCursorContext() {
  return CURSOR_CONTEXT;
}

/**
 * @param ctx
 * @returns {import('./InventoryGrid.js').InventoryGridElement}
 */
export function getCursorElement(ctx) {
  return ctx.element;
}

/**
 * @param ctx
 * @returns {import('./InventoryStore.js').Item}
 */
export function getCursorItem(ctx) {
  const cursorInventoryName = ctx.element.name;
  return getInventoryItemAt(getInventoryStore(), cursorInventoryName, 0, 0);
}

/**
 * @param ctx
 * @param freedItem
 */
export function storeToCursor(ctx, freedItem) {
  if (!freedItem) {
    return;
  }
  const cursorInventoryName = ctx.element.name;
  putItem(getInventoryStore(), cursorInventoryName, freedItem, 0, 0);
  ctx.element.style.display = 'unset';
  startPlaceDownBuffer();
}

/**
 * @param ctx
 */
export function freeFromCursor(ctx) {
  clearInventory(getInventoryStore(), ctx.element.name, false);
  ctx.element.style.display = 'none';
  clearPlaceDownBuffer();
}

export function startPlaceDownBuffer() {
  const ctx = getCursorContext();
  ctx.placeDownBuffer = false;
  ctx.pickX = ctx.x;
  ctx.pickY = ctx.y;
  ctx.placeDownBufferTimeoutHandle = setTimeout(
    onPlaceDownBufferTimeout,
    PLACE_BUFFER_TIMEOUT_MILLIS
  );
}

function onPlaceDownBufferTimeout() {
  const ctx = getCursorContext();
  ctx.placeDownBuffer = true;
}

export function clearPlaceDownBuffer() {
  const ctx = getCursorContext();
  ctx.placeDownBuffer = true;
  clearTimeout(ctx.placeDownBufferTimeoutHandle);
  ctx.placeDownBufferTimeoutHandle = null;
}
