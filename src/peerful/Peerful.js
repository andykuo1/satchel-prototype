import { uuid } from '../util/uuid.js';
import { Eventable } from '../util/Eventable.js';
import { PeerJsSignaling } from './PeerJsSignaling.js';
import { PeerfulConnection, PeerfulLocalConnection, PeerfulRemoteConnection } from './PeerfulConnection.js';

/**
 * @typedef PeerfulEvents
 * @property {(connection: PeerfulConnection) => void} connect
 * @property {(error: Error) => void} error
 */

/**
 * @extends Eventable<PeerfulEvents>
 */
export class Peerful extends Eventable
{
    /**
     * @param {string} id
     */
    constructor(id = uuid())
    {
        super();

        this.id = id;

        /** @protected */
        this.closed = false;

        /** @type {Record<string, PeerfulConnection>} */
        this.connections = {};

        /** @private */
        this.onPeerfulLocalConnectionOpen = this.onPeerfulLocalConnectionOpen.bind(this);
        /** @private */
        this.onPeerfulRemoteConnectionOpen = this.onPeerfulRemoteConnectionOpen.bind(this);

        /** @private */
        this.onSignaling = this.onSignaling.bind(this);
        /** @private */
        this.signaling = new PeerJsSignaling(id, this.onSignaling);
        /** @private */
        this.signalingPromise = this.signaling.open();
    }

    close()
    {
        this.closed = true;
        let conns = Object.values(this.connections);
        this.connections = {};
        for(let conn of conns)
        {
            conn.close();
        }
        this.signaling.close();
    }

    /**
     * @param {string} remoteId 
     */
    async connect(remoteId)
    {
        if (this.id === remoteId)
        {
            throw new Error('Cannot connect to peer with the same id.');
        }
        if (this.closed)
        {
            throw new Error('Cannot connect to peers when already closed.');
        }
        await this.signalingPromise;
        let conn = new PeerfulLocalConnection(this.id, this.signaling).open();
        this.connections[remoteId] = conn;
        try
        {
            await conn.connect(remoteId);
        }
        catch(e)
        {
            delete this.connections[remoteId];
        }
        this.onPeerfulLocalConnectionOpen(conn);
        return this;
    }

    async listen()
    {
        if (this.closed)
        {
            throw new Error('Cannot listen for peers when already closed.');
        }
        await this.signalingPromise;
        return this;
    }

    /**
     * @private
     * @param {PeerfulLocalConnection} conn
     */
    onPeerfulLocalConnectionOpen(conn)
    {
        this.emit('connect', conn);
    }

    /**
     * @private
     * @param {PeerfulRemoteConnection} conn
     */
    onPeerfulRemoteConnectionOpen(conn)
    {
        this.emit('connect', conn);
    }

    /**
     * @private
     * @param {Error} error
     * @param {RTCSessionDescriptionInit} sdp
     * @param {string} src
     * @param {string} dst
     */
    onSignaling(error, sdp, src, dst)
    {
        if (error)
        {
            let conn = this.connections[dst] || this.connections[src];
            if (conn)
            {
                conn.close();
            }
            this.emit('error', error);
            return;
        }
        else
        {
            switch(sdp.type)
            {
                case 'offer':
                    {
                        let conn = new PeerfulRemoteConnection(this.id, this.signaling).open();
                        this.connections[dst] = conn;
                        conn.listen().then(this.onPeerfulRemoteConnectionOpen);
                        conn.onSignalingResponse('offer', sdp, src, dst);
                    }
                    break;
                case 'answer':
                    {
                        let conn = this.connections[src];
                        if (!conn)
                        {
                            console.warn('Received signaling attempt when not listening.');
                            return;
                        }
                        conn.onSignalingResponse('answer', sdp, src, dst);
                    }
                    break;
            }
        }
    }
}
