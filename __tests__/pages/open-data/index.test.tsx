import React from 'react';
import { render, screen } from '@testing-library/react';
import Downloads from '../../../pages/open-data/index';
import { AuthContext } from '../../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('Open Data page', () => {
  it('renders downloads component and sets title', () => {
    const setTitle = jest.fn();
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <Downloads />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
    expect(setTitle).toHaveBeenCalledWith({ title: 'Open Data' });
  });

  it('exposes metadata', () => {
    expect(Downloads.metadata).toEqual({ title: 'Open Data' });
  });
});
