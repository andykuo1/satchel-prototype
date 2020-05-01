import { ItemContainer } from './components/ItemContainer.js';
import { ItemElement } from './components/ItemElement.js';
import { LootDialog } from './components/LootDialog.js';

import { createSocketContainer } from './SocketContainer.js';

import { putIn } from './Satchel.js';
import { saveItemElement, loadItemElement } from './Item.js';

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
    let sockets = [];
    for(let socketContainer of socketRoot.querySelectorAll('item-container'))
    {
        let socketContainerData = {};
        saveSocketContainer(socketContainer, socketContainerData);
        sockets.push(socketContainerData);
    }

    jsonData.sockets = sockets;
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
        } = jsonData.containers;
        
        if (groundData)
        {
            let groundContainer = document.querySelector('#ground');
            loadItemContainer(groundContainer, groundData);
        }

        if (lootData)
        {
            let lootRoot = document.querySelector('#lootRoot');
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
    }

    if ('sockets' in jsonData)
    {
        let socketRoot = document.querySelector('#socketRoot');
        for(let socketContainerData of jsonData.sockets)
        {
            let socketContainer = createSocketContainer();
            loadSocketContainer(socketContainer, socketContainerData);
            socketRoot.appendChild(socketContainer);
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
    for(let socketContainer of socketRoot.querySelectorAll('item-container'))
    {
        clearSocketContainer(socketContainer);
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

function saveSocketContainer(socketContainer, socketContainerData)
{
    let socketItemContainerData = {};
    socketContainer.socketed._update(null);
    saveItemContainer(socketContainer, socketItemContainerData);
    socketContainerData.itemContainer = socketItemContainerData;
    socketContainer.socketed.onItemChange();

    return socketContainerData;
}

function loadSocketContainer(socketContainer, socketContainerData)
{
    if ('itemContainer' in socketContainerData)
    {
        loadItemContainer(socketContainer, socketContainerData.itemContainer);
    }
    socketContainer.socketed.onItemChange();

    return socketContainer;
}

function clearSocketContainer(socketContainer)
{
    clearItemContainer(socketContainer);
}

export function saveItemContainer(itemContainer, itemContainerData)
{
    let itemListData = {};
    saveItemList(itemContainer.itemList, itemListData);
    itemContainerData.itemList = itemListData;

    itemContainerData.type = itemContainer.type;
    itemContainerData.size = itemContainer.size;

    return itemContainerData;
}

export function loadItemContainer(itemContainer, itemContainerData)
{
    if ('itemList' in itemContainerData)
    {
        loadItemList(itemContainer.itemList, itemContainerData.itemList);
    }

    if ('type' in itemContainerData)
    {
        itemContainer.type = itemContainerData.type;
    }

    if ('size' in itemContainerData)
    {
        itemContainer.size = itemContainerData.size;
    }

    return itemContainer;
}

export function clearItemContainer(itemContainer)
{
    clearItemList(itemContainer.itemList);
}

function saveItemList(itemList, itemListData)
{
    let result = [];
    for(let itemElement of itemList)
    {
        let itemData = {};
        saveItemElement(itemElement, itemData);
        result.push(itemData);
    }
    itemListData.items = result;

    return itemListData;
}

function loadItemList(itemList, itemListData)
{
    if ('items' in itemListData)
    {
        for(let itemData of itemListData.items)
        {
            let itemElement = loadItemElement(new ItemElement(), itemData);
            itemList.add(itemElement);
        }
    }

    return itemList;
}

function clearItemList(itemList)
{
    itemList.clear();
}
