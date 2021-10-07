import { distanceSquared } from './util.js';

const CURSOR_OFFSET_PIXELS = 24;
const PLACE_BUFFER_RANGE_SQUARED = 8 * 8;
const PLACE_BUFFER_TIMEOUT_MILLIS = 300;

const CURSOR_CONTEXT = {
    inventory: null,
    ground: null,
    x: 0, y: 0,
    pickX: 0, pickY: 0,
    pickOffsetX: 0, pickOffsetY: 0,
    placeDownBuffer: true,
    placeDownBufferTimeoutHandle: null,
};

export function setCursorInventory(inventory) {
    let ctx = getCursorContext();
    if (ctx.inventory) {
        document.removeEventListener('mousemove', onMouseMove);
        ctx.inventory = null;
    }
    if (inventory) {
        inventory.style.position = 'absolute';
        inventory.style.display = 'none';
        ctx.inventory = inventory;
        document.addEventListener('mousemove', onMouseMove);
    }
}

export function updateCursorPosition(clientX, clientY, unitSize) {
    let ctx = getCursorContext();
    let inv = getCursorInventory(ctx);
    let x = clientX + ctx.pickOffsetX * unitSize;
    let y = clientY + ctx.pickOffsetY * unitSize;
    ctx.x = x;
    ctx.y = y;
    inv.style.setProperty('left', `${x - CURSOR_OFFSET_PIXELS}px`);
    inv.style.setProperty('top', `${y - CURSOR_OFFSET_PIXELS}px`);
    if (distanceSquared(x, y, ctx.pickX, ctx.pickY) >= PLACE_BUFFER_RANGE_SQUARED) {
        clearPlaceDownBuffer();
    }
}

function onMouseMove(e) {
    updateCursorPosition(e.clientX, e.clientY, 48);
}

export function getCursorContext() {
    return CURSOR_CONTEXT;
}

/**
 * @returns {import('./InventoryBag.js').InventoryBag}
 */
export function getCursorInventory(ctx) {
    return ctx.inventory;
}

/**
 * @returns {import('./InventoryItem.js').InventoryItem}
 */
export function getCursorItem(ctx) {
    let inv = getCursorInventory(ctx);
    if (!inv) return null;
    return inv.itemList.at(0, 0);
}

export function storeToCursor(ctx, freedItem) {
    if (!freedItem) return;
    let inv = getCursorInventory(ctx);
    inv.itemList.add(freedItem);
    if (inv.itemList.length > 0) {
        inv.style.display = 'unset';
        startPlaceDownBuffer();
    }
}

export function freeFromCursor(ctx) {
    let inv = getCursorInventory(ctx);
    inv.itemList.clear();
    if (inv.itemList.length <= 0) {
        inv.style.display = 'none';
        clearPlaceDownBuffer();
    }
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
