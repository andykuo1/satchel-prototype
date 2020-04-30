export function saveItemElement(itemElement, itemData)
{
    itemData.x = itemElement.x;
    itemData.y = itemElement.y;
    itemData.w = itemElement.w;
    itemData.h = itemElement.h;
    itemData.src = itemElement.src;
    itemData.name = itemElement.name;
    itemData.category = itemElement.category;
    itemData.detail = itemElement.detail;
    itemData.metadata = itemElement.metadata;

    return itemData;
}

export function loadItemElement(itemElement, itemData)
{
    if ('x' in itemData) itemElement.x = itemData.x;
    if ('y' in itemData) itemElement.y = itemData.y;
    if ('w' in itemData) itemElement.w = itemData.w;
    if ('h' in itemData) itemElement.h = itemData.h;
    if ('src' in itemData) itemElement.src = itemData.src;
    if ('name' in itemData) itemElement.name = itemData.name;
    if ('category' in itemData) itemElement.category = itemData.category;
    if ('detail' in itemData) itemElement.detail = itemData.detail;
    if ('metadata' in itemData) itemElement.metadata = itemData.metadata;

    return itemElement;
}


/*
function createItemTransaction()
{
    return {
        transactionId: '12321441',
        source: 'Master13421',
        timestamp: '2020-04-24 01:01:01',
        requiredOwner: 'Player31451',
        payload: {
            title: 'Loot!',
            description: 'Looted from a bunch of goblin corpses near Stillwater.',
            items: [
                createItem(),
                createItem(),
            ],
        },
        digest: 'dfasfdasdfasdfasdfasdf',
        signature: 'dfasdfasdfadsfasdfadfasdfadf',
    };
}

// Key exchange
function createInitialContextTransaction()
{
    return {
        transactionId: '1231234',
        source: 'Master13421',
        requiredOwner: 'Player31451',
        payload: {
            title: 'And the adventure begins...',
            description: 'You decided to take your first steps onto a new journey.',
            playerId: 'Player3492934',
        },
    };
}

function createContextTransaction()
{
    return {
        transactionId: '3242442',
        source: 'Master13421',
        requiredOwner: 'Player31451',
        payload: {
            title: 'Loot!',
            description: 'Looted from a bunch of goblin corpses near Stillwater.',
        }
    };
}




















export function createItem()
{
    return {
        w: 1,
        h: 1,
        name: 'Potion of Healing',
        description: 'For healing.',
        usage: 'Drink or help someone drink to heal for 1d4 + 4 HP.',
        price: '1gp',
        size: 'Small',
        icon: 'image:data-64/dfasdfasfasdf',
        portrait: 'image:data-64/adklfalsjdfklajsdfljk',
        checksum: '',
    };
}

function createPositionInfo(item)
{

}

function getPositionInfo(item)
{

}

function getCustomNameInfo(item)
{

}

function getAdditionalNotesInfo(item)
{

}

function getFavoriteInfo(item)
{

}
*/