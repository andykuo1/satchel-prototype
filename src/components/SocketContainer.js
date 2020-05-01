import { BaseElement, html, css } from './BaseElement.js';

import { saveItemContainer, loadItemContainer, clearItemContainer } from '../SatchelState.js';

export class SocketContainer extends BaseElement
{
    /** @override */
    static get template()
    {
        return html`
        `;
    }

    /** @override */
    static get style()
    {
        return css``;
    }

    constructor()
    {
        super();

        this._containerRoot = null;

        let itemContainer = new ItemContainer();
        itemContainer.type = 'slot';
        itemContainer.filter = itemElement => {
            return itemElement.category === 'Container';
        };
        this.shadowRoot.appendChild(itemContainer);
        this.itemContainer = itemContainer;

        this.socketedItem = null;
        this.socketedItemContainer = null;

        this.onItemChange = this.onItemChange.bind(this);
    }

    /** @override */
    connectedCallback()
    {
        super.connectedCallback();

        this._containerRoot = document.querySelector('#containerRoot');
        
        this._update(null);
        this.itemContainer.addEventListener('itemchange', this.onItemChange);
    }

    /** @override */
    disconnectedCallback()
    {
        super.disconnectedCallback();

        this.itemContainer.removeEventListener('itemchange', this.onItemChange);
        this._update(null);
    }

    onItemChange()
    {
        let socketedItem = this.itemContainer.itemList.at(0, 0);
        this._update(socketedItem);
    }

    _update(itemElement)
    {
        if (itemElement !== this.socketedItem)
        {
            if (this.socketedItem)
            {
                this._containerRoot.removeChild(this.socketedItemContainer);
                unloadSocketedItemContainer(this.socketedItemContainer, this.socketedItem);
                this.socketedItemContainer = null;
                this.socketedItem = null;
            }
    
            if (itemElement)
            {
                this.socketedItem = itemElement;
                this.socketedItemContainer = new ItemContainer();
                loadSocketedItemContainer(this.socketedItemContainer, this.socketedItem);
                this._containerRoot.appendChild(this.socketedItemContainer);
            }
        }
    }
}
BaseElement.define('socket-container', SocketContainer);

function loadSocketedItemContainer(itemContainer, itemElement)
{
    if (itemElement.metadata && itemElement.metadata.container)
    {
        loadItemContainer(itemContainer, itemElement.metadata.container);
        return itemContainer;
    }
    return null;
}

function unloadSocketedItemContainer(itemContainer, itemElement)
{
    let itemContainerData = {};
    saveItemContainer(itemContainer, itemContainerData);
    clearItemContainer(itemContainer);
    if (!('metadata' in itemElement)) itemElement.metadata = {};
    itemElement.metadata.container = itemContainerData;
    return null;
}
