import { BaseElement, html, css } from './BaseElement.js';

import { NumberPair } from './util/types.js';

import { placeDown } from '../Satchel.js';
import { ItemList, loadItemList, saveItemList, clearItemList } from '../ItemList.js';

const DEFAULT_ITEM_UNIT_SIZE = 64;

export class ItemContainer extends BaseElement
{
    /** @override */
    static get template()
    {
        return html`
        <article>
            <h2><slot name="title"></slot></h2>
            <section class="container grid">
                <slot></slot>
            </section>
        </article>
        `;
    }

    /** @override */
    static get style()
    {
        return css`
        :host {
            --background-color: dodgerblue;
            --container-width: 1;
            --container-height: 1;
            --item-unit-size: ${DEFAULT_ITEM_UNIT_SIZE}px;
            --transition-duration: 0.3s;
        }
        article {
            display: inline-block;
            width: calc(var(--container-width) * var(--item-unit-size));
            transition: width var(--transition-duration) ease;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
        }
        h2 {
            font-size: 0.8rem;
            width: 100%;
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            border-radius: 0.2rem;
        }
        h2:empty {
            display: none;
        }
        .container {
            position: relative;
            width: 100%;
            height: calc(var(--container-height) * var(--item-unit-size));
            background-color: var(--background-color);
            border: 1px solid black;
            border-radius: 1rem;
            box-shadow: 0.2rem 0.2rem 0 0 black;
            overflow: hidden;
            transition: height var(--transition-duration) ease;
        }
        .grid {
            background-size: var(--item-unit-size) var(--item-unit-size);
            background-position: -1px -1px;
            background-image:
                linear-gradient(to right, black, transparent 1px),
                linear-gradient(to bottom, black, transparent 1px);
        }
        `;
    }

    /** @override */
    static get properties() {
        return {
            size: { type: NumberPair, value: '1 1' },
            type: { type: String, value: 'grid' },
            filter: Function,
            unit: { type: Number, value: `${DEFAULT_ITEM_UNIT_SIZE}` },
            disabledTransfer: Boolean,
            disabledTransferIn: Boolean,
            disabledTransferOut: Boolean,
            disabledEdit: Boolean,
        };
    }

    /** @override */
    get changedAttributes()
    {
        return {
            size: value => {
                this.style.setProperty('--container-width', value[0]);
                this.style.setProperty('--container-height', value[1]);
            },
            unit: value => {
                this.style.setProperty('--item-unit-size', value + 'px');
            },
        };
    }

    constructor()
    {
        super();

        this._itemSlot = this.shadowRoot.querySelector('.container slot');
        this._container = this.shadowRoot.querySelector('.container');
        this._containerTitle = this.shadowRoot.querySelector('h2');

        this.onItemListChange = this.onItemListChange.bind(this);
        this.onSlotChange = this.onSlotChange.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onSocketedContainerChange = this.onSocketedContainerChange.bind(this);
        
        this.itemList = new ItemList(this, this.onItemListChange);
        this.socket = { item: null, container: null };
    }

    /** @override */
    connectedCallback()
    {
        super.connectedCallback();

        this._container.addEventListener('mouseup', this.onMouseUp);
        this._containerTitle.addEventListener('click', this.onTitleClick);
        this._itemSlot.addEventListener('slotchange', this.onSlotChange);
    }

    /** @override */
    disconnectedCallback()
    {
        super.disconnectedCallback();
        
        this._container.removeEventListener('mouseup', this.onMouseUp);
        this._containerTitle.removeEventListener('click', this.onTitleClick);
        this._itemSlot.removeEventListener('slotchange', this.onSlotChange);
    }

    onSlotChange(e)
    {
        this.itemList.update(e.target);
        
        if (this.type === 'slot' || this.type === 'socket')
        {
            let itemElement = this.itemList.at(0, 0);
            if (itemElement)
            {
                this.size = [ itemElement.w, itemElement.h ];

                // TODO: This is nice, but not robust enough.
                if (itemElement.name)
                {
                    this._containerTitle.textContent = itemElement.name;
                }
            }
            else
            {
                this.size = [ 1, 1 ];
                
                // TODO: This is nice, but not robust enough.
                this._containerTitle.textContent = '';
            }
        }
    }

    onItemListChange()
    {
        this.dispatchEvent(new CustomEvent('itemchange', { composed: true, bubbles: false }));

        // Socket containers
        if (this.type === 'socket')
        {
            let itemElement = this.itemList.at(0, 0);
            let socketItem = this.socket.item;
            if (socketItem !== itemElement)
            {
                let socketContainerRoot = document.querySelector('#socketContainerRoot');

                // Remove the existing socketed item
                if (socketItem)
                {
                    // Save the container to the item.
                    let socketContainer = this.socket.container;

                    socketContainer.removeEventListener('itemchange', this.onSocketedContainerChange);

                    let socketContainerData = {};
                    saveItemContainer(socketContainer, socketContainerData);
                    clearItemContainer(socketContainer);
                    if (!socketItem.metadata) socketItem.metadata = {};
                    socketItem.metadata.containerData = socketContainerData;
                    
                    socketContainerRoot.removeChild(socketContainer);
                    this.socket.container = null;
                    this.socket.item = null;
                }

                // Add the new socketed item
                if (itemElement && itemElement.category === 'Container')
                {
                    let socketContainer = new ItemContainer();
                    socketContainer.type = 'grid';
                    socketContainer.size = [ itemElement.w, itemElement.h ];

                    // Load the container from the item.
                    if (itemElement.metadata && itemElement.metadata.containerData)
                    {
                        let socketContainerData = itemElement.metadata.containerData;
                        loadItemContainer(socketContainer, socketContainerData);
                    }

                    socketContainer.addEventListener('itemchange', this.onSocketedContainerChange);

                    socketContainerRoot.appendChild(socketContainer);
                    this.socket.container = socketContainer;
                    this.socket.item = itemElement;
                }

                this.onSocketedItemChange(socketItem, itemElement);
            }
        }
    }

    onSocketedItemChange(prev, next)
    {
        if (next)
        {
            this.unit = DEFAULT_ITEM_UNIT_SIZE / (Math.min(next.w, next.h) || 1);
        }
        else
        {
            this.unit = DEFAULT_ITEM_UNIT_SIZE;
        }
    }

    onSocketedContainerChange(e)
    {
        if (e.target !== this.socket.container) throw new Error('Mismatched socketed container.');

        let itemContainerData = {};
        saveItemContainer(e.target, itemContainerData);
        let socketItem = this.socket.item;
        if (!socketItem.metadata) socketItem.metadata = {};
        socketItem.metadata.containerData = itemContainerData;
    }

    onMouseUp(e)
    {
        if (!canTransferItemIn(this)) return;
        if (e.button === 2) return;
    
        let boundingRect = this._container.getBoundingClientRect();
        let offsetX = e.clientX - boundingRect.x;
        let offsetY = e.clientY - boundingRect.y;
    
        const UNIT_SIZE = this.unit;
        let coordX = Math.trunc(offsetX / UNIT_SIZE);
        let coordY = Math.trunc(offsetY / UNIT_SIZE);

        let result = placeDown(this, coordX, coordY, this.disabledTransferOut);
        if (result)
        {
            e.preventDefault();
            e.stopPropagation();
        }
    }
}
BaseElement.define('item-container', ItemContainer);

export function isSocketContainer(itemContainer)
{
    return itemContainer.type === 'socket';
}

export function isSlotContainer(itemContainer)
{
    return itemContainer.type === 'slot';
}

export function isGridContainer(itemContainer)
{
    return itemContainer.type === 'grid';
}

export function canTransferItemIn(itemContainer)
{
    return itemContainer && !itemContainer.disabledTransfer && !itemContainer.disabledTransferIn;
}

export function canTransferItemOut(itemContainer)
{
    return itemContainer && !itemContainer.disabledTransfer && !itemContainer.disabledTransferOut;
}

export function saveItemContainer(itemContainer, itemContainerData)
{
    let itemListData = {};
    saveItemList(itemContainer.itemList, itemListData);
    itemContainerData.itemList = itemListData;

    itemContainerData.type = itemContainer.type;
    itemContainerData.size = itemContainer.size;

    return itemContainerData;
}

export function loadItemContainer(itemContainer, itemContainerData)
{
    if ('itemList' in itemContainerData)
    {
        loadItemList(itemContainer.itemList, itemContainerData.itemList);
    }

    if ('type' in itemContainerData)
    {
        itemContainer.type = itemContainerData.type;
    }

    if ('size' in itemContainerData)
    {
        itemContainer.size = itemContainerData.size;
    }

    return itemContainer;
}

export function clearItemContainer(itemContainer)
{
    clearItemList(itemContainer.itemList);
}
