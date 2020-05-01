import { BaseElement, html, css } from './BaseElement.js';

import { ItemDisplay } from './ItemDisplay.js';

export class LootDialog extends BaseElement
{
    /** @override */
    static get template()
    {
        return html`
        <dialog>
            <div class="details">
                <h2><slot name="title">Loot!</slot></h2>
                <blockquote>
                    <p>Looted from a bunch of goblins near Stillwater.</p>
                    <footer>
                        <slot name="footer"></slot>
                        <cite><slot name="footer-cite"></slot></cite>
                    </footer>
                </blockquote>
            </div>
            <hr>
            <div class="items"></div>
            <hr>
            <div class="options">
                <fieldset>
                    <button id="accept">Accept</button>
                    <button id="cancel">Cancel</button>
                </fieldset>
            </div>
        </dialog>
        `;
    }

    /** @override */
    static get style()
    {
        return css`
        dialog {
            top: 10%;
            max-height: 80%;
            pointer-events: auto;
            overflow-x: hidden;
            overflow-y: auto;
            border-radius: 0.5rem;
            background-color: white;
            color: black;
        }
        dialog::backdrop {
            background-color: rgba(0, 0, 0, 0.8);
        }
        blockquote {
            margin: 0;
        }
        blockquote p {
            padding: 1rem;
            background-color: #EEEEEE;
            border-radius: 0.2rem;
            text-align: center;
        }
        h2 {
            text-align: center;
        }
        hr {
            border: 0;
            height: 1px;
            background-image: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0));
            margin: 1rem;
        }
        button {
            margin-bottom: 0.5rem;
            width: 100%;
        }
        #accept {
            font-size: 1.6rem;
        }
        .details, .options, hr {
            animation: fadein 1s ease forwards;
        }
        .items {
            display: flex;
            flex-direction: column;
        }
        .items > * {
            animation: slidein 1.2s ease forwards;
            opacity: 0;
        }
        .items > *:first-child {
            margin-top: 0;
        }
        .items > *:last-child {
            margin-bottom: 0;
        }
        fieldset {
            border: none;
            padding: 0;
        }
        @keyframes fadein {
            from {
                opacity: 0;
                filter: blur(4px);
            }
            to {
                opacity: 1;
                filter: blur(0);
            }
        }
        @keyframes slidein {
            from {
                transform: translateX(100%);
                filter: blur(4px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                filter: blur(0);
                opacity: 1;
            }
        }
        `;
    }

    constructor(items = [])
    {
        super();

        this._dialog = this.shadowRoot.querySelector('dialog');
        this._accept = this.shadowRoot.querySelector('#accept');
        this._cancel = this.shadowRoot.querySelector('#cancel');
        this._items = this.shadowRoot.querySelector('.items');

        this.initialScrollDelay = 1.5;
        this.initialItemDelay = 1;

        this.scrollAnimationHandle = null;
        this.scrollSpeed = 1;
        this.scrollSpeedStep = 0.2;
        this.maxScrollSpeed = 12;

        this.itemDelayStep = 0.3;

        this.items = items;
        for(let item of this.items)
        {
            let itemDisplay = new ItemDisplay(item);
            this._items.appendChild(itemDisplay);
        }

        this.onWheel = this.onWheel.bind(this);
        this.onStartAnimationFrame = this.onStartAnimationFrame.bind(this);
        this.onAcceptClick = this.onAcceptClick.bind(this);
        this.onCancelClick = this.onCancelClick.bind(this);
    }

    /** @override */
    connectedCallback()
    {
        super.connectedCallback();

        this._dialog.showModal();
        this._dialog.scrollTo(0, 0);

        this._dialog.addEventListener('wheel', this.onWheel);
        this._accept.addEventListener('click', this.onAcceptClick);
        this._cancel.addEventListener('click', this.onCancelClick);

        let delayTime = this.initialItemDelay;
        for(let section of this.shadowRoot.querySelectorAll('.items > *'))
        {
            section.style.animationDelay = `${delayTime}s`;
            delayTime += this.itemDelayStep;
        }

        setTimeout(this.onStartAnimationFrame, this.initialScrollDelay * 1000);
    }

    onWheel()
    {
        cancelAnimationFrame(this.scrollAnimationHandle);
    }

    onStartAnimationFrame(e)
    {
        this.scrollAnimationHandle = requestAnimationFrame(this.onStartAnimationFrame);

        let scrollElement = this._dialog;
        let prevScrollTop = scrollElement.scrollTop;
        this.scrollSpeed += this.scrollSpeedStep;
        if (this.scrollSpeed > this.maxScrollSpeed) this.scrollSpeed = this.maxScrollSpeed;
        scrollElement.scrollBy(0, this.scrollSpeed);

        let nextScrollTop = scrollElement.scrollTop;
        if (prevScrollTop >= nextScrollTop)
        {
            cancelAnimationFrame(this.scrollAnimationHandle);
        }
    }

    onAcceptClick(e)
    {
        this.dispatchEvent(new CustomEvent('accept', {
            composed: true, bubbles: false,
            detail: { items: this.items }
        }));
    }

    onCancelClick(e)
    {
        this.dispatchEvent(new CustomEvent('cancel', {
            composed: true, bubbles: false,
        }));
    }
}
BaseElement.define('loot-dialog', LootDialog);
