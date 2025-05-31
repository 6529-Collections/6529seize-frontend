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
  it('returns true when wallet is admin', () => {
    const profile: Partial<ApiIdentity> = { wallets: [{ wallet: '0x0187C9a182736ba18b44eE8134eE438374cf87DC' }] };
    expect(isSubscriptionsAdmin(profile as ApiIdentity)).toBe(true);
  });

  it('handles download failure', async () => {
    mockFetch.mockRejectedValue('fail');
    const result = await download('c','1','plan','phase','public');
    expect(result.success).toBe(false);
  });
});
