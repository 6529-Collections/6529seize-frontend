import { render, screen } from '@testing-library/react';
import React from 'react';
import UserSetUpProfileCta from '@/components/user/utils/set-up-profile/UserSetUpProfileCta';
import { AuthContext } from '@/components/auth/Auth';
import { useSeizeConnectContext } from '@/components/auth/SeizeConnectContext';

jest.mock('@/components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: jest.fn() }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));

const useCtx = useSeizeConnectContext as jest.Mock;

function renderWithProfile(profile: any) {
  return render(
    <AuthContext.Provider value={{ connectedProfile: profile } as any}>
      <UserSetUpProfileCta />
    </AuthContext.Provider>
  );
}

describe('UserSetUpProfileCta', () => {
  it('shows link when handle missing', () => {
    useCtx.mockReturnValue({ address: '0xabc' });
    renderWithProfile({ handle: null });
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/0xabc/identity');
  });

  it('returns null when address missing or handle exists', () => {
    useCtx.mockReturnValue({ address: null });
    const { container } = renderWithProfile({ handle: null });
    expect(container.firstChild).toBeNull();

    useCtx.mockReturnValue({ address: '0x1' });
    const { container: c2 } = renderWithProfile({ handle: 'h' });
    expect(c2.firstChild).toBeNull();
  });
});
