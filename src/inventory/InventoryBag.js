import { clearItemList, ItemList, loadItemList, saveItemList } from './ItemList.js';
import { containerMouseUpCallback } from './ContainerHelper.js';
import { upgradeProperty } from './util.js';

const DEFAULT_ITEM_UNIT_SIZE = 48;

const INNER_HTML = `
<article>
    <h2><span class="innerTitle"><slot name="title"></slot></span></h2>
    <section class="container grid">
        <slot></slot>
    </section>
</article>
`;
const INNER_STYLE = `
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
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    font-size: 0.9rem;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    border-radius: ${DEFAULT_ITEM_UNIT_SIZE / 16}rem;
    text-align: center;
    color: white;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 1;
    transform: translateY(-100%);
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
.hidden {
    display: none;
}
`;

export class InventoryBag extends HTMLElement {

    /** @private */
    static get [Symbol.for('templateNode')]() {
        let t = document.createElement('template');
        t.innerHTML = INNER_HTML;
        Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
        return t;
    }

    /** @private */
    static get [Symbol.for('styleNode')]() {
        let t = document.createElement('style');
        t.innerHTML = INNER_STYLE;
        Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
        return t;
    }

    static define(customElements = window.customElements) {
        customElements.define('inventory-bag', this);
    }

    static get observedAttributes() {
        return [
            'rows',
            'cols',
            'type',
        ];
    }

    get rows() {
        return this._rows;
    }

    set rows(value) {
        this.setAttribute('rows', String(value));
    }

    get cols() {
        return this._cols;
    }

    set cols(value) {
        this.setAttribute('cols', String(value));
    }

    get type() {
        return this._type;
    }

    set type(value) {
        this.setAttribute('type', value);
    }

    get size() {
        return [ this.rows, this.cols ];
    }

    set size(value) {
        this.rows = value[0];
        this.cols = value[1];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
        this.shadowRoot.appendChild(this.constructor[Symbol.for('styleNode')].cloneNode(true));

        this._rows = 1;
        this._cols = 1;
        this._type = 'grid';

        this.disabledTransfer = false;
        this.disabledTransferIn = false;
        this.disabledTransferOut = false;
        this.disabledEdit = false;
        this.hidden = false;

        this._root = this.shadowRoot.querySelector('article');
        this._itemSlot = this.shadowRoot.querySelector('.container slot');
        this._container = this.shadowRoot.querySelector('.container');
        this._containerTitle = this.shadowRoot.querySelector('h2');

        this.onItemListChange = this.onItemListChange.bind(this);
        this.onSlotChange = this.onSlotChange.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        
        this.itemList = new ItemList(this, this.onItemListChange);
        this.socket = { item: null, container: null };
    }

    connectedCallback() {
        upgradeProperty(this, 'rows');
        upgradeProperty(this, 'cols');
        upgradeProperty(this, 'type');

        this._container.addEventListener('mouseup', this.onMouseUp);
        this._itemSlot.addEventListener('slotchange', this.onSlotChange);
    }

    disconnectedCallback() {
        this._container.removeEventListener('mouseup', this.onMouseUp);
        this._itemSlot.removeEventListener('slotchange', this.onSlotChange);
    }

    attributeChangedCallback(attribute, prev, value) {
        switch(attribute) {
            case 'rows':
                this._rows = Number(value);
                this.style.setProperty('--container-width', value);
                break;
            case 'cols':
                this._cols = Number(value);
                this.style.setProperty('--container-height', value);
                break;
            case 'type':
                this._type = value;
                break;
        }
    }

    onSlotChange(e)
    {
        this.itemList.update(e.target);
        
        if (this.type === 'socket')
        {
            let itemElement = this.itemList.at(0, 0);
            if (itemElement)
            {
                this.rows = itemElement.w;
                this.cols = itemElement.h;
            }
            else
            {
                this.rows = 1;
                this.cols = 1;
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
    
    onMouseUp(e)
    {
        return containerMouseUpCallback(e, this, 48);
    }
}
InventoryBag.define();

export function isSocketContainer(itemContainer)
{
    return itemContainer.type === 'socket';
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
    itemContainerData.hidden = itemContainer.hidden;

    return itemContainerData;
}

export function loadItemContainer(itemContainer, itemContainerData)
{
    if ('itemList' in itemContainerData)
    {
        loadItemList(itemContainer.itemList, itemContainerData.itemList);
    }

    if ('type' in itemContainerData) itemContainer.type = itemContainerData.type;
    if ('size' in itemContainerData) itemContainer.size = itemContainerData.size;
    if ('hidden' in itemContainerData) itemContainer.hidden = itemContainerData.hidden;

    return itemContainer;
}

export function clearItemContainer(itemContainer)
{
    clearItemList(itemContainer.itemList);

    // BUGFIX: This makes sure that the socketed container is removed. Maybe there's a better way to do this?
    itemContainer.onItemListChange();
}
