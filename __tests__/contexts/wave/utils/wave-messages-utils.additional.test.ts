import {
  fetchWaveMessages,
  fetchAroundSerialNoWaveMessages,
  fetchLightWaveMessages,
} from '@/contexts/wave/utils/wave-messages-utils';
import { commonApiFetch, commonApiFetchWithRetry } from '@/services/api/common-api';

jest.mock('@/services/api/common-api');

const drop = { id: 'd1', serial_no: 1, created_at: '2020', wave: { id: 'w' } } as any;

const mockFetch = commonApiFetch as jest.Mock;
const mockFetchRetry = commonApiFetchWithRetry as jest.Mock;

const makeBatch = (start: number, count: number) =>
  Array.from({ length: count }, (_, index) => ({ serial_no: start - index }));

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

  it('fetchLightWaveMessages gathers light drops across pages and merges full drops', async () => {
    const lightBatches = [makeBatch(4005, 2000), makeBatch(2004, 2000)];
    let lightCallCount = 0;
    mockFetchRetry.mockImplementation(async (options) => {
      if (options.endpoint === 'light-drops') {
        const batch = lightBatches[lightCallCount++] ?? [];
        return batch;
      }

      if (options.endpoint === 'waves/w/drops') {
        return {
          drops: [
            {
              serial_no: 5,
              id: 'full-5',
              created_at: '2020-01-01',
              wave: { id: 'w' },
            },
          ],
          wave: { id: 'w' },
        };
      }

      throw new Error(`Unexpected endpoint: ${options.endpoint}`);
    });

    const result = await fetchLightWaveMessages('w', 4005, 5);

    expect(lightCallCount).toBe(2);
    expect(mockFetchRetry).toHaveBeenCalledTimes(3);
    expect(mockFetchRetry).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: 'light-drops' })
    );
    expect(result).not.toBeNull();
    expect(result!.length).toBe(4000);
    expect(result![0].serial_no).toBe(4005);
    expect(result![result!.length - 1].serial_no).toBe(5);
    expect(result!.find((d) => d.serial_no === 5)).toMatchObject({ id: 'full-5' });
  });

  it('fetchLightWaveMessages returns null when target serial is not found', async () => {
    mockFetchRetry.mockImplementation(async (options) => {
      if (options.endpoint === 'light-drops') {
        return [];
      }

      if (options.endpoint === 'waves/w/drops') {
        return { drops: [], wave: { id: 'w' } };
      }

      throw new Error(`Unexpected endpoint: ${options.endpoint}`);
    });

    const result = await fetchLightWaveMessages('w', 10, 5);

    expect(result).toBeNull();
  });
});
