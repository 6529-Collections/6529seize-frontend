import { render, screen } from '@testing-library/react';
import DropLoading from '../../../components/waves/drops/DropLoading';

test('shows loading state', () => {
  render(<DropLoading />);
  expect(screen.getByText('Loading...', { selector: 'p' })).toBeInTheDocument();
});
