const INNER_HTML = /* html */ `
<div class="container">
  <slot></slot>
</div>
`;
const INNER_STYLE = /* css */ `
:host {
  z-index: 10;
}
.container {
  position: fixed;
  top: 0;
  left: 0;
  padding: 0.5em;
  overflow-x: hidden;
  overflow-y: auto;
  background-color: #444444;
  border-radius: 1em;
  border-top: 0.1em solid #666666;
  border-left: 0.1em solid #666666;
  border-right: 0.3em solid #666666;
  border-bottom: 0.3em solid #666666;
  width: 10em;
  height: 10em;
}
.container:not(.visible) {
  visibility: hidden;
}
`;

/**
 * @fires open
 * @fires close
 */
export class ContextMenuElement extends HTMLElement {
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
    customElements.define('context-menu', this);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this.containerElement = /** @type {HTMLElement} */ (shadowRoot.querySelector('.container'));

    /** @private */
    this.onOutside = this.onOutside.bind(this);
  }

  /** @protected */
  connectedCallback() {
    document.addEventListener('mousedown', this.onOutside, true);
  }

  /** @protected */
  disconnectedCallback() {
    document.removeEventListener('mousedown', this.onOutside, true);
  }

  /**
   * @param {number} clientX 
   * @param {number} clientY 
   */
   open(clientX, clientY) {
    const contextMenu = this.containerElement;
    contextMenu.style.left = `${clientX}px`;
    contextMenu.style.top = `${clientY}px`;
    contextMenu.classList.add('visible');
    this.dispatchEvent(
      new CustomEvent('open', {
        composed: true,
        bubbles: false,
      })
    );
  }

  close() {
    const contextMenu = this.containerElement;
    if (!contextMenu.classList.contains('visible')) {
      return;
    }
    contextMenu.classList.remove('visible');
    this.dispatchEvent(
      new CustomEvent('close', {
        composed: true,
        bubbles: false,
      })
    );
  }

  /** @private */
  onOutside(e) {
    const contextMenu = this.containerElement;
    if (contextMenu.classList.contains('visible')) {
      let rect = contextMenu.getBoundingClientRect();
      let x = e.clientX;
      let y = e.clientY;
      if (x > rect.right || x < rect.left || y > rect.bottom || y < rect.top) {
        this.close();
      }
    }
  }
}
ContextMenuElement.define();
