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

describe('Import App Wallet Page', () => {
  it('sets title and renders import component', () => {
    const setTitle = jest.fn();
    renderPage(setTitle);
    expect(setTitle).toHaveBeenCalledWith({ title: 'Import App Wallet | Tools' });
    expect(document.querySelector('[data-testid="import"]')).toBeInTheDocument();
  });

  it('exports metadata', () => {
    expect(Page.metadata).toEqual({ title: 'App Wallets | Import', description: 'Tools' });
  });
});
