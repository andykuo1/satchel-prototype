const SHOW_DEBUG = true;

/**
 * @param  {...any} messages
 */
export function debug(...messages) {
  if (!SHOW_DEBUG) {
    return;
  }
  console.log(...messages);
}

export const FILTER_TRICKLE_SDP_PATTERN = /a=ice-options:trickle\s\n/g;
export const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'turn:0.peerjs.com:3478', username: 'peerjs', credential: 'peerjsp' },
];
