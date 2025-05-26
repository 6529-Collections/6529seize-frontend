import { render, screen } from '@testing-library/react';
import AllowlistToolCsvIcon from '../../../components/allowlist-tool/icons/AllowlistToolCsvIcon';

describe('AllowlistToolCsvIcon', () => {
  it('renders svg with csv accent color', () => {
    const { container } = render(<AllowlistToolCsvIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 71 80');
    expect(svg).toHaveClass('tw-h-auto tw-w-auto tw-text-[#76bc99]');
  });
});
