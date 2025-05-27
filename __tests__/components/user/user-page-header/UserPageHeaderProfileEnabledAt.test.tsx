import { render, screen } from '@testing-library/react';
import UserPageHeaderProfileEnabledAt from '../../../../components/user/user-page-header/UserPageHeaderProfileEnabledAt';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('../../../../services/api/common-api', () => ({
  commonApiFetch: jest.fn(),
}));

const { useQuery } = require('@tanstack/react-query');
const { commonApiFetch } = require('../../../../services/api/common-api');

describe('UserPageHeaderProfileEnabledAt', () => {
  it('renders formatted date when data present', () => {
    (useQuery as jest.Mock).mockImplementation(({ queryFn }) => {
      (commonApiFetch as jest.Mock).mockResolvedValue({ data: [{ created_at: '2024-01-01T00:00:00Z' }] });
      queryFn();
      return { data: { data: [{ created_at: '2024-01-01T00:00:00Z' }] } };
    });

    render(<UserPageHeaderProfileEnabledAt handleOrWallet="alice" />);

    expect(commonApiFetch).toHaveBeenCalled();
    expect(screen.getByText('Profile Enabled: January 2024')).toBeInTheDocument();
  });

});
