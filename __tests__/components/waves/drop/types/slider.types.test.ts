import { getSliderTheme } from '@/components/waves/drop/types/slider.types';

describe('getSliderTheme', () => {
  it('returns themed tooltip colors for rank 1', () => {
    const theme = getSliderTheme(1);
    expect(theme.tooltip.background).toContain('#E8D48A');
    expect(theme.tooltip.text).toBe('tw-text-iron-950');
  });

  it('returns default colors when rank is null', () => {
    const theme = getSliderTheme(null);
    expect(theme.tooltip.background).toBe('tw-bg-iron-650');
    expect(theme.tooltip.text).toBe('tw-text-white');
  });

  it('returns default colors when rank is outside theme range', () => {
    const theme = getSliderTheme(999);
    expect(theme.tooltip.background).toBe('tw-bg-iron-650');
    expect(theme.tooltip.text).toBe('tw-text-white');
  });
});
