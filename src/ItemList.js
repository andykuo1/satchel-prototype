import { ItemElement } from './components/ItemElement.js';

export class ItemList
{
    constructor(containerElement)
    {
        this._element = containerElement;
        this._slotElement = null;

        this._list = [];
    }

    get length() { return this._list.length; }

    update(slotElement)
    {
        this._list.length = 0;
        this._slotElement = slotElement;
        
        let nodes = slotElement.assignedNodes();
        for(let node of nodes)
        {
            if (node instanceof ItemElement)
            {
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
        // Althuogh later it will update automatically, this makes sure synchronous calls are in a valid state.
        this._list.push(itemElement);
        return true;
    }

    remove(itemElement)
    {
        this._element.removeChild(itemElement);
        // Althuogh later it will update automatically, this makes sure synchronous calls are in a valid state.
        this._list.splice(this._list.indexOf(itemElement), 1);
        return true;
    }

    clear()
    {
        if (!this._slotElement) return;

        this._list.length = 0;

        for(let node of this._slotElement.assignedNodes())
        {
            if (node instanceof ItemElement)
            {
                this._element.removeChild(node);
            }
        }

        this._slotElement = null;
    }

    [Symbol.iterator]()
    {
        return this._list[Symbol.iterator]();
    }
};
