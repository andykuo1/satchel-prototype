import { Eventable } from '../../util/Eventable.js';
import {
  createPropertyAttribute,
  getPropertyAttribute,
  setPropertyAttribute,
  upgradePropertyAttributes,
} from './PropertyAttribute.js';
import { dispatchPropertyAttributeChanged, getObservedPropertyAttributes } from './PropertyObserved.js';
import { createPropertyTypeDescriptor } from './PropertyTypeDescriptor.js';

export class CuttleComponent extends HTMLElement {
  /** @abstract */
  static get tagName() {
    return camelToKebab(this.name);
  }

  /** @abstract */
  static get html() {
    return null;
  }

  /** @abstract */
  static get css() {
    return null;
  }

  /** @abstract */
  static get properties() {
    return {};
  }

  static define(customElements = window.customElements) {
    customElements.define(this.tagName, this);
  }

  /** @protected */
  static get [Symbol.for('templateNode')]() {
    let s = this.html;
    let t = null;
    if (s) {
      t = document.createElement('template');
      t.innerHTML = s;
    }
    Object.defineProperty(this, Symbol.for('templateNode'), { value: t });
    return t;
  }

  /** @protected */
  static get [Symbol.for('styleNode')]() {
    let s = this.css;
    let t = null;
    if (s) {
      t = document.createElement('style');
      t.innerHTML = this.css;
    }
    Object.defineProperty(this, Symbol.for('styleNode'), { value: t });
    return t;
  }

  /** @protected */
  static get observedAttributes() {
    return getObservedPropertyAttributes(resolveProps(this));
  }

  constructor() {
    super();
    let c = /** @type {typeof CuttleComponent} */ (this.constructor);
    let t = c[Symbol.for('templateNode')];
    let s = c[Symbol.for('styleNode')];
    if (t || s) {
      let shadowRoot = this.attachShadow({ mode: 'open' });
      if (t) {
        shadowRoot.append(t.content.cloneNode(true));
      }
      if (s) {
        shadowRoot.append(s.cloneNode(true));
      }
    }

    /** @protected */
    this.m = {
      target: this,
      events: new Eventable(),
    };
  }

  /** @protected */
  connectedCallback() {
    upgradePropertyAttributes(this, resolveProps(this.constructor));
    this.m.events.emit('connected');
  }

  /** @protected */
  disconnectedCallback() {
    this.m.events.emit('disconnected');
  }

  /**
   * @protected
   * @param {string} attribute
   * @param {string} previous
   * @param {string} value
   */
  attributeChangedCallback(attribute, previous, value) {
    dispatchPropertyAttributeChanged(this, resolveProps(this.constructor), attribute, previous, value);
    this.m.events.emit('attributeChanged', attribute, previous, value);
  }
}

export function getPropValue(element, propName) {
  return getPropertyAttribute(element, resolveProps(element.constructor), propName);
}

export function setPropValue(element, propName, value) {
  setPropertyAttribute(element, resolveProps(element.constructor), propName, value);
}

export function onPropValue(propName) {
  return `${propName}$propertyChangedCallback`;
}

export function resolveProps(constructor) {
  let p = constructor[Symbol.for('attributeProperties')];
  if (!p) {
    p = {};
    let props = constructor.properties || {};
    for (let key of Object.keys(props)) {
      let opts = props[key];
      if (typeof opts === 'function') {
        opts = { type: opts };
      } else if (typeof opts !== 'object') {
        throw new Error(`Unsupported type '${typeof opts}' for attribute '${key}'.`);
      }
      const {
        type = String,
        attribute = key.toLowerCase(),
        descriptor = createPropertyTypeDescriptor(type, attribute),
        observed = true,
        propertyChangedCallback = observed ? constructor.prototype[onPropValue(key)] : null,
      } = opts;
      p[key] = createPropertyAttribute(key, {
        type,
        attribute,
        descriptor,
        observed,
        propertyChangedCallback,
      });
    }
    Object.defineProperty(constructor, Symbol.for('attributeProperties'), { value: p });
  }
  return p;
}

function camelToKebab(str) {
  return str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase());
}
