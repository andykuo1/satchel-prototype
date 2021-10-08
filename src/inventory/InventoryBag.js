import { containerMouseUpCallback } from './ContainerHelper.js';
import { upgradeProperty, uuid } from './util.js';
import { addInventoryChangeListener, getInventoryStore, getItemAtInventory, getItemsInInventory, removeInventoryChangeListener, resolveInventory } from './InventoryStore.js';

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
            'name',
            'rows',
            'cols',
            'type',
        ];
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this.setAttribute('name', value);
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

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
        this.shadowRoot.appendChild(this.constructor[Symbol.for('styleNode')].cloneNode(true));

        this._name = uuid();
        this._rows = 1;
        this._cols = 1;
        this._type = 'grid';

        this._root = this.shadowRoot.querySelector('article');
        this._itemSlot = /** @type {HTMLSlotElement} */ (this.shadowRoot.querySelector('.container slot'));
        this._container = this.shadowRoot.querySelector('.container');
        this._containerTitle = this.shadowRoot.querySelector('h2');

        this.onInventoryChange = this.onInventoryChange.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }

    connectedCallback() {
        upgradeProperty(this, 'name');
        upgradeProperty(this, 'rows');
        upgradeProperty(this, 'cols');
        upgradeProperty(this, 'type');
        
        resolveInventory(getInventoryStore(), this.name);
        this._container.addEventListener('mouseup', this.onMouseUp);
    }

    disconnectedCallback() {
        this._container.removeEventListener('mouseup', this.onMouseUp);
    }

    attributeChangedCallback(attribute, prev, value) {
        switch(attribute) {
            case 'name': {
                    let store = getInventoryStore();
                    let prevName = this._name;
                    let nextName = value;
                    this._name = nextName;
                    if (prevName) {
                        removeInventoryChangeListener(store, prevName, this.onInventoryChange);
                    }
                    if (nextName) {
                        addInventoryChangeListener(store, nextName, this.onInventoryChange);
                    }
                } break;
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

    onInventoryChange(store, inventoryName) {
        if (this.type === 'socket') {
            let item = getItemAtInventory(store, inventoryName, 0, 0);
            if (item) {
                this.rows = item.w;
                this.cols = item.h;
            } else {
                this.rows = 1;
                this.cols = 1;
            }
        }
        // Clear items in slot
        this._itemSlot.innerHTML = '';
        // Add new items into slot.
        for(let item of getItemsInInventory(store, inventoryName)) {
            item.container = this;
            this._itemSlot.appendChild(item);
        }
        this.dispatchEvent(new CustomEvent('itemchange', { composed: true, bubbles: false }));
    }

    onMouseUp(e)
    {
        return containerMouseUpCallback(e, this, 48);
    }
}
InventoryBag.define();
