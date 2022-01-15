import { loadFromStorage, saveToStorage } from './Storage.js';
import { createSound } from './util/audio.js';

const INIT_FLAG = Symbol('init');
const PLAY_FLAG = Symbol('play');
const SOUNDS = {
  [INIT_FLAG]: false,
  [PLAY_FLAG]: loadFromStorage('sound') !== 'off',
};

export function toggleSound(force = undefined) {
  let result = typeof force === 'undefined' ? !SOUNDS[PLAY_FLAG] : Boolean(force);
  SOUNDS[PLAY_FLAG] = result;
  saveToStorage('sound', result ? 'on' : 'off');
  playSound('ping');
}

export function playSound(name) {
  if (!SOUNDS[PLAY_FLAG]) {
    return;
  }
  if (!SOUNDS[INIT_FLAG]) {
    SOUNDS[INIT_FLAG] = true;
    initSounds().then(() => playSound(name));
    return;
  }
  if (name in SOUNDS) {
    const { sound, pitchLow, pitchRange, gain, pan } = SOUNDS[name];
    sound.play({
      pitch: (Math.random() * pitchRange) - pitchLow,
      gain: gain,
      pan: pan,
    });
  }
}

async function initSounds() {
  let pop = await loadSound('res/sounds/pop.ogg');
  let mug = await loadSound('res/sounds/mug.ogg');
  let dunk = await loadSound('res/sounds/dunk.ogg');
  let put = await loadSound('res/sounds/put.ogg');
  let pick = await loadSound('res/sounds/pick.ogg');
  let open = await loadSound('res/sounds/open.ogg');
  registerSound('pickup', pick, -5, 5);
  registerSound('putdown', mug, -5, 5, 0.3);
  registerSound('putdownGround', pop, -5, 5);
  registerSound('putdownAlbum', mug, -5, 5, 0.3);
  registerSound('openBag', open, 2, 5, 0.5);
  registerSound('closeBag', open, -5, -2, 0.5);
  registerSound('openAnvil', open, 2, 5, 0.5);
  registerSound('closeAnvil', open, -5, -2, 0.5);
  registerSound('spawnItem', pick, -5, 5);
  registerSound('clearItem', dunk, -5, 0);
  registerSound('sizeItem', put, -5, 0, 0.5);
  registerSound('ping', pop, -5, 5);
}

/**
 * @param {string} name 
 * @param {object} sound 
 * @param {number} pitchLow 
 * @param {number} pitchHigh 
 * @param {number} gain
 */
function registerSound(name, sound, pitchLow = 0, pitchHigh = pitchLow, gain = 0, pan = 0) {
  SOUNDS[name] = {
    sound,
    pitchLow: Math.min(pitchLow, pitchHigh),
    pitchHigh: Math.max(pitchLow, pitchHigh),
    pitchRange: Math.abs(pitchHigh - pitchLow),
    gain: gain,
    pan: pan,
  };
}

async function loadSound(url) {
  let response = await fetch(url);
  let buffer = await response.arrayBuffer();
  return await createSound(buffer);
}
