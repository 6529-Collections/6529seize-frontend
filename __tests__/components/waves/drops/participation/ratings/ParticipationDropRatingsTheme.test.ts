import { getThemeColors } from '../../../../../../components/waves/drops/participation/ratings/ParticipationDropRatingsTheme';

describe('getThemeColors', () => {
  it('returns colors for rank 1', () => {
    const result = getThemeColors(1, false);
    expect(result.text).toBe('tw-text-[#E8D48A]');
    expect(result.ring).toBe('tw-ring-[#E8D48A]/20');
    expect(result.indicator).toBe('');
  });

  it('applies negative styling', () => {
    const result = getThemeColors(2, true);
    expect(result.text).toContain('tw-opacity-60');
    expect(result.indicator).toContain('tw-absolute');
  });

  it('defaults when rank is null', () => {
    const result = getThemeColors(null, false);
    expect(result.text).toBe('tw-text-iron-300');
    expect(result.ring).toBe('tw-ring-iron-600');
  });
});
