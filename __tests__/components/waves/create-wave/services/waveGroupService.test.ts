import { getAdminGroupId } from '@/components/waves/create-wave/services/waveGroupService';
import { commonApiPost } from '@/services/api/common-api';

jest.mock('@/services/api/common-api', () => ({
  commonApiPost: jest.fn(),
}));

const mockedCommonApiPost = commonApiPost as jest.Mock;

describe('waveGroupService', () => {
  beforeEach(() => {
    mockedCommonApiPost.mockReset();
  });

  it('returns existing admin group id if provided', async () => {
    const result = await getAdminGroupId({
      adminGroupId: '123',
      primaryWallet: '0x1',
      handle: 'alice',
      onError: jest.fn(),
    });
    expect(result).toBe('123');
    expect(mockedCommonApiPost).not.toHaveBeenCalled();
  });

  it('returns null and calls onError when no primary wallet', async () => {
    const onError = jest.fn();
    const result = await getAdminGroupId({
      adminGroupId: null,
      primaryWallet: null,
      handle: 'alice',
      onError,
    });
    expect(result).toBeNull();
    expect(onError).toHaveBeenCalled();
  });

  it('creates group when no admin group id', async () => {
    mockedCommonApiPost
      .mockResolvedValueOnce({ id: 'new' }) // create group
      .mockResolvedValueOnce({}); // set visible
    const result = await getAdminGroupId({
      adminGroupId: null,
      primaryWallet: '0x1',
      handle: 'alice',
      onError: jest.fn(),
    });
    expect(result).toBe('new');
    expect(mockedCommonApiPost).toHaveBeenCalledTimes(2);
  });
});
