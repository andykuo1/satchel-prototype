import { BaseElement, html, css } from './BaseElement.js';

import { DEFAULT_ITEM } from '../assets.js';
import { pickUp } from '../Satchel.js';
import { canTransferItemOut } from './ItemContainer.js';

export class ItemElement extends BaseElement
{
    /** @override */
    static get template()
    {
        return html`
        <figure class="container">
            <img>
            <figcaption></figcaption>
        </figure>
        `;
    }

    /** @override */
    static get style()
    {
        return css`
        :host {
            --itemX: 0;
            --itemY: 0;
            --itemWidth: 1;
            --itemHeight: 1;
            --itemTitleOpacity: 0;
            /* var(--item-unit-size) is inherited from parent container. */
        }
        .container {
            display: inline-block;
            position: absolute;
            left: calc(var(--itemX) * var(--item-unit-size));
            top: calc(var(--itemY) *  var(--item-unit-size));
            width: calc(var(--itemWidth) *  var(--item-unit-size));
            height: calc(var(--itemHeight) *  var(--item-unit-size));
            padding: 0;
            margin: 0;
            user-select: none;
            box-shadow: 0 0 0 rgba(0, 0, 0, 0);
            transition: box-shadow 0.3s ease;
        }
        .container:hover {
            background-color: rgba(0, 0, 0, 0.2);
            box-shadow: 0 0 0.7rem rgba(0, 0, 0, 0.6);
            z-index: 1;
        }
        img {
            width: 100%;
            height: 100%;
        }
        figcaption {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 10px;
            opacity: var(--itemTitleOpacity);
            text-align: center;
            transition: opacity 0.1s ease, bottom 0.1s ease;
            color: white;
            background-color: rgba(0, 0, 0, 0.7);
        }
        .container:hover figcaption:not(.active), figcaption.active {
            opacity: 1;
        }
        `;
    }

    /** @override */
    static get properties()
    {
        return {
            x: { type: Number, value: 0 },
            y: { type: Number, value: 0 },
            w: { type: Number, value: 1 },
            h: { type: Number, value: 1 },
            src: { type: String, value: DEFAULT_ITEM },
            name: { type: String, value: 'Unknown' },
            category: { type: String, value: 'Item' },
            detail: { type: String, value: '' },
        };
    }

    /** @override */
    get changedAttributes()
    {
        return {
            name: value => {
                this._image.alt = value;
                this._caption.textContent = value;
            },
        };
    }

    constructor()
    {
        super();

        this._image = this.shadowRoot.querySelector('img');
        this._caption = this.shadowRoot.querySelector('figcaption');

        this.container = null;

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
    }

    /** @override */
    connectedCallback()
    {
        super.connectedCallback();

        this.addEventListener('mousedown', this.onMouseDown);
        this.addEventListener('contextmenu', this.onContextMenu);

        this.container = this.closest('item-container');

        this.style.setProperty('--itemX', this.x);
        this.style.setProperty('--itemY', this.y);
        this.style.setProperty('--itemWidth', this.w);
        this.style.setProperty('--itemHeight', this.h);
        
        this._image.src = this.src;
    }

    /** @override */
    disconnectedCallback()
    {
        super.disconnectedCallback();
        
        this.removeEventListener('mousedown', this.onMouseDown);
        this.removeEventListener('contextmenu', this.onContextMenu);
        this.container = null;
    }

    /** @override */
    attributeChangedCallback(attribute, prev, value)
    {
        super.attributeChangedCallback(attribute, prev, value);

        this.dispatchEvent(new CustomEvent('change', { composed: true, bubbles: false }));
    }

    onContextMenu(e)
    {
        // Don't open the context menu regardless of what happens.
        e.preventDefault();
        e.stopPropagation();
        
        if (this.container && this.container.disabledEdit) return;
        
        let contextMenu = document.querySelector('#contextmenu');
        if (contextMenu)
        {
            contextMenu.setItem(this, e.pageX, e.pageY);
        }
    }

    onMouseDown(e)
    {
        if (!canTransferItemOut(this.container)) return;
        if (e.button === 2) return;

        let result = pickUp(this, this.container);
        if (result)
        {
            e.preventDefault();
            e.stopPropagation();
        }
    }
}
BaseElement.define('item-element', ItemElement);

export function saveItemElement(itemElement, itemData)
{
    itemData.x = itemElement.x || 0;
    itemData.y = itemElement.y || 0;
    itemData.w = itemElement.w;
    itemData.h = itemElement.h;
    itemData.src = itemElement.src;
    itemData.name = itemElement.name;
    itemData.category = itemElement.category;
    itemData.detail = itemElement.detail;
    itemData.metadata = itemElement.metadata;

    return itemData;
}

export function loadItemElement(itemElement, itemData)
{
    if ('x' in itemData) itemElement.x = Number(itemData.x) || 0;
    if ('y' in itemData) itemElement.y = Number(itemData.y) || 0;
    if ('w' in itemData) itemElement.w = itemData.w;
    if ('h' in itemData) itemElement.h = itemData.h;
    if ('src' in itemData) itemElement.src = itemData.src;
    if ('name' in itemData) itemElement.name = itemData.name;
    if ('category' in itemData) itemElement.category = itemData.category;
    if ('detail' in itemData) itemElement.detail = itemData.detail;
    if ('metadata' in itemData) itemElement.metadata = itemData.metadata;

    return itemElement;
}
