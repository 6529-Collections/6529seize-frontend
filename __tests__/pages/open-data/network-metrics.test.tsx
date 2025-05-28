import React from 'react';
import { render, screen } from '@testing-library/react';
import NetworkMetrics from '../../../pages/open-data/network-metrics';
import { AuthContext } from '../../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('Open Data network metrics page', () => {
  it('renders metrics component and sets title', () => {
    const setTitle = jest.fn();
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <NetworkMetrics />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
    expect(setTitle).toHaveBeenCalledWith({ title: 'Network Metrics | Open Data' });
  });

  it('exposes metadata', () => {
    expect(NetworkMetrics.metadata).toEqual({ title: 'Network Metrics', description: 'Open Data' });
  });
});
