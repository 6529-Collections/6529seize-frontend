import { useParsedCollectionIndex, getCollectionIdsForAddress } from '../../../components/nextGen/nextgen_helpers';

describe('nextgen_helpers extra coverage', () => {
  it('parses collection index', () => {
    expect(useParsedCollectionIndex({ data: 5n } as any)).toBe(5);
    expect(useParsedCollectionIndex(undefined as any)).toBe(0);
  });

  it('returns ids when function admin', () => {
    const ids = getCollectionIdsForAddress(false, true, null as any, 4);
    expect(ids).toEqual(['1','2','3']);
  });
});
