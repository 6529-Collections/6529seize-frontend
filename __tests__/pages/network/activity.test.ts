import { getCommonHeaders, getUserProfileActivityLogs } from '../../../helpers/server.helpers';
import { convertActivityLogParams } from '../../../components/profile-activity/ProfileActivityLogs';

jest.mock('../../../helpers/server.helpers');
jest.mock('../../../components/profile-activity/ProfileActivityLogs', () => ({
  convertActivityLogParams: jest.fn(),
  __esModule: true,
}));

// Import and extract getServerSideProps without causing metadata issues
const activityPage = jest.requireActual('../../../pages/network/activity');
const { getServerSideProps } = activityPage;

// Mock the default export to prevent metadata assignment errors
jest.doMock('../../../pages/network/activity', () => {
  const MockComponent = jest.fn();
  (MockComponent as any).metadata = {};
  return {
    ...activityPage,
    default: MockComponent,
  };
});

const req: any = { req: { cookies: {} } };
const res: any = {};
const resolvedUrl: any = '/network/activity';

describe('getServerSideProps', () => {
  it('returns logs when fetch succeeds', async () => {
    (getCommonHeaders as jest.Mock).mockReturnValue({ h: 'v' });
    (convertActivityLogParams as jest.Mock).mockReturnValue('converted');
    (getUserProfileActivityLogs as jest.Mock).mockResolvedValue('logs');

    const result = await getServerSideProps(req, res, resolvedUrl);
    expect(getCommonHeaders).toHaveBeenCalledWith(req);
    expect(getUserProfileActivityLogs).toHaveBeenCalledWith({
      headers: { h: 'v' },
      params: 'converted',
    });
    expect(result).toEqual({ props: { logsPage: 'logs' } });
  });

  it('redirects on error', async () => {
    (getCommonHeaders as jest.Mock).mockReturnValue({});
    (convertActivityLogParams as jest.Mock).mockReturnValue('params');
    (getUserProfileActivityLogs as jest.Mock).mockRejectedValue(new Error('fail'));

    const result = await getServerSideProps(req, res, resolvedUrl);
    expect(result).toEqual({
      redirect: { permanent: false, destination: '/404' },
      props: {},
    });
  });
});
