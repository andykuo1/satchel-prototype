import { html, component, useState, useEffect, useRef } from '../../node_modules/haunted/haunted.js';
import { ItemContainer, loadItemContainer, saveItemContainer } from '../components/ItemContainer.js';

import { Peerful } from '../peerful/Peerful.js';
import { addToHoldingContainer, removeFromHoldingContainer } from '../Satchel.js';
import { copyToClipboard } from '../util/clipboard.js';

function initializePeerful(onConnect, onClose, onData) {
    const peerful = new Peerful();
    peerful.on('connect', (conn) => {
        onConnect(conn);
        conn.on('data', data => {
            onData(data);
        });
        conn.on('error', e => {
            console.error(e);
        });
        conn.on('close', () => {
            onClose(conn);
        });
    });
    return peerful;
}

/**
 * @param {Location} url 
 * @returns {string|null}
 */
function tryGetRemotePeerId(url) {
    let params = new URLSearchParams(url.search);
    if (params.has('id')) {
        return params.get('id');
    } else {
        return null;
    }
}

/**
 * @param {Peerful} peerful 
 * @returns {string}
 */
function generateShareableLink(peerful) {
    return `http://127.0.0.1:5500/client.html?id=${peerful.id}`;
}

function ClientApp() {
    const peerfulRef = useRef(null);
    const [shareable, setShareable] = useState(false);
    const holdingRef = useRef(null);
    const element = this;

    useEffect(() => {
        let holdingContainer = element.shadowRoot.querySelector('#holding');
        addToHoldingContainer(holdingContainer);
        return () => removeFromHoldingContainer(holdingContainer);
    });

    function onConnect(conn) {
        setShareable(shareable);
    }

    function onClose(conn) {
        setShareable(shareable);
    }

    function onData(data) {
    }

    async function onHost() {
        if (!peerfulRef.current) {
            peerfulRef.current = initializePeerful(onConnect, onClose, onData);
            setShareable(true);
            let peerful = peerfulRef.current;
            await peerful.listen();
        }
    }

    async function onJoin() {
        let peerId = tryGetRemotePeerId(window.location);
        if (peerId && !peerfulRef.current) {
            peerfulRef.current = initializePeerful(onConnect, onData);
            setShareable(true);
            let peerful = peerfulRef.current;
            await peerful.connect(peerId);
        }
    }

    function onShare() {
        if (peerfulRef.current) {
            let url = generateShareableLink(peerfulRef.current);
            copyToClipboard(url);
        }
    }

    return html`
        <style>
            .pages {
                display: flex;
                flex-direction: row;
                overflow-x: auto;
            }

            .foreground {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                overflow: hidden;
                z-index: 5;
                background-color: rgba(0, 0, 0, 0);
                transition: background-color 0.3s ease;
            }

            #holding {
                display: none;
                position: absolute;
            }
        </style>
        <div class="foreground">
            <item-contextmenu id="contextmenu"></item-contextmenu>    
            <item-container id="holding" type="slot" ref=${holdingRef}></item-container>
        </div>
        <div>
            <div class="menus">
                <button @click=${onShare} ?disabled=${!shareable}>Share Link</button>
            </div>
            <div class="pages">
                ${peerfulRef.current
                    && Object
                        .values(peerfulRef.current.connections)
                        .map(conn => html`<inventory-page .connection=${conn}></inventory-page>`)}
            </div>
            <div class="grounds">
                <h2>Ground</h2>
                <div id="ground">
                </div>
                <button @click=${onHost}>Host</button>
                <button @click=${onJoin}>Join</button>
            </div>
        </div>
    `;
}
window.customElements.define('client-app', component(ClientApp));

function InventoryPage(props) {
    const { connection } = props;

    const [name, setName] = useState('???');
    const tickRef = useRef(0);
    const itemContainerRef = useRef(null);
    const element = this;

    function onData(data) {
        console.log(itemContainerRef.current);
        if (itemContainerRef.current)
        {
            let itemContainer = itemContainerRef.current;
            let json = JSON.parse(data);
            switch(json.type) {
                case 'name':
                    setName(json.data);
                    break;
                case 'update':
                    loadItemContainer(itemContainer, json.data);
                    break;
            }
        }
    }

    function onChange(e) {
        let text = e.target.textContent;
        console.log('SEND!', text);
        connection.send(JSON.stringify({
            type: 'name',
            data: text,
        }));
    }

    function onAnimationFrame(now) {
        if (++tickRef.current < 100) {
            tickRef.current = 0;
            let itemContainer = element.shadowRoot.querySelector('item-container');
            let json = {};
            saveItemContainer(itemContainer, json);
            connection.send(JSON.stringify({ type: 'update', timestamp: now, data: json }));
        }
    }

    useEffect(() => {
        // let handle = requestAnimationFrame(onAnimationFrame);
        connection.on('data', onData);
        itemContainerRef.current = this.shadowRoot.querySelector('item-container');
        return () => {
            connection.off('data', onData);
            itemContainerRef.current = null;
            // cancelAnimationFrame(handle);
        };
    });

    return html`
        <style>
            h1 {
                display: flex;
                flex-direction: row;
                align-items: center;
                margin-bottom: 0;
            }
        </style>
        <article>
            <h1>
                <item-container type="slot"></item-container>
                <label contenteditable @blur=${onChange}>${name}</label>
            </h1>
            <section>
                <item-container type="grid" size="4 6"></item-container>
            </section>
        </article>
    `;
}
window.customElements.define('inventory-page', component(InventoryPage));
