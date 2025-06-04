import { renderHook } from '@testing-library/react';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import { QueryKey } from '../../components/react-query-wrapper/ReactQueryWrapper';

const useQueryMock = jest.fn();
jest.mock('@tanstack/react-query', () => ({ useQuery: (...args:any[]) => useQueryMock(...args) }));

jest.mock('../../hooks/useCapacitor', () => ({ __esModule: true, default: () => ({ isCapacitor: false }) }));

jest.mock('../../services/api/common-api', () => ({ commonApiFetch: jest.fn() }));

describe('useUnreadNotifications', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
  });

  it('returns unread when notifications have count', () => {
    useQueryMock.mockReturnValue({ data: { unread_count: 2 } });
    const { result } = renderHook(() => useUnreadNotifications('bob'));
    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: [QueryKey.IDENTITY_NOTIFICATIONS, { identity: 'bob', limit: '1' }],
      enabled: true,
    }));
    expect(result.current.haveUnreadNotifications).toBe(true);
    expect(result.current.notifications).toEqual({ unread_count: 2 });
  });

  it('returns false when no unread notifications', () => {
    useQueryMock.mockReturnValue({ data: { unread_count: 0 } });
    const { result } = renderHook(() => useUnreadNotifications('alice'));
    expect(result.current.haveUnreadNotifications).toBe(false);
  });
});
