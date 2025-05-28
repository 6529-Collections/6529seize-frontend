import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageHeaderBanner from '../../../../../components/user/user-page-header/banner/UserPageHeaderBanner';
import { ApiIdentity } from '../../../../../generated/models/ApiIdentity';

jest.mock('../../../../../components/utils/icons/PencilIcon', () => () => <span data-testid="pencil" />);
jest.mock('../../../../../components/utils/animation/CommonAnimationWrapper', () => ({ children }: any) => <div>{children}</div>);
jest.mock('../../../../../components/utils/animation/CommonAnimationOpacity', () => ({ children, onClicked }: any) => (
  <div data-testid="opacity" onClick={onClicked}>{children}</div>
));

jest.mock('../../../../../components/user/user-page-header/banner/UserPageHeaderEditBanner', () => (props: any) => (
  <div data-testid="edit" onClick={props.onClose} />
));

describe('UserPageHeaderBanner', () => {
  const baseProfile: ApiIdentity = {
    id: '1',
    handle: 'alice',
    normalised_handle: null,
    pfp: null,
    cic: 0,
    rep: 0,
    level: 0,
    tdh: 0,
    consolidation_key: '',
    display: 'alice',
    primary_wallet: '0xabc',
    banner1: null,
    banner2: null,
    classification: 0 as any,
    sub_classification: null,
  };

  it('opens and closes edit modal when button clicked', async () => {
    render(
      <UserPageHeaderBanner profile={baseProfile} defaultBanner1="#000" defaultBanner2="#fff" canEdit={true} />
    );

    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('edit')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('edit'));
    expect(screen.queryByTestId('edit')).toBeNull();
  });

  it('hides edit button when cannot edit', () => {
    render(
      <UserPageHeaderBanner profile={baseProfile} defaultBanner1="#000" defaultBanner2="#fff" canEdit={false} />
    );

    expect(screen.queryByRole('button')).toBeNull();
  });
});
