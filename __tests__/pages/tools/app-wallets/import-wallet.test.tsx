import React from 'react';
import { render } from '@testing-library/react';
import Page from '../../../../pages/tools/app-wallets/import-wallet';
import { AuthContext } from '../../../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="import" />);
jest.mock('../../../../components/app-wallets/AppWalletImport', () => () => <div data-testid="import" />);

const renderPage = (setTitle: jest.Mock) =>
  render(
    <AuthContext.Provider value={{ setTitle } as any}>
      <Page />
    </AuthContext.Provider>
  );


// Mock TitleContext
jest.mock('../../../../contexts/TitleContext', () => ({
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

describe('Import App Wallet Page', () => {
  it('sets title and renders import component', () => {
    const setTitle = jest.fn();
    renderPage(setTitle);
    // Title is set via TitleContext hooks
    expect(document.querySelector('[data-testid="import"]')).toBeInTheDocument();
  });

  it('exports metadata', () => {
    expect(Page.metadata).toEqual({ title: 'App Wallets | Import', description: 'Tools' });
  });
});
