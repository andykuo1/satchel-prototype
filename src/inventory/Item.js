/** 
 * @typedef {string} ItemId
 * 
 * @typedef Item
 * @property {ItemId} itemId
 * @property {number} width
 * @property {number} height
 * @property {string} imgSrc
 * @property {string} displayName
 * @property {string} description
 * @property {object} metadata
 */

/**
 * @param {ItemId} itemId 
 */
export function createItem(itemId) {
    // TODO: How about an item builder?
    let item = {
        itemId,
        width: 1,
        height: 1,
        imgSrc: '',
        displayName: 'Item',
        description: 'A mundane item.',
        metadata: {},
    };
    return item;
}
