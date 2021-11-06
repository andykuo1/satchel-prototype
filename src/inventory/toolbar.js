import { clearGround } from './GroundHelper.js';
import { openItemBuilder } from './ItemBuilder.js';
import { downloadText } from '../util/downloader.js';
import { saveToJSON, loadFromJSON } from './InventoryLoader.js';
import { getInventoryStore } from './InventoryStore.js';
import { connectAsClient, connectAsServer, isServerSide } from './PeerSatchel.js';
import { getCursorContext } from './CursorHelper.js';

window.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#editButton').addEventListener('click', onEditClick);
    document.querySelector('#deleteButton').addEventListener('click', onDeleteClick);
    document.querySelector('#cloudButton').addEventListener('click', onCloudClick);
    document.querySelector('#downloadButton').addEventListener('click', onDownloadClick);
    document.querySelector('#uploadButton').addEventListener('click', onUploadClick);
    document.querySelector('#uploadInput').addEventListener('change', onUploadChange);
});

function onEditClick() {
    let editor = document.querySelector('#editor');
    if (editor.classList.contains('open')) {
        editor.classList.remove('open');
    } else {
        openItemBuilder(document.querySelector('#itemBuilder'));
        document.querySelector('#editor').classList.add('open');
    }
}

function onDeleteClick() {
    if (window.confirm('Clear all items on the ground?')) {
        clearGround();
    }
}

function onCloudClick() {
    // Try connect the client
    connectAsClient().then(result => {
        if (result) {
            document.querySelector('#cloudButton').toggleAttribute('disabled', true);
        } else {
            // Try connect the server
            connectAsServer();
        }
    });
}

function onDownloadClick() {
    let timestamp = Date.now();
    if (isServerSide()) {
        let serverData;
        try {
            serverData = JSON.parse(localStorage.getItem('server_data'));
        } catch(e) {
            serverData = {};
        }
        let wrappedData = {
            timestamp,
            datatype: 'server',
            data: serverData,
        };
        let dataString = JSON.stringify(wrappedData, null, 4);
        downloadText(`satchel-server-data-${timestamp}.json`, dataString);
    } else {
        let jsonData = saveToJSON(getInventoryStore());
        let wrappedData = {
            timestamp,
            datatype: 'client',
            data: jsonData,
        };
        let dataString = JSON.stringify(wrappedData, null, 4);
        downloadText(`satchel-data-${timestamp}.json`, dataString);
    }
}

function onUploadClick() {
    document.querySelector('#uploadInput').click();
}

async function onUploadChange(e) {
    let file = e.target.files[0];

    let jsonData;
    try {
        jsonData = JSON.parse(await file.text());
    } catch(e) {
        window.alert('Failed to load file.');
    }
    if (jsonData.datatype === 'server') {
        localStorage.setItem('server_data', JSON.stringify(jsonData.data));
        let ctx = getCursorContext();
        if (ctx.server) {
            ctx.server.data = jsonData.data;
        }
    }
    if (jsonData.datatype === 'client') {
        loadFromJSON(getInventoryStore(), jsonData.data);
    }
}
