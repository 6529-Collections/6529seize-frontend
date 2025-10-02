import { render } from '@testing-library/react';
import HomeIcon from '@/components/common/icons/HomeIcon';

describe('HomeIcon', () => {
  it('renders svg with provided class and attributes', () => {
    const { container } = render(<HomeIcon className="test-class" />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveClass('test-class');
    expect(svg.getAttribute('stroke-width')).toBe('1.65');
  });

  it('contains the expected path data', () => {
    const { container } = render(<HomeIcon />);
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path?.getAttribute('stroke-linecap')).toBe('round');
    expect(path?.getAttribute('stroke-linejoin')).toBe('round');
    expect(path?.getAttribute('d')).toContain('m2.25 12');
  });
});
