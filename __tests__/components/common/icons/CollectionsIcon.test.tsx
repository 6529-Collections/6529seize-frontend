import { render } from '@testing-library/react';
import CollectionsIcon from '@/components/common/icons/CollectionsIcon';

describe('CollectionsIcon', () => {
  it('renders svg with given class and attributes', () => {
    const { container } = render(<CollectionsIcon className="cls" />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveClass('cls');
    expect(svg.getAttribute('stroke-width')).toBe('1.65');
  });

  it('has correct path details', () => {
    const { container } = render(<CollectionsIcon />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0]).toHaveAttribute('d');
  });
});
