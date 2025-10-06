import { prefetchAuthenticatedNotifications } from '@/helpers/stream.helpers';

jest.mock('jwt-decode', () => ({ jwtDecode: () => ({ sub: 'wallet' }) }));
jest.mock('@/helpers/server.helpers', () => ({ getUserProfile: jest.fn(() => Promise.resolve({ handle: 'alice' })) }));
jest.mock('@/services/api/common-api', () => ({ commonApiFetch: jest.fn(() => Promise.resolve([])) }));

const createClient = () => ({ prefetchInfiniteQuery: jest.fn(), prefetchQuery: jest.fn() });

describe('prefetchAuthenticatedNotifications', () => {
  it('prefetches when handle present', async () => {
    const queryClient = createClient();
    await prefetchAuthenticatedNotifications({ queryClient: queryClient as any, headers: { Authorization: 'Bearer t' }, context: {} as any });
    expect(queryClient.prefetchInfiniteQuery).toHaveBeenCalledTimes(3);
  });

  it('skips when no auth header', async () => {
    const queryClient = createClient();
    await prefetchAuthenticatedNotifications({ queryClient: queryClient as any, headers: {}, context: {} as any });
    expect(queryClient.prefetchInfiniteQuery).not.toHaveBeenCalled();
  });

  it('calls getUserProfile with provided headers', async () => {
    const queryClient = createClient();
    const { getUserProfile } = require('@/helpers/server.helpers');
    await prefetchAuthenticatedNotifications({
      queryClient: queryClient as any,
      headers: { Authorization: 'Bearer t' },
      context: {} as any,
    });
    expect(getUserProfile).toHaveBeenCalledWith({ user: 'wallet', headers: { Authorization: 'Bearer t' } });
  });

  it('does not prefetch when handle missing', async () => {
    const queryClient = createClient();
    const helpers = require('@/helpers/server.helpers');
    helpers.getUserProfile.mockResolvedValueOnce({ handle: null });
    await prefetchAuthenticatedNotifications({
      queryClient: queryClient as any,
      headers: { Authorization: 'Bearer t' },
      context: {} as any,
    });
    expect(queryClient.prefetchInfiniteQuery).not.toHaveBeenCalled();
  });
});
