import { render } from '@testing-library/react';
import ClockIcon from '@/components/utils/icons/ClockIcon';

describe('ClockIcon', () => {
  it('renders svg with viewBox and class', () => {
    const { container } = render(<ClockIcon className="text-blue" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveClass('text-blue');
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(2);
  });
});
