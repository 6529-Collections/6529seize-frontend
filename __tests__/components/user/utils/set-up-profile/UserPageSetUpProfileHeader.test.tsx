import { render, screen } from '@testing-library/react';
import UserPageSetUpProfileHeader from '@/components/user/utils/set-up-profile/UserPageSetUpProfileHeader';

describe('UserPageSetUpProfileHeader', () => {
  it('renders the setup header text', () => {
    render(<UserPageSetUpProfileHeader />);
    expect(
      screen.getByText('Set up your profile in 30 seconds or less')
    ).toBeInTheDocument();
  });
});
