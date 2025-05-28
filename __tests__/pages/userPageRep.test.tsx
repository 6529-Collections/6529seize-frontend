import { getServerSideProps } from '../../pages/[user]/rep';
import { getCommonHeaders, getUserProfile, userPageNeedsRedirect } from '../../helpers/server.helpers';
import { getMetadataForUserPage } from '../../helpers/Helpers';

jest.mock('../../helpers/server.helpers');
jest.mock('../../helpers/Helpers');

const mockProfile = { handle: 'alice' } as any;
(getMetadataForUserPage as jest.Mock).mockReturnValue('meta');
(getCommonHeaders as jest.Mock).mockReturnValue({ head: '1' });
(getUserProfile as jest.Mock).mockResolvedValue(mockProfile);

describe('rep page getServerSideProps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects when helper returns redirect', async () => {
    (userPageNeedsRedirect as jest.Mock).mockReturnValue({ redirect: 'yes' });
    const result = await getServerSideProps({ query: { user: 'bob' }, req: {} } as any, null as any, null as any);
    expect(result).toEqual({ redirect: 'yes' });
  });

  it('returns props when no redirect needed', async () => {
    (userPageNeedsRedirect as jest.Mock).mockReturnValue(false);
    const result = await getServerSideProps({ query: { user: 'bob' }, req: {} } as any, null as any, null as any);
    expect(result).toEqual({ props: { profile: mockProfile, handleOrWallet: 'bob', metadata: 'meta' } });
  });

  it('returns 404 redirect on error', async () => {
    (userPageNeedsRedirect as jest.Mock).mockReturnValue(false);
    (getUserProfile as jest.Mock).mockRejectedValue(new Error('fail'));
    const result = await getServerSideProps({ query: { user: 'bob' }, req: {} } as any, null as any, null as any);
    expect(result).toEqual({ redirect: { permanent: false, destination: '/404' }, props: {} });
  });
});
