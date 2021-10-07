import { DEFAULT_ITEM } from '../assets.js';
import { upgradeProperty } from './util.js';
import { pickUp } from './InventoryHelper.js';

const INNER_HTML = `
<figure class="container">
    <img src="${DEFAULT_ITEM}">
    <figcaption></figcaption>
</figure>
`;
const INNER_STYLE = `
:host {
    --itemX: 0;
    --itemY: 0;
    --itemWidth: 1;
    --itemHeight: 1;
    /* var(--item-unit-size) is inherited from parent container. */
}
.container {
    display: inline-block;
    position: absolute;
    left: calc(var(--itemX) * var(--item-unit-size, 48px));
    top: calc(var(--itemY) * var(--item-unit-size, 48px));
    width: calc(var(--itemWidth) * var(--item-unit-size, 48px));
    height: calc(var(--itemHeight) * var(--item-unit-size, 48px));
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
    opacity: 1;
    text-align: center;
    transition: opacity 0.1s ease, bottom 0.1s ease;
    color: white;
    background-color: rgba(0, 0, 0, 0.7);
}
.container:hover figcaption:not(.active), figcaption.active {
    opacity: 1;
}
`;

export class InventoryItem extends HTMLElement {

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
        customElements.define('inventory-item', this);
    }

    static get observedAttributes() {
        return [
            'x',
            'y',
            'w',
            'h',
            'src',
            'name',
        ];
    }

    get x() {
        return this._x;
    }

    set x(value) {
        this.setAttribute('x', String(value));
    }

    get y() {
        return this._y;
    }

    set y(value) {
        this.setAttribute('y', String(value));
    }

    get w() {
        return this._w;
    }

    set w(value) {
        this.setAttribute('w', String(value));
    }

    get h() {
        return this._h;
    }

    set h(value) {
        this.setAttribute('h', String(value));
    }

    get src() {
        return this._src;
    }

    set src(value) {
        this.setAttribute('src', value);
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this.setAttribute('name', value);
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
        this.shadowRoot.appendChild(this.constructor[Symbol.for('styleNode')].cloneNode(true));

        this._x = 0;
        this._y = 0;
        this._w = 1;
        this._h = 1;
        this._src = '';
        this._name = '';

        this._image = this.shadowRoot.querySelector('img');
        this._caption = this.shadowRoot.querySelector('figcaption');

        this.container = null;

        this.onMouseDown = this.onMouseDown.bind(this);
    }

    connectedCallback() {
        upgradeProperty(this, 'x');
        upgradeProperty(this, 'y');
        upgradeProperty(this, 'w');
        upgradeProperty(this, 'h');
        upgradeProperty(this, 'src');
        upgradeProperty(this, 'name');

        this.addEventListener('mousedown', this.onMouseDown);

        this.container = this.closest('inventory-bag');
    }

    disconnectedCallback() {
        this.removeEventListener('mousedown', this.onMouseDown);
        this.container = null;
    }

    attributeChangedCallback(attribute, prev, value) {
        switch(attribute) {
            case 'x':
                this._x = Number(value);
                this.style.setProperty('--itemX', value);
                break;
            case 'y':
                this._y = Number(value);
                this.style.setProperty('--itemY', value);
                break;
            case 'w':
                this._w = Number(value);
                this.style.setProperty('--itemWidth', value);
                break;
            case 'h':
                this._h = Number(value);
                this.style.setProperty('--itemHeight', value);
                break;
            case 'src':
                this._src = value;
                this._image.src = value;
                break;
            case 'name':
                this._image.alt = value;
                this._caption.textContent = value;
                break;
        }
    }

    onMouseDown(e) {
        if (e.button === 2) return;
        let result = pickUp(this, this.container);
        if (result) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }
}
InventoryItem.define();

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
