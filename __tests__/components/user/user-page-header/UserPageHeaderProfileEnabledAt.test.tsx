import { render, screen } from '@testing-library/react';
import UserPageHeaderProfileEnabledAt from '@/components/user/user-page-header/UserPageHeaderProfileEnabledAt';

jest.mock('@/helpers/Helpers', () => ({
  ...jest.requireActual('../../../../helpers/Helpers'),
  formatTimestampToMonthYear: jest.fn(() => 'January 2024'),
}));

describe('UserPageHeaderProfileEnabledAt', () => {
  it('renders formatted date when value provided', () => {
    render(
      <UserPageHeaderProfileEnabledAt profileEnabledAt="2024-01-01T00:00:00Z" />
    );

    expect(
      screen.getByText('Profile Enabled: January 2024')
    ).toBeInTheDocument();
  });

  it('renders nothing when no value', () => {
    const { container } = render(
      <UserPageHeaderProfileEnabledAt profileEnabledAt={null} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
