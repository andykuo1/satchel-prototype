import { updateCursorPosition } from './CursorHelper.js';
import { pickUp, putDown } from './InventoryHelper.js';

export function itemMouseDownCallback(mouseEvent, itemElement, unitSize) {
    let containerElement = itemElement.container;
    let boundingRect = containerElement._container.getBoundingClientRect();
    let clientCoordX = getClientCoordX(boundingRect, mouseEvent.clientX, unitSize);
    let clientCoordY = getClientCoordY(boundingRect, mouseEvent.clientY, unitSize);
    let result = pickUp(itemElement, containerElement, clientCoordX, clientCoordY);
    updateCursorPosition(mouseEvent.clientX, mouseEvent.clientY, unitSize);
    if (result)
    {
        mouseEvent.preventDefault();
        mouseEvent.stopPropagation();
        return false;
    }
}

export function containerMouseUpCallback(mouseEvent, containerElement, unitSize)
{
    let boundingRect = containerElement._container.getBoundingClientRect();
    let clientCoordX = getClientCoordX(boundingRect, mouseEvent.clientX, unitSize);
    let clientCoordY = getClientCoordY(boundingRect, mouseEvent.clientY, unitSize);
    let result = putDown(containerElement, clientCoordX, clientCoordY);
    if (result)
    {
        mouseEvent.preventDefault();
        mouseEvent.stopPropagation();
        return false;
    }
}

export function getClientCoordX(elementBoundingRect, clientX, unitSize) {
    return Math.trunc((clientX - elementBoundingRect.x) / unitSize);
}

export function getClientCoordY(elementBoundingRect, clientY, unitSize) {
    return Math.trunc((clientY - elementBoundingRect.y) / unitSize);
}
