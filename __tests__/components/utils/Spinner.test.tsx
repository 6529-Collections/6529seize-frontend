import { render } from '@testing-library/react';
import Spinner from '@/components/utils/Spinner';

describe('Spinner', () => {
  it('renders svg with expected class', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('class', expect.stringContaining('tw-animate-spin'));
  });
});
