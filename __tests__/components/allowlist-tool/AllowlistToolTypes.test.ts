import {
  AllowlistOperationCode,
  AllowlistRunStatus,
  DistributionPlanTokenPoolDownloadStatus,
  Pool,
} from '@/components/allowlist-tool/allowlist-tool.types';

describe('allowlist-tool types', () => {
  it('should expose correct AllowlistOperationCode values', () => {
    expect(AllowlistOperationCode.CREATE_ALLOWLIST).toBe('CREATE_ALLOWLIST');
    expect(AllowlistOperationCode.ADD_PHASE).toBe('ADD_PHASE');
  });

  it('should expose correct AllowlistRunStatus values', () => {
    expect(AllowlistRunStatus.PENDING).toBe('PENDING');
    expect(AllowlistRunStatus.CLAIMED).toBe('CLAIMED');
    expect(AllowlistRunStatus.FAILED).toBe('FAILED');
  });

  it('should expose correct Pool enumeration values', () => {
    expect(Pool.TOKEN_POOL).toBe('TOKEN_POOL');
    expect(Pool.CUSTOM_TOKEN_POOL).toBe('CUSTOM_TOKEN_POOL');
    expect(Pool.WALLET_POOL).toBe('WALLET_POOL');
  });

  it('should expose correct DistributionPlanTokenPoolDownloadStatus values', () => {
    expect(DistributionPlanTokenPoolDownloadStatus.COMPLETED).toBe('COMPLETED');
  });
});
