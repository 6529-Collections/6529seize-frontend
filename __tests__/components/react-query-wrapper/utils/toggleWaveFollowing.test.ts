import { QueryClient } from '@tanstack/react-query';
import { toggleWaveFollowing } from '@/components/react-query-wrapper/utils/toggleWaveFollowing';
import { QueryKey } from '@/components/react-query-wrapper/ReactQueryWrapper';
import { WAVE_DEFAULT_SUBSCRIPTION_ACTIONS } from '@/components/react-query-wrapper/utils/query-utils';

describe('toggleWaveFollowing', () => {
  it('updates subscribed actions in cache', async () => {
    const client = new QueryClient();
    const key = [QueryKey.WAVE, { wave_id: 'w1' }];
    client.setQueryData(key, { id: 'w1', subscribed_actions: [] });

    await toggleWaveFollowing({ waveId: 'w1', following: true, queryClient: client });
    expect((client.getQueryData(key) as any).subscribed_actions).toEqual(WAVE_DEFAULT_SUBSCRIPTION_ACTIONS);

    await toggleWaveFollowing({ waveId: 'w1', following: false, queryClient: client });
    expect((client.getQueryData(key) as any).subscribed_actions).toEqual([]);
  });
});
