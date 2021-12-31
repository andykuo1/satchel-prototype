import { addInventoryToStore, getInventoryStore } from '../../inventory/InventoryStore.js';
import { uuid } from '../../util/uuid.js';
import { createGridInventory } from '../inv/Inv.js';
import { createProfile } from './Profile.js';
import { addProfileInStore, getProfileInStore, getProfilesInStore, hasActiveProfileInStore, setActiveProfileInStore } from './ProfileStore.js';

/**
 * @typedef {import('../../inventory/element/InventoryGridElement.js').InventoryGridElement} InventoryGridElement
 */

const INNER_HTML = /* html */`
<select>
</select>
<button id="actionNew">New</button>
`;
const INNER_STYLE = /* css */`
:host {
  display: flex;
  flex-direction: column;
  align-items: center;
}
`;

export class ProfileSelectElement extends HTMLElement {
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
    customElements.define('profile-select', this);
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
    this.invGroups = [];

    /** @private */
    this.profileSelect = shadowRoot.querySelector('select');
    /** @private */
    this.actionNew = shadowRoot.querySelector('#actionNew');

    /** @private */
    this.onProfileNew = this.onProfileNew.bind(this);
    /** @private */
    this.onProfileSelect = this.onProfileSelect.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.actionNew.addEventListener('click', this.onProfileNew);
    this.profileSelect.addEventListener('input', this.onProfileSelect);

    const store = getInventoryStore();
    const profiles = getProfilesInStore(store);
    for(let profile of profiles) {
      this.addProfileOption(profile.profileId);
    }
  }

  /** @protected */
  disconnectedCallback() {
    this.actionNew.removeEventListener('click', this.onProfileNew);
    this.profileSelect.removeEventListener('input', this.onProfileSelect);

    this.clearProfileOptions();
  }

  forceUpdate() {
    this.resetProfileOptions();
  }

  /** @private */
  resetProfileOptions() {
    this.clearProfileOptions();
    const store = getInventoryStore();
    const profiles = getProfilesInStore(store);
    for(let profile of profiles) {
      this.addProfileOption(profile.profileId);
    }
  }

  /** @private */
  addProfileOption(profileId) {
    const store = getInventoryStore();
    const profile = getProfileInStore(store, profileId);
    let newNode = document.createElement('option');
    newNode.value = profileId;
    newNode.textContent = profile.displayName;
    newNode.id = `profile_option-${profileId}`;
    const rootWorkspace = document.querySelector('#localWorkspace');
    const invGroupId = `profile_invgroup-${profileId}`;
    let invGroupElement = rootWorkspace.querySelector(`#${invGroupId}`);
    if (!invGroupElement) {
      invGroupElement = document.createElement('div');
      invGroupElement.id = invGroupId;
      invGroupElement.style.display = 'none';
      for(let invId of profile.invs) {
        const invElement = /** @type {InventoryGridElement} */ (document.createElement('inventory-grid'));
        invElement.invId = invId;
        invElement.id = `profile_inv-${invId}`;
        // Add profile inv
        invGroupElement.appendChild(invElement);
      }
      // Add profile invgroup
      rootWorkspace.appendChild(invGroupElement);
      this.invGroups.push(invGroupElement);
    }
    // Add profile option
    this.profileSelect.appendChild(newNode);
    this.setActiveProfile(profileId, true);
  }

  /** @private */
  clearProfileOptions() {
    this.setActiveProfile('', false);
    for(let invGroup of this.invGroups) {
      invGroup.remove();
    }
    this.profileSelect.replaceChildren();
  }

  /** @private */
  setActiveProfile(profileId, changeSelect) {
    const store = getInventoryStore();
    if (hasActiveProfileInStore(store)) {
      for(let invGroup of this.invGroups) {
        invGroup.style.display = 'none';
      }
    }
    if (profileId) {
      let invGroup = this.getProfileInvGroup(profileId);
      invGroup.style.display = 'unset';
      setActiveProfileInStore(store, profileId);
      if (changeSelect) {
        this.profileSelect.value = profileId;
      }
    }
    const profileTitle = document.querySelector('#appTitle');
    if (profileId) {
      const store = getInventoryStore();
      const profile = getProfileInStore(store, profileId);
      profileTitle.textContent = profile.displayName;
    } else {
      profileTitle.textContent = 'Satchel';
    }
  }
  
  /** @private */
  getProfileInvGroup(profileId) {
    const invGroupId = `profile_invgroup-${profileId}`;
    for(let invGroup of this.invGroups) {
      if (invGroup.id === invGroupId) {
        return invGroup;
      }
    }
    return null;
  }

  /** @private */
  onProfileSelect(e) {
    let targetId = e.target.value;
    const invGroupElement = this.getProfileInvGroup(targetId);
    if (invGroupElement) {
      this.setActiveProfile(targetId, false);
    } else {
      // It doesn't exist :( Something went wrong.
      console.error(`Something went wrong and the profile '${targetId}' is missing invgroup.`);
      this.resetProfileOptions();
    }
  }

  /** @private */
  onProfileNew() {
    const store = getInventoryStore();
    const displayName = `Satchel #${this.invGroups.length + 1}`;
    let newProfile = createProfile(uuid());
    newProfile.displayName = displayName;
    let newInv = createGridInventory(uuid(), 12, 9);
    newProfile.invs.push(newInv.invId);
    addInventoryToStore(store, newInv.invId, newInv);
    addProfileInStore(store, newProfile.profileId, newProfile);
    this.addProfileOption(newProfile.profileId);
  }
}
ProfileSelectElement.define();
