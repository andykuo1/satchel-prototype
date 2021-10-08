import { freeFromCursor, getCursorContext, getCursorItem } from './CursorHelper.js';
import { insertIn } from './InventoryHelper.js';
import { createInventory, deleteInventory, getInventoryStore, isEmptyInventory } from './InventoryStore.js';

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
    let element = document.createElement('inventory-bag');
    element.name = createInventory(getInventoryStore()).name;
    element.type = 'socket';
    insertIn(element, freedItem);
    element.addEventListener('itemchange', onGroundSlotChange);
    ground.appendChild(element);
}

function onGroundSlotChange(e) {
    let target = e.target;
    if (isEmptyInventory(getInventoryStore(), target.id)) {
        target.removeEventListener('itemchange', onGroundSlotChange);
        target.parentNode.removeChild(target);
        deleteInventory(getInventoryStore(), target.id);
    }
}
