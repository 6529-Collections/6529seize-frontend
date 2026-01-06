import { validateTraitsData } from '@/components/waves/memes/submission/validation/traitsValidation';
import type { TraitsData } from '@/components/waves/memes/submission/types/TraitsData';

function createTraits(): TraitsData {
  return {
    title: 'Title',
    description: 'Desc',
    artist: 'Artist',
    seizeArtistProfile: 'Artist Profile',
    palette: 'Color',
    style: 'Style',
    jewel: 'Jewel',
    superpower: 'Superpower',
    dharma: 'Dharma',
    gear: 'Gear',
    clothing: 'Clothing',
    element: 'Element',
    mystery: 'Mystery',
    secrets: 'Secrets',
    weapon: 'Weapon',
    home: 'Home',
    parent: 'Parent',
    sibling: 'Sibling',
    food: 'Food',
    drink: 'Drink',
    bonus: 'Bonus',
    boost: 'Boost',
    punk6529: false,
    gradient: false,
    movement: false,
    dynamic: false,
    interactive: false,
    collab: false,
    om: false,
    threeD: false,
    pepe: false,
    gm: false,
    summer: false,
    tulip: false,
    memeName: 'Use a Hardware Wallet',
    pointsPower: 1,
    pointsWisdom: 2,
    pointsLoki: 3,
    pointsSpeed: 4,
  };
}

describe('validateTraitsData', () => {
  it('returns valid result for correct data', () => {
    const traits = createTraits();
    const result = validateTraitsData(traits);
    expect(result.isValid).toBe(true);
    expect(result.errorCount).toBe(0);
  });

  it('detects errors for empty required field', () => {
    const traits = createTraits();
    traits.artist = '';
    const result = validateTraitsData(traits);
    expect(result.isValid).toBe(false);
    expect(result.errors.artist).toBeTruthy();
  });

  it('skips untouched fields in touched mode', () => {
    const traits = createTraits();
    traits.artist = '';
    const result = validateTraitsData(traits, { mode: 'touched', touchedFields: new Set(['title']) });
    expect(result.isValid).toBe(true);
    expect(result.errorCount).toBe(0);
  });

  it('only validates changed fields in dirty mode', () => {
    const initial = createTraits();
    const traits = createTraits();
    traits.artist = '';
    const result = validateTraitsData(traits, { mode: 'dirty', initialValues: initial });
    expect(result.isValid).toBe(false);
    expect(result.errors.artist).toBeTruthy();
  });
});
