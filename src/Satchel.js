import { dijkstra2d, distanceSquared } from './util.js';
import { importLootDialog } from './SatchelState.js';
import { clearItemContainer, ItemContainer } from './components/ItemContainer.js';

const PLACE_BUFFER_RANGE_SQUARED = 8 * 8;
const PLACE_BUFFER_TIMEOUT = 300;

let holding = {
    container: null,
    x: 0,
    y: 0,
    pick: { x: 0, y: 0 },
    placeDownBuffer: true,
    placeDownBufferTimeoutHandle: null,
};

document.addEventListener('DOMContentLoaded', () => {
    holding.container = document.querySelector('#holding');
    holding.container.style.position = 'absolute';
    holding.container.style.display = 'none';
    holding.container.addEventListener('itemchange', onHoldingContainerChange);
    
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
    const holdingOffset = 10;
    holding.container.style.setProperty('left', holding.x - holdingOffset + 'px');
    holding.container.style.setProperty('top', holding.y - holdingOffset + 'px');

    if (distanceSquared(holding.x, holding.y, holding.pick.x, holding.pick.y) >= PLACE_BUFFER_RANGE_SQUARED)
    {
        holding.placeDownBuffer = true;

        clearTimeout(holding.placeDownBufferTimeoutHandle);
        holding.placeDownBufferTimeoutHandle = null;
    }
}

function onMouseUp(e)
{
    e.preventDefault();
    e.stopPropagation();

    if (holding.container && holding.container.itemList.length > 0 && holding.placeDownBuffer)
    {
        let result = putOnGroundFromHolding();
        if (!result)
        {
            // Leave it in the holding container.
        }
    }
}

function onHoldingContainerChange(e)
{
    if (holding.container)
    {
        let itemElement = holding.container.itemList.at(0, 0);
        if (itemElement)
        {
            holding.container._containerTitle.textContent = itemElement.name;
        }
        else
        {
            holding.container._containerTitle.textContent = '';
        }
    }
}

function onGroundSlotContainerChange(e)
{
    let target = e.target;
    let itemElement = target.itemList.at(0, 0);
    if (!itemElement)
    {
        cleanUpGroundSlotContainer(target);
        target.parentNode.removeChild(target);
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

    let otherBlobs = [];
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
        otherBlobs.push(fileBlob);
        return prev;
    }, Promise.resolve()).then(() => {
        if (otherBlobs.length > 0)
        {
            window.alert('Sorry, but these do not look like loot.\n\n'
                + otherBlobs.map(fileBlob => fileBlob.name).join('\n'));
        }
    });
}

function startHolding(holding, itemElement)
{
    itemElement.x = 0;
    itemElement.y = 0;

    holding.container.itemList.add(itemElement);
    holding.container.style.display = 'unset';

    holding.placeDownBuffer = false;
    holding.pick.x = holding.x;
    holding.pick.y = holding.y;
    holding.placeDownBufferTimeoutHandle = setTimeout(() => {
        if (!holding.placeDownBuffer) holding.placeDownBuffer = true;
    }, PLACE_BUFFER_TIMEOUT);
}

function stopHolding(holding, itemElement)
{
    holding.container.itemList.delete(itemElement);
    holding.container.style.display = 'none';

    holding.placeDownBuffer = true;

    clearTimeout(holding.placeDownBufferTimeoutHandle);
    holding.placeDownBufferTimeoutHandle = null;
}

export function getHoldingItem()
{
    return holding.container.itemList.at(0, 0);
}

export function setUpGroundSlotContainer(itemContainer)
{
    itemContainer.type = 'slot';
    itemContainer.addEventListener('itemchange', onGroundSlotContainerChange);
}

export function cleanUpGroundSlotContainer(itemContainer)
{
    itemContainer.removeEventListener('itemchange', onGroundSlotContainerChange);
}

export function putOnGroundFromHolding()
{
    let itemElement = holding.container.itemList.at(0, 0);
    stopHolding(holding, itemElement);
    putOnGround(itemElement);
}

export function putOnGround(itemElement)
{
    let ground = document.querySelector('#ground');
    let groundSlotContainer = new ItemContainer();
    setUpGroundSlotContainer(groundSlotContainer);
    putIn(groundSlotContainer, itemElement);
    ground.appendChild(groundSlotContainer);
}

export function clearGround()
{
    let ground = document.querySelector('#ground');
    for(let groundSlotContainer of ground.querySelectorAll('item-container'))
    {
        clearItemContainer(groundSlotContainer);
    }
    ground.innerHTML = '';
}

export function pickUp(itemElement, itemContainer)
{
    if (!holding.container || holding.container.itemList.length > 0) return false;

    itemContainer.itemList.delete(itemElement);
    startHolding(holding, itemElement);
    return true;
}

export function placeDown(itemContainer, coordX, coordY, trySwap = true, fromHolding = true, fromItemElement = null)
{
    if (fromHolding && (!holding.container || holding.container.itemList.length <= 0 || !holding.placeDownBuffer)) return false;
    
    let itemElement = fromHolding ? holding.container.itemList.at(0, 0) : fromItemElement;

    // Always check with the filter first if defined.
    if (itemContainer.filter && !itemContainer.filter.call(itemContainer, itemElement))
    {
        return false;
    }

    // This is a socket.
    if (itemContainer.type === 'socket')
    {
        return placeDownInSocketContainer(itemContainer, itemElement, fromHolding);
    }

    // This is a slot.
    if (itemContainer.type === 'slot')
    {
        return placeDownInSlotContainer(itemContainer, itemElement, trySwap, fromHolding);
    }

    // This is NOT a slot.
    let [ containerWidth, containerHeight ] = itemContainer.size;
    let { w: itemWidth, h: itemHeight } = itemElement;
    let maxCoordX = containerWidth - itemWidth;
    let maxCoordY = containerHeight - itemHeight;
    let targetCoordX = Math.min(Math.max(0, coordX), maxCoordX);
    let targetCoordY = Math.min(Math.max(0, coordY), maxCoordY);

    if (maxCoordX < 0 || maxCoordY < 0) return false;

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
        if (fromHolding)
        {
            stopHolding(holding, itemElement);
        }

        itemElement.x = x;
        itemElement.y = y;
        itemContainer.itemList.add(itemElement);

        return true;
    }

    return false;
}

function placeDownInSlotContainer(itemContainer, itemElement, trySwap, fromHolding)
{
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
        if (fromHolding)
        {
            stopHolding(holding, itemElement);
        }

        itemElement.x = 0;
        itemElement.y = 0;
        itemContainer.itemList.add(itemElement);

        return true;
    }
}

function placeDownInSocketContainer(itemContainer, itemElement, fromHolding)
{
    if (itemContainer.itemList.length > 0)
    {
        if (!itemContainer.socket.container) throw new Error('Cannot find socketed container.');

        if (fromHolding)
        {
            stopHolding(holding, itemElement);
        }

        let result = putIn(itemContainer.socket.container, itemElement);

        if (!result && fromHolding)
        {
            startHolding(holding, itemElement);
        }

        return result;
    }
    else if (itemElement.category === 'Container')
    {
        if (fromHolding)
        {
            stopHolding(holding, itemElement);
        }

        itemElement.x = 0;
        itemElement.y = 0;
        itemContainer.itemList.add(itemElement);

        return true;
    }
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
    return placeDown(itemContainer, 0, 0, false, false, itemElement);
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
