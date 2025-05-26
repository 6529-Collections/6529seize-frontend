import { AllowlistOperationCode, Pool, AllowlistRunStatus, DistributionPlanTokenPoolDownloadStatus } from '../../../components/allowlist-tool/allowlist-tool.types';

describe('allowlist-tool.types enums', () => {
  it('has expected AllowlistOperationCode values', () => {
    expect(AllowlistOperationCode.CREATE_ALLOWLIST).toBe('CREATE_ALLOWLIST');
    expect(AllowlistOperationCode.GET_COLLECTION_TRANSFERS).toBe('GET_COLLECTION_TRANSFERS');
  });

  it('Pool enum maps to string values', () => {
    expect(Pool.TOKEN_POOL).toBe('TOKEN_POOL');
    expect(Pool.CUSTOM_TOKEN_POOL).toBe('CUSTOM_TOKEN_POOL');
    expect(Pool.WALLET_POOL).toBe('WALLET_POOL');
  });

  it('AllowlistRunStatus contains expected statuses', () => {
    expect(Object.values(AllowlistRunStatus)).toEqual(['PENDING', 'CLAIMED', 'FAILED']);
  });

  it('DistributionPlanTokenPoolDownloadStatus includes COMPLETED', () => {
    expect(DistributionPlanTokenPoolDownloadStatus.COMPLETED).toBe('COMPLETED');
  });
});
