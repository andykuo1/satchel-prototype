import { BaseElement } from './BaseElement.js';

import { ItemContainer } from './ItemContainer.js';

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

        this._type = this.shadowRoot.querySelector('#type');
        this._name = this.shadowRoot.querySelector('#name');
        this._content = this.shadowRoot.querySelector('#content');
        this._itemContainer = this.shadowRoot.querySelector('item-container');

        this._connected = false;
        
        this.item = item;

        this.attributeCallbacks = {
            editable: this.onEditableChanged,
        };
    }

    /** @override */
    connectedCallback()
    {
        super.connectedCallback();

        this._connected = true;
        this.setItem(this.item);
    }

    /** @override */
    disconnectedCallback()
    {
        super.disconnectedCallback();

        this.setItem(null);
        this._connected = false;
    }

    onEditableChanged(value)
    {
        this._content.style.setProperty('pointer-events', value ? 'unset' : 'none');
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
                this._itemContainer.innerHTML = '';
            }
    
            if (item)
            {
                this._itemContainer.appendChild(item);
            }

            this.item = item;
        }
        return this;
    }
}
BaseElement.define('item-display', ItemDisplay);
