import { DEFAULT_ITEM_CARD_PORTRAIT, DEFAULT_ITEM_CARD_PORTRAIT_BACKGROUND, DEFAULT_ITEM_CARD_INFO_BACKGROUND } from './assets.js';

class ItemCard extends HTMLElement
{
    static get template()
    {
        const INNER_HTML = `
        <div class="flipContainer">
            <article class="container front">
                <div class="cover">
                    <h2>Potion of Healing</h2>
                    <img src="${DEFAULT_ITEM_CARD_PORTRAIT}">
                </div>
                <section class="info">
                    <h3>Bottle</h3>
                    <p class="topLeft">
                        <span class="label">Price: </span>
                        <span id="price">1gp</span>
                    </p>
                    <p class="topRight">
                        <span class="label">Size: </span>
                        <span id="size">1x1</span>
                    </p>
                    <p class="content">
                        Just some text. Lorem Ipsum is fun. Yep it is. Hyuck-hyuck.
                    </p>
                </section>
            </article>
            <div class="container back">
            </div>
        </div>
        `;
        const INNER_STYLE = `
        :host {}
        h2 {
            margin: 0em;
            background: white;
            border: 0.1em solid rgba(0, 0, 0, 0.8);
        }
        h3 {
            margin: 0;
        }
        p {
            margin: 0;
            text-align: left;
        }
        img {
            width: 100%;
        }
        .flipContainer {
            position: relative;
            width: 20em;
            height: 28em;
            perspective: 30rem;
        }
        .front, .back {
            position: absolute;
            top: 0;
            left: 0;
            transition: transform 0.3s;
            backface-visibility: hidden;
        }
        .flipContainer:hover .front {
            transform: rotateY(180deg);
        }
        .flipContainer:hover .back {
            transform: rotateY(360deg);
        }
        .back {
            transform: rotateY(90deg);
        }
        .container {
            display: flex;
            flex-direction: column;
            /* Fills the container and then offsets for padding. */
            width: calc(100% - 3em);
            height: calc(100% - 3em);
            padding: 1.5em;
            border-radius: 1em;
            background-image: linear-gradient(to bottom, brown, red);
        }
        .cover {
            position: relative;
            flex: 1;
            padding: 0.5em;
            background-size: cover;
            background-image: url("${DEFAULT_ITEM_CARD_PORTRAIT_BACKGROUND}");
            border: 0.1em solid rgba(0, 0, 0, 0.8);
            overflow: hidden;
        }
        .info {
            position: relative;
            margin: 0;
            margin-top: 0.5em;
            padding: 0.5em;
            border-radius: 0.5em;
            background-size: cover;
            background-image: url("${DEFAULT_ITEM_CARD_INFO_BACKGROUND}");
            border: 0.1em solid rgba(0, 0, 0, 0.8);
        }
        .topLeft {
            position: absolute;
            top: 0.4em;
            right: 0.4em;
        }
        .topRight {
            position: absolute;
            top: 0.4em;
            left: 0.4em;
        }
        .info .label {
            font-weight: bold;
        }
        .info .content {
            margin-top: 0.5em;
            margin-bottom: 0.5em;
        }
        `;
        let template = document.createElement('template');
        template.innerHTML = `<style>${INNER_STYLE}</style>${INNER_HTML}`;
        Object.defineProperty(this, 'template', { value: template });
        return template;
    }

    constructor()
    {
        super();

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
    }
}
window.customElements.define('item-card', ItemCard);
