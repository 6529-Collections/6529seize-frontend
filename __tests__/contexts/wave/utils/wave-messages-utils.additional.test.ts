import { fetchWaveMessages, fetchAroundSerialNoWaveMessages, findLightDropBySerialNoWithPagination } from '@/contexts/wave/utils/wave-messages-utils';
import { commonApiFetch, commonApiFetchWithRetry } from '@/services/api/common-api';

jest.mock('@/services/api/common-api');

const drop = { id: 'd1', serial_no: 1, created_at: '2020', wave: { id: 'w' } } as any;

const mockFetch = commonApiFetch as jest.Mock;
const mockFetchRetry = commonApiFetchWithRetry as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('wave-messages-utils additional', () => {
  it('fetchWaveMessages returns mapped drops', async () => {
    mockFetch.mockResolvedValue({ drops: [drop], wave: { id: 'w' } });
    const res = await fetchWaveMessages('w', null);
    expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ endpoint: 'waves/w/drops' }));
    expect(res?.[0].wave).toEqual({ id: 'w' });
  });

  it('fetchWaveMessages rethrows abort errors', async () => {
    const err = new DOMException('aborted', 'AbortError');
    mockFetch.mockRejectedValue(err);
    await expect(fetchWaveMessages('w', null)).rejects.toBe(err);
  });

  it('fetchAroundSerialNoWaveMessages uses retry fetch', async () => {
    mockFetchRetry.mockResolvedValue({ drops: [drop], wave: { id: 'w' } });
    const res = await fetchAroundSerialNoWaveMessages('w', 5);
    expect(mockFetchRetry).toHaveBeenCalled();
    expect(res?.[0].serial_no).toBe(1);
  });

  it('findLightDropBySerialNoWithPagination gathers pages until target', async () => {
    mockFetchRetry
      .mockResolvedValueOnce([{ serial_no: 10 }, { serial_no: 9 }, { serial_no: 8 }])
      .mockResolvedValueOnce([{ serial_no: 7 }, { serial_no: 6 }, { serial_no: 5 }]);
    const res = await findLightDropBySerialNoWithPagination(5, { wave_id: 'w', max_serial_no: 10, limit: 3 });
    expect(mockFetchRetry).toHaveBeenCalledTimes(2);
    expect(res.map((d) => d.serial_no)).toEqual([10,9,8,7,6,5]);
  });

  it('findLightDropBySerialNoWithPagination throws when not found', async () => {
    mockFetchRetry.mockResolvedValueOnce([]);
    await expect(findLightDropBySerialNoWithPagination(5, { wave_id: 'w', max_serial_no: 10 })).rejects.toThrow('Target serial number 5 not found');
  });
});
