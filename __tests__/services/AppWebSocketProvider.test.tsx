import { render } from '@testing-library/react';
import React from 'react';
import { AppWebSocketProvider } from '../../services/websocket/AppWebSocketProvider';
import { useWebSocket } from '../../services/websocket/useWebSocket';
import { getAuthJwt } from '../../services/auth/auth.utils';

jest.mock('../../services/websocket/useWebSocket');
jest.mock('../../services/auth/auth.utils');

const connect = jest.fn();
const disconnect = jest.fn();

(useWebSocket as jest.Mock).mockReturnValue({ connect, disconnect });

it('connects with auth token and disconnects on unmount', () => {
  (getAuthJwt as jest.Mock).mockReturnValue('token');
  const { unmount } = render(
    <AppWebSocketProvider>
      <div data-testid="child" />
    </AppWebSocketProvider>
  );
  expect(connect).toHaveBeenCalledWith('token');
  unmount();
  expect(disconnect).toHaveBeenCalled();
});
