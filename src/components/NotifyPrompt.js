/** @typedef {import('./lib/BannerPromptElement.js').BannerPromptElement} BannerPromptElement */

export async function notify(message, confirm = false) {
  return new Promise((resolve, reject) => {
    try {
      /** @type {HTMLTemplateElement} */
      let notifyTemplate = document.querySelector('#notifyTemplate');
      let element = /** @type {BannerPromptElement} */ (
        notifyTemplate.content.firstElementChild.cloneNode(true)
      );
      let label = element.querySelector('label');
      /** @type {HTMLButtonElement} */
      let button = element.querySelector('button');
      processRichText(label, message);
      if (confirm) {
        element.toggleAttribute('required', true);
      } else {
        button.style.display = 'none';
      }
      document.body.appendChild(element);
      button.addEventListener(
        'click',
        () => {
          element.toggleAttribute('open', false);
          resolve();
        },
        { once: true }
      );
      element.addEventListener(
        'close',
        () => {
          element.remove();
        },
        { once: true }
      );
      if (!confirm) {
        resolve();
      }
    } catch (e) {
      reject(e);
    }
  });
}

function processRichText(root, message) {
  let lines = message.split('\n');
  if (lines.length > 1) {
    root.innerHTML = '';
    for (let line of lines) {
      let p = document.createElement('p');
      p.textContent = line;
      root.appendChild(p);
    }
  } else {
    root.innerHTML = message;
  }
}
