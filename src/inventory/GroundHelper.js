import { freeFromCursor, getCursorContext, getCursorItem } from './CursorHelper.js';
import { insertIn } from './InventoryHelper.js';

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
    let inv = document.createElement('inventory-bag');
    inv.type = 'socket';
    insertIn(inv, freedItem);
    inv.addEventListener('itemchange', onGroundSlotChange);
    ground.appendChild(inv);
}

function onGroundSlotChange(e) {
    let target = e.target;
    let item = target.itemList.at(0, 0);
    if (!item) {
        target.removeEventListener('itemchange', onGroundSlotChange);
        target.parentNode.removeChild(target);
    }
}
