const mockFetch = jest.fn();
jest.mock('../../../services/api/common-api', () => ({
  commonApiFetch: (...args: any[]) => mockFetch(...args),
  commonApiPost: jest.fn(),
}));

import { download, isSubscriptionsAdmin } from '../../../components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription';
import { ApiIdentity } from '../../../generated/models/ApiIdentity';

describe('ReviewDistributionPlanTableSubscription utilities', () => {
  it('checks subscriptions admin wallets', () => {
    const profile: Partial<ApiIdentity> = { wallets: [{ wallet: '0xabc' }] };
    expect(isSubscriptionsAdmin(profile as ApiIdentity)).toBe(false);
  });

  it('downloads subscription results', async () => {
    mockFetch.mockResolvedValue({ airdrops: [], airdrops_unconsolidated: [], allowlists: [] });
    await download('c','1','plan','phase','public');
    expect(mockFetch).toHaveBeenCalledWith({ endpoint: 'subscriptions/allowlists/c/1/plan/phase' });
  });
});
