// @ts-nocheck
import React from 'react';
import { render, screen } from '@testing-library/react';
import MemeAccountingPage from '../../pages/meme-accounting';
import { AuthContext } from '../../components/auth/Auth';

jest.mock('../../components/gas-royalties/Royalties', () => () => <div data-testid="royalties" />);

jest.mock('../../styles/Home.module.scss', () => ({
  main: 'main-class',
}));


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

describe('MemeAccountingPage', () => {
  const setTitle = jest.fn();

  const renderPage = () =>
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <MemeAccountingPage />
      </AuthContext.Provider>
    );

  it('renders royalties component inside main', async () => {
    const { container } = renderPage();
    expect(container.querySelector('main')).toHaveClass('main-class');
    expect(await screen.findByTestId('royalties')).toBeInTheDocument();
  });

  it('page renders successfully', () => {
    renderPage();
    // Component renders successfully
  });

  it('exposes correct metadata', () => {
    expect(MemeAccountingPage.metadata).toEqual({
      title: 'Meme Accounting',
      description: 'Tools',
    });
  });
});
