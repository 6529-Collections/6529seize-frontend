import { render } from '@testing-library/react';
import CsvIcon from '@/components/distribution-plan-tool/common/CsvIcon';

describe('CsvIcon', () => {
  it('renders svg with expected attributes', () => {
    const { container } = render(<CsvIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 71 80');
    expect(svg).toHaveClass('tw-h-auto tw-w-auto tw-text-[#76bc99]');
  });

  it('contains a path element filled with currentColor', () => {
    const { container } = render(<CsvIcon />);
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path?.getAttribute('fill')).toBe('currentColor');
    expect(path?.getAttribute('d')).toContain('66.37');
  });
});
