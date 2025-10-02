import * as api from '@/services/api/common-api';

describe('commonApiFetchWithRetry', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retries once on failure then succeeds', async () => {
    const spy = jest.spyOn(api as any, 'commonApiFetch');
    spy.mockRejectedValueOnce(new Error('fail'));
    spy.mockResolvedValueOnce('ok');
    const result = await api.commonApiFetchWithRetry({ endpoint: 'a', retryOptions: { maxRetries: 1, initialDelayMs: 0 } });
    expect(result).toBe('ok');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('throws after exceeding retries', async () => {
    const spy = jest.spyOn(api as any, 'commonApiFetch');
    spy.mockRejectedValue(new Error('bad'));
    await expect(
      api.commonApiFetchWithRetry({ endpoint: 'a', retryOptions: { maxRetries: 1, initialDelayMs: 0 } })
    ).rejects.toThrow('bad');
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
