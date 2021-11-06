import { clearGround } from './GroundHelper.js';
import { openItemBuilder } from './ItemBuilder.js';
import { downloadText } from '../Downloader.js';
import { saveToJSON, loadFromJSON, saveToLocalStorage, loadFromLocalStorage } from './InventoryLoader.js';
import { getInventoryStore } from './InventoryStore.js';
import { connectAsClient, connectAsServer, isServerSide } from './PeerSatchel.js';

window.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#settingsButton').addEventListener('click', onSettingsClick);
    document.querySelector('#deleteButton').addEventListener('click', onDeleteClick);
    document.querySelector('#cloudButton').addEventListener('click', onCloudClick);
    document.querySelector('#downloadButton').addEventListener('click', onDownloadClick);
    document.querySelector('#uploadButton').addEventListener('click', onUploadClick);
    document.querySelector('#uploadInput').addEventListener('change', onUploadChange);

    // Try connect the client
    connectAsClient().then(result => {
        if (result) {
            document.querySelector('#cloudButton').toggleAttribute('disabled', true);
            setInterval(() => {
                console.log('Autosave...');
                saveToLocalStorage(getInventoryStore());
            }, 5000);
        } else {
            loadFromLocalStorage(getInventoryStore());
        }
    });
});

function onSettingsClick() {
    let settings = document.querySelector('#settingsContent');
    if (settings.classList.contains('open')) {
        settings.classList.remove('open');
    } else {
        openItemBuilder(document.querySelector('#itemBuilder'));
        document.querySelector('#settingsContent').classList.add('open');
    }
}

function onDeleteClick() {
    if (window.confirm('Clear all items on the ground?')) {
        clearGround();
    }
}

function onCloudClick() {
    // Try connect the server
    connectAsServer();
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
    let jsonData = await file.json();
    if (jsonData.datatype === 'server') {
        localStorage.setItem('server_data', JSON.stringify(jsonData.data));
    }
    if (jsonData.datatype === 'client') {
        loadFromJSON(getInventoryStore(), jsonData.data);
    }
}
