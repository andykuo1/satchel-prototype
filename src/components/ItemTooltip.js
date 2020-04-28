import { BaseElement } from './BaseElement.js';

import { ItemElement } from './ItemElement.js';

export class ItemTooltip extends BaseElement
{
    /** @override */
    static get template()
    {
        return `
        <span>
        </span>
        `;
    }

    /** @override */
    static get style()
    {
        return `
        :host {
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
        }
        span {
            display: block;
            padding: 0.5rem;
            z-index: 3;
            color: black;
            background-color: rgba(0, 0, 0, 0.8);
            border: 4px solid indigo;
            border-radius: 0.5rem;
            transform: translate(0, 0);
        }
        span:empty {
            display: none;
        }
        `;
    }

    constructor()
    {
        super();

        this._root = this.shadowRoot.querySelector('span');

        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseOver = this.onMouseOver.bind(this);
    }

    /** @override */
    connectedCallback()
    {
        super.connectedCallback();

        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseover', this.onMouseOver, false);
    }

    /** @override */
    disconnectedCallback()
    {
        super.disconnectedCallback();
        
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseover', this.onMouseOver, false);
    }

    onMouseMove(e)
    {
        this.style.setProperty('left', e.clientX + 'px');
        this.style.setProperty('top', e.clientY + 'px');
    }

    onMouseOver(e)
    {
        if (e.target instanceof ItemElement)
        {
            let itemElement = e.target;
            this._root.textContent = itemElement.name;
        }
        else
        {
            this._root.textContent = '';
        }
    }
}
BaseElement.define('item-tooltip', ItemTooltip);
