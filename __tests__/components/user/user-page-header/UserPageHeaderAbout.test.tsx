import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageHeaderAbout from '../../../../components/user/user-page-header/about/UserPageHeaderAbout';
import { ApiIdentity } from '../../../../generated/models/ApiIdentity';

jest.mock('../../../../components/user/user-page-header/about/UserPageHeaderAboutStatement', () => (props: any) => (
  <div data-testid="statement">{JSON.stringify(props)}</div>
));

jest.mock('../../../../components/user/user-page-header/about/UserPageHeaderAboutEdit', () => (props: any) => (
  <div data-testid="edit" onClick={() => props.onClose()} />
));

const profile: ApiIdentity = { handle: 'alice' } as any;

describe('UserPageHeaderAbout', () => {
  it('toggles view on edit click', async () => {
    render(<UserPageHeaderAbout profile={profile} statement={null} canEdit={true} />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('edit')).toBeInTheDocument();
  });

  it('resets view when props change', () => {
    const { rerender } = render(
      <UserPageHeaderAbout profile={profile} statement={null} canEdit={true} />
    );
    rerender(
      <UserPageHeaderAbout profile={{ handle: 'bob' } as any} statement={null} canEdit={true} />
    );
    expect(screen.getByTestId('statement')).toBeInTheDocument();
  });
});
