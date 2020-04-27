import { ItemContainer } from './components/ItemContainer.js';
import { ItemElement } from './components/ItemElement.js';

export function exportSatchelState(jsonData)
{
    let containers = {};
    
    let groundContainer = document.querySelector('#ground');
    let groundData = {};
    saveItemContainer(groundContainer, groundData);
    containers.ground = groundData;

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

    jsonData.containers = containers;
    return jsonData;
}

export function importSatchelState(jsonData)
{
    clearSatchelState();

    if ('containers' in jsonData)
    {
        let { ground: groundData, holding: holdingData, inventory: inventoryData } = jsonData.containers;
        
        if (groundData)
        {
            let groundContainer = document.querySelector('#ground');
            loadItemContainer(groundContainer, groundData);
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
    }

    return true;
}

export function clearSatchelState()
{
    let groundContainer = document.querySelector('#ground');
    clearItemContainer(groundContainer);

    let holdingContainer = document.querySelector('#holding');
    clearItemContainer(holdingContainer);

    let inventoryRoot = document.querySelector('#inventoryRoot');
    for(let itemContainer of inventoryRoot.querySelectorAll('item-container'))
    {
        clearItemContainer(itemContainer);
    }
    inventoryRoot.innerHTML = ''
}

function saveItemContainer(itemContainer, itemContainerData)
{
    let itemListData = {};
    saveItemList(itemContainer.itemList, itemListData);
    itemContainerData.itemList = itemListData;

    itemContainerData.size = itemContainer.size;

    return itemContainerData;
}

function loadItemContainer(itemContainer, itemContainerData)
{
    if ('itemList' in itemContainerData)
    {
        loadItemList(itemContainer.itemList, itemContainerData.itemList);
    }

    if ('size' in itemContainerData)
    {
        itemContainer.size = itemContainerData.size;
    }

    return itemContainer;
}

function clearItemContainer(itemContainer)
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

function saveItemElement(itemElement, itemData)
{
    itemData.x = itemElement.x;
    itemData.y = itemElement.y;
    itemData.w = itemElement.w;
    itemData.h = itemElement.h;
    itemData.src = itemElement.src;

    return itemData;
}

function loadItemElement(itemElement, itemData)
{
    if ('x' in itemData) itemElement.x = itemData.x;
    if ('y' in itemData) itemElement.y = itemData.y;
    if ('w' in itemData) itemElement.w = itemData.w;
    if ('h' in itemData) itemElement.h = itemData.h;
    if ('src' in itemData) itemElement.src = itemData.src;

    return itemElement;
}

function clearItemElement(itemElement)
{
    itemElement.x = 0;
    itemElement.y = 0;
    itemElement.w = 1;
    itemElement.h = 1;
    itemElement.src = '';
}
