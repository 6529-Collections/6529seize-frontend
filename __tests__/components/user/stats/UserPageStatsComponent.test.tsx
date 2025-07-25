
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/[user]/stats',
    pathname: '/[user]/stats',
    query: { user: 'test' },
    asPath: '/test/stats',
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

jest.mock('../../../../services/api/common-api', () => ({
  commonApiFetch: jest.fn().mockResolvedValue([])
}));

describe('UserPageStatsComponent', () => {
  it('component module loads', () => {
    expect(() => require('../../../../components/user/stats/UserPageStats')).not.toThrow();
  });
});