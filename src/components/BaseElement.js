import { assignProperties, defaultAndUpgradeProperties, callbackAssignedProperties } from './util/w.js';

export class BaseElement extends HTMLElement
{
    static define(name, constructor, opts)
    {
        let properties = assignProperties(constructor, constructor.properties);
        Object.defineProperty(constructor, '__properties__', {
            value: properties,
        });
        window.customElements.define(name, constructor, opts);
    }

    static get template()
    {
        return '';
    }

    static get style()
    {
        return '';
    }

    static get properties()
    {
        return {};
    }

    static get __properties__()
    {
        return {};
    }

    static get __template__()
    {
        let template = document.createElement('template');
        template.innerHTML = `<style>${this.style}</style>${this.template}`;
        Object.defineProperty(this, '__template__', { value: template });
        return template;
    }

    static get __style__()
    {
        // TODO: Not yet used.
        let style = document.createElement('style');
        style.innerHTML = this.style;
        Object.defineProperty(this, '__style__', { value: style });
        return style;
    }

    constructor()
    {
        super();

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(this.constructor.__template__.content.cloneNode(true));

        this.attributeCallbacks = {};
    }
    
    /** @override */
    connectedCallback()
    {
        defaultAndUpgradeProperties(this, this.constructor.__properties__);
    }

    /** @override */
    disconnectedCallback()
    {

    }

    /** @override */
    attributeChangedCallback(attribute, prev, value)
    {
        callbackAssignedProperties(this, this.constructor.__properties__, attribute, prev, value, this.attributeCallbacks);
    }
}
