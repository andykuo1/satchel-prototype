import { BaseElement, html, css } from './BaseElement.js';

import * as Satchel from '../Satchel.js';

export class ItemDisplay extends BaseElement
{
    /** @override */
    static get template()
    {
        return html`
        <section>
            <div>
            </div>
            <div>
                <h3 id="category"></h3>
                <p id="name"></p>
                <p id="content">
                    <item-container type="slot" disabled-transfer disabled-edit></item-container>
                </p>
                <p id="detail"></p>
            </div>
            <div>
            </div>
        </section>
        `;
    }

    /** @override */
    static get style()
    {
        return css`
        section {
            display: flex;
            flex-direction: row;
            padding: 0.5rem;
            margin: 0.5rem 0;
            text-align: center;
            border: 1px solid #EEEEEE;
            user-select: none;
        }
        section:hover {
            background-color: #EEEEEE;
        }
        section > * {
            flex: 1;
        }
        #detail {
            overflow-y: auto;
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

    /** @override */
    get changedAttributes()
    {
        return {
            editable: value => this._container.disabledTransfer = !value,
        };
    }

    constructor(item)
    {
        super();

        this._root = this.shadowRoot.querySelector('section');
        this._category = this.shadowRoot.querySelector('#category');
        this._name = this.shadowRoot.querySelector('#name');
        this._detail = this.shadowRoot.querySelector('#detail');
        this._content = this.shadowRoot.querySelector('#content');
        this._container = this.shadowRoot.querySelector('item-container');

        this._connected = false;
        this._item = item;

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onItemUpdate = this.onItemUpdate.bind(this);
    }

    /** @override */
    connectedCallback()
    {
        super.connectedCallback();

        this._root.addEventListener('mousedown', this.onMouseDown);
        this._root.addEventListener('mouseup', this.onMouseUp);
        this._container.addEventListener('itemchange', this.onItemUpdate);

        this._connected = true;
        
        // Debounce this call until after this call.
        setTimeout(() => this.setItem(this._item));
    }

    /** @override */
    disconnectedCallback()
    {
        super.disconnectedCallback();

        this._root.removeEventListener('mousedown', this.onMouseDown);
        this._root.removeEventListener('mouseup', this.onMouseUp);
        this._container.removeEventListener('itemchange', this.onItemUpdate);

        this.setItem(null);
        this._connected = false;
    }

    onItemUpdate(e)
    {
        this._item = this._container.itemList.at(0, 0);
        let { name, category, detail } = this._item || {};
        this._name.textContent = name || '';
        this._category.textContent = category || '';
        this._detail.textContent = detail || '';
    }

    onMouseDown(e)
    {
        if (this._container.disabledTransfer || this._container.disabledTransferOut) return;
        if (e.button === 2) return;

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
        if (this._container.disabledTransfer || this._container.disabledTransferIn) return;
        if (e.button === 2) return;

        let holdingItem = Satchel.getHoldingItem();
        if (!holdingItem) return;
        let result = Satchel.placeDown(this._container, 0, 0, this._container.disabledTransferOut);
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
