import { render } from '@testing-library/react';
import AllowlistToolJsonIcon from '../../../../components/allowlist-tool/icons/AllowlistToolJsonIcon';

describe('AllowlistToolJsonIcon', () => {
  it('renders svg with expected attributes', () => {
    const { container } = render(<AllowlistToolJsonIcon />);
    const svg = container.querySelector('svg') as SVGElement;
    expect(svg).toHaveAttribute('viewBox', '0 0 71 80');
    expect(svg).toHaveClass('tw-h-auto tw-w-auto tw-text-[#e8c250]');
  });
});
