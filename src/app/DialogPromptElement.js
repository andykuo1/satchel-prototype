import { upgradeProperty } from '../util/wc.js';

import './IconButtonElement.js';

const INNER_HTML = /* html */ `
<div class="backdrop hidden"></div>
<dialog>
  <icon-button id="cancel" icon="res/cancel.svg" alt="close" title="Close"></icon-button>
  <slot></slot>
</dialog>
`;
const INNER_STYLE = /* css */ `
:host {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 100;
  --foreground-color: #ffffff;
  --background-color: #444444;
  --outline-color: #333333;
}
dialog {
  position: relative;
  margin: 0;
  transform: translate(-50%, -50%);
  border: none;
  border-radius: 0.2em;
  color: var(--foreground-color);
  background-color: var(--background-color);
  border-top: 0.5em solid var(--outline-color);
  overflow: auto;
}
dialog[open] {
  display: flex;
  flex-direction: column;
}
.backdrop {
  visibility: visible;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}
.backdrop.hidden {
  visibility: hidden;
}
#cancel {
  position: fixed;
  right: 0;
  top: 0;
  width: 2em;
  height: 2em;
  z-index: 1;
}
#cancel[disabled] {
  display: none;
}

.shake {
  animation-name: shake;
  animation-duration: 0.5s;
  animation-iteration-count: 1;
  animation-timing-function: ease;
  animation-direction: forwards;
}
@keyframes shake {
  0%, 100% {transform: translate(-50%, -50%) translateX(0);} 
  40%, 80% {transform: translate(-50%, -50%) translateX(-1em);} 
  20%, 60% {transform: translate(-50%, -50%) translateX(1em);} 
}
`;

/**
 * @fires open
 * @fires close
 */
export class DialogPromptElement extends HTMLElement {
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
    customElements.define('dialog-prompt', this);
  }

  static get observedAttributes() {
    return ['open', 'required'];
  }

  get open() {
    return this.hasAttribute('open');
  }

  set open(value) {
    this.toggleAttribute('open', value);
  }

  get required() {
    return this.hasAttribute('required');
  }

  set required(value) {
    this.toggleAttribute('required', value);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this.shakeDebounce = null;

    /** @private */
    this.dialog = shadowRoot.querySelector('dialog');
    /** @private */
    this.backdrop = shadowRoot.querySelector('.backdrop');
    /** @private */
    this.cancel = shadowRoot.querySelector('#cancel');

    /** @private */
    this.onBackdropClick = this.onBackdropClick.bind(this);
    /** @private */
    this.onCancelClick = this.onCancelClick.bind(this);
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'open');
    upgradeProperty(this, 'required');

    this.backdrop.addEventListener('contextmenu', this.onBackdropClick);
    this.backdrop.addEventListener('click', this.onBackdropClick);
    this.cancel.addEventListener('click', this.onCancelClick);
  }

  /** @protected */
  disconnectedCallback() {
    if (this.shakeDebounce) {
      clearTimeout(this.shakeDebounce);
      this.shakeDebounce = null;
    }
    this.backdrop.removeEventListener('contextmenu', this.onBackdropClick);
    this.backdrop.removeEventListener('click', this.onBackdropClick);
    this.cancel.removeEventListener('click', this.onCancelClick);
  }

  /**
   * @param attribute
   * @param previous
   * @param value
   * @protected
   */
  attributeChangedCallback(attribute, previous, value) {
    switch (attribute) {
      case 'open':
        {
          let result = value !== null;
          let prev = this.dialog.hasAttribute('open');
          this.dialog.toggleAttribute('open', result);
          this.backdrop.classList.toggle('hidden', !result);
          // Dispatch 'open' event. The 'close' events are handled elsewhere.
          if (prev !== result && result) {
            this.dispatchEvent(new CustomEvent('open', {
              composed: true,
              bubbles: false,
            }));
          }
        }
        break;
      case 'required':
        {
          let result = value !== null;
          this.cancel.toggleAttribute('disabled', result);
        }
        break;
    }
  }

  /** @private */
  onBackdropClick(e) {
    if (this.required) {
      this.dialog.classList.toggle('shake', false);
      this.shakeDebounce = setTimeout(() => {
        this.shakeDebounce = null;
        this.dialog.classList.toggle('shake', true);
      });
      return;
    }
    document.activeElement.blur();
    this.toggleAttribute('open', false);
    this.dispatchEvent(new CustomEvent('close', {
      composed: true,
      bubbles: false,
      detail: {
        from: 'blur'
      }
    }));

    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  /** @private */
  onCancelClick() {
    document.activeElement.blur();
    this.toggleAttribute('open', false);
    this.dispatchEvent(new CustomEvent('close', {
      composed: true,
      bubbles: false,
      detail: {
        from: 'cancel'
      }
    }));
  }
}
DialogPromptElement.define();
