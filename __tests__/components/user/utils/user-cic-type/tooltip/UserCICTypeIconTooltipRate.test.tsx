import { render, screen } from '@testing-library/react';
import { ApiIdentity } from '@/generated/models/ApiIdentity';
import { ApiProfileClassification } from '@/generated/models/ApiProfileClassification';
import UserCICTypeIconTooltipRate from '@/components/user/utils/user-cic-type/tooltip/UserCICTypeIconTooltipRate';

jest.mock('@/components/user/utils/rate/UserPageRateWrapper', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="wrapper">{children}</div>,
}));

jest.mock('@/components/user/identity/header/cic-rate/UserPageIdentityHeaderCICRate', () => ({
  __esModule: true,
  default: () => <div data-testid="rate" />,
}));

describe('UserCICTypeIconTooltipRate', () => {
  const profile: ApiIdentity = {
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
  } as any;

  it('renders cic rate inside wrapper', () => {
    render(<UserCICTypeIconTooltipRate profile={profile} />);
    expect(screen.getByTestId('wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('rate')).toBeInTheDocument();
  });
});
