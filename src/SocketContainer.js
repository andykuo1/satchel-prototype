import { loadItemContainer, saveItemContainer, clearItemContainer } from './SatchelState.js';
import { ItemContainer } from './components/ItemContainer.js';

export function createSocketContainer()
{
    let containerRoot = document.querySelector('#containerRoot');

    let itemContainer = new ItemContainer();
    itemContainer.type = 'slot';
    itemContainer.filter = (itemElement) => {
        return itemElement.category === 'Container';
    };

    itemContainer.socketed = {
        item: null,
        container: null,
        onItemChange()
        {
            let socketedItem = itemContainer.itemList.at(0, 0);
            this._update(socketedItem);
        },
        _update(itemElement)
        {
            if (itemElement !== this.item)
            {
                if (this.item)
                {
                    containerRoot.removeChild(this.container);
                    unloadSocketedItemContainer(this.container, this.item);
                    this.container = null;
                    this.item = null;
                }
        
                if (itemElement)
                {
                    this.item = itemElement;
                    this.container = new ItemContainer();
                    this.container.size = [ this.item.w, this.item.h ];
                    loadSocketedItemContainer(this.container, this.item);
                    containerRoot.appendChild(this.container);
                }
            }
        }
    };

    itemContainer.addEventListener('itemchange', () => {
        itemContainer.socketed.onItemChange();
    });

    return itemContainer;
}

function loadSocketedItemContainer(itemContainer, itemElement)
{
    if (itemElement.metadata && itemElement.metadata.container)
    {
        loadItemContainer(itemContainer, itemElement.metadata.container);
        return itemContainer;
    }
    return null;
}

function unloadSocketedItemContainer(itemContainer, itemElement)
{
    let itemContainerData = {};
    saveItemContainer(itemContainer, itemContainerData);
    clearItemContainer(itemContainer);
    if (!('metadata' in itemElement)) itemElement.metadata = {};
    itemElement.metadata.container = itemContainerData;
    return null;
}
