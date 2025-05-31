import { render, screen } from '@testing-library/react';
import HeaderNotifications from '../../../components/header/notifications/HeaderNotifications';
import React from 'react';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));
jest.mock('next/router', () => ({ useRouter: jest.fn() }));

jest.mock('../../../components/auth/Auth', () => ({
  useAuth: jest.fn(),
  TitleType: { NOTIFICATION: 'NOTIFICATION' },
}));

jest.mock('../../../hooks/useUnreadNotifications', () => ({
  useUnreadNotifications: jest.fn(),
}));

jest.mock('../../../components/notifications/NotificationsContext', () => ({
  useNotificationsContext: jest.fn(),
}));

const { useRouter } = require('next/router');
const { useAuth, TitleType } = require('../../../components/auth/Auth');
const { useUnreadNotifications } = require('../../../hooks/useUnreadNotifications');
const { useNotificationsContext } = require('../../../components/notifications/NotificationsContext');

describe('HeaderNotifications', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows unread badge and sets title', () => {
    (useAuth as jest.Mock).mockReturnValue({ connectedProfile: { handle: 'alice' }, setTitle: jest.fn() });
    (useRouter as jest.Mock).mockReturnValue({ pathname: '/home' });
    const removeAll = jest.fn();
    (useNotificationsContext as jest.Mock).mockReturnValue({ removeAllDeliveredNotifications: removeAll });
    (useUnreadNotifications as jest.Mock).mockReturnValue({ notifications: { unread_count: 2 }, haveUnreadNotifications: true });

    render(<HeaderNotifications />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/my-stream/notifications');
    expect(screen.getByRole('link').querySelector('div')).toBeInTheDocument();
    expect(removeAll).not.toHaveBeenCalled();
    const { setTitle } = (useAuth as jest.Mock).mock.results[0].value;
    expect(setTitle).toHaveBeenCalledWith({ title: '(2) Notifications | 6529.io', type: TitleType.NOTIFICATION });
  });

  it('removes delivered notifications when none unread and adjusts link', () => {
    const setTitle = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({ connectedProfile: { handle: 'bob' }, setTitle });
    (useRouter as jest.Mock).mockReturnValue({ pathname: '/my-stream/notifications' });
    const removeAll = jest.fn();
    (useNotificationsContext as jest.Mock).mockReturnValue({ removeAllDeliveredNotifications: removeAll });
    (useUnreadNotifications as jest.Mock).mockReturnValue({ notifications: { unread_count: 0 }, haveUnreadNotifications: false });

    render(<HeaderNotifications />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/my-stream/notifications?reload=true');
    expect(screen.getByRole('link').querySelector('div')).toBeNull();
    expect(removeAll).toHaveBeenCalled();
    expect(setTitle).toHaveBeenCalledWith({ title: null, type: TitleType.NOTIFICATION });
  });
});
