import { BaseElement } from './BaseElement.js';

import * as Satchel from '../Satchel.js';

export class ItemDisplay extends BaseElement
{
    /** @override */
    static get template()
    {
        return `
        <section>
            <h3 id="type">Unknown Item</h3>
            <p id="name">???</p>
            <p id="content">
                <item-container type="slot">
                </item-container>
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
        this._type = this.shadowRoot.querySelector('#type');
        this._name = this.shadowRoot.querySelector('#name');
        this._content = this.shadowRoot.querySelector('#content');
        this._container = this.shadowRoot.querySelector('item-container');

        this._connected = false;
        
        this.item = item;

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
        this._root.style.setProperty('pointer-events', this.editable ? 'unset' : 'none');

        this._connected = true;
        this.setItem(this.item);
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

    onMouseDown(e)
    {
        if (e.button === 2) return;

        if (!this.item) return;
        let result = Satchel.pickUp(this.item, this._container);
        if (result)
        {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    onMouseUp(e)
    {
        if (e.button === 2) return;

        let holdingItem = Satchel.getHoldingItem();
        if (!holdingItem) return;
        let result = Satchel.placeDown(this._container, 0, 0);
        if (result)
        {
            this.item = holdingItem;
            e.preventDefault();
            e.stopPropagation();
        }
    }

    setItem(item)
    {
        if (!this._connected)
        {
            this.item = item;
        }
        else
        {
            if (this.item)
            {
                this._container.innerHTML = '';
            }
    
            if (item)
            {
                this._container.appendChild(item);
            }

            this.item = item;
        }
        return this;
    }
}
BaseElement.define('item-display', ItemDisplay);
