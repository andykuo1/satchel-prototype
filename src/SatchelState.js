import { ItemContainer } from './components/ItemContainer.js';
import { ItemElement } from './components/ItemElement.js';

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
    }
    containers.displayItem = displayItemData;

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
    inventoryRoot.innerHTML = ''
}

function saveItemContainer(itemContainer, itemContainerData)
{
    let itemListData = {};
    saveItemList(itemContainer.itemList, itemListData);
    itemContainerData.itemList = itemListData;

    itemContainerData.type = itemContainer.type;
    itemContainerData.size = itemContainer.size;

    return itemContainerData;
}

function loadItemContainer(itemContainer, itemContainerData)
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
    itemData.name = itemElement.name;
    itemData.category = itemElement.category;
    itemData.detail = itemElement.detail;

    return itemData;
}

function loadItemElement(itemElement, itemData)
{
    if ('x' in itemData) itemElement.x = itemData.x;
    if ('y' in itemData) itemElement.y = itemData.y;
    if ('w' in itemData) itemElement.w = itemData.w;
    if ('h' in itemData) itemElement.h = itemData.h;
    if ('src' in itemData) itemElement.src = itemData.src;
    if ('name' in itemData) itemElement.name = itemData.name;
    if ('category' in itemData) itemElement.category = itemData.category;
    if ('detail' in itemData) itemElement.detail = itemData.detail;

    return itemElement;
}

function clearItemElement(itemElement)
{
    itemElement.x = 0;
    itemElement.y = 0;
    itemElement.w = 1;
    itemElement.h = 1;
    itemElement.removeAttribute('src');
    itemElement.removeAttribute('name');
    itemElement.removeAttribute('category');
    itemElement.removeAttribute('detail');
}
