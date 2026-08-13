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

  it('aligns the icon, message, and touch-sized dismiss control', () => {
    render(
      <UserPageErrorWrapper closeError={jest.fn()} fullWidth>
        <h3 className="tw-leading-5">Message title</h3>
      </UserPageErrorWrapper>
    );

    const alert = screen.getByRole('alert');
    const dismiss = screen.getByRole('button', { name: 'Close' });

    expect(alert).toHaveClass('tw-grid', 'tw-items-start');
    expect(alert).not.toHaveClass('md:tw-w-auto');
    expect(alert.querySelector('svg')).toHaveClass('tw-size-5');
    expect(dismiss).toHaveClass('tw-size-11');
  });
});
