import React from 'react';
import { render, screen } from '@testing-library/react';
import TeamDownloads from '../../../pages/open-data/team';
import { AuthContext } from '../../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('Open Data team page', () => {
  it('renders component and sets title', () => {
    const setTitle = jest.fn();
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <TeamDownloads />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
    expect(setTitle).toHaveBeenCalledWith({ title: 'Team | Open Data' });
  });

  it('exposes metadata', () => {
    expect(TeamDownloads.metadata).toEqual({ title: 'Team', description: 'Open Data' });
  });
});
