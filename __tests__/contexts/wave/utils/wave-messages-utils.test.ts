import { formatWaveMessages, createEmptyWaveMessages, mergeDrops, fetchNewestWaveMessages, maxOrNull } from '@/contexts/wave/utils/wave-messages-utils';
import { DropSize } from '@/helpers/waves/drop.helpers';
import { commonApiFetch } from '@/services/api/common-api';

jest.mock('@/services/api/common-api');

const waveId = 'wave1';
const drop = { id: 'a', serial_no: 1, created_at: '2020', wave: { id: waveId }, parts: [], author: {}, metadata: [] } as any;

describe('wave message utils', () => {
  it('formats wave messages', () => {
    const res = formatWaveMessages(waveId, [drop]);
    expect(res.drops![0]).toMatchObject({ id: 'a', stableKey: 'a', stableHash: 'a', type: DropSize.FULL });
    expect(res.latestFetchedSerialNo).toBe(1);
  });

  it('creates empty wave messages', () => {
    expect(createEmptyWaveMessages('w')).toEqual({ key: 'w', id: 'w', isLoading: false, isLoadingNextPage: false, hasNextPage: false, drops: [] });
  });

  it('merges drops preferring newest', () => {
    const current = [{ ...drop, stableKey: 'k', stableHash: 'h', type: DropSize.FULL }];
    const newDrop = { ...drop, id: 'b', serial_no: 2, created_at: '2021', type: DropSize.FULL, stableKey: '', stableHash: '' } as any;
    const merged = mergeDrops(current, [newDrop]);
    expect(merged[0].id).toBe('b');
  });

  it('fetchNewestWaveMessages returns data', async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({ drops: [drop], wave: {} });
    const result = await fetchNewestWaveMessages('wave', null, 10);
    expect(commonApiFetch).toHaveBeenCalled();
    expect(result.drops && result.drops[0].wave).toEqual({});
    expect(result.highestSerialNo).toBe(1);
  });

  it('maxOrNull returns max or null', () => {
    expect(maxOrNull(1, 5)).toBe(5);
    expect(maxOrNull(null, undefined)).toBeNull();
  });
});
