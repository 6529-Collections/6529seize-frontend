import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { NotificationsProvider, useNotificationsContext } from '../../../components/notifications/NotificationsContext';

jest.mock('../../../hooks/useCapacitor', () => () => ({ isCapacitor: true, isIos: true }));
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

jest.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    removeAllListeners: jest.fn(),
    addListener: jest.fn(),
    requestPermissions: jest.fn().mockResolvedValue({ receive: 'granted' }),
    register: jest.fn(),
    getDeliveredNotifications: jest.fn().mockResolvedValue({ notifications: [{ data: { wave_id: 'w1' } }] }),
    removeDeliveredNotifications: jest.fn(),
    removeAllDeliveredNotifications: jest.fn(),
  },
}));

jest.mock('@capacitor/device', () => ({ Device: { getInfo: jest.fn().mockResolvedValue({ platform: 'ios' }) } }));

it('removes notifications when functions called', async () => {
  const { result } = renderHook(() => useNotificationsContext(), { wrapper });
  await act(async () => {
    await result.current.removeWaveDeliveredNotifications('w1');
    await result.current.removeAllDeliveredNotifications();
  });
  const { PushNotifications } = require('@capacitor/push-notifications');
  expect(PushNotifications.getDeliveredNotifications).toHaveBeenCalled();
  expect(PushNotifications.removeDeliveredNotifications).toHaveBeenCalled();
  expect(PushNotifications.removeAllDeliveredNotifications).toHaveBeenCalled();
});
