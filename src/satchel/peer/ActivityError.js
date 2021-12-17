import { ActivityBase } from './ActivityBase.js';
import { SatchelLocal, SatchelRemote } from './SatchelLocal.js';

export class ActivityError extends ActivityBase {
  /**
   * @override
   * @param {SatchelLocal} local
   * @param {SatchelRemote} remote
   * @param {string} type
   * @param {object} data
   */
  static onRemoteServerMessage(local, remote, type, data) {
    if (type !== 'error') {
      return false;
    }
    window.alert(`Oops! Server error message: ${data}`);
    remote.connection.close();
    return true;
  }

  /**
   * @param {SatchelRemote} remote 
   * @param {object} data 
   */
  static sendError(remote, data) {
    remote.sendMessage('error', data);
  }
}
