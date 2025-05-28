import { QueryClient } from '@tanstack/react-query';
import { increaseWavesOverviewDropsCount } from '../../../../components/react-query-wrapper/utils/increaseWavesOverviewDropsCount';
import { ApiWavesOverviewType } from '../../../../generated/models/ApiWavesOverviewType';
import { QueryKey } from '../../../../components/react-query-wrapper/ReactQueryWrapper';

function createWave(id: string) {
  return { id, metrics: { drops_count: 0, your_drops_count: 0 } } as any;
}

describe('increaseWavesOverviewDropsCount', () => {
  it('increments drops count for all overview types', async () => {
    const client = new QueryClient();
    const wave = createWave('w1');
    const data = { pages: [[wave]] };

    for (const type of Object.values(ApiWavesOverviewType)) {
      const key = [QueryKey.WAVES_OVERVIEW, { limit: 20, type, only_waves_followed_by_authenticated_user: true }];
      client.setQueryData(key, data);
    }

    await increaseWavesOverviewDropsCount(client, 'w1');

    for (const type of Object.values(ApiWavesOverviewType)) {
      const key = [QueryKey.WAVES_OVERVIEW, { limit: 20, type, only_waves_followed_by_authenticated_user: true }];
      const result: any = client.getQueryData(key);
      expect(result?.pages?.[0][0].metrics.drops_count).toBe(1);
      expect(result?.pages?.[0][0].metrics.your_drops_count).toBe(1);
    }
  });
});
