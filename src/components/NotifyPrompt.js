export async function notify(message, confirm = false) {
  return new Promise((resolve, reject) => {
    /** @type {HTMLTemplateElement} */
    let notifyTemplate = document.querySelector('#notifyTemplate');
    let element = /** @type {HTMLElement} */ (notifyTemplate.content.cloneNode(true));
    let dialog = element.querySelector('#notifyDialog');
    let label = element.querySelector('#notifyLabel');
    /** @type {HTMLButtonElement} */
    let button = element.querySelector('#notifyConfirm');
    processRichText(label, message);
    button.addEventListener('click', () => {
      dialog.toggleAttribute('open', false);
      resolve();
    });
    dialog.addEventListener('close', () => {
      element.remove();
    });
    if (confirm) {
      dialog.toggleAttribute('required', true);
    } else {
      button.style.display = 'none';
      resolve();
    }
    document.body.appendChild(element);
  });
}

function processRichText(root, message) {
  let lines = message.split('\n');
  if (lines.length > 1) {
    root.innerHTML = '';
    for(let line of lines) {
      let p = document.createElement('p');
      p.textContent = line;
      root.appendChild(p);
    }
  } else {
    root.innerHTML = message;
  }
}
