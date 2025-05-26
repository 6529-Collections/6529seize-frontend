import {
  AllowlistOperationCode,
  Pool,
  AllowlistRunStatus,
  DistributionPlanTokenPoolDownloadStatus,
} from '../../../components/allowlist-tool/allowlist-tool.types';

describe('allowlist-tool.types enums', () => {
  it('has correct AllowlistOperationCode values', () => {
    expect(AllowlistOperationCode.CREATE_ALLOWLIST).toBe('CREATE_ALLOWLIST');
    expect(AllowlistOperationCode.ADD_ITEM).toBe('ADD_ITEM');
    expect(AllowlistOperationCode.ITEM_REMOVE_FIRST_N_WALLETS).toBe('ITEM_REMOVE_FIRST_N_WALLETS');
  });

  it('has correct Pool enum values', () => {
    expect(Pool.TOKEN_POOL).toBe('TOKEN_POOL');
    expect(Pool.CUSTOM_TOKEN_POOL).toBe('CUSTOM_TOKEN_POOL');
    expect(Pool.WALLET_POOL).toBe('WALLET_POOL');
  });

  it('has correct AllowlistRunStatus values', () => {
    expect(AllowlistRunStatus.PENDING).toBe('PENDING');
    expect(AllowlistRunStatus.CLAIMED).toBe('CLAIMED');
    expect(AllowlistRunStatus.FAILED).toBe('FAILED');
  });

  it('has correct DistributionPlanTokenPoolDownloadStatus values', () => {
    expect(DistributionPlanTokenPoolDownloadStatus.PENDING).toBe('PENDING');
    expect(DistributionPlanTokenPoolDownloadStatus.CLAIMED).toBe('CLAIMED');
    expect(DistributionPlanTokenPoolDownloadStatus.COMPLETED).toBe('COMPLETED');
  });
});
