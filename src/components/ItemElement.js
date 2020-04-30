import { BaseElement, html, css } from './BaseElement.js';

import { DEFAULT_ITEM } from '../assets.js';
import * as Satchel from '../Satchel.js';
import { canTransferItemOut } from './ItemContainer.js';

export class ItemElement extends BaseElement
{
    /** @override */
    static get template()
    {
        return html`
        <div class="container">
            <img>
        </div>
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
        }
        .container {
            display: inline-block;
            position: absolute;
            left: calc(var(--itemX) * ${Satchel.GRID_CELL_SIZE}px);
            top: calc(var(--itemY) * ${Satchel.GRID_CELL_SIZE}px);
            width: calc(var(--itemWidth) * ${Satchel.GRID_CELL_SIZE}px);
            height: calc(var(--itemHeight) * ${Satchel.GRID_CELL_SIZE}px);
        }
        img {
            width: 100%;
            height: 100%;
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
            metadata: { type: Object, value: {} },
        };
    }

    /** @override */
    get changedAttributes()
    {
        return {
            name: value => {
                this._image.alt = value;
                this._image.title = value;
            },
        };
    }

    constructor()
    {
        super();

        this._image = this.shadowRoot.querySelector('img');

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

        let result = Satchel.pickUp(this, this.container);
        if (result)
        {
            e.preventDefault();
            e.stopPropagation();
        }
    }
}
BaseElement.define('item-element', ItemElement);
