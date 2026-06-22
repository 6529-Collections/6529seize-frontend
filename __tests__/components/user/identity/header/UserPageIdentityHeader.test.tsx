import { render, screen } from '@testing-library/react';
import UserPageIdentityHeader from '@/components/user/identity/header/UserPageIdentityHeader';
import UserPageIdentityHeaderCIC from '@/components/user/identity/header/UserPageIdentityHeaderCIC';
import type { ApiIdentity } from '@/generated/models/ApiIdentity';

jest.mock('@/components/user/identity/header/UserPageIdentityHeaderCIC', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="cic" />),
}));
jest.mock('@/components/user/utils/rate/UserPageRateWrapper', () => (props: any) => <div data-testid="rate-wrapper">{props.children}</div>);
jest.mock('@/components/user/identity/header/cic-rate/UserPageIdentityHeaderCICRate', () => () => <div data-testid="cic-rate" />);

const profile = { cic: 1 } as ApiIdentity;
const mockCic = UserPageIdentityHeaderCIC as jest.MockedFunction<
  typeof UserPageIdentityHeaderCIC
>;

describe('UserPageIdentityHeader', () => {
  it('renders header and child components', () => {
    const onRateClick = jest.fn();
    render(
      <UserPageIdentityHeader
        profile={profile}
        cicOverview={null}
        onRateClick={onRateClick}
      />
    );
    expect(screen.getByText('Network Identity Check (NIC)')).toBeInTheDocument();
    expect(screen.getByTestId('cic')).toBeInTheDocument();
    expect(mockCic.mock.calls[0]?.[0]).toMatchObject({
      cicOverview: null,
      onRateClick,
      profile,
    });
  });
});
