import { freeFromCursor, getCursorContext, getCursorItem } from './CursorHelper.js';
import { insertIn } from './InventoryHelper.js';
import { clearInventory, createInventory, getInventoryStore } from './InventoryStore.js';
import { createTemporaryInventoryView } from './InventoryView.js';
import { uuid } from './util.js';

export function setGroundContainer(ground) {
    let ctx = getCursorContext();
    if (ctx.ground) {
        document.removeEventListener('mouseup', onMouseUp);
    }
    if (ground) {
        ctx.ground = ground;
        document.addEventListener('mouseup', onMouseUp);
    }
}

function onMouseUp(e) {
    let ctx = getCursorContext();
    let item = getCursorItem(ctx);
    if (item && ctx.placeDownBuffer) {
        freeFromCursor(ctx);
        dropOnGround(item);
    }
}

export function getGroundContainer() {
    return getCursorContext().ground;
}

export function dropOnGround(freedItem) {
    let ground = getGroundContainer();
    let inventory = createInventory(getInventoryStore(), uuid(), 'socket');
    insertIn(inventory, freedItem);

    let invElement = createTemporaryInventoryView(getInventoryStore(), inventory.name);
    ground.appendChild(invElement);
}

export function clearGround() {
    let ground = getGroundContainer();
    for(let grid of ground.querySelectorAll('inventory-grid')) {
        clearInventory(getInventoryStore(), grid.name, true);
    }
}
