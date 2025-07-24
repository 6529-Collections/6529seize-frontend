import { render } from '@testing-library/react';
import AllowlistToolCsvIcon from '../../../../components/allowlist-tool/icons/AllowlistToolCsvIcon';

describe('AllowlistToolCsvIcon', () => {
  it('renders svg with expected attributes', () => {
    const { container } = render(<AllowlistToolCsvIcon />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg).toHaveAttribute('viewBox', '0 0 71 80');
    expect(svg).toHaveClass('tw-h-auto tw-w-auto tw-text-[#76bc99]');
  });
});
