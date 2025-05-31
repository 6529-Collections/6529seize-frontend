import { render, screen } from '@testing-library/react';
import UserPageRepHeader from '../../../../../components/user/rep/header/UserPageRepHeader';

describe('UserPageRepHeader', () => {
  it('shows rep totals when provided', () => {
    const repRates = {
      total_rep_rating: 1500,
      number_of_raters: 25,
    } as any;
    render(<UserPageRepHeader repRates={repRates} />);
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('renders empty values without repRates', () => {
    const { container } = render(<UserPageRepHeader repRates={null} />);
    expect(container).toHaveTextContent('Rep:');
  });
});
