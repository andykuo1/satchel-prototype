import { BaseElement } from './BaseElement.js';
import { GRID_CELL_SIZE, putDown } from './Satchel.js';
import { NumberPair } from './types.js';
import { ItemList } from './ItemList.js';

export class ItemContainer extends BaseElement
{
    /** @override */
    static get template()
    {
        return `
        <article>
            <h2>
                <slot name="title">Container</slot>
            </h2>
            <section class="container grid">
                <slot></slot>
            </section>
        </article>
        `;
    }

    /** @override */
    static get style()
    {
        return `
        :host {
            --containerWidth: 1;
            --containerHeight: 1;
        }
        article {
            display: inline-block;
            margin: 0.2rem;
            width: calc(var(--containerWidth) * ${GRID_CELL_SIZE}px);
            transition: width 0.3s ease;
        }
        h2 {
            font-size: 0.8rem;
            width: 100%
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
            height: calc(var(--containerHeight) * ${GRID_CELL_SIZE}px);
            background-color: dodgerblue;
            border: 1px solid black;
            border-radius: 1rem;
            box-shadow: 0.2rem 0.2rem 0 0 black;
            overflow: hidden;
            transition: height 0.3s ease;
        }
        .grid {
            background-size: ${GRID_CELL_SIZE}px ${GRID_CELL_SIZE}px;
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
            type: String,
        };
    }

    constructor()
    {
        super();

        this._itemSlot = this.shadowRoot.querySelector('.container slot');
        this._container = this.shadowRoot.querySelector('.container');
        this._containerTitle = this.shadowRoot.querySelector('h2');

        this.itemList = new ItemList(this);

        this.onSlotChange = this.onSlotChange.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this.attributeCallbacks = {
            size: this.onSizeChanged,
        };
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
        this._itemSlot.removeEventListener('slotchange', this.onSlotChange);
    }

    onSizeChanged(value)
    {
        this.style
        this.style.setProperty('--containerWidth', value[0]);
        this.style.setProperty('--containerHeight', value[1]);
    }

    onSlotChange(e)
    {
        this.itemList.update(e.target);
        
        if (this.type === 'slot')
        {
            let itemElement = this.itemList.at(0, 0);
            if (itemElement)
            {
                this.size = [ itemElement.w, itemElement.h ];
            }
            else
            {
                this.size = [ 1, 1 ];
            }
        }
    }

    onMouseUp(e)
    {
        if (e.button === 2) return;
    
        let boundingRect = this._container.getBoundingClientRect();
        let offsetX = e.clientX - boundingRect.x;
        let offsetY = e.clientY - boundingRect.y;
    
        let coordX = Math.trunc(offsetX / GRID_CELL_SIZE);
        let coordY = Math.trunc(offsetY / GRID_CELL_SIZE);

        let result = putDown(this, coordX, coordY);
        if (result)
        {
            e.preventDefault();
            e.stopPropagation();
        }
    }
}
BaseElement.define('item-container', ItemContainer);

export function isSlotContainer(itemContainer)
{
    return itemContainer.type === 'slot';
}
