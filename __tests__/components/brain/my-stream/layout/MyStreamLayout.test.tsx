import { render, screen } from '@testing-library/react';
import React from 'react';
import MyStreamLayout from '../../../../../components/brain/my-stream/layout/MyStreamLayout';
import { AuthContext } from '../../../../../components/auth/Auth';

jest.mock('next/image', () => ({ __esModule: true, default: (props:any) => <img {...props} /> }));

const useLayout = jest.fn();
jest.mock('../../../../../components/brain/my-stream/layout/LayoutContext', () => ({
  useLayout: (...args:any[]) => useLayout(...args)
}));

const useSeizeConnectContext = jest.fn();
jest.mock('../../../../../components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: (...args:any[]) => useSeizeConnectContext(...args)
}));

jest.mock('../../../../../components/brain/Brain', () => (props:any) => <div data-testid="brain">{props.children}</div>);
jest.mock('../../../../../components/header/user/HeaderUserConnect', () => () => <div data-testid="connect" />);
jest.mock('../../../../../components/user/utils/set-up-profile/UserSetUpProfileCta', () => () => <div data-testid="setup" />);
jest.mock('../../../../../components/client-only/ClientOnly', () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));

describe('MyStreamLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLayout.mockReturnValue({ spaces: { measurementsComplete: true } });
    useSeizeConnectContext.mockReturnValue({ isAuthenticated: true });
  });

  function renderWithAuth(auth: any) {
    return render(
      <AuthContext.Provider value={auth}>
        <MyStreamLayout>
          <span>child</span>
        </MyStreamLayout>
      </AuthContext.Provider>
    );
  }

  it('renders content when waves available', () => {
    renderWithAuth({ showWaves: true, connectedProfile: { handle: 'h' }, fetchingProfile: false });
    expect(screen.getByTestId('brain')).toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('shows connect prompt when not authenticated', () => {
    useSeizeConnectContext.mockReturnValue({ isAuthenticated: false });
    renderWithAuth({ showWaves: false, connectedProfile: null, fetchingProfile: false });
    expect(screen.getByTestId('connect')).toBeInTheDocument();
  });

  it('shows setup profile CTA when no profile handle', () => {
    renderWithAuth({ showWaves: false, connectedProfile: {}, fetchingProfile: false });
    expect(screen.getByTestId('setup')).toBeInTheDocument();
  });
});
