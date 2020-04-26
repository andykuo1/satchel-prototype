import { defaultAndUpgradeProperties, assignProperties, callbackAssignedProperties } from './w.js';
import { ItemElement } from './ItemElement.js';
import * as Satchel from './Satchel.js';

const NumberPair = {
    parse(string)
    {
        if (!string) return [0, 0];
        string = string.trim();
        let a, b;
        let i = string.indexOf(' ');
        let k = i;
        a = Number(string.substring(0, k));
        b = Number(string.substring(k + 1).trim());
        return [a, b];
    },
    stringify(value)
    {
        if (value)
        {
            let a = value[0];
            let b = value[1];
            return `${a} ${b}`;
        }
        else
        {
            return '';
        }
    },
};

class ItemList
{
    constructor()
    {
        this._list = [];
    }

    get length()
    {
        return this._list.length;
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

    get()
    {
        return this._list[0];
    }

    add(item)
    {
        this._list.push(item);
        return true;
    }

    remove(item)
    {
        this._list.splice(this._list.indexOf(item), 1);
        return true;
    }

    values()
    {
        return this._list;
    }

    clear()
    {
        this._list.length = 0;
    }
}

export class ItemContainer extends HTMLElement
{
    static get template()
    {
        const GRID_CELL_SIZE = '32px';
        const INNER_HTML = `
        <article>
            <h2>
                <slot name="title">Container</slot>
            </h2>
            <section class="container grid">
                <slot></slot>
            </section>
        </article>
        `;
        const INNER_STYLE = `
        :host {
            --containerWidth: 1;
            --containerHeight: 1;
        }
        article {
            margin: 0.2rem;
            width: calc(var(--containerWidth) * ${GRID_CELL_SIZE});
        }
        h2 {
            font-size: 0.8em;
            /* Fill the container + grid shadow size */
            width: calc(100% + 0.4em);
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            border-radius: 0.2em;
            user-select: none;
        }
        h2:empty {
            display: none;
        }
        h2:hover {
            background-color: rgba(0, 0, 0, 0.2);
        }
        .container {
            position: relative;
            width: 100%;
            height: calc(var(--containerHeight) * ${GRID_CELL_SIZE});
            background-color: dodgerblue;
            border: 1px solid black;
            border-radius: 1em;
            box-shadow: 0.2rem 0.2rem 0 0 black;
            overflow: hidden;
            transition: width 0.3s ease, height 0.3s ease;
        }
        .grid {
            background-size: ${GRID_CELL_SIZE} ${GRID_CELL_SIZE};
            background-position: -1px -1px;
            background-image:
                linear-gradient(to right, black, transparent 1px),
                linear-gradient(to bottom, black, transparent 1px);
        }
        .container:not(.open) {
            width: 0;
            height: 0;
            border: none;
        }
        `;
        let template = document.createElement('template');
        template.innerHTML = `<style>${INNER_STYLE}</style>${INNER_HTML}`;
        Object.defineProperty(this, 'template', { value: template });
        return template;
    }

    static get properties() {
        return {
            size: { type: NumberPair, value: '1 1' },
            open: { type: Boolean, value: '' },
        };
    }

    constructor()
    {
        super();

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));

        this._itemSlot = this.shadowRoot.querySelector('.container slot');
        this._container = this.shadowRoot.querySelector('.container');
        this._containerTitle = this.shadowRoot.querySelector('h2');

        this._items = new ItemList();

        this.onSlotChange = this.onSlotChange.bind(this);
        this.onTitleClick = this.onTitleClick.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this._callbacks = {
            size: this.onSizeChanged,
            open: this.onOpenChanged,
        };
    }

    /** @override */
    connectedCallback()
    {
        defaultAndUpgradeProperties(this, this.constructor.properties);

        this._container.addEventListener('mouseup', this.onMouseUp);
        this._containerTitle.addEventListener('click', this.onTitleClick);
        this._itemSlot.addEventListener('slotchange', this.onSlotChange);
    }

    /** @override */
    disconnectedCallback()
    {
        this._container.removeEventListener('mouseup', this.onMouseUp);
        this._itemSlot.removeEventListener('slotchange', this.onSlotChange);
    }

    /** @override */
    attributeChangedCallback(attribute, prev, value)
    {
        callbackAssignedProperties(this, attribute, prev, value, this._callbacks);
    }

    onSizeChanged(value)
    {
        this.style.setProperty('--containerWidth', value[0]);
        this.style.setProperty('--containerHeight', value[1]);
    }

    onOpenChanged(value)
    {
        this._container.classList.toggle('open', value);
    }

    onSlotChange(e)
    {
        this._items.clear();
        let nodes = e.target.assignedNodes();
        for(let node of nodes)
        {
            if (node instanceof ItemElement)
            {
                this._items.add(node);
            }
        }
    }

    onMouseUp(e)
    {
        if (e.button === 2) return;
    
        let boundingRect = this._container.getBoundingClientRect();
        let offsetX = e.pageX - boundingRect.x;
        let offsetY = e.pageY - boundingRect.y;
    
        let coordX = Math.trunc(offsetX / 32);
        let coordY = Math.trunc(offsetY / 32);

        let result = Satchel.putDown(this, coordX, coordY);
        if (result)
        {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    onTitleClick(e)
    {
        e.preventDefault();
        e.stopPropagation();

        this.open = !this.open;
    }

    clear()
    {
        for(let itemElement of this._items.values())
        {
            this.removeChild(itemElement);
        }
    }

    get itemList()
    {
        return this._items;
    }
}
assignProperties(ItemContainer, ItemContainer.properties);
window.customElements.define('item-container', ItemContainer);
