/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import { distanceSquared, lerp } from './math.js';

it('calculates distance squared', () => {
    // Happy case
    expect(distanceSquared(0, 0, 0, 1)).to.equal(1);
    expect(distanceSquared(0, 0, 1, 0)).to.equal(1);
    // Reverse works as well
    expect(distanceSquared(1, 0, 0, 0)).to.equal(1);
    expect(distanceSquared(0, 1, 0, 0)).to.equal(1);
    // Actually squared
    expect(distanceSquared(1, 1, 1, 5)).to.equal(4 * 4);
    expect(distanceSquared(1, 1, 5, 1)).to.equal(4 * 4);
    // Negative numbers
    expect(distanceSquared(-1, -1, -1, 1)).to.equal(2 * 2);
    expect(distanceSquared(-1, -1, 1, -1)).to.equal(2 * 2);
});

it('calculates lerp', () => {
    // Happy case
    expect(lerp(0, 1, 0.5)).to.equal(0.5);
    expect(lerp(1, 0, 0.5)).to.equal(0.5);
    // 0 or 1
    expect(lerp(0, 1, 0)).to.equal(0);
    expect(lerp(0, 1, 1)).to.equal(1);
    // Large numbers
    expect(lerp(0, 100, 1)).to.equal(100);
    expect(lerp(0, 100, 0.5)).to.equal(50);
    // Small numbers
    expect(lerp(0, 0.4, 1)).to.equal(0.4);
    expect(lerp(0, 0.4, 0.5)).to.equal(0.2);
    // Start non-zero
    expect(lerp(-1, 1, 0.5)).to.equal(0);
});
