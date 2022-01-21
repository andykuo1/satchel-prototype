import { getSatchelStore } from '../../store/SatchelStore.js';
import { isAlbumExpanded, isAlbumLocked, setAlbumExpanded, setAlbumLocked } from '../../satchel/album/Album.js';
import { getCursor } from '../cursor/index.js';
import { downloadText } from '../../util/downloader.js';
import { exportAlbumToJSON } from '../../loader/AlbumLoader.js';
import { deleteAlbumInStore, getAlbumInStore, isAlbumInStore } from '../../store/AlbumStore.js';
import { dispatchAlbumChange } from '../../events/AlbumEvents.js';
import { IconButtonElement } from '../lib/IconButtonElement.js';
import { clearItemsInAlbum, getItemIdsInAlbum } from '../../satchel/album/AlbumItems.js';
import { isGroundAlbum } from '../../satchel/GroundAlbum.js';
import { isFoundryAlbum } from '../../satchel/FoundryAlbum.js';
import { isTrashAlbum } from '../../satchel/TrashAlbum.js';
import './AlbumListElement.js';

/**
 * @typedef {import('../invgrid/InventoryGridElement.js').InventoryGridElement} InventoryGridElement
 * @typedef {import('../../satchel/item/Item.js').ItemId} ItemId
 */

const INNER_HTML = /* html */`
<fieldset>
  <legend contenteditable></legend>
  <span class="preactionbar">
    <icon-button class="button" id="buttonExpand" icon="res/expandmore.svg" alt="expand" title="Expand Album"></icon-button>
  </span>
  <span class="actionbar">
    <icon-button class="button" id="buttonDelete" icon="res/delete.svg" alt="clear" title="Clear Album"></icon-button>
    <icon-button class="button" id="buttonExport" icon="res/download.svg" alt="export" title="Export Album"></icon-button>
    <icon-button class="button" id="buttonLock" icon="res/unlock.svg" alt="lock" title="Lock Album"></icon-button>
  </span>
  <label id="labelEmpty" class="hidden">- - - - - Empty - - - - -</label>
  <album-list fixed></album-list>
</fieldset>
`;
const INNER_STYLE = /* css */`
fieldset {
  position: relative;
  min-height: 2em;
  padding-right: 2.5em;
  border-color: #444444;
}
fieldset.unlocked {
  border-color: #ffffff;
}
legend {
  display: flex;
  flex-direction: row;
  border-bottom: 2px solid transparent;
  margin-left: 1.5em;
}
legend[contenteditable] {
  border-color: #ffffff;
}
.preactionbar {
  position: absolute;
  top: -1.5em;
  left: 0.3em;
  background-color: #333333;
  padding: 0 0.1em;
}
.actionbar {
  position: absolute;
  top: -1.5em;
  right: 0.3em;
  background-color: #333333;
  padding: 0 0.1em;
}
.button {
  display: inline-block;
  width: 1.5em;
  height: 1.5em;
  margin: 0;
}
#labelEmpty {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  color: #666666;
  text-align: center;
}
.hidden {
  display: none;
}
fieldset.internal {
  opacity: 0.6;
}
legend.internal {
  color: #888888;
}
album-list:not(.expanded) {
  display: none;
}
`;

export class AlbumPackElement extends HTMLElement {
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
    customElements.define('album-pack', this);
  }

  get albumId() {
    return this._albumId;
  }

  constructor(albumId) {
    super();
    if (!albumId) {
      throw new Error('Missing album id for album element.');
    }
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.append(
      this.constructor[Symbol.for('templateNode')].content.cloneNode(true)
    );
    shadowRoot.append(
      this.constructor[Symbol.for('styleNode')].cloneNode(true)
    );
    
    /** @private */
    this._albumId = albumId;
    /** @private */
    this._locked = false;

    /** @private */
    this.container = shadowRoot.querySelector('fieldset');
    /** @private */
    this.inputTitle = shadowRoot.querySelector('legend');
    /** @private */
    this.labelEmpty = shadowRoot.querySelector('#labelEmpty');

    /** @private */
    this.buttonDelete = shadowRoot.querySelector('#buttonDelete');
    /** @private */
    this.buttonExport = shadowRoot.querySelector('#buttonExport');
    /** @private */
    this.buttonLock = /** @type {IconButtonElement} */ (shadowRoot.querySelector('#buttonLock'));
    /** @private */
    this.buttonExpand = /** @type {IconButtonElement} */ (shadowRoot.querySelector('#buttonExpand'));

    /** @private */
    this.albumList = shadowRoot.querySelector('album-list');
    this.albumList.setAttribute('albumid', albumId);
    /** @private */
    this.onAlbumListChange = this.onAlbumListChange.bind(this);

    /** @private */
    this.onInputTitle = this.onInputTitle.bind(this);
    /** @private */
    this.onButtonLock = this.onButtonLock.bind(this);
    /** @private */
    this.onButtonExport = this.onButtonExport.bind(this);
    /** @private */
    this.onButtonDelete = this.onButtonDelete.bind(this);
    /** @private */
    this.onButtonExpand = this.onButtonExpand.bind(this);
    
    /** @private */
    this.onItemDrop = this.onItemDrop.bind(this);
  }

  /** @protected */
  connectedCallback() {
    this.albumList.addEventListener('change', this.onAlbumListChange);
    this.inputTitle.addEventListener('input', this.onInputTitle);
    this.buttonLock.addEventListener('click', this.onButtonLock);
    this.buttonExport.addEventListener('click', this.onButtonExport);
    this.buttonDelete.addEventListener('click', this.onButtonDelete);
    this.buttonExpand.addEventListener('click', this.onButtonExpand);
    this.container.addEventListener('mouseup', this.onItemDrop);
  }

  /** @protected */
  disconnectedCallback() {
    this.albumList.removeEventListener('change', this.onAlbumListChange);
    this.inputTitle.removeEventListener('input', this.onInputTitle);
    this.buttonLock.removeEventListener('click', this.onButtonLock);
    this.buttonExport.removeEventListener('click', this.onButtonExport);
    this.buttonDelete.removeEventListener('click', this.onButtonDelete);
    this.buttonExpand.removeEventListener('click', this.onButtonExpand);
    this.container.removeEventListener('mouseup', this.onItemDrop);
  }

  /** @private */
  onAlbumListChange(e) {
    const albumId = e.detail.albumId;
    const store = getSatchelStore();
    const album = getAlbumInStore(store, albumId);

    if (isGroundAlbum(album) || isTrashAlbum(album)) {
      // Cannot change lock state for a ground album
      this.buttonLock.toggleAttribute('disabled', true);
    }

    // Update lock status
    const locked = isAlbumLocked(store, albumId);
    this.buttonLock.icon = locked ? 'res/lock.svg' : 'res/unlock.svg';
    this.buttonLock.alt = locked ? 'unlock' : 'lock';
    this.buttonLock.title = locked ? 'Unlock Album' : 'Lock Album';
    this.buttonDelete.toggleAttribute('disabled', locked);
    this.inputTitle.toggleAttribute('contenteditable', !locked);
    this.container.classList.toggle('unlocked', !locked);
    this.albumList.toggleAttribute('locked', locked);

    // Update expand status
    const expanded = isAlbumExpanded(store, albumId);
    this.buttonExpand.icon = expanded ? 'res/expandless.svg' : 'res/expandmore.svg';
    this.buttonExpand.alt = expanded ? 'less' : 'more';
    this.buttonExpand.title = expanded ? 'Hide Album' : 'Show Album';
    this.albumList.classList.toggle('expanded', expanded);

    // Change style for internal albums
    let isInternalAlbum = isFoundryAlbum(album) || isGroundAlbum(album) || isTrashAlbum(album);
    this.container.classList.toggle('internal', isInternalAlbum);
    this.inputTitle.classList.toggle('internal', isInternalAlbum);

    // Update name
    const name = album.displayName;
    if (name !== this.inputTitle.textContent) {
      this.inputTitle.textContent = name;
    }

    // Update if empty
    let empty = getItemIdsInAlbum(store, albumId).length > 0;
    this.labelEmpty.classList.toggle('hidden', empty);
  }

  /** @private */
  onInputTitle(e) {
    const store = getSatchelStore();
    const albumId = this.albumId;
    if (isAlbumInStore(store, albumId)) {
      const name = this.inputTitle.textContent;
      const album = getAlbumInStore(store, albumId);
      album.displayName = name;
      dispatchAlbumChange(store, albumId);
    }
  }

  /** @private */
  onButtonLock() {
    const store = getSatchelStore();
    const albumId = this.albumId;
    if (isAlbumInStore(store, albumId)) {
      const locked = isAlbumLocked(store, albumId);
      setAlbumLocked(store, albumId, !locked);
    }
  }

  /** @private */
  onButtonExport() {
    const store = getSatchelStore();
    const album = getAlbumInStore(store, this.albumId);
    if (album) {
      try {
        const jsonData = exportAlbumToJSON(album);
        const name = album.displayName;
        downloadText(`${name}-album.json`, JSON.stringify(jsonData, null, 4));
      } catch (e) {
        console.error(e);
      }
    }
  }

  /** @private */
  onButtonDelete() {
    const store = getSatchelStore();
    const albumId = this.albumId;
    clearItemsInAlbum(store, albumId);
    const album = getAlbumInStore(store, albumId);
    deleteAlbumInStore(store, albumId, album);
    this.remove();
  }

  /** @private */
  onButtonExpand() {
    const store = getSatchelStore();
    const albumId = this.albumId;
    if (isAlbumInStore(store, albumId)) {
      const expanded = isAlbumExpanded(store, albumId);
      setAlbumExpanded(store, albumId, !expanded);
    }
  }

  /** @private */
  onItemDrop(e) {
    const store = getSatchelStore();
    const albumId = this.albumId;
    if (!isAlbumInStore(store, albumId)) {
      return;
    }
    if (isAlbumLocked(store, albumId)) {
      return;
    }
    if (!isAlbumExpanded(store, albumId)) {
      return;
    }
    let cursor = getCursor();
    let result = cursor.putDownInAlbum(albumId);
    if (result) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
}
AlbumPackElement.define();
