import { loadFromStorage } from '../Storage.js';
import { addInventoryChangeListener, removeInventoryChangeListener } from '../events/InvEvents.js';
import { getSatchelStore } from '../store/SatchelStore.js';
import { isInventoryEmpty } from '../satchel/inv/InventoryTransfer.js';

export async function setupTutorial() {
  let skipTutorial = Boolean(loadFromStorage('skipTutorial'));
  if (skipTutorial) {
    return;
  }
  setupTutorial01();
}

function openTutorial(target, tooltip) {
  let rect = target.getBoundingClientRect();
  let x = rect.x + rect.width / 2;
  let y = rect.y + rect.height + 10;
  tooltip.x = x;
  tooltip.y = y;
  tooltip.toggleAttribute('open', true);
}

function openTooltip(target, tooltip, offsetX = 0, offsetY = 0) {
  let rect = target.getBoundingClientRect();
  let x = rect.x + rect.width / 2 + offsetX;
  let y = rect.y + rect.height / 2 + offsetY;
  tooltip.x = x;
  tooltip.y = y;
  tooltip.toggleAttribute('open', true);
}

function closeTutorial(target, tooltip) {
  tooltip.toggleAttribute('open', false);
}

function setupTutorialClick(target, tooltip, callback) {
  openTutorial(target, tooltip);
  target.addEventListener('click', callback);
}

function teardownTutorialClick(target, tooltip, callback) {
  target.removeEventListener('click', callback);
  closeTutorial(target, tooltip);
}

function setupTutorial01() {
  let target = document.querySelector('#actionItemEdit');
  let tooltip = document.querySelector('#tooltipTutorial01');
  setupTutorialClick(target, tooltip, onTutorial01);
}

function teardownTutorial01() {
  let target = document.querySelector('#actionItemEdit');
  let tooltip = document.querySelector('#tooltipTutorial01');
  teardownTutorialClick(target, tooltip, onTutorial01);
}

function onTutorial01() {
  teardownTutorial01();
  setupTutorial02();
}

function setupTutorial02() {
  let target = document.querySelector('#actionFoundryNew');
  let tooltip = document.querySelector('#tooltipTutorial02');
  setupTutorialClick(target, tooltip, onTutorial02);
}

function teardownTutorial02() {
  let target = document.querySelector('#actionFoundryNew');
  let tooltip = document.querySelector('#tooltipTutorial02');
  teardownTutorialClick(target, tooltip, onTutorial02);
}

function onTutorial02() {
  teardownTutorial02();
  setupTutorial03();
}

function setupTutorial03() {
  let target = document.querySelector('#editorWatermark');
  let tooltip = document.querySelector('#tooltipTutorial03');
  let rect = target.getBoundingClientRect();
  let x = rect.x + rect.width / 2;
  let y = rect.y + rect.height / 3;
  tooltip.x = x;
  tooltip.y = y;
  tooltip.toggleAttribute('open', true);
  let editor = document.querySelector('#itemEditor');
  // HACK: This is to get the underlying inventory id for the item editor
  // @ts-ignore
  let invId = editor.socket.invId;
  const store = getSatchelStore();
  addInventoryChangeListener(store, invId, onTutorial03);
}

function teardownTutorial03() {
  let target = document.querySelector('#editorWatermark');
  let tooltip = document.querySelector('#tooltipTutorial03');
  closeTutorial(target, tooltip);
  let editor = document.querySelector('#itemEditor');
  // HACK: This is to get the underlying inventory id for the item editor
  // @ts-ignore
  let invId = editor.socket.invId;
  const store = getSatchelStore();
  removeInventoryChangeListener(store, invId, onTutorial03);
}

function onTutorial03(store, invId) {
  if (isInventoryEmpty(store, invId)) {
    teardownTutorial03();
    setupTutorial04();
  }
}

function setupTutorial04() {
  let tooltipDelete = document.querySelector('#tooltipDelete');
  let targetDelete = document.querySelector('#actionGroundDelete');
  let tooltipFoundry = document.querySelector('#tooltipFoundry');
  let targetFoundry = document.querySelector('#actionItemEdit');
  let tooltipAlbums = document.querySelector('#tooltipAlbums');
  let targetAlbums = document.querySelector('#actionAlbumOpen');
  let tooltipSettings = document.querySelector('#tooltipSettings');
  let targetSettings = document.querySelector('#actionSettings');
  openTooltip(targetDelete, tooltipDelete, -30, -35);
  openTooltip(targetFoundry, tooltipFoundry, 0, 10);
  openTooltip(targetAlbums, tooltipAlbums, 30, 20);
  openTooltip(targetSettings, tooltipSettings, 0, 30);
}
