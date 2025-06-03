import { getStatusFromDates, formatNameForUrl, normalizeNextgenTokenID, getOpenseaLink, getBlurLink, getMagicEdenLink, getCollectionIdsForAddress, getCollectionBaseBreadcrums } from '../../../components/nextGen/nextgen_helpers';
import { NextGenCollection } from '../../../entities/INextgen';
import { Status } from '../../../components/nextGen/nextgen_entities';

describe('nextgen_helpers utility functions', () => {
  beforeEach(() => {
    process.env.NEXTGEN_CHAIN_ID = '1';
  });

  it('determines status from dates', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(getStatusFromDates(0,0)).toBe(Status.UNAVAILABLE);
    expect(getStatusFromDates(now-10, now+10)).toBe(Status.LIVE);
    expect(getStatusFromDates(now-20, now-10)).toBe(Status.COMPLETE);
    expect(getStatusFromDates(now+10, now+20)).toBe(Status.UPCOMING);
  });

  it('formats name and normalises token id', () => {
    expect(formatNameForUrl('Hello World')).toBe('hello-world');
    expect(normalizeNextgenTokenID(10000000005)).toEqual({ collection_id:1, token_id:5 });
  });

  it('generates marketplace links', () => {
    const tokenId = 10;
    expect(getOpenseaLink(1, tokenId)).toContain('/assets/ethereum/');
    expect(getBlurLink(tokenId)).toContain(tokenId.toString());
    expect(getMagicEdenLink(tokenId)).toContain(tokenId.toString());
  });

  it('computes collection admin ids', () => {
    expect(getCollectionIdsForAddress(true, false, null, 3)).toEqual(['1','2']);
    const admin = { data: [{result:true},{result:false}] };
    expect(getCollectionIdsForAddress(false,false,admin,3)).toEqual(['1']);
  });

  it('returns base breadcrumbs', () => {
    const col: NextGenCollection = { name:'Cool' } as any;
    expect(getCollectionBaseBreadcrums(col,'Page')).toEqual([
      {display:'Home',href:'/'},
      {display:'NextGen',href:'/nextgen'},
      {display:'Cool',href:'/nextgen/collection/cool'},
      {display:'Page'}
    ]);
  });

  it('builds opensea url for testnets', () => {
    expect(getOpenseaLink(5, 1)).toContain('/assets/goerli/');
    expect(getOpenseaLink(11155111, 2)).toContain('/assets/sepolia/');
  });
});
