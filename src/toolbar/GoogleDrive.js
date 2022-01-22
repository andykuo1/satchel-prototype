/* global gapi */
import { Logger } from '../util/Logger.js';

// TODO: To test this, you need to use localhost (not 127.0.0.1)
// Client ID and API key from the Developer Console
const CLIENT_ID = '195145006634-0mp9f2fvmgfufp524aj70ckka4q6oc9t.apps.googleusercontent.com';
const ENCRYPTED_API_KEY = 'QUl6YVN5QmpFN3RuTkhqWVBPclhVSnVzbzR5R0NaazY0WkV0b0pV';

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

const LOGGER = new Logger('GoogleDriveAPI');

export function isSignedInGoogle() {
  let script = document.querySelector('#gapiScript');
  if (!script) {
    return false;
  }
  if (typeof gapi === 'undefined') {
    return false;
  }
  return gapi.auth2.getAuthInstance().isSignedIn.get();
}

export async function signInGoogle() {
  await initializeGoogle();
  if (isSignedInGoogle()) {
    return true;
  }
  await gapi.auth2.getAuthInstance().signIn();
  return isSignedInGoogle();
}

export async function signOutGoogle() {
  await initializeGoogle();
  if (!isSignedInGoogle()) {
    return false;
  }
  await gapi.auth2.getAuthInstance().signOut();
  return true;
}

export async function readGoogleAppFile(fileName) {
  let fileId = await getFileId(fileName);
  if (!fileId) {
    return null;
  }
  return await readFile(fileId);
}

export async function writeGoogleAppFile(fileName, jsonContent) {
  let fileId = await getFileId(fileName);
  if (!fileId) {
    fileId = await createFile(fileName);
  }
  await uploadFile(fileId, fileName, jsonContent);
}

async function initializeGoogle() {
  let script = document.querySelector('#gapiScript');
  if (!script) {
    LOGGER.info('Initializing Google...');
    return new Promise((resolve, reject) => {
      let script = document.createElement('script');
      script.id = 'gapiScript';
      script.toggleAttribute('async', true);
      script.toggleAttribute('defer', true);
      script.setAttribute('src', 'https://apis.google.com/js/api.js');
      script.addEventListener('load', () =>
        gapi.load('client:auth2', async () => {
          try {
            let apiKey = window.atob(ENCRYPTED_API_KEY);
            await gapi.client.init({
              apiKey: apiKey,
              clientId: CLIENT_ID,
              discoveryDocs: DISCOVERY_DOCS,
              scope: SCOPES,
            });
          } catch (e) {
            reject(e);
            return;
          }
          LOGGER.info('Google complete!');
          // Listen for sign-in state changes
          gapi.auth2.getAuthInstance().isSignedIn.listen(onGoogleSignIn);
          // Resolve the pending promise
          resolve();
        })
      );
      document.body.appendChild(script);
    });
  }
}

function onGoogleSignIn(signedIn) {
  if (signedIn) {
    LOGGER.info('Signed in to Google!');
  } else {
    LOGGER.info('Signed out from Google!');
  }
}

async function createFile(name) {
  LOGGER.info(`Creating Google app file '${name}'...`);
  let fileMetadata = {
    name,
    mimeType: 'application/json',
    parents: ['appDataFolder'],
  };
  let response = await gapi.client.drive.files.create({
    resource: fileMetadata,
    fields: 'id',
  });
  return response.result.id;
}

async function listFiles() {
  LOGGER.info('Listing Google app folder...');
  let response = await gapi.client.drive.files.list({
    spaces: 'appDataFolder',
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  });
  let files = response.result.files;
  if (!files || files.length <= 0) {
    return [];
  }
  let result = [];
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    result.push({
      id: file.id,
      name: file.name,
    });
  }
  return result;
}

const APP_FILE_ID_CACHE = {};
async function getFileId(name) {
  if (name in APP_FILE_ID_CACHE) {
    const { fileId, timestamp } = APP_FILE_ID_CACHE[name];
    let staleness = (Date.now() - timestamp) / 1_000;
    LOGGER.debug(`Using Google app file id from cache (${staleness}s old)...`);
    return fileId;
  }
  let result = null;
  let files = await listFiles();
  for (let file of files) {
    if (file.name === name) {
      result = file.id;
      break;
    }
  }
  if (result) {
    APP_FILE_ID_CACHE[name] = {
      fileId: result,
      timestamp: Date.now(),
    };
  }
  return result;
}

async function readFile(fileId) {
  LOGGER.info(`Reading Google file '${fileId}'...`);
  let response = await gapi.client.drive.files.get({
    fileId,
    alt: 'media',
  });
  return response.body;
}

async function uploadFile(fileId, name, jsonString) {
  if (typeof jsonString !== 'string') {
    throw new Error('Cannot upload non-string content.');
  }
  LOGGER.info(`Uploading Google file '${name}'...`);
  LOGGER.debug(fileId, name, typeof jsonString);
  const accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
  const response = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: new Headers({
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }),
      body: jsonString,
    }
  );
  if (response.status === 200) {
    return true;
  } else {
    LOGGER.error('Failed to upload file -', response, await response.text());
    return false;
  }
}
