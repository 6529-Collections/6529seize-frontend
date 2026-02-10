import { Period } from '@/components/waves/create-wave/types/period';

describe('Period enum', () => {
  it('contains expected values', () => {
    expect(Period.MINUTES).toBe('MINUTES');
    expect(Period.HOURS).toBe('HOURS');
    expect(Period.DAYS).toBe('DAYS');
    expect(Period.WEEKS).toBe('WEEKS');
    expect(Period.MONTHS).toBe('MONTHS');
  });
});
