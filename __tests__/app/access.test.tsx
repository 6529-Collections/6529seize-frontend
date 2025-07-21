import { render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import AccessPage from '@/app/access/page';
import { AuthContext } from '../../components/auth/Auth';
import { useRouter } from 'next/navigation';

jest.mock('next/image', () => ({ __esModule: true, default: (p: any) => <img alt="" {...p} /> }));
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));

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


const useRouterMock = useRouter as jest.Mock;

const TestProvider: React.FC = ({ children }) => (
  <AuthContext.Provider value={{ setTitle: jest.fn() } as any}>{children}</AuthContext.Provider>
);

describe('Access page', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 401,
      json: () => Promise.resolve({ image: 'img.jpg' }),
    }) as any;
    useRouterMock.mockReturnValue({ push: jest.fn() });
    // Avoid "alert is not implemented" errors from jsdom
    global.alert = jest.fn();
  });

  it('fetches image and triggers login on enter', async () => {
    const { getByPlaceholderText } = render(
      <TestProvider>
        <AccessPage />
      </TestProvider>
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const input = getByPlaceholderText('Team Login') as HTMLInputElement;
    fireEvent.keyDown(input, { key: 'enter', target: input });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
});
