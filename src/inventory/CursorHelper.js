import { addItemToInventory, clearInventory, getInventoryStore, getItemAtInventory } from './InventoryStore.js';
import { distanceSquared } from './util.js';

const CURSOR_OFFSET_PIXELS = 24;
const PLACE_BUFFER_RANGE_SQUARED = 8 * 8;
const PLACE_BUFFER_TIMEOUT_MILLIS = 300;

const CURSOR_CONTEXT = {
    element: null,
    ground: null,
    clientX: 0, clientY: 0,
    x: 0, y: 0,
    pickX: 0, pickY: 0,
    pickOffsetX: 0, pickOffsetY: 0,
    placeDownBuffer: true,
    placeDownBufferTimeoutHandle: null,
    cursorAnimationFrameHandle: null,
};

export function setCursorElement(inventoryElement) {
    let ctx = getCursorContext();
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

export function updateCursorPosition(clientX, clientY, unitSize) {
    let ctx = getCursorContext();
    let element = getCursorElement(ctx);
    let x = clientX + ctx.pickOffsetX * unitSize;
    let y = clientY + ctx.pickOffsetY * unitSize;
    ctx.x = x;
    ctx.y = y;
    element.style.setProperty('left', `${x - CURSOR_OFFSET_PIXELS}px`);
    element.style.setProperty('top', `${y - CURSOR_OFFSET_PIXELS}px`);
    if (distanceSquared(x, y, ctx.pickX, ctx.pickY) >= PLACE_BUFFER_RANGE_SQUARED) {
        clearPlaceDownBuffer();
    }
}

function onAnimationFrame() {
    let ctx = getCursorContext();
    updateCursorPosition(ctx.clientX, ctx.clientY, 48);
    ctx.cursorAnimationFrameHandle = requestAnimationFrame(onAnimationFrame);
}

function onMouseMove(e) {
    let ctx = getCursorContext();
    ctx.clientX = e.clientX;
    ctx.clientY = e.clientY;
}

export function getCursorContext() {
    return CURSOR_CONTEXT;
}

/**
 * @returns {import('./InventoryGrid.js').InventoryGrid}
 */
export function getCursorElement(ctx) {
    return ctx.element;
}

/**
 * @returns {import('./InventoryItem.js').InventoryItem}
 */
export function getCursorItem(ctx) {
    return getItemAtInventory(getInventoryStore(), ctx.element.name, 0, 0);
}

export function storeToCursor(ctx, freedItem) {
    if (!freedItem) return;
    addItemToInventory(getInventoryStore(), ctx.element.name, freedItem);
    ctx.element.style.display = 'unset';
    startPlaceDownBuffer();
}

export function freeFromCursor(ctx) {
    clearInventory(getInventoryStore(), ctx.element.name);
    ctx.element.style.display = 'none';
    clearPlaceDownBuffer();
}

export function startPlaceDownBuffer() {
    let ctx = getCursorContext();
    ctx.placeDownBuffer = false;
    ctx.pickX = ctx.x;
    ctx.pickY = ctx.y;
    ctx.placeDownBufferTimeoutHandle = setTimeout(
        onPlaceDownBufferTimeout, PLACE_BUFFER_TIMEOUT_MILLIS);
}

function onPlaceDownBufferTimeout() {
    let ctx = getCursorContext();
    ctx.placeDownBuffer = true;
}

export function clearPlaceDownBuffer() {
    let ctx = getCursorContext();
    ctx.placeDownBuffer = true;
    clearTimeout(ctx.placeDownBufferTimeoutHandle);
    ctx.placeDownBufferTimeoutHandle = null;
}
