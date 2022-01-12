import { upgradeProperty } from '../../util/wc.js';

const INNER_HTML = /* html */ `
<button>
  <img>
</button>
`;
const INNER_STYLE = /* css */ `
:host {
  display: inline-block;
  width: 3em;
  height: 3em;
  margin: 0.2em;
  color: #ffffff;
  --background-color: #444444;
  --hover-color: #666666;
}
button {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 0.8em;
  background-color: var(--background-color);
  cursor: pointer;
}
button:disabled {
  opacity: 0.3;
  cursor: unset;
}
button:not(:disabled):hover {
  background-color: var(--hover-color);
}
button:not(:disabled):active {
  filter: brightness(60%);
}
img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}
`;

export class IconButtonElement extends HTMLElement {
  /** @private */
  static get [Symbol.for('templateNode')]() {
    const t = document.createElement('template');
    t.innerHTML = INNER_HTML;
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @private */
  static get [Symbol.for('styleNode')]() {
    const t = document.createElement('style');
    t.innerHTML = INNER_STYLE;
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  static define(customElements = window.customElements) {
    customElements.define('icon-button', this);
  }

  /** @protected */
  static get observedAttributes() {
    return ['icon', 'alt', 'disabled'];
  }

  get icon() {
    return this.getAttribute('icon');
  }

  set icon(value) {
    this.setAttribute('icon', value);
  }

  get alt() {
    return this.getAttribute('alt');
  }

  set alt(value) {
    this.setAttribute('alt', value);
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    this.toggleAttribute('disabled', value);
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    this.shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this.button = this.shadowRoot.querySelector('button');
    /** @private */
    this.image = this.shadowRoot.querySelector('img');
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'icon');
    upgradeProperty(this, 'alt');
    upgradeProperty(this, 'disabled');
  }

  /** @protected */
  disconnectedCallback() {}

  /** @protected */
  attributeChangedCallback(attribute, prev, value) {
    switch (attribute) {
      case 'icon':
        this.image.src = value;
        break;
      case 'alt':
        this.image.alt = value;
        break;
      case 'disabled':
        this.button.toggleAttribute('disabled', value !== null);
        break;
    }
  }
}
IconButtonElement.define();
