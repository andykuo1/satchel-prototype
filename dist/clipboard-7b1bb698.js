/**
 * Upgrade a property during connectedCallback() if property was set before
 * attaching to document. This should trigger attributeChangedCallback().
 *
 * @param {HTMLElement} element The element to upgrade the property for.
 * @param {string} propertyName The name of the property.
 */
function upgradeProperty(element, propertyName) {
  if (Object.prototype.hasOwnProperty.call(element, propertyName)) {
    const value = element[propertyName];
    delete element[propertyName];
    element[propertyName] = value;
  }
}

const INNER_HTML = /* html */ `
<div class="container hidden">
  <div id="left" class="padding"></div>
  <dialog>
    <div class="inner">
      <div class="margin">
        <slot></slot>
      <div>
    </div>
  </dialog>
  <div id="right" class="padding"></div>
</div>
`;
const INNER_STYLE = /* css */ `
:host {
  z-index: 10;
}

dialog {
  padding: 0;
  border: none;
  border-style: solid;
  border-color: var(--outline-color);
  background: linear-gradient(to bottom right, var(--outline-color), var(--background-color));
  color: var(--foreground-color);
  box-shadow: inset 0 0 0.5em rgba(0, 0, 0, 0.2), 0 0 1em rgba(0, 0, 0, 0.2);
  overflow: hidden;
}
dialog[open]:not(.shake) {
  animation-name: fadein;
  animation-duration: 0.2s;
  animation-iteration-count: 1;
  animation-timing-function: ease-in;
  animation-direction: forwards;
}

@keyframes fadein {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

:host(:not([horizontal])) .container {
  flex-direction: row;
}
:host(:not([horizontal])) .inner {
  width: 100%;
  height: 100vh;
}
:host(:not([horizontal])) dialog {
  max-width: 70vw;
  width: 25em;
  height: 100%;
  border-width: 0 1em;
}
:host(:not([horizontal])) .shake {
  animation-name: shakeX;
}

:host([horizontal]) .container {
  flex-direction: column;
}
:host([horizontal]) .inner {
  width: 100vw;
  height: 100%;
}
:host([horizontal]) dialog {
  top: 0;
  bottom: 0;
  width: 100%;
  height: 15em;
  max-height: 50vh;
  border-width: 1em 0;
  overflow: hidden;
}
:host([horizontal]) .shake {
  animation-name: shakeY;
}

.container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  background-color: rgba(0, 0, 0, 0.5);
}
.inner {
  display: flex;
  overflow-y: auto;
}
.margin {
  margin: 1em;
  flex: 1;
}
.padding {
  flex: 1;
}
.hidden {
  visibility: hidden;
}

.shake {
  animation-duration: 0.6s;
  animation-iteration-count: 1;
  animation-timing-function: ease;
  animation-direction: forwards;
}

@keyframes shakeX {
  0%, 100% {
    transform: translateX(0);
  } 
  40%, 80% {
    transform: translateX(-0.5em);
  } 
  20%, 60% {
    transform: translateX(0.5em);
  }
}
@keyframes shakeY {
  0%, 100% {
    transform: translateY(0);
  } 
  40%, 80% {
    transform: translateY(-0.5em);
  } 
  20%, 60% {
    transform: translateY(0.5em);
  }
}

`;

/**
 * @fires open When the prompt is opened.
 * @fires close When the prompt is closed.
 */
class BannerPromptElement extends HTMLElement {
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

  /** @public */
  static define(customElements = window.customElements) {
    customElements.define('banner-prompt', this);
  }

  /** @protected */
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
    this.dialogElement = shadowRoot.querySelector('dialog');
    /** @private */
    this.containerElement = shadowRoot.querySelector('.container');
    /** @private */
    this.leftPaddingElement = shadowRoot.querySelector('#left');
    /** @private */
    this.rightPaddingElement = shadowRoot.querySelector('#right');

    /** @private */
    this.onBackdropClick = this.onBackdropClick.bind(this);
  }

  /** @protected */
  connectedCallback() {
    upgradeProperty(this, 'open');
    upgradeProperty(this, 'required');
    this.leftPaddingElement.addEventListener('contextmenu', this.onBackdropClick);
    this.leftPaddingElement.addEventListener('click', this.onBackdropClick);
    this.rightPaddingElement.addEventListener('contextmenu', this.onBackdropClick);
    this.rightPaddingElement.addEventListener('click', this.onBackdropClick);
  }

  /** @protected */
  disconnectedCallback() {
    if (this.shakeDebounce) {
      clearTimeout(this.shakeDebounce);
      this.shakeDebounce = null;
    }
    this.leftPaddingElement.removeEventListener('contextmenu', this.onBackdropClick);
    this.leftPaddingElement.removeEventListener('click', this.onBackdropClick);
    this.rightPaddingElement.removeEventListener('contextmenu', this.onBackdropClick);
    this.rightPaddingElement.removeEventListener('click', this.onBackdropClick);
  }

  /**
   * @protected
   * @param {string} attribute
   * @param {any} previous
   * @param {any} value
   */
  attributeChangedCallback(attribute, previous, value) {
    switch (attribute) {
      case 'open':
        {
          let result = value !== null;
          let prev = previous !== null;
          this.dialogElement.toggleAttribute('open', result);
          this.containerElement.classList.toggle('hidden', !result);
          // Dispatch 'open' event. The 'close' events are handled elsewhere.
          if (prev !== result && result) {
            this.dispatchEvent(
              new CustomEvent('open', {
                composed: true,
                bubbles: false,
              })
            );
          }
        }
        break;
    }
  }

  /** @private */
  onBackdropClick(e) {
    if (this.required) {
      this.dialogElement.classList.toggle('shake', false);
      this.shakeDebounce = setTimeout(() => {
        this.shakeDebounce = null;
        this.dialogElement.classList.toggle('shake', true);
      });
      return;
    }
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
    this.toggleAttribute('open', false);
    this.dispatchEvent(
      new CustomEvent('close', {
        composed: true,
        bubbles: false,
      })
    );
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}
BannerPromptElement.define();

const BUILD_VERSION = '1.0.41';

/**
 * Generates a uuid v4.
 *
 * @param {number} a The placeholder (serves for recursion within function).
 * @returns {string} The universally unique id string.
 */
function uuid(a = undefined) {
  // https://gist.github.com/jed/982883
  return a
    ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid);
}

function prepareSessionStatus(sessionId, remoteId) {
  let jsonData = {
    sessionId: typeof sessionId === 'string' ? sessionId : '',
    remoteId: typeof remoteId === 'string' ? remoteId : '',
  };
  sessionStorage.setItem('sessionStatus', JSON.stringify(jsonData));
}

function resolveSessionStatus() {
  const sessionStatus = resolveSessionStatusFromStorage();
  const urlRemoteId = resolveRemoteIdFromUrl(window.location);
  const sessionId = sessionStatus.sessionId || uuid();
  const remoteId = urlRemoteId || sessionStatus.remoteId || sessionId;
  return {
    sessionId,
    remoteId,
  };
}

function resolveSessionStatusFromStorage() {
  try {
    const storageData = sessionStorage.getItem('sessionStatus');
    const jsonData = JSON.parse(storageData);
    return {
      sessionId: jsonData && typeof jsonData.sessionId === 'string' ? jsonData.sessionId : '',
      remoteId: jsonData && typeof jsonData.remoteId === 'string' ? jsonData.remoteId : '',
    };
  } catch (e) {
    return {
      sessionId: '',
      remoteId: '',
    };
  }
}

function resolveRemoteIdFromUrl(url) {
  try {
    const urlParams = new URLSearchParams(url.search);
    if (urlParams.has('id')) {
      return urlParams.get('id');
    } else {
      return '';
    }
  } catch (e) {
    return '';
  }
}

/**
 * @param {string} data
 */
async function copyToClipboard(data) {
  await navigator.clipboard.writeText(data);
}

/**
 * @returns {Promise<string>}
 */
async function pasteFromClipboard() {
  return await navigator.clipboard.readText();
}

export { BUILD_VERSION as B, pasteFromClipboard as a, upgradeProperty as b, copyToClipboard as c, prepareSessionStatus as p, resolveSessionStatus as r, uuid as u };
