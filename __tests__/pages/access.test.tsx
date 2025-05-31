import { render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import Access from '../../pages/access';
import { AuthContext } from '../../components/auth/Auth';
import { useRouter } from 'next/router';

jest.mock('next/image', () => ({ __esModule: true, default: (p: any) => <img {...p} /> }));
jest.mock('next/router', () => ({ useRouter: jest.fn() }));

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
    useRouterMock.mockReturnValue({ isReady: true, push: jest.fn() });
    // Avoid "alert is not implemented" errors from jsdom
    global.alert = jest.fn();
  });

  it('fetches image and triggers login on enter', async () => {
    const { getByPlaceholderText } = render(
      <TestProvider>
        <Access />
      </TestProvider>
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const input = getByPlaceholderText('Team Login') as HTMLInputElement;
    fireEvent.keyDown(input, { key: 'enter', target: input });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
});
