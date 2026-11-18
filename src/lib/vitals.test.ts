import { describe, expect, it } from 'vitest';
import { classify, flags, overallStatus } from './vitals';

const healthy = { systolic: 118, diastolic: 76, heartRate: 72, temperature: 36.8, spo2: 98 };

describe('classify', () => {
  it('flags values by band', () => {
    expect(classify('spo2', 98)).toBe('normal');
    expect(classify('spo2', 94)).toBe('watch');
    expect(classify('spo2', 90)).toBe('critical');
  });

  it('treats band edges as inside the band', () => {
    expect(classify('heartRate', 90)).toBe('normal');
    expect(classify('heartRate', 91)).toBe('watch');
    expect(classify('heartRate', 130)).toBe('watch');
    expect(classify('heartRate', 131)).toBe('critical');
  });

  it('flags low values as well as high ones', () => {
    expect(classify('systolic', 95)).toBe('watch');
    expect(classify('systolic', 85)).toBe('critical');
    expect(classify('temperature', 34.9)).toBe('critical');
  });
});

describe('overallStatus', () => {
  it('is normal when every reading is normal', () => {
    expect(overallStatus(healthy)).toBe('normal');
  });

  it('takes the worst individual reading', () => {
    expect(overallStatus({ ...healthy, heartRate: 110 })).toBe('watch');
    expect(overallStatus({ ...healthy, heartRate: 110, spo2: 89 })).toBe('critical');
  });
});

describe('flags', () => {
  it('lists only abnormal metrics', () => {
    expect(flags({ ...healthy, temperature: 38.6 })).toEqual([{ metric: 'temperature', status: 'watch' }]);
    expect(flags(healthy)).toEqual([]);
  });
});
