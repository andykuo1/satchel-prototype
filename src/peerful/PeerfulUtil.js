import { Logger } from '../util/Logger.js';

const SHOW_DEBUG = true;
const LOGGER = new Logger('PeerfulUtil');
/**
 * @param  {...any} messages
 */
export function debug(...messages) {
  if (!SHOW_DEBUG) {
    return;
  }
  LOGGER.debug(...messages);
}

export const FILTER_TRICKLE_SDP_PATTERN = /a=ice-options:trickle\s\n/g;
export const DEFAULT_ICE_SERVERS = [
  {
    urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'],
  },
  { urls: 'turn:0.peerjs.com:3478', username: 'peerjs', credential: 'peerjsp' },
];
