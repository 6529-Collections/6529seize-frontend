import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageHeaderAboutEditError from '../../../../components/user/user-page-header/about/UserPageHeaderAboutEditError';

describe('UserPageHeaderAboutEditError', () => {
  it('detects known error types', () => {
    render(
      <UserPageHeaderAboutEditError
        msg="contains personal insults"
        closeError={jest.fn()}
      />
    );
    expect(screen.getByText('Error: Personal Insults')).toBeInTheDocument();
  });

  it('handles unknown errors and close click', async () => {
    const close = jest.fn();
    render(<UserPageHeaderAboutEditError msg="something" closeError={close} />);
    expect(screen.getByText('Unknown Error')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button'));
    expect(close).toHaveBeenCalled();
  });
});
