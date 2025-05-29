import { validateTraitsData } from '../../../../../components/waves/memes/submission/validation/traitsValidation';
import { FieldType } from '../../../../../components/waves/memes/traits/schema';

jest.mock('../../../../../components/waves/memes/traits/schema', () => {
  const actual = jest.requireActual('../../../../../components/waves/memes/traits/schema');
  return {
    ...actual,
    traitDefinitions: [
      {
        title: 'section',
        layout: 'single',
        fields: [
          { field: 'artist', type: actual.FieldType.TEXT, label: 'Artist' },
          { field: 'pointsPower', type: actual.FieldType.NUMBER, label: 'Power', min: 1, max: 10 },
        ],
      },
    ],
  };
});

describe('validateTraitsData', () => {
  it('returns errors for invalid fields', () => {
    const traits = {
      artist: '',
      pointsPower: 0,
      title: '',
      description: '',
    } as any;
    const result = validateTraitsData(traits);
    expect(result.isValid).toBe(false);
    expect(result.errorCount).toBe(4);
    expect(result.errors.artist).toBe('Field cannot be empty');
    expect(result.errors.pointsPower).toBe('Value cannot be zero');
    expect(result.errors.title).toBe('Title is required');
    expect(result.errors.description).toBe('Description is required');
    expect(result.firstInvalidField).toBe('artist');
  });

  it('skips validation in dirty mode when values unchanged', () => {
    const traits = {
      artist: '',
      pointsPower: 0,
      title: '',
      description: '',
    } as any;
    const result = validateTraitsData(traits, {
      mode: 'dirty',
      touchedFields: new Set(),
      initialValues: traits,
    });
    expect(result.isValid).toBe(true);
    expect(result.errorCount).toBe(0);
  });
});
