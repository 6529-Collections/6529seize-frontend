import React from 'react';
import { render, screen } from '@testing-library/react';
import HeaderUser from '../../../../components/header/user/HeaderUser';

jest.mock('../../../../components/header/user/HeaderUserConnected', () => ({ __esModule: true, default: (props: any) => <div data-testid="connected">{props.connectedAddress}</div> }));
jest.mock('../../../../components/header/user/HeaderUserConnect', () => ({ __esModule: true, default: () => <div data-testid="connect" /> }));

jest.mock('../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: jest.fn() }));
jest.mock('../../../../components/notifications/NotificationsContext', () => ({ useNotificationsContext: jest.fn() }));

const { useSeizeConnectContext } = require('../../../../components/auth/SeizeConnectContext');
const { useNotificationsContext } = require('../../../../components/notifications/NotificationsContext');

describe('HeaderUser', () => {
  const removeAllDeliveredNotifications = jest.fn();

  beforeEach(() => {
    (useNotificationsContext as jest.Mock).mockReturnValue({ removeAllDeliveredNotifications });
    jest.clearAllMocks();
  });

  it('renders connected state when address present', () => {
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: '0xabc' });
    render(<HeaderUser />);
    expect(screen.getByTestId('connected')).toHaveTextContent('0xabc');
    expect(removeAllDeliveredNotifications).not.toHaveBeenCalled();
  });

  it('renders connect state and clears notifications when not connected', () => {
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: undefined });
    render(<HeaderUser />);
    expect(screen.getByTestId('connect')).toBeInTheDocument();
    expect(removeAllDeliveredNotifications).toHaveBeenCalledTimes(1);
  });
});
