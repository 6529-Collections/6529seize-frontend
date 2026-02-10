// @ts-nocheck
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AuthContext } from '@/components/auth/Auth';

jest.mock('@/components/utils/button/PrimaryButtonLink', () => ({
  __esModule: true,
  default: ({ children }: any) => <a data-testid="btn">{children}</a>
}));

const GroupHeaderSelect = require('@/components/groups/header/GroupHeaderSelect').default;

describe('GroupHeaderSelect', () => {
  const renderWithProfile = (profile: any) =>
    render(
      <AuthContext.Provider value={{ connectedProfile: profile } as any}>
        <GroupHeaderSelect />
      </AuthContext.Provider>
    );

  it('shows button when user has profile', () => {
    renderWithProfile({ handle: 'user' });
    expect(screen.getByTestId('btn')).toHaveTextContent('Create A Group');
  });

  it('shows connect wallet message when no profile', () => {
    renderWithProfile(null);
    expect(screen.getByText('Please connect a wallet')).toBeInTheDocument();
  });

  it('updates when profile changes', () => {
    const { rerender } = renderWithProfile(null);
    expect(screen.getByText('Please connect a wallet')).toBeInTheDocument();
    rerender(
      <AuthContext.Provider value={{ connectedProfile: { handle: 'user' } } as any}>
        <GroupHeaderSelect />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('btn')).toBeInTheDocument();
  });

  it('shows create profile message when wallet connected without handle', () => {
    renderWithProfile({});
    expect(screen.getByText('Please create a profile')).toBeInTheDocument();
  });
});
