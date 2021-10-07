import { dijkstra2d } from '../util.js';
import { freeFromCursor, getCursorContext, getCursorInventory, getCursorItem, storeToCursor } from './CursorHelper.js';

/**
 * Pick up from target inventory to cursor.
 * @param {*} storedItem 
 * @param {*} fromInventory 
 * @returns 
 */
export function pickUp(storedItem, fromInventory, fromCoordX = 0, fromCoordY = 0) {
    let ctx = getCursorContext();
    let inv = getCursorInventory(ctx);
    if (!inv) return false;
    if (inv.itemList.length > 0) return false;
    fromInventory.itemList.delete(storedItem);
    let prevX = storedItem.x;
    let prevY = storedItem.y;
    storedItem.x = 0;
    storedItem.y = 0;
    storeToCursor(ctx, storedItem);
    ctx.pickOffsetX = prevX - fromCoordX;
    ctx.pickOffsetY = prevY - fromCoordY;
    return true;
}

/**
 * Put down from cursor to destination.
 * @param {*} toInventory 
 * @param {*} toCoordX 
 * @param {*} toCoordY 
 */
export function putDown(toInventory, toCoordX, toCoordY, allowSwap = true) {
    let ctx = getCursorContext();
    let item = getCursorItem(ctx);
    if (!item || !ctx.placeDownBuffer) return false;

    let invWidth = toInventory.rows;
    let invHeight = toInventory.cols;
    let itemWidth = item.w;
    let itemHeight = item.h;
    let coordX = toCoordX + ctx.pickOffsetX;
    let coordY = toCoordY + ctx.pickOffsetY;

    let maxCoordX = invWidth - itemWidth;
    let maxCoordY = invHeight - itemHeight;
    if (maxCoordX < 0 || maxCoordY < 0) return false;
    let targetCoordX = Math.min(Math.max(0, coordX), maxCoordX);
    let targetCoordY = Math.min(Math.max(0, coordY), maxCoordY);

    if (allowSwap && canSwapAt(toInventory, coordX, coordY, targetCoordX, targetCoordY, itemWidth, itemHeight)) {
        freeFromCursor(ctx);
        let result = pickUp(toInventory.itemList.at(coordX, coordY), toInventory);
        if (!result) {
            throw new Error('Failed to pick up item on swap.');
        }
        item.x = targetCoordX;
        item.y = targetCoordY;
        toInventory.itemList.add(item);
        return true;
    } else {
        let [ x, y ] = findEmptyCoords(
            targetCoordX, targetCoordY,
            maxCoordX, maxCoordY,
            (x, y) => canPlaceAt(toInventory, x, y, itemWidth, itemHeight));
        if (x >= 0 && y >= 0) {
            freeFromCursor(ctx);
            item.x = x;
            item.y = y;
            toInventory.itemList.add(item);
            return true;
        }
    }
    return false;
}

export function extractOut(fromInventory, filter) {
    let result = [];
    for(let item of fromInventory.itemList) {
        if (filter(item, fromInventory)) {
            fromInventory.itemList.delete(item);
            item.x = 0;
            item.y = 0;
            result.push(item);
        }
    }
    return result;
}

export function insertIn(toInventory, freedItem) {
    if (toInventory.type === 'socket' && toInventory.itemList.length <= 0) {
        freedItem.x = 0;
        freedItem.y = 0;
        toInventory.itemList.add(freedItem);
        return true;
    }
    let ctx = getCursorContext();
    let invWidth = toInventory.rows;
    let invHeight = toInventory.cols;
    let itemWidth = freedItem.w;
    let itemHeight = freedItem.h;
    let maxCoordX = invWidth - itemWidth;
    let maxCoordY = invHeight - itemHeight;
    if (maxCoordX < 0 || maxCoordY < 0) return false;
    let [ x, y ] = findEmptyCoords(
        0, 0,
        maxCoordX, maxCoordY,
        (x, y) => canPlaceAt(toInventory, x, y, itemWidth, itemHeight));
    if (x >= 0 && y >= 0) {
        freeFromCursor(ctx);
        freedItem.x = x;
        freedItem.y = y;
        toInventory.itemList.add(freedItem);
        return true;
    }
    return false;
}


function canSwapAt(inv, coordX, coordY, itemX, itemY, itemWidth, itemHeight) {
    let item = inv.itemList.at(coordX, coordY);
    return item && canPlaceAt(inv, itemX, itemY, itemWidth, itemHeight, item);
}

function canPlaceAt(inv, coordX, coordY, itemWidth, itemHeight, exclude = null) {
    for(let y = 0; y < itemHeight; ++y)
    {
        for(let x = 0; x < itemWidth; ++x)
        {
            let itemElement = inv.itemList.at(coordX + x, coordY + y);
            if (itemElement && (!exclude || itemElement !== exclude))
            {
                return false;
            }
        }
    }
    return true;
}

function findEmptyCoords(coordX, coordY, maxCoordX, maxCoordY, isEmptyCallback = () => true) {
    return dijkstra2d(
        coordX, coordY,
        0, 0,
        maxCoordX, maxCoordY,
        isEmptyCallback,
        getNeighborsFromCoords,
        fromCoordsToNode,
        toCoordsFromNode);
}

function fromCoordsToNode(coordX, coordY) {
    return (coordX & 0xFFFF) << 16 | (coordY & 0xFFFF);
}

function toCoordsFromNode(node, out) {
    out[0] = node >> 16;
    out[1] = node & 0xFFFF;
    return out;
}

function getNeighborsFromCoords(coordX, coordY, out) {
    out[0] = fromCoordsToNode(coordX - 1, coordY);
    out[1] = fromCoordsToNode(coordX, coordY - 1);
    out[2] = fromCoordsToNode(coordX + 1, coordY);
    out[3] = fromCoordsToNode(coordX, coordY + 1);
    return out;
}
