import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import Auth, { AuthContext, TitleType } from '../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../components/react-query-wrapper/ReactQueryWrapper';

jest.mock('react-toastify', () => ({
  toast: jest.fn(),
  ToastContainer: () => <div data-testid="toast" />,
  Slide: () => null,
}));

jest.mock('wagmi', () => ({ useSignMessage: jest.fn(() => ({ signMessageAsync: jest.fn(), isPending: false })) }));

jest.mock('../../services/api/common-api', () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

jest.mock('../../services/auth/auth.utils', () => ({
  removeAuthJwt: jest.fn(),
  setAuthJwt: jest.fn(),
  getAuthJwt: jest.fn(),
  getRefreshToken: jest.fn(),
  getWalletAddress: jest.fn(),
  getWalletRole: jest.fn(),
}));

jest.mock('jwt-decode', () => jest.fn());

jest.mock('../../components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: jest.fn(() => ({ address: undefined, isConnected: false, seizeDisconnectAndLogout: jest.fn() })),
}));

jest.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: undefined }) }));

describe('Auth component', () => {
  it('updates title when setTitle called', async () => {
    const wrapperValue = { invalidateAll: jest.fn() } as any;

    function Child() {
      const { title, setTitle } = React.useContext(AuthContext);
      return (
        <div>
          <span data-testid="title">{title}</span>
          <button onClick={() => setTitle({ title: 'Wave', type: TitleType.WAVE })}>set</button>
        </div>
      );
    }

    render(
      <ReactQueryWrapperContext.Provider value={wrapperValue}>
        <Auth>
          <Child />
        </Auth>
      </ReactQueryWrapperContext.Provider>
    );

    expect(screen.getByTestId('title').textContent).toBe('6529');
    fireEvent.click(screen.getByText('set'));
    await waitFor(() => expect(screen.getByTestId('title').textContent).toBe('Wave'));
  });

  it('requestAuth shows toast when no address', async () => {
    const wrapperValue = { invalidateAll: jest.fn() } as any;
    const Child = () => {
      const { requestAuth } = React.useContext(AuthContext);
      return <button onClick={() => requestAuth()}>auth</button>;
    };

    const { toast } = require('react-toastify');

    render(
      <ReactQueryWrapperContext.Provider value={wrapperValue}>
        <Auth>
          <Child />
        </Auth>
      </ReactQueryWrapperContext.Provider>
    );
    fireEvent.click(screen.getByText('auth'));
    await waitFor(() => expect(toast).toHaveBeenCalled());
  });

});
