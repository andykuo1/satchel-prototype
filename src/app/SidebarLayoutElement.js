const INNER_HTML = /* html */ `
<div id="sidebar">
  <slot name="sidebar"></slot>
</div>
<div id="viewport">
  <slot></slot>
</div>
`;
const INNER_STYLE = /* css */ `
:host {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  --background-color: #333333;
}

#sidebar {
  background-color: var(--background-color);
  overflow-x: hidden;
  overflow-y: auto;
}

#sidebar ::slotted(*) {
  display: flex;
  flex-direction: column;
  text-align: center;
  width: 100%;
  height: 100%;
}

#viewport {
  flex: 1;
  overflow: hidden;
}
`;

export class SidebarLayoutElement extends HTMLElement {
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
    customElements.define('sidebar-layout', this);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));
  }

  /** @protected */
  connectedCallback() {
  }

  /** @protected */
  disconnectedCallback() {
  }

  /**
   * @param attribute
   * @param previous
   * @param value
   * @protected
   */
  attributeChangedCallback(attribute, previous, value) {
  }
}
SidebarLayoutElement.define();
