import { uuid } from '../util/uuid.js';

export function prepareSessionStatus(sessionId, remoteId) {
  let jsonData = {
    sessionId: typeof sessionId === 'string' ? sessionId : '',
    remoteId: typeof remoteId === 'string' ? remoteId : '',
  };
  sessionStorage.setItem('sessionStatus', JSON.stringify(jsonData));
}

export function resolveSessionStatus() {
  const sessionStatus = resolveSessionStatusFromStorage();
  const urlRemoteId = resolveRemoteIdFromUrl(window.location);
  const sessionId = sessionStatus.sessionId || uuid();
  const remoteId = urlRemoteId || sessionStatus.remoteId || sessionId;
  return {
    sessionId,
    remoteId,
  };
}

function resolveSessionStatusFromStorage() {
  try {
    const storageData = sessionStorage.getItem('sessionStatus');
    const jsonData = JSON.parse(storageData);
    return {
      sessionId: jsonData && typeof jsonData.sessionId === 'string' ? jsonData.sessionId : '',
      remoteId: jsonData && typeof jsonData.remoteId === 'string' ? jsonData.remoteId : '',
    };
  } catch (e) {
    return {
      sessionId: '',
      remoteId: '',
    };
  }
}

function resolveRemoteIdFromUrl(url) {
  try {
    const urlParams = new URLSearchParams(url.search);
    if (urlParams.has('id')) {
      return urlParams.get('id');
    } else {
      return '';
    }
  } catch (e) {
    return '';
  }
}
