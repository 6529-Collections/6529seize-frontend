import { render } from '@testing-library/react';
import PermissionIcon from '@/components/utils/icons/PermissionIcon';

describe('PermissionIcon', () => {
  it('renders svg with correct viewBox and default props', () => {
    const { container } = render(<PermissionIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
  });

  it('applies custom className', () => {
    const customClass = 'text-blue-500 w-6 h-6';
    const { container } = render(<PermissionIcon className={customClass} />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveClass(customClass);
  });

  it('applies default empty className when none provided', () => {
    const { container } = render(<PermissionIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('class', '');
  });

  it('renders lock icon structure correctly', () => {
    const { container } = render(<PermissionIcon />);
    
    // Check for lock body (rectangle)
    const rect = container.querySelector('rect');
    expect(rect).toBeInTheDocument();
    expect(rect).toHaveAttribute('x', '5');
    expect(rect).toHaveAttribute('y', '11');
    expect(rect).toHaveAttribute('width', '14');
    expect(rect).toHaveAttribute('height', '10');
    expect(rect).toHaveAttribute('rx', '2');
    expect(rect).toHaveAttribute('stroke', 'currentColor');
    expect(rect).toHaveAttribute('stroke-width', '1.5');

    // Check for lock shackle (path)
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('d', 'M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11');
    expect(path).toHaveAttribute('stroke', 'currentColor');
    expect(path).toHaveAttribute('stroke-width', '1.5');

    // Check for keyhole (circle)
    const circle = container.querySelector('circle');
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute('cx', '12');
    expect(circle).toHaveAttribute('cy', '16');
    expect(circle).toHaveAttribute('r', '1');
    expect(circle).toHaveAttribute('fill', 'currentColor');
  });

  it('uses currentColor for all strokes and fills', () => {
    const { container } = render(<PermissionIcon />);
    
    const rect = container.querySelector('rect');
    const path = container.querySelector('path');
    const circle = container.querySelector('circle');
    
    expect(rect).toHaveAttribute('stroke', 'currentColor');
    expect(path).toHaveAttribute('stroke', 'currentColor');
    expect(circle).toHaveAttribute('fill', 'currentColor');
  });

  it('has appropriate stroke properties for accessibility', () => {
    const { container } = render(<PermissionIcon />);
    
    const rect = container.querySelector('rect');
    const path = container.querySelector('path');
    
    expect(rect).toHaveAttribute('stroke-linecap', 'round');
    expect(rect).toHaveAttribute('stroke-linejoin', 'round');
    expect(path).toHaveAttribute('stroke-linecap', 'round');
    expect(path).toHaveAttribute('stroke-linejoin', 'round');
  });

  it('is accessible with aria-hidden attribute', () => {
    const { container } = render(<PermissionIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders exactly one of each element type', () => {
    const { container } = render(<PermissionIcon />);
    
    expect(container.querySelectorAll('rect')).toHaveLength(1);
    expect(container.querySelectorAll('path')).toHaveLength(1);
    expect(container.querySelectorAll('circle')).toHaveLength(1);
  });
});
