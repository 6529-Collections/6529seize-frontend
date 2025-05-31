import { getStatsPath } from '../../components/user/stats/UserPageStats';
import { ApiIdentity } from '../../generated/models/ApiIdentity';

describe('getStatsPath', () => {
  const baseProfile = {
    wallets: [{ wallet: '0xabc' }],
    consolidation_key: 'key123',
  } as unknown as ApiIdentity;

  it('returns wallet path when active address provided', () => {
    const result = getStatsPath(baseProfile, '0xdef');
    expect(result).toBe('wallet/0xdef');
  });

  it('returns consolidation path when no active address', () => {
    const result = getStatsPath(baseProfile, null);
    expect(result).toBe('consolidation/key123');
  });

  it('falls back to first wallet when no active address and no consolidation key', () => {
    const profile = { wallets: [{ wallet: '0x999' }] } as unknown as ApiIdentity;
    const result = getStatsPath(profile, null);
    expect(result).toBe('wallet/0x999');
  });
});
