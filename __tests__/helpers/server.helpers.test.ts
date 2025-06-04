import { getUserProfile, userPageNeedsRedirect, getUserProfileActivityLogs, getInitialRatersParams, getCommonHeaders } from '../../helpers/server.helpers';
import { commonApiFetch } from '../../services/api/common-api';

afterEach(() => jest.clearAllMocks());

jest.mock('../../services/api/common-api');

const mockedFetch = commonApiFetch as jest.Mock;

describe('server.helpers', () => {
  it('getUserProfile calls api', async () => {
    mockedFetch.mockResolvedValue({ handle: 'a' });
    await getUserProfile({ user: 'bob', headers: { h: '1' } });
    expect(mockedFetch).toHaveBeenCalledWith({ endpoint: 'identities/bob', headers: { h: '1' } });
  });

  it('userPageNeedsRedirect returns redirect when handle differs', () => {
    const res = userPageNeedsRedirect({ profile: { handle: 'Alice' }, req: { query: { user: 'bob', x: '1' } }, subroute: 'page' } as any);
    expect(res!.redirect.destination).toBe('/Alice/page?x=1');
  });

  it('getUserProfileActivityLogs returns fallback on error', async () => {
    mockedFetch.mockRejectedValue(new Error('fail'));
    const data = await getUserProfileActivityLogs({ headers: {}, params: {} as any });
    expect(data.count).toBe(0);
  });

  it('getInitialRatersParams creates params', () => {
    const p = getInitialRatersParams({ handleOrWallet: 'h', given: true, matter: 'REP' as any });
    expect(p.handleOrWallet).toBe('h');
    expect(p.given).toBe(true);
  });

  it('getCommonHeaders reads cookies', () => {
    const req = { req: { cookies: { 'x-6529-auth': 'a', 'wallet-auth': 'b' } } } as any;
    expect(getCommonHeaders(req)).toEqual({ 'x-6529-auth': 'a', Authorization: 'Bearer b' });
  });
});
