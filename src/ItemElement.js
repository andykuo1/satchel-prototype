import { DEFAULT_ITEM } from './assets.js';
import * as Satchel from './Satchel.js';
import { BaseElement } from './BaseElement.js';

export class ItemElement extends BaseElement
{
    /** @override */
    static get template()
    {
        return `
        <img src="${DEFAULT_ITEM}">
        `;
    }

    /** @override */
    static get style()
    {
        return `
        :host {
            --itemX: 0;
            --itemY: 0;
            --itemWidth: 1;
            --itemHeight: 1;
        }
        img {
            position: absolute;
            left: calc(var(--itemX) * ${Satchel.GRID_CELL_SIZE}px);
            top: calc(var(--itemY) * ${Satchel.GRID_CELL_SIZE}px);
            width: calc(var(--itemWidth) * ${Satchel.GRID_CELL_SIZE}px);
            height: calc(var(--itemHeight) * ${Satchel.GRID_CELL_SIZE}px);
        }
        img.hidden {
            opacity: 0;
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
        };
    }

    constructor()
    {
        super();

        this.container = null;

        this.onMouseDown = this.onMouseDown.bind(this);
    }

    /** @override */
    connectedCallback()
    {
        super.connectedCallback();

        this.addEventListener('mousedown', this.onMouseDown);
        this.container = this.closest('item-container');

        this.style.setProperty('--itemX', this.x);
        this.style.setProperty('--itemY', this.y);
        this.style.setProperty('--itemWidth', this.w);
        this.style.setProperty('--itemHeight', this.h);
    }

    /** @override */
    disconnectedCallback()
    {
        super.disconnectedCallback();
        
        this.removeEventListener('click', this.onMouseDown);
        this.container = null;
    }

    /** @override */
    attributeChangedCallback(attribute, prev, value)
    {
        super.attributeChangedCallback(attribute, prev, value);

        this.dispatchEvent(new CustomEvent('change', { composed: true, bubbles: false }));
    }

    onMouseDown(e)
    {
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
