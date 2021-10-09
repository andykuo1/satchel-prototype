import BackpackImage from '../../res/backpack.js';
import CubeImage from '../../res/cube.js';
import PotionImage from '../../res/potion.js';
import RopeImage from '../../res/rope.js';
import ShieldImage from '../../res/shield.js';
import SwordImage from '../../res/sword.js';

function choose(elements)
{
    return elements[Math.floor(Math.random() * elements.length)];
}

function randomRange(min, max)
{
    return (Math.random() * (max - min)) + min;
}

function randomRangeInt(min, max)
{
    return Math.floor(randomRange(min, max));
}

export const BACKPACK = {
    w: randomRangeInt(3, 4),
    h: choose([3, 3, 3, 4, 4, 4, 5]),
    displayName: 'Backpack',
    imgSrc: BackpackImage,
    metadata: {
        detail: 'It can hold stuff. Yay!',
        category: 'Container',
    }
};

export const POTION = {
    w: 1,
    h: choose([1, 1, 2, 2, 2, 3]),
    displayName: 'Potion of Healing',
    imgSrc: PotionImage,
    metadata: {
        detail: 'Drink it to heal yourself.\n Or give it to someone else to heal them too!',
        category: 'Potion',
    }
};

export const SWORD = {
    w: 1,
    h: choose([2, 2, 2, 3, 3, 3, 4]),
    displayName: 'Wooden Sword',
    imgSrc: SwordImage,
    metadata: {
        category: 'Weapon',
        detail: 'Maybe one day I can get an actual sword...',
    }
};

export const CUBE = {
    w: 1,
    h: 1,
    displayName: 'The Cube',
    imgSrc: CubeImage,
    metadata: {
        category: 'Artifact',
        detail: 'It looks like a cube?',
    }
};

const SHIELD = itemElement => {
    itemElement.w = 2;
    itemElement.h = choose([2, 3]);
    itemElement.name = 'Wooden Shield';
    itemElement.category = 'Armor';
    itemElement.src = ShieldImage;
    itemElement.detail = 'Sharp stuff. Bad.';
};
const MAGIC_ROPE = itemElement => {
    itemElement.w = 2;
    itemElement.h = 1;
    itemElement.name = 'Never-Ending Rope';
    itemElement.category = 'Wonder';
    itemElement.src = RopeImage;
    itemElement.detail = 'Seriously. It never ends!';
};
