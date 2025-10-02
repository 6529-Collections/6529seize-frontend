import { render } from '@testing-library/react';
import RateClapOutlineIcon from '@/components/utils/icons/RateClapOutlineIcon';

describe('RateClapOutlineIcon', () => {
  it('renders svg element', () => {
    const { container } = render(<RateClapOutlineIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 350 364');
  });
});
