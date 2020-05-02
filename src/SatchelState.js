import { ItemContainer, saveItemContainer, loadItemContainer, clearItemContainer } from './components/ItemContainer.js';
import { ItemElement, saveItemElement, loadItemElement } from './components/ItemElement.js';

import { LootDialog } from './components/LootDialog.js';

import { putOnGround, cleanUpGroundSlotContainer, setUpGroundSlotContainer } from './Satchel.js';

export function exportSatchelState(jsonData)
{
    let containers = {};
    
    let ground = document.querySelector('#ground');
    let groundData = [];
    for(let itemContainer of ground.querySelectorAll('item-container'))
    {
        let itemContainerData = {};
        saveItemContainer(itemContainer, itemContainerData);
        groundData.push(itemContainerData);
    }
    containers.ground = groundData;

    let holdingContainer = document.querySelector('#holding');
    let holdingData = {};
    saveItemContainer(holdingContainer, holdingData);
    containers.holding = holdingData;

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
            holding: holdingData,
            displayItem: displayItemData,
            sockets: socketsData,
        } = jsonData.containers;
        
        if (groundData)
        {
            let ground = document.querySelector('#ground');
            ground.innerHTML = '';
            
            for(let itemContainerData of groundData)
            {
                let itemContainer = new ItemContainer();
                setUpGroundSlotContainer(itemContainer);
                loadItemContainer(itemContainer, itemContainerData);
                ground.appendChild(itemContainer);
            }
        }

        if (holdingData)
        {
            let holdingContainer = document.querySelector('#holding');
            loadItemContainer(holdingContainer, holdingData);
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
    let ground = document.querySelector('#ground');
    for(let itemContainer of ground.querySelectorAll('item-container'))
    {
        cleanUpGroundSlotContainer(itemContainer);
        clearItemContainer(itemContainer);
    }
    ground.innerHTML = ''

    let holdingContainer = document.querySelector('#holding');
    clearItemContainer(holdingContainer);

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
            for(let itemElement of e.detail.items)
            {
                putOnGround(itemElement);
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
