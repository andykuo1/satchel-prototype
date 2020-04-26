import { BaseElement } from './BaseElement.js';

export class ItemDisplay extends BaseElement
{
    /** @override */
    static get template()
    {
        return `
            <div>
                <item-container type="slot">
                </item-container>
                <item-card></item-card>
            </div>
        `;
    }

    constructor()
    {
        super();
    }
}
BaseElement.define('item-display', ItemDisplay);
