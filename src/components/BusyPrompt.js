/** @typedef {import('./lib/BannerPromptElement.js').BannerPromptElement} BannerPromptElement */
import { getCursorContext } from '../satchel/inv/CursorHelper.js';

const BUSY_ADJ = [
  'Fetching',
  'Feeding',
  'Wrangling',
  'Spooling',
  'Bubbling',
  'Raising',
  'Finding',
  'Investigating',
  'Pushing',
  'Pulling',
  'Committing',
  'Branching',
];
const BUSY_NOUN = [
  'Goblins',
  'Hobgoblins',
  'Beholders',
  'Ankhegs',
  'Dragons',
  'Minds',
  'Cubes',
  'Mimics',
  'Humans',
  'Gnomes',
  'Elves',
];

function randomBusyLabel() {
  let i = Math.floor(Math.random() * BUSY_ADJ.length);
  let j = Math.floor(Math.random() * BUSY_NOUN.length);
  return `${BUSY_ADJ[i]} ${BUSY_NOUN[j]}`;
}

export function busy() {
  /** @type {HTMLTemplateElement} */
  let busyTemplate = document.querySelector('#busyTemplate');
  let element = /** @type {BannerPromptElement} */ (busyTemplate.content.firstElementChild.cloneNode(true));
  element.toggleAttribute('open', true);
  let label = element.querySelector('label');
  let progress = element.querySelector('span');
  label.innerHTML = randomBusyLabel();
  let ctx = getCursorContext();
  let handle = setInterval(() => {
    switch (progress.textContent) {
      case '.':
        progress.textContent = '..';
        break;
      case '..':
        progress.textContent = '...';
        break;
      case '...':
        progress.textContent = '.';
        break;
      default:
        progress.textContent = '.';
        break;
    }
  }, 300);
  ctx.busyWork = handle;
  document.body.appendChild(element);
  return () => {
    element.toggleAttribute('open', false);
    element.remove();
    let ctx = getCursorContext();
    let handle = ctx.busyWork;
    clearInterval(handle);
  };
}
