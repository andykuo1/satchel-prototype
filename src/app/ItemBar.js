
/** @typedef {import('../inventory/element/InventoryCursorElement.js').InventoryCursorElement} InventoryCursorElement */

const INNER_HTML = /* html */ `
<div class="root">
  <button id="actionExpand">
    <img src="res/bookmarks.svg" alt="Show" title="Show Items">
  </button>
  <button id="actionDelete">
    <img src="res/delete.svg" alt="Delete" title="Delete Item">
  </button>
  <ul class="container list hidden">
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
    <li><img src="res/images/potion.png"></li>
  </ul>
</div>
`;
const INNER_STYLE = /* css */ `
:host {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  --primary-color: #222222;
  --secondary-color: #222222;
}

.root {
  position: relative;
}

#actionNew {
  position: absolute;
  bottom: 5.25em;
  right: 0.5em;
}
#actionDelete {
  position: absolute;
  bottom: 1.25em;
  left: 0.5em;
}
#actionDelete:hover {
  filter: brightness(70%);
}
#actionExpand {
  position: absolute;
  bottom: 1.25em;
  right: 0.5em;
}

.container {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 5em;
  width: calc(100% - 8em);
  padding: 0;
  margin: 0;
  margin-left: 4em;
  background-color: var(--primary-color);
  border-radius: 4em;
  overflow-x: auto;
  list-style-type: none;
}
.container.hidden {
  visibility: hidden;
}
.container > li {
  width: 4em;
  height: calc(100% - 1em);
  margin: 0;
  padding: 0 0.5em;
  text-align: center;
}

img {
  color: #FFFFFF;
  height: 100%;
}
button {
  height: 3em;
  background: none;
  border: none;
}
`;

export class ItemBar extends HTMLElement {
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
    customElements.define('item-bar', this);
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(this.constructor[Symbol.for('templateNode')].content.cloneNode(true));
    this.shadowRoot.append(this.constructor[Symbol.for('styleNode')].cloneNode(true));

    /** @private */
    this.container = this.shadowRoot.querySelector('.container');
    /** @private */
    this.actionExpand = this.shadowRoot.querySelector('#actionExpand');
    /** @private */
    this.actionDelete = this.shadowRoot.querySelector('#actionDelete');

    /** @private */
    this.onActionDelete = this.onActionDelete.bind(this);
    this.onActionDeleteEnter = this.onActionDeleteEnter.bind(this);
    this.onActionDeleteLeave = this.onActionDeleteLeave.bind(this);
    /** @private */
    this.onActionExpand = this.onActionExpand.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.actionExpand.addEventListener('click', this.onActionExpand);
    this.actionDelete.addEventListener('mouseup', this.onActionDelete);
    this.actionDelete.addEventListener('mousedown', this.onActionDelete);
    this.actionDelete.addEventListener('mouseenter', this.onActionDeleteEnter);
    this.actionDelete.addEventListener('mouseleave', this.onActionDeleteLeave);
  }

  /** @protected */
  disconnectedCallback() {
    this.actionExpand.removeEventListener('click', this.onActionExpand);
    this.actionDelete.removeEventListener('mouseup', this.onActionDelete);
    this.actionDelete.removeEventListener('mousedown', this.onActionDelete);
    this.actionDelete.removeEventListener('mouseenter', this.onActionDeleteEnter);
    this.actionDelete.removeEventListener('mouseleave', this.onActionDeleteLeave);
  }

  /** @private */
  onActionExpand() {
    this.container.classList.toggle('hidden');
  }

  /** @private */
  onActionDelete(e) {
    /** @type {InventoryCursorElement} */
    let cursor = document.querySelector('inventory-cursor');
    if (cursor && cursor.hasHeldItem()) {
      cursor.clearHeldItem();
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  /** @private */
  onActionDeleteEnter() {
    /** @type {InventoryCursorElement} */
    let cursor = document.querySelector('inventory-cursor');
    if (cursor) {
      cursor.toggleAttribute('danger', true);
    }
  }

  /** @private */
  onActionDeleteLeave() {
    /** @type {InventoryCursorElement} */
    let cursor = document.querySelector('inventory-cursor');
    if (cursor) {
      cursor.toggleAttribute('danger', false);
    }
  }
}
ItemBar.define();
