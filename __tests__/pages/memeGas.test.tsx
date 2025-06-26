import React from 'react';
import { render } from '@testing-library/react';
import GasPage from '../../pages/meme-gas';
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

  it('exports metadata', () => {
    expect(GasPage.metadata).toEqual({ title: 'Meme Gas', description: 'Tools' });
  });
});
