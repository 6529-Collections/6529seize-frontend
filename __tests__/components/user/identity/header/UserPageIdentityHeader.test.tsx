import { render, screen } from '@testing-library/react';
import UserPageIdentityHeader from '@/components/user/identity/header/UserPageIdentityHeader';
import { ApiIdentity } from '@/generated/models/ApiIdentity';

jest.mock('@/components/user/identity/header/UserPageIdentityHeaderCIC', () => () => <div data-testid="cic" />);
jest.mock('@/components/user/utils/rate/UserPageRateWrapper', () => (props: any) => <div data-testid="rate-wrapper">{props.children}</div>);
jest.mock('@/components/user/identity/header/cic-rate/UserPageIdentityHeaderCICRate', () => () => <div data-testid="cic-rate" />);

const profile = { cic: 1 } as ApiIdentity;

describe('UserPageIdentityHeader', () => {
  it('renders header and child components', () => {
    render(<UserPageIdentityHeader profile={profile} />);
    expect(screen.getByText('Network Identity Check (NIC)')).toBeInTheDocument();
    expect(screen.getByTestId('cic')).toBeInTheDocument();
    expect(screen.getByTestId('cic-rate')).toBeInTheDocument();
    expect(screen.getByTestId('rate-wrapper')).toBeInTheDocument();
  });
});
