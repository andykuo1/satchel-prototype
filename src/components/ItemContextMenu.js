import { BaseElement } from './BaseElement.js';

class ItemContextMenu extends BaseElement
{
    /** @override */
    static get template()
    {
        return `
        <fieldset>
            <input type="text">
            <button>Pick up</button>
            <button>Merge</button>
            <textarea></textarea>
        </fieldset>
        `;
    }

    /** @override */
    static get style()
    {
        return `
        :host {
            display: none;
            position: absolute;
            left: 0;
            top: 0;
            z-index: 5;
        }
        fieldset {
            display: flex;
            flex-direction: column;
            color: black;
            background-color: rgba(0, 0, 0, 0.8);
            border: 4px solid indigo;
            border-radius: 0.5rem;
        }
        button {
            width: 100%;
            background-color: gray;
            color: white;
            border: 4px solid white;
            border-radius: 0.5rem;
            margin: 0;
        }
        textarea {
            resize: vertical;
            color: white;
            background-color: rgba(0, 0, 0, 0.8);
        }
        `;
    }

    constructor()
    {
        super();

        this._item = null;

        this.onMouseDown = this.onMouseDown.bind(this);
    }

    /** @override */
    connectedCallback()
    {
        super.connectedCallback();

        document.addEventListener('mousedown', this.onMouseDown, true);
    }

    /** @override */
    disconnectedCallback()
    {
        super.disconnectedCallback();

        document.removeEventListener('mousedown', this.onMouseDown, true);
    }

    setItem(item)
    {
        if (item)
        {
            this.style.setProperty('display', 'block');
            this.focus();
        }
        else
        {
            this.style.setProperty('display', 'none');
        }
        this._item = item;
        return this;
    }

    onMouseDown(e)
    {
        if (!this.contains(e.target))
        {
            this.setItem(null);
        }
    }
}
BaseElement.define('item-contextmenu', ItemContextMenu);
