import { setCursorElement } from './CursorHelper.js';
import { setGroundContainer, dropOnGround } from './GroundHelper.js';
import { createInventoryView } from './InventoryView.js';
import { createItem, getInventoryStore, createInventory } from './InventoryStore.js';
import { BACKPACK } from './Items.js';
import { loadFromLocalStorage, saveToLocalStorage } from './InventoryLoader.js';

window.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#itemBuilder').addEventListener('submit', onItemBuild);
    document.querySelector('#itemResetButton').addEventListener('click', onItemReset);
});

function onItemBuild(e) {
    let result = {
        w: 1,
        h: 1,
        displayName: 'Item',
        imgSrc: 'res/images/potion.png',
        metadata: {
            detail: 'A mundane item.',
            category: 'Container',
            size: 'small',
            traits: []
        }
    };
    let data = new FormData(e.target);
    for(let entry of data) {
        let [key, value] = entry;
        switch(key) {
            case 'itemSize':
                result.metadata.size = value;
                break;
            case 'itemTrait':
                result.metadata.traits.push(value);
                break;
            case 'itemName':
                result.displayName = value;
                break;
            case 'itemPortrait':
                result.imgSrc = value;
                break;
            case 'itemDetail':
                result.metadata.detail = value;
                break;
        }
    }

    let size = result.metadata.size;
    if (result.metadata.traits.includes('heavy')) {
        size = getNextItemSize(size);
    }
    let imgSrc = 'res/images/potion.png';
    let [width, height] = getDefaultItemSizeDimensions(size);
    if (result.metadata.traits.includes('long')) {
        width = Math.ceil(width / 2);
        height = height + 1;
        imgSrc = 'res/images/blade.png';
    }
    if (result.metadata.traits.includes('flat')) {
        width = width + 1;
        height = Math.ceil(height / 2);
        imgSrc = 'res/images/scroll.png';
    }
    result.w = width;
    result.h = height;
    result.imgSrc = imgSrc;

    spawnItem(result);

    e.preventDefault();
    return false;
}

function getNextItemSize(itemSize) {
    switch(itemSize) {
        case 'tiny': return 'small';
        case 'small': return 'medium';
        case 'medium': return 'large';
        case 'large': return 'huge';
        case 'huge': throw new Error(`No item size bigger than huge.`);
        default: throw new Error(`Unknown item size '${itemSize}'`);
    }
}

function getDefaultItemSizeDimensions(itemSize) {
    switch(itemSize) {
        case 'tiny': return [1, 1];
        case 'small': return [1, 1];
        case 'medium': return [2, 2];
        case 'large': return [4, 4];
        case 'huge': return [6, 6];
        default: throw new Error(`Unknown item size '${itemSize}'`);
    }
}

function onItemReset(e) {
    document.querySelector('#itemBuilder').reset();
}

function spawnItem(opts) {
    let item = createItem(getInventoryStore(), opts);
    dropOnGround(item);
}

function spawnDefaultBackpack() {
    spawnItem(BACKPACK);
}

window.addEventListener('DOMContentLoaded', () => {
    let store = getInventoryStore();
    let workspace = document.querySelector('#workspace');
    let cursor = document.querySelector('#cursor');
    let ground = document.querySelector('#ground');

    let cursorInventory = createInventory(getInventoryStore(), 'cursor', 'socket', 1, 1);
    let cursorElement = createInventoryView(store, cursorInventory.name);
    cursor.appendChild(cursorElement);

    setCursorElement(cursorElement);
    setGroundContainer(ground);

    let mainInventory = createInventory(store, 'main', 'grid', 12, 9);
    let mainElement = createInventoryView(store, mainInventory.name);
    workspace.appendChild(mainElement);

    spawnDefaultBackpack();

    loadFromLocalStorage(store);

    setInterval(() => {
        console.log('Autosave...');
        saveToLocalStorage(store);
    }, 5000);
});