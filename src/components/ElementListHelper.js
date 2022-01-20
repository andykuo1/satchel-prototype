/**
 *
 * @param {Element} parentNode
 * @param {Iterable<string>} list
 * @param {(key: string) => Element} factoryCreate
 * @param {(key: string, element: Element) => void} [factoryDelete]
 * @param {(key: string, element: Element, preserved: boolean) => void} [callback]
 */
export function updateList(parentNode, list, factoryCreate, factoryDelete = () => {}, callback = () => {}) {
  const children = parentNode.children;
  /** @type {Record<string, Element>} */
  const preserved = {};
  for(let i = 0; i < children.length; ++i) {
    let child = children.item(i);
    if (child.hasAttribute('data-listkey')) {
      let listKey = child.getAttribute('data-listkey');
      preserved[listKey] = child;
    }
  }
  /** @type {Array<Element>} */
  let reversedChildren = [];
  const preservedKeys = Object.keys(preserved);
  let keys = [...list].reverse();
  for (let key of keys) {
    let i = preservedKeys.indexOf(key);
    if (i >= 0) {
      preservedKeys.splice(i, 1);
      let element = preserved[key];
      callback(key, element, false);
      reversedChildren.push(element);
    } else {
      let element = factoryCreate(key);
      element.setAttribute('data-listkey', key);
      callback(key, element, true);
      if (reversedChildren.length > 0) {
        parentNode.insertBefore(element, reversedChildren[reversedChildren.length - 1]);
      } else {
        parentNode.appendChild(element);
      }
      reversedChildren.push(element);
    }
  }
  // Delete any remaining preserved
  for (let key of preservedKeys) {
    let element = preserved[key];
    element.remove();
    factoryDelete(key, element);
  }
}
