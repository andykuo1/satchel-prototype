import { ItemContainer, saveItemContainer, loadItemContainer, clearItemContainer } from './components/ItemContainer.js';
import { ItemElement, saveItemElement, loadItemElement } from './components/ItemElement.js';

import { LootDialog } from './components/LootDialog.js';

import { putIn } from './Satchel.js';

export function exportSatchelState(jsonData)
{
    let containers = {};
    
    let groundContainer = document.querySelector('#ground');
    let groundData = {};
    saveItemContainer(groundContainer, groundData);
    containers.ground = groundData;
    
    let lootRoot = document.querySelector('#lootRoot');
    let lootData = [];
    for(let itemContainer of lootRoot.querySelectorAll('item-container'))
    {
        let itemContainerData = {};
        saveItemContainer(itemContainer, itemContainerData);
        lootData.push(itemContainerData);
    }
    containers.loot = lootData;

    let holdingContainer = document.querySelector('#holding');
    let holdingData = {};
    saveItemContainer(holdingContainer, holdingData);
    containers.holding = holdingData;

    let inventoryRoot = document.querySelector('#inventoryRoot');
    let inventoryData = [];
    for(let itemContainer of inventoryRoot.querySelectorAll('item-container'))
    {
        let itemContainerData = {};
        saveItemContainer(itemContainer, itemContainerData);
        inventoryData.push(itemContainerData);
    }
    containers.inventory = inventoryData;

    let display = document.querySelector('#display');
    let displayItemData = {};
    let displayItem = display.getItem();
    if (displayItem)
    {
        saveItemElement(displayItem, displayItemData);
        containers.displayItem = displayItemData;
    }

    let socketRoot = document.querySelector('#socketRoot');
    let socketsData = [];
    for(let socketContainer of socketRoot.querySelectorAll('item-container'))
    {
        let itemContainerData = {};
        saveItemContainer(socketContainer, itemContainerData);
        socketsData.push(itemContainerData);
    }
    containers.sockets = socketsData;

    jsonData.containers = containers;
    return jsonData;
}

export function importSatchelState(jsonData)
{
    clearSatchelState();

    if ('containers' in jsonData)
    {
        let {
            ground: groundData,
            loot: lootData,
            holding: holdingData,
            inventory: inventoryData,
            displayItem: displayItemData,
            sockets: socketsData,
        } = jsonData.containers;
        
        if (groundData)
        {
            let groundContainer = document.querySelector('#ground');
            loadItemContainer(groundContainer, groundData);
        }

        if (lootData)
        {
            let lootRoot = document.querySelector('#lootRoot');
            lootRoot.innerHTML = '';
            
            for(let itemContainerData of lootData)
            {
                let itemContainer = new ItemContainer();
                loadItemContainer(itemContainer, itemContainerData);
                lootRoot.appendChild(itemContainer);
            }
        }

        if (holdingData)
        {
            let holdingContainer = document.querySelector('#holding');
            loadItemContainer(holdingContainer, holdingData);
        }

        if (inventoryData)
        {
            let inventoryRoot = document.querySelector('#inventoryRoot');
            inventoryRoot.innerHTML = '';
            
            for(let itemContainerData of inventoryData)
            {
                let itemContainer = new ItemContainer();
                loadItemContainer(itemContainer, itemContainerData);
                inventoryRoot.appendChild(itemContainer);
            }
        }

        if (displayItemData)
        {
            let display = document.querySelector('#display');
            let itemElement = new ItemElement();
            loadItemElement(itemElement, displayItemData);
            display.setItem(itemElement);
        }

        if (socketsData)
        {
            let socketRoot = document.querySelector('#socketRoot');
            socketRoot.innerHTML = '';
            
            for(let itemContainerData of socketsData)
            {
                let itemContainer = new ItemContainer();
                loadItemContainer(itemContainer, itemContainerData);
                socketRoot.appendChild(itemContainer);
            }
        }
    }

    return true;
}

export function clearSatchelState()
{
    let groundContainer = document.querySelector('#ground');
    clearItemContainer(groundContainer);

    let lootRoot = document.querySelector('#lootRoot');
    for(let itemContainer of lootRoot.querySelectorAll('item-container'))
    {
        clearItemContainer(itemContainer);
    }
    lootRoot.innerHTML = ''

    let holdingContainer = document.querySelector('#holding');
    clearItemContainer(holdingContainer);

    let inventoryRoot = document.querySelector('#inventoryRoot');
    for(let itemContainer of inventoryRoot.querySelectorAll('item-container'))
    {
        clearItemContainer(itemContainer);
    }
    inventoryRoot.innerHTML = '';

    let display = document.querySelector('#display');
    display.setItem(null);

    let socketRoot = document.querySelector('#socketRoot');
    for(let itemContainer of socketRoot.querySelectorAll('item-container'))
    {
        clearItemContainer(itemContainer);
    }
    socketRoot.innerHTML = '';
}

export async function importLootDialog(jsonData)
{
    let { items } = jsonData;

    let lootItems = [];
    // let lootTitle = '';
    
    for(let itemData of items)
    {
        lootItems.push(loadItemElement(new ItemElement(), itemData));
    }

    return new Promise(resolve =>
    {
        let dialogRoot = document.querySelector('#dialogRoot');
        let lootDialog = new LootDialog(lootItems);
        lootDialog.addEventListener('accept', e => {
            let lootRoot = document.querySelector('#lootRoot');
            for(let itemElement of e.detail.items)
            {
                let itemContainer = document.createElement('item-container');
                itemContainer.type = 'slot';
                putIn(itemContainer, itemElement);
                lootRoot.appendChild(itemContainer);
            }
            dialogRoot.removeChild(lootDialog);

            resolve();
        });
        lootDialog.addEventListener('cancel', e => {
            dialogRoot.removeChild(lootDialog);

            resolve();
        });
        dialogRoot.appendChild(lootDialog);
    });
}
