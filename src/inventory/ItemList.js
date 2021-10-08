import { InventoryItem, loadItemElement, saveItemElement } from './InventoryItem.js';

export class ItemList
{
    constructor(containerElement, changeCallback = null)
    {
        this._element = containerElement;
        this._slotElement = null;

        this._changeCallback = changeCallback;

        this._list = [];

        this.onItemChange = this.onItemChange.bind(this);
    }

    get length() { return this._list.length; }

    update(slotElement)
    {
        resetAll(this, this._list);

        this._slotElement = slotElement;
        
        let nodes = slotElement.assignedNodes();
        for(let node of nodes)
        {
            if (node instanceof InventoryItem)
            {
                prepare(this, node);
                this._list.push(node);
            }
        }
    }

    at(coordX, coordY)
    {
        for(let item of this._list)
        {
            if (coordX >= item.x && coordX < item.x + item.w
                && coordY >= item.y && coordY < item.y + item.h)
            {
                return item;
            }
        }
        return null;
    }

    add(itemElement)
    {
        this._element.appendChild(itemElement);
        this._list.push(itemElement);
        prepare(this, itemElement);
        if (this._changeCallback) this._changeCallback(this._slotElement);
        return true;
    }

    delete(itemElement)
    {
        reset(this, itemElement);
        this._element.removeChild(itemElement);
        this._list.splice(this._list.indexOf(itemElement), 1);
        if (this._changeCallback) this._changeCallback(this._slotElement);
        return true;
    }

    has(itemElement)
    {
        return this._list.includes(itemElement);
    }

    clear()
    {
        if (!this._slotElement) return;
        let slotElement = this._slotElement;

        resetAll(this, this._list);

        for(let node of slotElement.assignedNodes())
        {
            if (node instanceof InventoryItem)
            {
                this._element.removeChild(node);
            }
        }

        this._slotElement = null;
        if (this._changeCallback) this._changeCallback(slotElement);
    }

    onItemChange(e)
    {
        if (this._changeCallback) this._changeCallback(e.target);
    }

    [Symbol.iterator]()
    {
        return this._list[Symbol.iterator]();
    }
};

export function saveItemList(itemList, itemListData)
{
    let result = [];
    for(let itemElement of itemList)
    {
        let itemData = {};
        saveItemElement(itemElement, itemData);
        result.push(itemData);
    }
    itemListData.items = result;

    return itemListData;
}

export function loadItemList(itemList, itemListData)
{
    if ('items' in itemListData)
    {
        for(let itemData of itemListData.items)
        {
            let itemElement = loadItemElement(new InventoryItem(), itemData);
            itemList.add(itemElement);
        }
    }

    return itemList;
}

export function clearItemList(itemList)
{
    itemList.clear();
}

function prepare(itemList, itemElement)
{
    itemElement.addEventListener('change', itemList.onItemChange);
    return itemElement;
}

function reset(itemList, itemElement)
{
    itemElement.removeEventListener('change', itemList.onItemChange);
    return itemElement;
}

function resetAll(itemList, itemElements)
{
    let result = [];
    for(let itemElement of itemElements)
    {
        reset(itemList, itemElement);
        result.push(itemElement);
    }
    itemElements.length = 0;
    return result;
}