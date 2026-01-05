import { render } from '@testing-library/react';
import WavesIcon from '@/components/common/icons/WavesIcon';

describe('WavesIcon', () => {
  it('renders svg with class and viewBox', () => {
    const { container } = render(<WavesIcon className="wave" />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 512 512');
    expect(svg).toHaveClass('wave');
  });

  it('renders three path elements with expected attributes', () => {
    const { container } = render(<WavesIcon />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(3);
    expect(paths[0]).toHaveAttribute('fill', 'none');
    expect(paths[0]?.getAttribute('d')).toContain('M397.9');
    expect(paths[1]).toHaveAttribute('fill', 'none');
    expect(paths[1]?.getAttribute('d')).toContain('M436.9');
    expect(paths[2]).toHaveAttribute('fill', 'currentColor');
  });
});
