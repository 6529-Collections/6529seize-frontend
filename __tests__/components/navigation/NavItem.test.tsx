import { render } from '@testing-library/react';
import NavItem from '../../../components/navigation/NavItem';
import { useViewContext } from '../../../components/navigation/ViewContext';
import { useAuth, TitleType } from '../../../components/auth/Auth';
import { useUnreadNotifications } from '../../../hooks/useUnreadNotifications';
import { useUnreadIndicator } from '../../../hooks/useUnreadIndicator';
import { useNotificationsContext } from '../../../components/notifications/NotificationsContext';
import { isNavItemActive } from '../../../components/navigation/isNavItemActive';
import { useWaveData } from '../../../hooks/useWaveData';
import { useWave } from '../../../hooks/useWave';
import { useRouter } from 'next/router';

jest.mock('../../../components/navigation/ViewContext', () => ({ useViewContext: jest.fn() }));
jest.mock('../../../components/auth/Auth', () => ({ useAuth: jest.fn(), TitleType: { NOTIFICATION: 'NOTIFICATION' } }));
jest.mock('../../../hooks/useUnreadNotifications', () => ({ useUnreadNotifications: jest.fn() }));
jest.mock('../../../hooks/useUnreadIndicator', () => ({ useUnreadIndicator: jest.fn() }));
jest.mock('../../../components/notifications/NotificationsContext', () => ({ useNotificationsContext: jest.fn() }));
jest.mock('../../../components/navigation/isNavItemActive', () => ({ isNavItemActive: jest.fn() }));
jest.mock('../../../hooks/useWaveData', () => ({ useWaveData: jest.fn() }));
jest.mock('../../../hooks/useWave', () => ({ useWave: jest.fn() }));
jest.mock('next/router', () => ({ useRouter: jest.fn() }));

describe('NavItem notifications', () => {
  const handleNavClick = jest.fn();
  const removeAllDeliveredNotifications = jest.fn();
  const setTitle = jest.fn();

  beforeEach(() => {
    (useViewContext as jest.Mock).mockReturnValue({ activeView: 'home', handleNavClick });
    (useRouter as jest.Mock).mockReturnValue({ query: {}, pathname: '/' });
    (isNavItemActive as jest.Mock).mockReturnValue(false);
    (useUnreadIndicator as jest.Mock).mockReturnValue({ hasUnread: false });
    (useNotificationsContext as jest.Mock).mockReturnValue({ removeAllDeliveredNotifications });
    (useAuth as jest.Mock).mockReturnValue({ connectedProfile: { handle: 'user' }, setTitle });
    (useWaveData as jest.Mock).mockReturnValue({ data: null });
    (useWave as jest.Mock).mockReturnValue({ isDm: false });
  });

  it('sets title and shows badge when there are unread notifications', () => {
    (useUnreadNotifications as jest.Mock).mockReturnValue({ notifications: { unread_count: 3 }, haveUnreadNotifications: true });
    const item = { name: 'Notifications', icon: '/n' } as any;

    const { container } = render(<NavItem item={item} />);

    expect(setTitle).toHaveBeenCalledWith({ title: '(3) Notifications | 6529.io', type: 'NOTIFICATION' });
    expect(container.querySelector('.tw-bg-red')).not.toBeNull();
    expect(removeAllDeliveredNotifications).not.toHaveBeenCalled();
  });

  it('clears delivered notifications when none unread', () => {
    (useUnreadNotifications as jest.Mock).mockReturnValue({ notifications: { unread_count: 0 }, haveUnreadNotifications: false });
    const item = { name: 'Notifications', icon: '/n' } as any;

    const { container } = render(<NavItem item={item} />);

    expect(setTitle).toHaveBeenCalledWith({ title: null, type: 'NOTIFICATION' });
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
