import { ItemElement } from './components/ItemElement.js';

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
            if (node instanceof ItemElement)
            {
                prepare(this, node);
                this._list.push(node);
            }
        }

        if (this._changeCallback) this._changeCallback(this._element);
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
        prepare(this, itemElement);
        this._element.appendChild(itemElement);
        this._list.push(itemElement);
        return true;
    }

    delete(itemElement)
    {
        reset(this, itemElement);
        this._element.removeChild(itemElement);
        this._list.splice(this._list.indexOf(itemElement), 1);
        return true;
    }

    has(itemElement)
    {
        return this._list.includes(itemElement);
    }

    clear()
    {
        if (!this._slotElement) return;

        resetAll(this, this._list);

        for(let node of this._slotElement.assignedNodes())
        {
            if (node instanceof ItemElement)
            {
                this._element.removeChild(node);
            }
        }

        this._slotElement = null;
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