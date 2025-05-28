import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { NotificationsProvider, useNotificationsContext } from '../../../components/notifications/NotificationsContext';

jest.mock('../../../hooks/useCapacitor', () => () => ({ isCapacitor: false, isIos: false }));
jest.mock('next/router', () => ({ __esModule: true, useRouter: jest.fn(() => ({ push: jest.fn() })) }));
jest.mock('../../../components/auth/Auth', () => ({ useAuth: () => ({ connectedProfile: null }) }));

const wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <NotificationsProvider>{children}</NotificationsProvider>
);

describe('NotificationsContext', () => {
  it('provides context functions', () => {
    const { result } = renderHook(() => useNotificationsContext(), { wrapper });
    expect(typeof result.current.removeAllDeliveredNotifications).toBe('function');
  });

  it('throws when used outside provider', () => {
    const { result } = renderHook(() => {
      try {
        return useNotificationsContext();
      } catch (e) {
        return e;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
  });
});
