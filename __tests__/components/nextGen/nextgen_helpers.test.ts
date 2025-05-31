import { getStatusFromDates, formatNameForUrl, normalizeNextgenTokenID, getOpenseaLink, getBlurLink, getMagicEdenLink, getCollectionIdsForAddress } from '../../../components/nextGen/nextgen_helpers';
import { Status } from '../../../components/nextGen/nextgen_entities';

jest.mock('../../../components/nextGen/nextgen_contracts', () => ({ NEXTGEN_CHAIN_ID: 1, NEXTGEN_CORE: { 1: '0xcore' } }));

describe('nextgen_helpers', () => {
  it('determines status from dates', () => {
    const future = Math.floor(Date.now() / 1000) + 2000;
    expect(getStatusFromDates(future + 10, future + 20)).toBe(Status.UPCOMING);
    expect(getStatusFromDates(0, 10)).toBe(Status.COMPLETE);
  });

  it('formats name and normalizes token id', () => {
    expect(formatNameForUrl('Hello World')).toBe('hello-world');
    expect(normalizeNextgenTokenID(10000000005)).toEqual({ collection_id:1, token_id:5 });
  });

  it('creates marketplace links', () => {
    const link = getOpenseaLink(1, 10);
    expect(link).toContain('opensea.io');
    expect(getBlurLink(10)).toContain('blur.io');
    expect(getMagicEdenLink(10)).toContain('magiceden.io');
  });

  it('builds collection ids for admin', () => {
    const ids = getCollectionIdsForAddress(true, false, null as any, 3);
    expect(ids).toEqual(['1','2']);
  });
});
