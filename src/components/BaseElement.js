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
        return html``;
    }

    static get style()
    {
        return css``;
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
        let template = this.template;
        Object.defineProperty(this, '__template__', { value: template });
        return template;
    }

    static get __style__()
    {
        let style = this.style;
        Object.defineProperty(this, '__style__', { value: style });
        return style;
    }

    constructor()
    {
        super();

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(this.constructor.__template__.content.cloneNode(true));
        this.shadowRoot.appendChild(this.constructor.__style__.cloneNode(true));
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
        callbackAssignedProperties(this, this.constructor.__properties__, attribute, prev, value, this.__changedAttributes__);
    }

    get changedAttributes()
    {
        return {};
    }

    get __changedAttributes__()
    {
        let changedAttributes = this.changedAttributes;
        Object.defineProperty(this, '__changedAttributes__', { value: changedAttributes });
        return changedAttributes;
    }
}

export function html(strings, ...args)
{
    const s = lit(strings, args);
    const t = document.createElement('template');
    t.innerHTML = s;
    return t;
}

export function css(strings, ...args)
{
    const s = lit(strings, args);
    const t = document.createElement('style');
    t.innerHTML = s;
    return t;
}

function lit(strings, args)
{
    return strings.reduce((prev, curr, i) => prev + curr + (args[i] || ''), '');
}
