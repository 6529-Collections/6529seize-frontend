import { render, screen } from '@testing-library/react';
import React from 'react';
import AcceptConnectionSharing, { getServerSideProps } from '../../pages/accept-connection-sharing';
import { AuthContext } from '../../components/auth/Auth';
import { useSeizeConnectContext } from '../../components/auth/SeizeConnectContext';
import { useRouter } from 'next/router';


// Mock TitleContext
jest.mock('../../contexts/TitleContext', () => ({
  useTitle: () => ({
    title: 'Test Title',
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const TestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={{ setTitle: jest.fn(), setToast: jest.fn() } as any}>
    {children}
  </AuthContext.Provider>
);

describe('AcceptConnectionSharing page', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (useSeizeConnectContext as jest.Mock).mockReturnValue({
      address: undefined,
      seizeDisconnectAndLogout: jest.fn(),
      seizeAcceptConnection: jest.fn(),
    });
  });

  it('shows missing parameters message when token or address missing', () => {
    render(
      <TestProvider>
        <AcceptConnectionSharing pageProps={{ token: '', address: '' }} />
      </TestProvider>
    );
    expect(screen.getByText(/Missing required parameters/)).toBeInTheDocument();
  });

  it('includes provided token and address in the page', () => {
    render(
      <TestProvider>
        <AcceptConnectionSharing pageProps={{ token: 'abc12345', address: '0x123' }} />
      </TestProvider>
    );
    expect(screen.getByText(/Incoming Connection/)).toBeInTheDocument();
    expect(screen.getByText(/0x123/)).toBeInTheDocument();
  });

  it('getServerSideProps returns props from query', async () => {
    const result = await getServerSideProps({ query: { token: 't', address: 'a', role: 'r' } } as any, null as any, null as any);
    expect(result).toEqual({ props: { token: 't', address: 'a', role: 'r' } });
  });
});
