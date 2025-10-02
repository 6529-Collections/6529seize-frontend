import { render } from '@testing-library/react';
import BellIcon from '@/components/common/icons/BellIcon';

describe('BellIcon', () => {
  it('renders svg with given class and attributes', () => {
    const { container } = render(<BellIcon className="ring" />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveClass('ring');
    expect(svg.getAttribute('stroke-width')).toBe('1.65');
  });

  it('contains correct path definition', () => {
    const { container } = render(<BellIcon />);
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path?.getAttribute('stroke-linecap')).toBe('round');
    expect(path?.getAttribute('stroke-linejoin')).toBe('round');
    expect(path?.getAttribute('d')).toContain('17.082');
  });
});
