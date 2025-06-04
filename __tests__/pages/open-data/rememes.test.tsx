import React from 'react';
import { render, screen } from '@testing-library/react';
import RememesDownloads from '../../../pages/open-data/rememes';
import { AuthContext } from '../../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('Open Data rememes page', () => {
  it('renders component and sets title', () => {
    const setTitle = jest.fn();
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <RememesDownloads />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
    expect(setTitle).toHaveBeenCalledWith({ title: 'Rememes | Open Data' });
  });

  it('exposes metadata', () => {
    expect(RememesDownloads.metadata).toEqual({ title: 'Rememes', description: 'Open Data' });
  });
});
