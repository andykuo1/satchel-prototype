import * as Y from './node_modules/yjs/src/index.js';

window.addEventListener('DOMContentLoaded', main);

async function main()
{
    let container = document.body.querySelector('main');
    createJSONPage(container);
}

function createJSONPage(container)
{
    let button = document.createElement('button');
    button.textContent = 'Hello';
    container.appendChild(button);
}
