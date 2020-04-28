import { BaseElement } from './BaseElement.js';

class ItemContextMenu extends BaseElement
{
    /** @override */
    static get template()
    {
        return `
        <fieldset>
            <h3></h3>
            <input type="text">
            <textarea placeholder="Anything to add?"></textarea>
        </fieldset>
        `;
    }

    /** @override */
    static get style()
    {
        return `
        :host {
            visibility: hidden;
            position: absolute;
            left: 0;
            top: 0;
            z-index: 5;
        }
        fieldset {
            display: flex;
            flex-direction: column;
            color: white;
            background-color: rgba(0, 0, 0, 0.8);
            border: 4px solid indigo;
            border-radius: 0.5rem;
        }
        fieldset > * {
            width: 100%;
            margin: 0;
            margin-bottom: 0.4rem;
        }
        fieldset > *:last-child {
            margin-bottom: 0;
        }
        input, textarea, h3 {
            color: white;
            background-color: black;
            border-radius: 0.2rem;
            border: none;
            padding: 0;
        }
        h3 {
            text-align: center;
        }
        input {
            text-align: center;
            font-family: monospace;
        }
        button {
            color: white;
            background-color: #444444;
            border-radius: 0.2rem;
            border: none;
            padding: 0.2rem 0;
        }
        button:hover {
            background-color: #666666;
        }
        textarea {
            resize: vertical;
            height: 4rem;
        }
        `;
    }

    constructor()
    {
        super();

        this._name = this.shadowRoot.querySelector('input');
        this._category = this.shadowRoot.querySelector('h3');
        this._detail = this.shadowRoot.querySelector('textarea');

        this._item = null;

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        this.onNameBlur = this.onNameBlur.bind(this);
        this.onDetailBlur = this.onDetailBlur.bind(this);
    }

    /** @override */
    connectedCallback()
    {
        super.connectedCallback();

        document.addEventListener('mousedown', this.onMouseDown, true);
        window.addEventListener('resize', this.onWindowResize);
    }

    /** @override */
    disconnectedCallback()
    {
        super.disconnectedCallback();

        document.removeEventListener('mousedown', this.onMouseDown, true);
        window.removeEventListener('resize', this.onWindowResize);
    }

    setItem(item, x = 0, y = 0)
    {
        if (this._item && item)
        {
            // It must reset to (0, 0) so the client width/height is preserved.
            this.setItem(null, 0, 0);
        }

        if (item)
        {
            this._name.value = item.name;
            this._category.textContent = item.category || '';
            this._detail.value = item.detail || '';

            this._name.addEventListener('blur', this.onNameBlur);
            this._detail.addEventListener('blur', this.onDetailBlur);

            this.style.setProperty('visibility', 'visible');
        }
        else
        {
            this.style.setProperty('visibility', 'hidden');

            this._name.blur();
            this._detail.blur();
            
            this._name.removeEventListener('blur', this.onNameBlur);
            this._detail.removeEventListener('blur', this.onDetailBlur);

            this._name.value = '';
            this._category.textContent = '';
            this._detail.value = '';
        }

        // Update the position.
        let maxX = window.innerWidth - this.clientWidth;
        let maxY = window.innerHeight - this.clientHeight;
        if (x - window.pageXOffset >= maxX) x -= this.clientWidth;
        if (y - window.pageYOffset >= maxY) y -= this.clientHeight;
        this.style.setProperty('left', x + 'px');
        this.style.setProperty('top', y + 'px');

        this._item = item;
        return this;
    }

    onMouseDown(e)
    {
        if (!this.contains(e.target))
        {
            this.setItem(null, 0, 0);
        }
    }

    onWindowResize(e)
    {
        this.setItem(null, 0, 0);
    }

    onNameBlur(e)
    {
        this._item.name = e.target.value;
    }

    onDetailBlur(e)
    {
        this._item.detail = e.target.value;
    }
}
BaseElement.define('item-contextmenu', ItemContextMenu);
