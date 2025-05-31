import { getServerSideProps as getUserProps } from '../../pages/[user]/index';
import { getServerSideProps as getProxyProps } from '../../pages/[user]/proxy/index';
import { getCommonHeaders, getUserProfile, userPageNeedsRedirect } from '../../helpers/server.helpers';
import { getMetadataForUserPage } from '../../helpers/Helpers';

jest.mock('../../helpers/server.helpers');
jest.mock('../../helpers/Helpers');

const mockProfile = { handle: 'alice' } as any;

(getMetadataForUserPage as jest.Mock).mockReturnValue('meta');

(getCommonHeaders as jest.Mock).mockReturnValue({ head: '1' });
(getUserProfile as jest.Mock).mockResolvedValue(mockProfile);

describe('user pages getServerSideProps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects when helper returns redirect object', async () => {
    (userPageNeedsRedirect as jest.Mock).mockReturnValue({ redirect: 'yes' });
    const result = await getUserProps({ query: { user: 'bob' } } as any, null as any, null as any);
    expect(result).toEqual({ redirect: 'yes' });
  });

  it('returns props when no redirect needed', async () => {
    (userPageNeedsRedirect as jest.Mock).mockReturnValue(false);
    const result = await getUserProps({ query: { user: 'bob' } } as any, null as any, null as any);
    expect(result).toEqual({ props: { profile: mockProfile, metadata: 'meta' } });
  });

  it('proxy page returns props', async () => {
    (userPageNeedsRedirect as jest.Mock).mockReturnValue(false);
    const result = await getProxyProps({ query: { user: 'bob' } } as any, null as any, null as any);
    expect(result).toEqual({ props: { profile: mockProfile, metadata: 'meta' } });
  });
});
