import { BaseElement } from './BaseElement.js';

export class TreasureReceipt extends BaseElement
{
    /** @override */
    static get template()
    {
        return `
            <article>
                <h2>Treasure</h2>
                <section>
                    <p>
                        Description of the treasure. Where is it from?
                    </p>
                </section>
                <h2>Items</h2>
                <section>
                    <p>
                        Item #1
                    </p>
                    <p>
                        Item #2
                    </p>
                </section>
                <h2>Misc</h2>
                <section>
                    <p>
                        Gold
                    </p>
                </section>
            </article>
        `;
    }

    constructor()
    {
        super();
    }
}
BaseElement.define('treasure-receipt', TreasureReceipt);
