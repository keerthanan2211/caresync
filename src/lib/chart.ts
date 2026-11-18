export interface ChartBox {
  width: number;
  height: number;
  pad: { top: number; right: number; bottom: number; left: number };
}

/** Maps a value in [min, max] to a y pixel (higher values are drawn higher), clamped to the plot area. */
export function yScale(value: number, [min, max]: [number, number], box: ChartBox): number {
  const plot = box.height - box.pad.top - box.pad.bottom;
  const clamped = Math.min(max, Math.max(min, value));
  return box.pad.top + plot - ((clamped - min) / (max - min)) * plot;
}

/** Spreads n points evenly across the plot width (oldest on the left). */
export function xPositions(n: number, box: ChartBox): number[] {
  const plot = box.width - box.pad.left - box.pad.right;
  if (n <= 1) return [box.pad.left + plot / 2];
  return Array.from({ length: n }, (_, i) => box.pad.left + (i / (n - 1)) * plot);
}

export function niceTicks([min, max]: [number, number], count = 4): number[] {
  const step = (max - min) / count;
  return Array.from({ length: count + 1 }, (_, i) => Math.round((min + i * step) * 10) / 10);
}
