import { Eventable } from '../util/Eventable.js';
import { PeerJsSignaling } from './PeerJsSignaling.js';
import { createPromiseStatus, createPromiseStatusPromise, rejectPromiseStatus, resolvePromiseStatus } from './PromiseStatus.js';

const DEFAULT_CONNECTION_OPTS = {
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:global.stun.twilio.com:3478'
            ]
        }
    ],
    sdpSemantics: 'unified-plan'
};

const SHOW_DEBUG = true;

/**
 * @param  {...any} messages 
 */
function debug(...messages)
{
    if (!SHOW_DEBUG) return;
    console.log(...messages);
}

/**
 * @typedef PeerfulConnectionEvents
 * @property {(data: string) => void} data
 * @property {(error: Error) => void} error
 * @property {() => void} close
 */

/**
 * @extends Eventable<PeerfulConnectionEvents>
 */
export class PeerfulConnection extends Eventable
{
    /**
     * @param {string} id
     * @param {PeerJsSignaling} signaling
     * @param {object} [opts]
     */
    constructor(id, signaling, opts = undefined)
    {
        super();
        opts = {
            ...DEFAULT_CONNECTION_OPTS,
            ...(opts || {}),
        };

        /** @protected */
        this.opened = false;
        /** @protected */
        this.closed = false;

        this.localId = id;
        this.remoteId = null;
        
        /** @protected */
        this.signaling = signaling;

        /**
         * @protected
         * @type {import('./PromiseStatus.js').PromiseStatusResult<PeerfulConnection>}
         */
        this.connectedStatus = null;
        /**
         * @protected
         * @type {RTCPeerConnection}
         */
        this.peerConnection = null;
        /**
         * @protected
         * @type {RTCDataChannel}
         */
        this.dataChannel = null;

        /** @private */
        this.onIceCandidate = this.onIceCandidate.bind(this);
        /** @private */
        this.onIceConnectionStateChange = this.onIceConnectionStateChange.bind(this);
        /** @private */
        this.onDataChannelClose = this.onDataChannelClose.bind(this);
        /** @private */
        this.onDataChannelError = this.onDataChannelError.bind(this);
        /** @private */
        this.onDataChannelMessage = this.onDataChannelMessage.bind(this);
        /** @private */
        this.onDataChannelOpen = this.onDataChannelOpen.bind(this);
    }

    /**
     * @protected
     * @param {RTCDataChannel} channel
     */
    setDataChannel(channel)
    {
        if (this.dataChannel)
        {
            let prev = this.dataChannel;
            this.dataChannel = null;
            prev.removeEventListener('message', this.onDataChannelMessage);
            prev.removeEventListener('error', this.onDataChannelError);
            prev.removeEventListener('close', this.onDataChannelClose);
            prev.removeEventListener('open', this.onDataChannelOpen);
            prev.close();
        }
        if (channel)
        {
            this.dataChannel = channel;
            channel.binaryType = 'arraybuffer';
            channel.addEventListener('message', this.onDataChannelMessage);
            channel.addEventListener('error', this.onDataChannelError);
            channel.addEventListener('close', this.onDataChannelClose);
            channel.addEventListener('open', this.onDataChannelOpen);
        }
    }

    /**
     * @param {string} data 
     */
    send(data)
    {
        if (!this.dataChannel)
        {
            throw new Error('Cannot send message to un-opened connection.');
        }
        this.dataChannel.send(data);
    }

    /**
     * @param {RTCConfiguration} [opts]
     */
    open(opts = undefined)
    {
        if (this.opened) throw new Error('Cannot open already opened connection.');
        this.opened = true;
        this.closed = false;
        this.connectedStatus = createPromiseStatus();

        let peerConnection = new RTCPeerConnection(opts);
        this.peerConnection = peerConnection;
        peerConnection.addEventListener('icecandidate', this.onIceCandidate);
        peerConnection.addEventListener('iceconnectionstatechange', this.onIceConnectionStateChange);
        return this;
    }

    close()
    {
        if (this.closed) throw new Error('Cannot close already closed connection.');
        this.closed = true;
        this.opened = false;
        this.connectedStatus = null;

        this.setDataChannel(null);

        let peerConnection = this.peerConnection;
        this.peerConnection = null;
        peerConnection.removeEventListener('icecandidate', this.onIceCandidate);
        peerConnection.removeEventListener('iceconnectionstatechange', this.onIceConnectionStateChange);
        peerConnection.close();
    }

    /**
     * @abstract
     * @param {string} type 
     * @param {RTCSessionDescriptionInit} sdp 
     * @param {string} src 
     * @param {string} dst 
     */
    onSignalingResponse(type, sdp, src, dst) {}

    /**
     * @private
     * @param {MessageEvent} e
     */
    onDataChannelMessage(e)
    {
        debug('[CHANNEL]', 'Received message:', e.data);
        this.emit('data', e.data);
    }

    /**
     * @private
     */
    onDataChannelClose()
    {
        debug('[CHANNEL]', 'Close!');
        this.emit('close');
    }

    /**
     * @private
     */
    onDataChannelOpen()
    {
        debug('[CHANNEL]', 'Open!');
        resolvePromiseStatus(this.connectedStatus, this);
    }

    /**
     * @private
     * @param {Event} e 
     */
    onDataChannelError(e)
    {
        debug('[CHANNEL]', 'Error!', e);
        this.emit('error', e);
    }

    /**
     * @private
     * @param {RTCPeerConnectionIceEvent} e
     */
    onIceCandidate(e)
    {
        if (!e.candidate)
        {
            debug('[CHANNEL]', 'ICE complete');
            this.signaling.sendSignalMessage(this.localId, this.remoteId, this.peerConnection.localDescription);
            // Wait for peer response...
        }
    }

    /**
     * @private
     * @param {Event} e 
     */
    onIceConnectionStateChange(e)
    {
        const state = /** @type {RTCPeerConnection} */(e.target).iceConnectionState;
        switch(state)
        {
            case 'failed':
                throw new Error('Ice connection failed.');
            case 'closed':
                throw new Error('Ice connection closed.');
            default:
                // Progress along as usual...
                break;
        }
    }
}

export class PeerfulLocalConnection extends PeerfulConnection
{
    /**
     * @param {string} id
     * @param {PeerJsSignaling} signaling
     * @param {object} [opts]
     */
    constructor(id, signaling, opts = undefined)
    {
        super(id, signaling, opts);
    }

    /**
     * @param {string} remoteId
     */
    async connect(remoteId)
    {
        debug('[LOCAL]', 'Connecting to', remoteId, '...');
        let channelOpts = undefined;
        let offerOpts = undefined;

        this.remoteId = remoteId;

        // Create channel
        let channel = this.peerConnection.createDataChannel('data', channelOpts);
        this.setDataChannel(channel);

        // Create offer
        let offer = await this.peerConnection.createOffer(offerOpts);
        await this.peerConnection.setLocalDescription(offer);

        // Wait for ICE to complete before sending offer...
        return createPromiseStatusPromise(this.connectedStatus);
    }

    /**
     * @override
     * @param {'answer'} type
     * @param {RTCSessionDescriptionInit} sdp
     * @param {string} src
     * @param {string} dst
     */
    onSignalingResponse(type, sdp, src, dst)
    {
        debug('[LOCAL]', 'Received signal', type, src, dst);
        if (type === 'answer')
        {
            // Process answer
            let answer = new RTCSessionDescription(sdp);
            this.peerConnection.setRemoteDescription(answer);
            // Wait for channel to open...
        }
        else
        {
            throw new Error(`Received invalid response type '${type}' on local connection.`);
        }
    }
}

export class PeerfulRemoteConnection extends PeerfulConnection
{
    /**
     * @param {string} id
     * @param {PeerJsSignaling} signaling
     * @param {object} [opts]
     */
    constructor(id, signaling, opts = undefined)
    {
        super(id, signaling, opts);

        this.onDataChannel = this.onDataChannel.bind(this);
    }

    async listen()
    {
        debug('[REMOTE]', 'Listening...');
        this.peerConnection.addEventListener('datachannel', this.onDataChannel);
        return createPromiseStatusPromise(this.connectedStatus);
    }

    /**
     * @protected
     * @param {RTCDataChannelEvent} e
     */
    onDataChannel(e)
    {
        debug('[REMOTE]', 'Received data channel');
        // Create channel
        let channel = e.channel;
        this.setDataChannel(channel);
        // Wait for channel to open...
    }

    /**
     * @override
     * @param {'offer'} type 
     * @param {RTCSessionDescriptionInit} sdp 
     * @param {string} src 
     * @param {string} dst 
     */
    onSignalingResponse(type, sdp, src, dst)
    {
        debug('[REMOTE]', 'Received signal', type, src, dst);
        if (type === 'offer')
        {
            this.remoteId = src;
            // Receive offer
            let offer = new RTCSessionDescription(sdp);
            this.peerConnection.setRemoteDescription(offer)
                .then(() => this.peerConnection.createAnswer())
                .then(answer => this.peerConnection.setLocalDescription(answer));
            // Wait for ICE to complete before sending answer...
        }
        else
        {
            throw new Error(`Received invalid response type '${type}' on remote connection.`);
        }
    }
}
