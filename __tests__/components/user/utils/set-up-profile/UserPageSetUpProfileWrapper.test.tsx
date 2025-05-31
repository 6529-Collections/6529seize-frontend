import { render, screen } from '@testing-library/react';
import UserPageSetUpProfileWrapper from '../../../../../components/user/utils/set-up-profile/UserPageSetUpProfileWrapper';
import { ApiIdentity } from '../../../../../generated/models/ApiIdentity';
import { ApiProfileClassification } from '../../../../../generated/models/ApiProfileClassification';

jest.mock('../../../../../components/user/utils/set-up-profile/UserPageSetUpProfile', () => ({
  __esModule: true,
  default: () => <div data-testid="setup" />,
}));

jest.mock('../../../../../components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: jest.fn(),
}));

const { useSeizeConnectContext } = require('../../../../../components/auth/SeizeConnectContext');

describe('UserPageSetUpProfileWrapper', () => {
  const baseProfile: ApiIdentity = {
    id: '1',
    handle: null,
    normalised_handle: null,
    pfp: null,
    cic: 0,
    rep: 0,
    level: 0,
    tdh: 0,
    consolidation_key: '',
    display: '',
    primary_wallet: '',
    banner1: null,
    banner2: null,
    classification: ApiProfileClassification.Bot,
    sub_classification: null,
    wallets: [{ wallet: '0xabc', display: '0xabc', tdh: 0 }],
  } as any;

  it('shows setup component when connected wallet matches and handle missing', () => {
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: '0xabc' });
    render(
      <UserPageSetUpProfileWrapper profile={baseProfile}>
        <div data-testid="child" />
      </UserPageSetUpProfileWrapper>
    );
    expect(screen.getByTestId('setup')).toBeInTheDocument();
  });

  it('shows children when no wallet match', () => {
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: '0xdef' });
    render(
      <UserPageSetUpProfileWrapper profile={baseProfile}>
        <div data-testid="child" />
      </UserPageSetUpProfileWrapper>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
