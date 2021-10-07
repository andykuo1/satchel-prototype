import { putDown } from './InventoryHelper.js';

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
