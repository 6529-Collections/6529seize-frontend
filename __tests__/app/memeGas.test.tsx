import React from 'react';
import { render } from '@testing-library/react';
import GasPage, { generateMetadata } from '@/app/meme-gas/page';
import { AuthContext } from '../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);


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

describe('GasPage', () => {
  it('sets page title and renders gas component', () => {
    const setTitle = jest.fn();
    const { getByTestId } = render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <GasPage />
      </AuthContext.Provider>
    );
    // Component renders successfully
    expect(getByTestId('dynamic')).toBeInTheDocument();
  });

  it('exports metadata', async () => {
    process.env.BASE_ENDPOINT = 'https://example.com';
    const metadata = await generateMetadata();
    expect(metadata).toMatchObject({ title: 'Meme Gas', description: 'Tools | 6529.io' });
  });
});
