import { uuid } from '../util/uuid.js';
import { Eventable } from '../util/Eventable.js';

export class PeerfulPeerJs extends Eventable {
    constructor(id = uuid()) {
        super();
        this.id = id;
        this.peer = new Peer(id);
    }

    close() {
        this.peer.destroy();
    }

    async connect(remoteId) {
        let peer = this.peer;
        let conn = peer.connect(remoteId);
        return new Promise((resolve, reject) => {
            conn.on('open', () => {
                resolve(conn);
            });
        });
    }

    async listen() {
        let peer = this.peer;
        peer.on('connection', (conn) => {
            this.emit('connect', conn);
        });
    }
}
