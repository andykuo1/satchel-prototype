import { BaseElement } from './BaseElement.js';

import * as Satchel from '../Satchel.js';

export class ItemDisplay extends BaseElement
{
    /** @override */
    static get template()
    {
        return `
        <section>
            <h3 id="category"></h3>
            <p id="name"></p>
            <p id="content">
                <item-container type="slot"></item-container>
            </p>
        </section>
        `;
    }

    /** @override */
    static get style()
    {
        return `
        section {
            padding: 0.5rem;
            margin: 0.5rem 0;
            text-align: center;
            border: 1px solid #EEEEEE;
            user-select: none;
        }
        section:hover {
            background-color: #EEEEEE;
        }
        #content {
            pointer-events: none;
        }
        `;
    }

    /** @override */
    static get properties()
    {
        return {
            editable: Boolean,
        };
    }

    constructor(item)
    {
        super();

        this._root = this.shadowRoot.querySelector('section');
        this._category = this.shadowRoot.querySelector('#category');
        this._name = this.shadowRoot.querySelector('#name');
        this._content = this.shadowRoot.querySelector('#content');
        this._container = this.shadowRoot.querySelector('item-container');

        this._connected = false;
        this._item = item;

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this.attributeCallbacks = {
            editable: this.onEditableChanged,
        };
    }

    /** @override */
    connectedCallback()
    {
        super.connectedCallback();

        this._root.addEventListener('mousedown', this.onMouseDown);
        this._root.addEventListener('mouseup', this.onMouseUp);

        this._connected = true;
        this.setItem(this._item);
    }

    /** @override */
    disconnectedCallback()
    {
        super.disconnectedCallback();

        this._root.removeEventListener('mousedown', this.onMouseDown);
        this._root.removeEventListener('mouseup', this.onMouseUp);

        this.setItem(null);
        this._connected = false;
    }

    onEditableChanged(value)
    {
        this._root.style.setProperty('pointer-events', value ? 'unset' : 'none');
    }

    onItemUpdate()
    {
        let { name, category } = this._item || {};
        this._name.textContent = name || '';
        this._category.textContent = category || '';
    }

    onMouseDown(e)
    {
        if (e.button === 2) return;
        if (!this.editable) return;

        if (!this._item) return;
        let result = Satchel.pickUp(this._item, this._container);
        if (result)
        {
            this.setItem(null, false);
            e.preventDefault();
            e.stopPropagation();
        }
    }

    onMouseUp(e)
    {
        if (e.button === 2) return;
        if (!this.editable) return;

        let holdingItem = Satchel.getHoldingItem();
        if (!holdingItem) return;
        let result = Satchel.placeDown(this._container, 0, 0);
        if (result)
        {
            this.setItem(holdingItem, false);
            e.preventDefault();
            e.stopPropagation();
        }
    }

    setItem(item, forceContainerUpdate = this._connected)
    {
        if (forceContainerUpdate)
        {
            let prevItem = this._item;
            if (this._container.contains(prevItem))
            {
                this._container.removeChild(prevItem);
            }
    
            if (item)
            {
                this._container.appendChild(item);
            }
        }

        this._item = item;
        this.onItemUpdate();
        return this;
    }

    getItem()
    {
        return this._item;
    }
}
BaseElement.define('item-display', ItemDisplay);
