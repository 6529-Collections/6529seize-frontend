import { renderHook } from '@testing-library/react';

const useQueryMock = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: any) => useQueryMock(...args),
}));

const commonApiFetch = jest.fn();
jest.mock('@/services/api/common-api', () => ({
  commonApiFetch: (...args: any) => commonApiFetch(...args),
}));

jest.mock('@/contexts/SeizeSettingsContext', () => ({
  useSeizeSettings: () => ({ seizeSettings: { all_drops_notifications_subscribers_limit: 10 } }),
}));

import { useWaveNotificationSubscription } from '@/hooks/useWaveNotificationSubscription';

describe('useWaveNotificationSubscription', () => {
  it('configures useQuery with proper options', async () => {
    const wave: any = { id: 'w1', metrics: { subscribers_count: 5 } };
    useQueryMock.mockReturnValue({ data: null });

    renderHook(() => useWaveNotificationSubscription(wave));

    const options = useQueryMock.mock.calls[0][0];
    expect(options.queryKey).toEqual(['wave-notification-subscription', 'w1']);
    await options.queryFn();
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: 'notifications/wave-subscription/w1',
    });
    expect(options.enabled).toBe(true);
    expect(options.retry(3, new Error())).toBe(false);
    expect(options.retry(2, new Error())).toBe(true);
    expect(options.retryDelay(2)).toBe(2000);
  });
});
