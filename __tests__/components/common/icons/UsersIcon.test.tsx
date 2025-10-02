import { render } from '@testing-library/react';
import UsersIcon from '@/components/common/icons/UsersIcon';

describe('UsersIcon', () => {
  it('renders svg with class and attributes', () => {
    const { container } = render(<UsersIcon className="icon" />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveClass('icon');
    expect(svg.getAttribute('stroke-width')).toBe('1.65');
  });

  it('contains expected path data', () => {
    const { container } = render(<UsersIcon />);
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path?.getAttribute('stroke-linecap')).toBe('round');
    expect(path?.getAttribute('stroke-linejoin')).toBe('round');
    expect(path?.getAttribute('d')).toContain('A12.318');
  });
});
