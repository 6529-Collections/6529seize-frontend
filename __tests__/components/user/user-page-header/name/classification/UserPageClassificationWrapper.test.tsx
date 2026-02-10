import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageClassificationWrapper from '@/components/user/user-page-header/name/classification/UserPageClassificationWrapper';

jest.mock('@/components/utils/icons/PencilIcon', () => ({
  __esModule: true,
  PencilIconSize: { SMALL: 'SMALL' },
  default: () => <span data-testid="pencil" />,
}));

jest.mock('@/components/user/user-page-header/name/classification/UserPageHeaderEditClassification', () => (props: any) => (
  <div data-testid="edit" onClick={props.onClose} />
));

jest.mock('@/components/utils/animation/CommonAnimationWrapper', () => ({ children }: any) => <div>{children}</div>);

jest.mock('@/components/utils/animation/CommonAnimationOpacity', () => ({ children, onClicked }: any) => (
  <div data-testid="opacity" onClick={onClicked}>{children}</div>
));

describe('UserPageClassificationWrapper', () => {
  it('opens and closes edit modal when button clicked', async () => {
    render(
      <UserPageClassificationWrapper profile={{} as any} canEdit={true}>
        <span data-testid="child" />
      </UserPageClassificationWrapper>
    );

    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('edit')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('edit'));
    expect(screen.queryByTestId('edit')).toBeNull();
  });
});
