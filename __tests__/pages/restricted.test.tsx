import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import Restricted from '../../pages/restricted';
import { AuthContext } from '../../components/auth/Auth';
import { useRouter } from 'next/router';
import { getStagingAuth } from '../../services/auth/auth.utils';

jest.mock('next/image', () => (props: any) => <img {...props} />);
jest.mock('../../pages/access', () => ({ LoginImage: (p: any) => <img {...p} /> }));

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../services/auth/auth.utils', () => ({ getStagingAuth: jest.fn() }));

const TestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={{ setTitle: jest.fn() } as any}>{children}</AuthContext.Provider>
);


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

describe('Restricted page', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ isReady: true });
    (getStagingAuth as jest.Mock).mockReturnValue('token');
  });

  it('shows restricted message when response status 403', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 403,
      json: () => Promise.resolve({ image: 'img', country: 'US' }),
    }) as any;
    render(
      <TestProvider>
        <Restricted />
      </TestProvider>
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(await screen.findByDisplayValue(/restricted/)).toBeInTheDocument();
  });

  it('shows go message when allowed', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ image: 'img' }),
    }) as any;
    render(
      <TestProvider>
        <Restricted />
      </TestProvider>
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(await screen.findByDisplayValue('Go to 6529.io')).toBeInTheDocument();
  });
});
