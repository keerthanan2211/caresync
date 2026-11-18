import { describe, expect, it } from 'vitest';
import { niceTicks, xPositions, yScale } from './chart';

const box = { width: 300, height: 120, pad: { top: 10, right: 10, bottom: 10, left: 40 } };

describe('chart scales', () => {
  it('maps the axis minimum to the bottom and maximum to the top', () => {
    expect(yScale(0, [0, 100], box)).toBe(110);
    expect(yScale(100, [0, 100], box)).toBe(10);
  });

  it('clamps out-of-range values to the plot', () => {
    expect(yScale(500, [0, 100], box)).toBe(10);
    expect(yScale(-5, [0, 100], box)).toBe(110);
  });

  it('spreads points across the width', () => {
    expect(xPositions(3, box)).toEqual([40, 165, 290]);
    expect(xPositions(1, box)).toEqual([165]);
  });

  it('builds evenly spaced ticks', () => {
    expect(niceTicks([40, 120], 4)).toEqual([40, 60, 80, 100, 120]);
  });
});
