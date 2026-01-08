import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageHeaderNameWrapper from '@/components/user/user-page-header/name/UserPageHeaderNameWrapper';
import type { ApiIdentity } from '@/generated/models/ApiIdentity';

jest.mock('@/components/utils/icons/PencilIcon', () => () => <span data-testid="pencil" />);
jest.mock('@/components/utils/animation/CommonAnimationWrapper', () => ({ children }: any) => <div>{children}</div>);
jest.mock('@/components/utils/animation/CommonAnimationOpacity', () => ({ children, onClicked }: any) => (
  <div data-testid="opacity" onClick={onClicked}>{children}</div>
));

jest.mock('@/components/user/user-page-header/name/UserPageHeaderEditName', () => (props: any) => (
  <div data-testid="edit" onClick={props.onClose} />
));

describe('UserPageHeaderNameWrapper', () => {
  it('opens and closes edit modal when button clicked', async () => {
    render(
      <UserPageHeaderNameWrapper profile={{} as ApiIdentity} canEdit={true}>
        <span data-testid="child" />
      </UserPageHeaderNameWrapper>
    );

    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('edit')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('edit'));
    expect(screen.queryByTestId('edit')).toBeNull();
  });
});
