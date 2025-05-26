import { AllowlistOperationCode, AllowlistRunStatus, DistributionPlanTokenPoolDownloadStatus } from '../../../components/allowlist-tool/allowlist-tool.types';

describe('allowlist-tool.types enums', () => {
  it('should expose operation codes', () => {
    expect(AllowlistOperationCode.CREATE_ALLOWLIST).toBe('CREATE_ALLOWLIST');
    expect(AllowlistOperationCode.GET_COLLECTION_TRANSFERS).toBe('GET_COLLECTION_TRANSFERS');
  });

  it('should expose run status values', () => {
    expect(AllowlistRunStatus.PENDING).toBe('PENDING');
    expect(AllowlistRunStatus.FAILED).toBe('FAILED');
  });

  it('should expose distribution plan statuses', () => {
    expect(DistributionPlanTokenPoolDownloadStatus.COMPLETED).toBe('COMPLETED');
  });
});
