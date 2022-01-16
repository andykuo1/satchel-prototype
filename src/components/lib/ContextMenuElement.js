import { upgradeProperty } from '../../util/wc.js';

const INNER_HTML = /* html */ `
<div class="container">
  <div class="inner">
    <slot></slot>
  </div>
</div>
`;
const INNER_STYLE = /* css */ `
.container {
  position: fixed;
  padding: 0.5em;
  background-color: #444444;
  border-radius: 2em;
  border-top: 0.1em solid #666666;
  border-left: 0.1em solid #666666;
  border-right: 0.3em solid #666666;
  border-bottom: 0.3em solid #666666;
  width: 10em;
  height: 12em;
  z-index: 10;
  transition: width 0.3s ease, height 0.3s ease;
  overflow: hidden;
}
.inner {
  width: 10em;
  height: 12em;
  overflow-x: hidden;
  overflow-y: visible;
}
.container:not(.visible) {
  visibility: hidden;
  width: 0;
  height: 0;
}
.topleft {
  border-top-left-radius: 0;
}
.bottomleft {
  border-bottom-left-radius: 0;
}
.topright {
  border-top-right-radius: 0;
}
.bottomright {
  border-bottom-right-radius: 0;
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

  static get observedAttributes() {
    return ['open', 'x', 'y'];
  }

  get x() {
    return Number(this.getAttribute('x'));
  }

  set x(value) {
    this.setAttribute('x', String(value));
  }

  get y() {
    return Number(this.getAttribute('y'));
  }

  set y(value) {
    this.setAttribute('y', String(value));
  }

  get open() {
    return this.hasAttribute('open');
  }

  set open(value) {
    this.toggleAttribute('open', value);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this.containerElement = /** @type {HTMLElement} */ (shadowRoot.querySelector('.container'));
    /** @private */
    this.innerElement = /** @type {HTMLElement} */ (shadowRoot.querySelector('.inner'));

    /** @private */
    this.onOutside = this.onOutside.bind(this);
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'open');

    document.addEventListener('mousedown', this.onOutside, true);
  }

  /** @protected */
  disconnectedCallback() {
    document.removeEventListener('mousedown', this.onOutside, true);
  }
  
  /**
   * @param attribute
   * @param previous
   * @param value
   * @protected
   */
  attributeChangedCallback(attribute, previous, value) {
    switch (attribute) {
      case 'open': {
          let result = value !== null;
          if (result) {
            this.performOpen();
          } else {
            this.performClose();
          }
        }
        break;
    }
  }
  
  /** @private */
  applyPosition(clientX, clientY) {
    const contextMenu = this.containerElement;
    const innerContent = this.innerElement;
    const innerRect = innerContent.getBoundingClientRect();
    const width = innerRect.width;
    const height = innerRect.height;
    const expectedPadding = '1.4em'; // Manually calculated from stylesheet
    let bottom = false;
    let left = false;
    if (window.innerHeight < (clientY + height)) {
      contextMenu.style.top = `calc(${clientY - height}px - ${expectedPadding})`;
      bottom = true;
    } else {
      contextMenu.style.top = `${clientY}px`;
    }
    if (window.innerWidth < (clientX + width)) {
      contextMenu.style.left = `calc(${clientX - width}px - ${expectedPadding})`;
    } else {
      contextMenu.style.left = `${clientX}px`;
      left = true;
    }
    contextMenu.classList.toggle('bottomleft', bottom && left);
    contextMenu.classList.toggle('bottomright', bottom && !left);
    contextMenu.classList.toggle('topleft', !bottom && left);
    contextMenu.classList.toggle('topright', !bottom && !left);
  }

  /** @private */
  performOpen() {
    const contextMenu = this.containerElement;
    if (contextMenu.classList.contains('visible')) {
      return;
    }
    this.applyPosition(this.x, this.y);
    contextMenu.classList.add('visible');
    this.dispatchEvent(
      new CustomEvent('open', {
        composed: true,
        bubbles: false,
      })
    );
  }

  /** @private */
  performClose() {
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
      const rect = contextMenu.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      if (x > rect.right || x < rect.left || y > rect.bottom || y < rect.top) {
        this.open = false;
      }
    }
  }
}
ContextMenuElement.define();
