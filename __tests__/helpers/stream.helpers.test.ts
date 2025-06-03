import { prefetchWavesOverview } from '../../helpers/stream.helpers';

jest.mock('jwt-decode', () => ({ jwtDecode: () => ({ sub: 'wallet' }) }));
jest.mock('../../helpers/server.helpers', () => ({ getUserProfile: jest.fn(() => Promise.resolve({ handle: 'bob' })) }));
jest.mock('../../services/api/common-api', () => ({ commonApiFetch: jest.fn(() => Promise.resolve([])) }));

const createClient = () => ({ prefetchInfiniteQuery: jest.fn(), prefetchQuery: jest.fn() });

describe('prefetchWavesOverview', () => {
  it('prefetches data when jwt present', async () => {
    const queryClient = createClient();
    await prefetchWavesOverview({ queryClient: queryClient as any, headers: { Authorization: 'Bearer token' }, waveId: '1' });
    expect(queryClient.prefetchInfiniteQuery).toHaveBeenCalled();
  });

  it('skips when no auth header', async () => {
    const queryClient = createClient();
    await prefetchWavesOverview({ queryClient: queryClient as any, headers: {}, waveId: null });
    expect(queryClient.prefetchInfiniteQuery).not.toHaveBeenCalled();
  });

  it('skips when Authorization header is malformed', async () => {
    const queryClient = createClient();
    await prefetchWavesOverview({
      queryClient: queryClient as any,
      headers: { Authorization: 'token' },
      waveId: null,
    });
    expect(queryClient.prefetchInfiniteQuery).not.toHaveBeenCalled();
  });
});
