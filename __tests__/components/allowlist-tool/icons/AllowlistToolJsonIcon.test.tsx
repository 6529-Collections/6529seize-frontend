import { render } from '@testing-library/react';
import AllowlistToolJsonIcon from '../../../../components/allowlist-tool/icons/AllowlistToolJsonIcon';

describe('AllowlistToolJsonIcon', () => {
  it('renders svg with correct classes', () => {
    const { container } = render(<AllowlistToolJsonIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('tw-h-auto tw-w-auto tw-text-[#e8c250]');
  });
});
