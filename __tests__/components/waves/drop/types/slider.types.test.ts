import { SLIDER_THEMES } from '../../../../../components/waves/drop/types/slider.types';

describe('SLIDER_THEMES', () => {
  it('contains themes for ranks 1-3 and default', () => {
    expect(Object.keys(SLIDER_THEMES)).toEqual(expect.arrayContaining(['1','2','3','default']));
  });

  it('rank 1 theme has expected tooltip colors', () => {
    const theme = SLIDER_THEMES[1];
    expect(theme.tooltip.background).toContain('#E8D48A');
    expect(theme.tooltip.text).toBe('tw-text-iron-950');
  });
});
