import { render, screen } from '@testing-library/react';
import { ApiIdentity } from '../../../../../generated/models/ApiIdentity';
import { ApiProfileClassification } from '../../../../../generated/models/ApiProfileClassification';
import { CLASSIFICATIONS } from '../../../../../entities/IProfile';
import UserPageHeaderName from '../../../../../components/user/user-page-header/name/UserPageHeaderName';

jest.mock('../../../../../components/user/user-page-header/name/UserPageHeaderNameWrapper', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="name-wrapper">{props.children}</div>,
}));

jest.mock('../../../../../components/user/user-page-header/name/classification/UserPageClassificationWrapper', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="classification">{props.children}</div>,
}));

jest.mock('../../../../../components/user/utils/user-cic-type/UserCICTypeIconWrapper', () => ({
  __esModule: true,
  default: () => <div data-testid="cic-icon" />,
}));

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
  classification: ApiProfileClassification.Pseudonym,
  sub_classification: null,
};

function renderComponent(profile: Partial<ApiIdentity>, mainAddress = '0xabc') {
  const combined = { ...baseProfile, ...profile } as ApiIdentity;
  return render(
    <UserPageHeaderName profile={combined} canEdit={false} mainAddress={mainAddress} />
  );
}

describe('UserPageHeaderName', () => {
  it('shows handle and classification when handle exists', () => {
    renderComponent({ handle: 'Alice', classification: ApiProfileClassification.Bot });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(
      screen.getByText(CLASSIFICATIONS[ApiProfileClassification.Bot].title)
    ).toBeInTheDocument();
  });

  it('shows display when handle missing', () => {
    renderComponent({ handle: null, display: 'Display Name' });
    expect(screen.getByText('Display Name')).toBeInTheDocument();
  });

  it('falls back to main address when no other name', () => {
    renderComponent({ handle: null, display: '' }, '0x123');
    expect(screen.getByText('0x123')).toBeInTheDocument();
  });
});
