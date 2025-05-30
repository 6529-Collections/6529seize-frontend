import { getStableDropKey, DropSize, convertApiDropToExtendedDrop, getFeedItemKey } from '../../../helpers/waves/drop.helpers';
import { ApiFeedItemType } from '../../../generated/models/ApiFeedItemType';

const baseDrop: any = {
  id: 'd1',
  serial_no: 1,
  wave: { id: 'w1', voting_credit_type: 'REP' },
  author: { handle: 'alice' },
  parts: [{ content: 'foo' }],
  metadata: [],
  created_at: 1,
  title: 't',
};

describe('drop.helpers', () => {
  it('returns id for light drops', () => {
    const key = getStableDropKey({ ...baseDrop, type: DropSize.LIGHT } as any);
    expect(key).toEqual({ key: 'd1', hash: 'd1' });
  });

  it('converts api drop to extended drop', () => {
    const extended = convertApiDropToExtendedDrop(baseDrop);
    const again = convertApiDropToExtendedDrop(baseDrop);
    expect(extended.stableKey).toBe(again.stableKey);
    expect(extended.type).toBe(DropSize.FULL);
  });

  it('generates feed item key', () => {
    const item = { serial_no: 5, item: baseDrop, type: ApiFeedItemType.DropCreated } as any;
    expect(getFeedItemKey({ item, index: 0 })).toBe(baseDrop.id);
    expect(getFeedItemKey({ item, index: 2 })).toBe('feed-item-5');
  });
});
