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
    itemList.clear();

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

function saveItemElement(itemElement, itemData)
{
    itemData.x = itemElement.x;
    itemData.y = itemElement.y;
    itemData.w = itemElement.w;
    itemData.h = itemElement.h;
    return itemData;
}

function loadItemElement(itemElement, itemData)
{
    itemElement.x = itemData.x || 0;
    itemElement.y = itemData.y || 0;
    itemElement.w = itemData.w || 1;
    itemElement.h = itemData.h || 1;
    return itemElement;
}
