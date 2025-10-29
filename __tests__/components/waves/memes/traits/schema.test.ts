import { getFormSections, getInitialTraitsValues } from '@/components/waves/memes/traits/schema';

describe('traits schema helpers', () => {
  it('replaces profile placeholder', () => {
    const sections = getFormSections('Bob');
    const artistField = sections[0].fields.find(f => f.field === 'artist') as any;
    expect(artistField.placeholder).toBe('Bob');
  });

  it('provides initial trait values via helper', () => {
    const initialTraits = getInitialTraitsValues();
    expect(initialTraits.pointsPower).toBe(0);
    expect(initialTraits.punk6529).toBe(false);
  });

  it('handles null profile in getFormSections', () => {
    const sections = getFormSections(null);
    expect(sections[0].fields[0].placeholder).toBe("User's Profile Name");
  });
});
