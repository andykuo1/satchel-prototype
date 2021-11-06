import { setCursorElement } from './CursorHelper.js';
import { setGroundContainer } from './GroundHelper.js';
import { createInventoryView } from './InventoryView.js';
import { getInventoryStore, createInventory } from './InventoryStore.js';
import { applyItemBuilder, openItemBuilder, resetItemBuilder } from './ItemBuilder.js';
import { loadFromLocalStorage } from './InventoryLoader.js';

window.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#itemBuilder').addEventListener('submit', (e) => {
        e.preventDefault();

        let settings = document.querySelector('#settingsContent');
        settings.classList.toggle('open', false);

        let target = e.target;
        applyItemBuilder(target);
        return false;
    });
    document.querySelector('#itemResetButton').addEventListener('click', (e) => {
        e.preventDefault();

        let settings = document.querySelector('#settingsContent');
        settings.classList.toggle('open', false);

        let itemBuilder = document.querySelector('#itemBuilder');
        resetItemBuilder(itemBuilder);

        return false;
    });
    document.addEventListener('itemcontext', (e) => {
        e.preventDefault();
        e.stopPropagation();

        let settings = document.querySelector('#settingsContent');
        settings.classList.toggle('open', false);
        let itemId = e.detail.itemId;
        if (itemId) {
            openItemBuilder(document.querySelector('#itemBuilder'), itemId);
            // Animate open/close transition
            setTimeout(() => settings.classList.toggle('open', true), 100);
        }

        return false;
    })
});

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

    loadFromLocalStorage(getInventoryStore());
});