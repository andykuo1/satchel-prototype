import { freeFromCursor, getCursorContext, getCursorItem } from './CursorHelper.js';
import { insertIn } from './InventoryHelper.js';
import { clearInventory, createInventory, deleteInventory, getInventoryStore, isEmptyInventory } from './InventoryStore.js';

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
    let inventory = createInventory(getInventoryStore());
    inventory.type = 'socket';
    let element = document.createElement('inventory-grid');
    element.name = inventory.name;
    element.type = 'socket';
    insertIn(inventory, freedItem);
    element.addEventListener('itemchange', onGroundSlotChange);
    ground.appendChild(element);
}

export function clearGround() {
    for(let child of getGroundContainer().children) {
        let inventoryName = child.name;
        clearInventory(getInventoryStore(), inventoryName);
    }
}

function onGroundSlotChange(e) {
    let target = e.target;
    if (isEmptyInventory(getInventoryStore(), target.id)) {
        target.removeEventListener('itemchange', onGroundSlotChange);
        target.parentNode.removeChild(target);
        deleteInventory(getInventoryStore(), target.id);
    }
}
