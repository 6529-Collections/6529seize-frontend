import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import Auth, { AuthContext } from '../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../components/react-query-wrapper/ReactQueryWrapper';
import { mockTitleContextModule } from '../utils/titleTestUtils';

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

// Mock TitleContext
mockTitleContextModule();

describe('Auth component', () => {
  // Note: Title functionality has been moved to TitleContext
  // This test is no longer applicable as Auth doesn't manage titles anymore
  it.skip('updates title when setTitle called - moved to TitleContext', async () => {
    // Title management is now handled by TitleContext, not Auth
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
