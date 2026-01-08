import { render, screen } from '@testing-library/react';
import UserPageIdentityHeaderCIC from '@/components/user/identity/header/UserPageIdentityHeaderCIC';
import type { ApiIdentity } from '@/generated/models/ApiIdentity';

jest.mock('@/components/user/utils/user-cic-type/UserCICTypeIconWrapper', () => ({
  __esModule: true,
  default: () => <div data-testid="icon" />,
}));

jest.mock('@/components/user/utils/user-cic-status/UserCICStatus', () => ({
  __esModule: true,
  default: ({ cic }: { cic: number }) => <div data-testid="status">{cic}</div>,
}));

describe('UserPageIdentityHeaderCIC', () => {
  const baseProfile: ApiIdentity = { cic: 1000 } as ApiIdentity;

  it('displays NIC and status info', () => {
    render(<UserPageIdentityHeaderCIC profile={baseProfile} />);
    expect(screen.getByText('NIC:')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByTestId('status')).toHaveTextContent('1000');
  });

  it('updates when profile prop changes', () => {
    const { rerender } = render(<UserPageIdentityHeaderCIC profile={baseProfile} />);
    rerender(<UserPageIdentityHeaderCIC profile={{ cic: 2000 } as ApiIdentity} />);
    expect(screen.getByText('2,000')).toBeInTheDocument();
    expect(screen.getByTestId('status')).toHaveTextContent('2000');
  });
});
