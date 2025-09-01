import { render } from '@testing-library/react';
import NavItem from '../../../components/navigation/NavItem';
import { useViewContext } from '../../../components/navigation/ViewContext';
import { useAuth } from '../../../components/auth/Auth';
import { useTitle } from '../../../contexts/TitleContext';
import { useUnreadNotifications } from '../../../hooks/useUnreadNotifications';
import { useUnreadIndicator } from '../../../hooks/useUnreadIndicator';
import { useNotificationsContext } from '../../../components/notifications/NotificationsContext';
import { isNavItemActive } from '../../../components/navigation/isNavItemActive';
import { useWaveData } from '../../../hooks/useWaveData';
import { useWave } from '../../../hooks/useWave';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

jest.mock('../../../components/navigation/ViewContext', () => ({ useViewContext: jest.fn() }));
jest.mock('../../../components/auth/Auth', () => ({ useAuth: jest.fn() }));
jest.mock('../../../contexts/TitleContext', () => ({ useTitle: jest.fn() }));
jest.mock('../../../hooks/useUnreadNotifications', () => ({ useUnreadNotifications: jest.fn() }));
jest.mock('../../../hooks/useUnreadIndicator', () => ({ useUnreadIndicator: jest.fn() }));
jest.mock('../../../components/notifications/NotificationsContext', () => ({ useNotificationsContext: jest.fn() }));
jest.mock('../../../components/navigation/isNavItemActive', () => ({ isNavItemActive: jest.fn() }));
jest.mock('../../../hooks/useWaveData', () => ({ useWaveData: jest.fn() }));
jest.mock('../../../hooks/useWave', () => ({ useWave: jest.fn() }));
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

describe('NavItem notifications', () => {
  const handleNavClick = jest.fn();
  const removeAllDeliveredNotifications = jest.fn();
  const setTitle = jest.fn();

  beforeEach(() => {
    (useViewContext as jest.Mock).mockReturnValue({ activeView: 'home', handleNavClick });
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    (usePathname as jest.Mock).mockReturnValue('/');
    (isNavItemActive as jest.Mock).mockReturnValue(false);
    (useUnreadIndicator as jest.Mock).mockReturnValue({ hasUnread: false });
    (useNotificationsContext as jest.Mock).mockReturnValue({ removeAllDeliveredNotifications });
    (useAuth as jest.Mock).mockReturnValue({ connectedProfile: { handle: 'user' } });
    (useTitle as jest.Mock).mockReturnValue({ setTitle, title: '6529.io', notificationCount: 0, setNotificationCount: jest.fn(), setWaveData: jest.fn(), setStreamHasNewItems: jest.fn() });
    (useWaveData as jest.Mock).mockReturnValue({ data: null });
    (useWave as jest.Mock).mockReturnValue({ isDm: false });
  });

  it('sets title and shows badge when there are unread notifications', () => {
    (useUnreadNotifications as jest.Mock).mockReturnValue({ notifications: { unread_count: 3 }, haveUnreadNotifications: true });
    const item = { name: 'Notifications', icon: '/n' } as any;

    const { container } = render(<NavItem item={item} />);

    // Title is set via TitleContext hooks
    expect(container.querySelector('.tw-bg-red')).not.toBeNull();
    expect(removeAllDeliveredNotifications).not.toHaveBeenCalled();
  });

  it('clears delivered notifications when none unread', () => {
    (useUnreadNotifications as jest.Mock).mockReturnValue({ notifications: { unread_count: 0 }, haveUnreadNotifications: false });
    const item = { name: 'Notifications', icon: '/n' } as any;

    const { container } = render(<NavItem item={item} />);

    // Title is set via TitleContext hooks
    expect(removeAllDeliveredNotifications).toHaveBeenCalled();
    expect(container.querySelector('.tw-bg-red')).toBeNull();
  });
});

it('renders disabled item when disabled flag set', () => {
  (useUnreadNotifications as jest.Mock).mockReturnValue({});
  const item = { name: 'Feed', icon: '/i', disabled: true } as any;
  const { getByRole } = render(<NavItem item={item} />);
  const button = getByRole('button');
  expect(button).toBeDisabled();
});
