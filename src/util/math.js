/**
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number}
 */
export function distanceSquared(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

/**
 * Interpolates, or lerps, between 2 values by the specified amount, dt.
 *
 * @param {number} a The initial value.
 * @param {number} b The final value.
 * @param {number} dt The amount changed.
 * @returns {number} The interpolated value.
 */
export function lerp(a, b, dt) {
  return a * (1 - dt) + b * dt;
}
