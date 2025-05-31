// @ts-nocheck
import React from 'react';
import { render, screen } from '@testing-library/react';
import MemeAccountingPage from '../../pages/meme-accounting';
import { AuthContext } from '../../components/auth/Auth';

jest.mock('../../components/gas-royalties/Royalties', () => () => <div data-testid="royalties" />);

jest.mock('../../styles/Home.module.scss', () => ({
  main: 'main-class',
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

  it('sets the page title on mount', () => {
    renderPage();
    expect(setTitle).toHaveBeenCalledWith({ title: 'Meme Accounting | Tools' });
  });

  it('exposes correct metadata', () => {
    expect(MemeAccountingPage.metadata).toEqual({
      title: 'Meme Accounting',
      description: 'Tools',
    });
  });
});
