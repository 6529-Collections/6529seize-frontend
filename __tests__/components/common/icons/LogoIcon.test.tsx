import { render } from '@testing-library/react';
import LogoIcon from '@/components/common/icons/LogoIcon';

describe('LogoIcon', () => {
  it('renders svg with viewBox and custom class', () => {
    const { container } = render(<LogoIcon className="brand" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 1920 1920');
    expect(svg).toHaveClass('brand');
  });

  it('contains polygon and path elements', () => {
    const { container } = render(<LogoIcon />);
    const polygon = container.querySelector('polygon');
    const paths = container.querySelectorAll('path');
    expect(polygon).toBeInTheDocument();
    expect(paths.length).toBeGreaterThan(1);
    expect(paths[0].getAttribute('fill')).toBe('currentColor');
  });
});
