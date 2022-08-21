/**
 * @typedef {ReturnType<createInventoryView>} InventoryView
 * @typedef {InventoryViewInputModes[keyof InventoryViewInputModes]} InventoryViewInputMode
 * @typedef {InventoryViewOutputModes[keyof InventoryViewOutputModes]} InventoryViewOutputMode
 * @typedef {InventoryViewResizeModes[keyof InventoryViewResizeModes]} InventoryViewResizeMode
 */

export const InventoryViewInputModes = {
  ALL: 'all',
  NONE: 'ignore',
};

export const InventoryViewOutputModes = {
  ALL: 'all',
  NONE: 'ignore',
  COPY: 'copy',
};

export const InventoryViewResizeModes = {
  FIXED: 'fixed',
  UNIT: 'unit',
};

/**
 * @param {HTMLElement & { _container: HTMLElement, invId: string }} containerElement
 */
export function createInventoryView(containerElement, invId) {
  return {
    invId,
    containerElement,
  };
}

/**
 * @param {InventoryView} invView
 */
export function getInventoryViewContainerElement(invView) {
  return invView.containerElement;
}

/**
 * @param {InventoryView} invView
 */
export function getInventoryViewInvId(invView) {
  return invView.invId;
}

/**
 * @param {InventoryView} invView
 */
export function isInventoryViewUnitSized(invView) {
  return invView.containerElement.hasAttribute('fixed');
}

/**
 * @param {InventoryView} invView
 */
export function isInventoryViewEditable(invView) {
  return invView.containerElement.hasAttribute('noedit');
}
