import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageErrorWrapper from '@/components/user/utils/UserPageErrorWrapper';

describe('UserPageErrorWrapper', () => {
  it('renders children and handles close', async () => {
    const user = userEvent.setup();
    const close = jest.fn();
    render(
      <UserPageErrorWrapper closeError={close}>
        <span>content</span>
      </UserPageErrorWrapper>
    );
    expect(screen.getByText('content')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Close'));
    expect(close).toHaveBeenCalled();
  });
});
