import React from 'react';
import { render, screen } from '@testing-library/react';
import RoyaltiesDownloads from '../../../pages/open-data/royalties';
import { AuthContext } from '../../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('Open Data royalties page', () => {
  it('renders royalties component and sets title', () => {
    const setTitle = jest.fn();
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <RoyaltiesDownloads />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
    expect(setTitle).toHaveBeenCalledWith({ title: 'Royalties | Open Data' });
  });

  it('exposes metadata', () => {
    expect(RoyaltiesDownloads.metadata).toEqual({ title: 'Royalties', description: 'Open Data' });
  });
});
