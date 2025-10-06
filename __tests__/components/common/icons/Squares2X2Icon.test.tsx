import { render } from '@testing-library/react';
import Squares2X2Icon from '@/components/common/icons/Squares2X2Icon';

describe('Squares2X2Icon', () => {
  it('renders svg with given class and attributes', () => {
    const { container } = render(<Squares2X2Icon className="cls" />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveClass('cls');
    expect(svg.getAttribute('stroke-width')).toBe('1.65');
  });

  it('has correct path details', () => {
    const { container } = render(<Squares2X2Icon />);
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path?.getAttribute('stroke-linecap')).toBe('round');
    expect(path?.getAttribute('stroke-linejoin')).toBe('round');
    expect(path?.getAttribute('d')).toContain('M16.5 8.25');
  });
});
