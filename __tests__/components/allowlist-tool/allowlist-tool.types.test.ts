import {
  AllowlistOperationCode,
  AllowlistRunStatus,
  Pool,
  DistributionPlanTokenPoolDownloadStatus,
  AllowlistToolResponse,
} from '../../../components/allowlist-tool/allowlist-tool.types';

describe('allowlist-tool types', () => {
  describe('AllowlistOperationCode', () => {
    it('contains expected operation values', () => {
      expect(AllowlistOperationCode.CREATE_ALLOWLIST).toBe('CREATE_ALLOWLIST');
      expect(AllowlistOperationCode.ADD_PHASE).toBe('ADD_PHASE');
    });

    it('has unique values', () => {
      const values = Object.values(AllowlistOperationCode);
      const unique = new Set(values);
      expect(unique.size).toBe(values.length);
    });
  });

  describe('AllowlistRunStatus', () => {
    it('matches expected statuses', () => {
      expect(AllowlistRunStatus.PENDING).toBe('PENDING');
      expect(AllowlistRunStatus.CLAIMED).toBe('CLAIMED');
      expect(AllowlistRunStatus.FAILED).toBe('FAILED');
    });
  });

  describe('Pool', () => {
    it('lists all pool types', () => {
      expect(Object.values(Pool)).toEqual([
        'TOKEN_POOL',
        'CUSTOM_TOKEN_POOL',
        'WALLET_POOL',
      ]);
    });
  });

  describe('DistributionPlanTokenPoolDownloadStatus', () => {
    it('defines completion status', () => {
      expect(DistributionPlanTokenPoolDownloadStatus.COMPLETED).toBe('COMPLETED');
    });
  });

  describe('AllowlistToolResponse usage', () => {
    const isError = <T,>(
      res: AllowlistToolResponse<T>
    ): res is { statusCode: number; message: string | string[]; error: string } =>
      typeof res === 'object' && res !== null && 'error' in res;

    it('distinguishes error responses', () => {
      const success: AllowlistToolResponse<number> = 42;
      const error: AllowlistToolResponse<number> = {
        statusCode: 400,
        message: 'Bad Request',
        error: 'invalid',
      };

      expect(isError(success)).toBe(false);
      expect(isError(error)).toBe(true);
    });
  });
});
