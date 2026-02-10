// @ts-nocheck
import { render, screen } from '@testing-library/react';
import UserCICTypeIconTooltip from '@/components/user/utils/user-cic-type/tooltip/UserCICTypeIconTooltip';


jest.mock('@/components/user/utils/user-cic-type/UserCICTypeIcon', () => () => <div data-testid="icon" />);
jest.mock('@/components/user/utils/user-cic-type/tooltip/UserCICTypeIconTooltipHeaders', () => () => <div data-testid="headers" />);
jest.mock('@/components/user/utils/user-cic-type/tooltip/UserCICTypeIconTooltipRate', () => ({ profile }: any) => <div data-testid="rate">{profile.handle}</div>);

jest.mock('@/helpers/Helpers', () => ({
  amIUser: jest.fn(),
  cicToType: jest.fn().mockReturnValue('INACCURATE'),
  formatNumberWithCommas: (v: number) => String(v),
}));

jest.mock('@/components/react-query-wrapper/ReactQueryWrapper', () => ({ QueryKey: {} }));

jest.mock('@/services/api/common-api', () => ({ commonApiFetch: jest.fn() }));

jest.mock('@/components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address: '0x1' }) }));

jest.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: { count: 2 } }) }));

const { amIUser } = jest.requireMock('../../../../../../helpers/Helpers');

const profile: any = { handle: 'alice', cic: -30 };

describe('UserCICTypeIconTooltip', () => {
  it('shows rate section when not my profile', () => {
    amIUser.mockReturnValue(false);
    render(<UserCICTypeIconTooltip profile={profile} />);
    expect(screen.getByTestId('headers')).toBeInTheDocument();
    expect(screen.getByTestId('rate')).toHaveTextContent('alice');
  });

  it('hides rate section for my profile and shows warning text for inaccurate', () => {
    amIUser.mockReturnValue(true);
    render(<UserCICTypeIconTooltip profile={profile} />);
    expect(screen.queryByTestId('rate')).toBeNull();
    expect(screen.getByText(/at risk of losing/i)).toBeInTheDocument();
  });
});
