import { dijkstra2d, distanceSquared } from './util.js';
import { importLootDialog } from './SatchelState.js';

const PLACE_BUFFER_RANGE_SQUARED = 8 * 8;
const PLACE_BUFFER_TIMEOUT = 300;
export const GRID_CELL_SIZE = 64;
export const HALF_GRID_CELL_SIZE = GRID_CELL_SIZE / 2;

let ground = {
    container: null,
};
let holding = {
    container: null,
    x: 0,
    y: 0,
    pick: { x: 0, y: 0 },
    placeDownAllowed: true,
    placeDownBufferTimeoutHandle: null,
};

document.addEventListener('DOMContentLoaded', () => {
    ground.container = document.querySelector('#ground');
    holding.container = document.querySelector('#holding');
    holding.container.style.position = 'absolute';
    holding.container.style.display = 'none';
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    document.body.addEventListener('dragover', onDragOver, true);
    document.body.addEventListener('dragleave', onDragLeave, true);
    document.body.addEventListener('drop', onDrop, true);
});

function onMouseMove(e)
{
    holding.x = e.clientX;
    holding.y = e.clientY;
    holding.container.style.setProperty('left', holding.x - HALF_GRID_CELL_SIZE + 'px');
    holding.container.style.setProperty('top', holding.y - HALF_GRID_CELL_SIZE + 'px');

    if (distanceSquared(holding.x, holding.y, holding.pick.x, holding.pick.y) >= PLACE_BUFFER_RANGE_SQUARED)
    {
        holding.placeDownAllowed = true;

        clearTimeout(holding.placeDownBufferTimeoutHandle);
        holding.placeDownBufferTimeoutHandle = null;
    }
}

function onMouseUp(e)
{
    e.preventDefault();
    e.stopPropagation();

    if (holding.container && holding.container.itemList.length > 0 && holding.placeDownAllowed)
    {
        let result = placeDown(ground.container, 0, 0, false);
        if (!result)
        {
            // Leave it in the holding container.
        }
    }
}

function onDragOver(e)
{
    e.preventDefault();
    e.stopPropagation();

    let dropZone = document.querySelector('#dropZone');
    dropZone.classList.add('active');
}

function onDragLeave(e)
{
    e.preventDefault();
    e.stopPropagation();

    let dropZone = document.querySelector('#dropZone');
    dropZone.classList.remove('active');
}

function onDrop(e)
{
    onDragLeave(e);

    let fileBlobs = [];

    if (e.dataTransfer.items)
    {
        for(let item of e.dataTransfer.items)
        {
            if (item.kind === 'file')
            {
                let fileBlob = item.getAsFile();
                fileBlobs.push(fileBlob);
            }
            // Ignore non-file items.
        }
    }
    else
    {
        for(let fileBlob of e.dataTransfer.files)
        {
            fileBlobs.push(fileBlob);
        }
    }

    fileBlobs.reduce((prev, fileBlob) => {
        if (fileBlob.type === 'application/json')
        {
            return prev
                .then(() => fileBlob.text())
                .then(textData => JSON.parse(textData))
                .then(jsonData => importLootDialog(jsonData))
                .catch(e => {
                    /* Ignore the error. */
                    console.error(e);
                });
        }

        // Skip this file.
        return prev;
    },
    Promise.resolve());
}

function startHolding(holding, itemElement)
{
    itemElement.x = 0;
    itemElement.y = 0;

    holding.container.itemList.add(itemElement);
    holding.container.style.display = 'unset';

    holding.placeDownAllowed = false;
    holding.pick.x = holding.x;
    holding.pick.y = holding.y;
    holding.placeDownBufferTimeoutHandle = setTimeout(() => {
        if (!holding.placeDownAllowed) holding.placeDownAllowed = true;
    }, PLACE_BUFFER_TIMEOUT);
}

function stopHolding(holding, itemElement)
{
    holding.container.itemList.delete(itemElement);
    holding.container.style.display = 'none';

    holding.placeDownAllowed = true;

    clearTimeout(holding.placeDownBufferTimeoutHandle);
    holding.placeDownBufferTimeoutHandle = null;
}

export function getHoldingItem()
{
    return holding.container.itemList.at(0, 0);
}

export function clearGround()
{
    ground.container.itemList.clear();
}

export function pickUp(itemElement, itemContainer)
{
    if (holding.container && holding.container.itemList.length <= 0)
    {
        itemContainer.itemList.delete(itemElement);
        
        startHolding(holding, itemElement);

        return true;
    }

    return false;
}

export function placeDown(itemContainer, coordX, coordY, trySwap = true)
{
    if (holding.container && holding.container.itemList.length > 0 && holding.placeDownAllowed)
    {
        let itemElement = holding.container.itemList.at(0, 0);
        if (itemContainer.type === 'slot')
        {
            // This is a slot.
            if (itemContainer.itemList.length > 0)
            {
                if (trySwap)
                {
                    stopHolding(holding, itemElement);
        
                    let result = pickUp(itemContainer.itemList.at(0, 0), itemContainer);
                    if (!result) throw new Error('Failed to pick up item on swap.');
        
                    itemElement.x = 0;
                    itemElement.y = 0;
                    itemContainer.itemList.add(itemElement);
        
                    return true;
                }

                return false;
            }
            else
            {
                stopHolding(holding, itemElement);

                itemElement.x = 0;
                itemElement.y = 0;
                itemContainer.itemList.add(itemElement);
    
                return true;
            }

            return false;
        }

        // This is NOT a slot.
        let [ containerWidth, containerHeight ] = itemContainer.size;
        let { w: itemWidth, h: itemHeight } = itemElement;
        let maxCoordX = containerWidth - itemWidth;
        let maxCoordY = containerHeight - itemHeight;
        let targetCoordX = Math.min(Math.max(0, coordX), maxCoordX);
        let targetCoordY = Math.min(Math.max(0, coordY), maxCoordY);

        if (trySwap && canSwapAt(itemContainer, coordX, coordY, targetCoordX, targetCoordY, itemWidth, itemHeight))
        {
            stopHolding(holding, itemElement);

            let result = pickUp(itemContainer.itemList.at(coordX, coordY), itemContainer);
            if (!result) throw new Error('Failed to pick up item on swap.');

            itemElement.x = targetCoordX;
            itemElement.y = targetCoordY;
            itemContainer.itemList.add(itemElement);

            return true;
        }

        let [ x, y ] = findEmptyCoords(
            targetCoordX, targetCoordY,
            maxCoordX, maxCoordY,
            (x, y) => canPlaceAt(itemContainer, x, y, itemWidth, itemHeight));

        if (x >= 0 && y >= 0)
        {
            stopHolding(holding, itemElement);

            itemElement.x = x;
            itemElement.y = y;
            itemContainer.itemList.add(itemElement);

            return true;
        }
    }

    return false;
}

export function takeOut(itemContainer, filter)
{
    let result = [];

    for(let itemElement of itemContainer.itemList)
    {
        if (filter(itemElement, itemContainer))
        {
            itemContainer.itemList.delete(itemElement);

            itemElement.x = 0;
            itemElement.y = 0;
            result.push(itemElement);
        }
    }

    return result;
}

export function putIn(itemContainer, itemElement)
{
    if (itemContainer.type === 'slot')
    {
        // This is a slot.
        if (itemContainer.itemList.length > 0)
        {
            return false;
        }
        else
        {
            itemElement.x = 0;
            itemElement.y = 0;
            itemContainer.itemList.add(itemElement);

            return true;
        }
    }

    // This is NOT a slot.
    let [ containerWidth, containerHeight ] = itemContainer.size;
    let { w: itemWidth, h: itemHeight } = itemElement;
    let maxCoordX = containerWidth - itemWidth;
    let maxCoordY = containerHeight - itemHeight;

    let [ x, y ] = findEmptyCoords(
        0, 0,
        maxCoordX, maxCoordY,
        (x, y) => canPlaceAt(itemContainer, x, y, itemWidth, itemHeight));

    if (x >= 0 && y >= 0)
    {
        itemElement.x = x;
        itemElement.y = y;
        itemContainer.itemList.add(itemElement);

        return true;
    }

    return false;
}

function canSwapAt(itemContainer, coordX, coordY, itemX, itemY, itemWidth, itemHeight)
{
    let itemElement = itemContainer.itemList.at(coordX, coordY);
    return itemElement && canPlaceAt(itemContainer, itemX, itemY, itemWidth, itemHeight, itemElement);
}

function canPlaceAt(itemContainer, coordX, coordY, itemWidth, itemHeight, exclude = null)
{
    for(let y = 0; y < itemHeight; ++y)
    {
        for(let x = 0; x < itemWidth; ++x)
        {
            let itemElement = itemContainer.itemList.at(coordX + x, coordY + y);
            if (itemElement && (!exclude || itemElement !== exclude))
            {
                return false;
            }
        }
    }
    return true;
}

function findEmptyCoords(coordX, coordY, maxCoordX, maxCoordY, isEmptyCallback = () => true)
{
    return dijkstra2d(
        coordX, coordY,
        0, 0,
        maxCoordX, maxCoordY,
        isEmptyCallback,
        getNeighborsFromCoords,
        fromCoordsToNode,
        toCoordsFromNode);
}

function fromCoordsToNode(coordX, coordY)
{
    return (coordX & 0xFFFF) << 16 | (coordY & 0xFFFF);
}

function toCoordsFromNode(node, out)
{
    out[0] = node >> 16;
    out[1] = node & 0xFFFF;
    return out;
}

function getNeighborsFromCoords(coordX, coordY, out)
{
    out[0] = fromCoordsToNode(coordX - 1, coordY);
    out[1] = fromCoordsToNode(coordX, coordY - 1);
    out[2] = fromCoordsToNode(coordX + 1, coordY);
    out[3] = fromCoordsToNode(coordX, coordY + 1);
    return out;
}
