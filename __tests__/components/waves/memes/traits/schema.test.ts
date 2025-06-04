import { getFormSections, getInitialTraitsValues, initialTraits } from '../../../../../components/waves/memes/traits/schema';

describe('traits schema helpers', () => {
  it('replaces profile placeholder', () => {
    const sections = getFormSections('Bob');
    const artistField = sections[0].fields.find(f => f.field === 'artist') as any;
    expect(artistField.placeholder).toBe('Bob');
  });

  it('returns initial trait values', () => {
    const vals = getInitialTraitsValues();
    expect(vals.pointsPower).toBe(0);
    expect(vals.punk6529).toBe(false);
  });

  it('initialTraits constant matches function result', () => {
    expect(initialTraits).toEqual(getInitialTraitsValues());
  });

  it('handles null profile in getFormSections', () => {
    const sections = getFormSections(null);
    expect(sections[0].fields[0].placeholder).toBe("User's Profile Name");
  });
});
