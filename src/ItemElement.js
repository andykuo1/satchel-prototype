import { defaultAndUpgradeProperties, assignProperties, callbackAssignedProperties } from './w.js';
import { DEFAULT_ITEM } from './assets.js';
import * as Satchel from './Satchel.js';

export class ItemElement extends HTMLElement
{
    static get template()
    {
        const INNER_HTML = `
        <img src="${DEFAULT_ITEM}">
        `;
        const INNER_STYLE = `
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
        let template = document.createElement('template');
        template.innerHTML = `<style>${INNER_STYLE}</style>${INNER_HTML}`;
        Object.defineProperty(this, 'template', { value: template });
        return template;
    }

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

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));

        this.container = null;

        this.onMouseDown = this.onMouseDown.bind(this);

        this._callbacks = {};
    }

    /** @override */
    connectedCallback()
    {
        defaultAndUpgradeProperties(this, this.constructor.properties);

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
        this.removeEventListener('click', this.onMouseDown);
        this.container = null;
    }

    /** @override */
    attributeChangedCallback(attribute, prev, value)
    {
        callbackAssignedProperties(this, attribute, prev, value, this._callbacks);

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

assignProperties(ItemElement, ItemElement.properties);
window.customElements.define('item-element', ItemElement);
