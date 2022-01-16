/** @typedef {import('../invgrid/InventoryGridElement.js').InventoryGridElement} InventoryGridElement */

import { getClient, isClientSide, isServerSide } from '../../satchel/app/PeerSatchelConnector.js';
import { ActivityProfileMap, ActivityProfileSelect } from '../../satchel/peer/ActivityProfile.js';
import { updateList } from '../ElementListHelper.js';

const INNER_HTML = /* html */`
<dialog-prompt required>
  <fieldset>
    <legend>Select Profile</legend>
    <ul id="list"></ul>
  </fieldset>
</dialog-prompt>
`;
const INNER_STYLE = /* css */`
ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}
ul button {
  width: 100%;
}
`;

export class DialogSelectElement extends HTMLElement {
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
    customElements.define('dialog-select', this);
  }

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(
      this.constructor[Symbol.for('templateNode')].content.cloneNode(true)
    );
    shadowRoot.append(
      this.constructor[Symbol.for('styleNode')].cloneNode(true)
    );

    /** @private */
    this.dialogElement = shadowRoot.querySelector('dialog-prompt');
    /** @private */
    this.listElement = shadowRoot.querySelector('#list');

    /** @private */
    this.intervalHandle = null;

    /** @private */
    this.onInterval = this.onInterval.bind(this);
    /** @private */
    this.onButtonClick = this.onButtonClick.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.intervalHandle = setInterval(this.onInterval, 1_000);
  }

  /** @protected */
  disconnectedCallback() {
    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
  }

  /** @private */
  onInterval() {
    if (!isClientSide()) {
      return;
    }
    const client = getClient();
    const profileMap = ActivityProfileMap.getProfileMap(client);
    if (profileMap) {
      this.update(profileMap);
    }
  }

  /** @private */
  async onButtonClick(e) {
    const profileId = e.target.getAttribute('data-profileid');
    const client = getClient();
    let result = await ActivityProfileSelect.chooseProfile(client, profileId);
    if (result) {
      this.dialogElement.toggleAttribute('open', false);
    }
  }

  open() {
    this.dialogElement.toggleAttribute('open', true);
  }

  update(profileMap) {
    let create = (key) => {
      let profileOpts = profileMap[key];
      let li = document.createElement('li');
      let button = document.createElement('button');
      button.setAttribute('data-profileid', key);
      button.textContent = profileOpts.displayName;
      button.disabled = Boolean(profileOpts.locked);
      button.addEventListener('click', this.onButtonClick);
      li.appendChild(button);
      return li;
    };
    let destroy = (key, element) => {
      let button = element.querySelector('button');
      button.removeEventListener('click', this.onButtonClick);
    };
    let callback = (key, element, preserved) => {
      if (!preserved) {
        return;
      }
      let profileOpts = profileMap[key];
      let button = element.querySelector('button');
      button.textContent = profileOpts.displayName;
      button.disabled = Boolean(profileOpts.locked);
    };
    updateList(this.listElement, Object.keys(profileMap), create, destroy, callback);
  }
}
DialogSelectElement.define();
