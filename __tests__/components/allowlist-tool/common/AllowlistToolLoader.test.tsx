import { render, screen } from '@testing-library/react';
import AllowlistToolLoader, { AllowlistToolLoaderSize } from '../../../../components/allowlist-tool/common/AllowlistToolLoader';

describe('AllowlistToolLoader', () => {
  it('renders with default small size', () => {
    render(<AllowlistToolLoader />);
    const svg = screen.getByRole('status', { hidden: true });
    expect(svg).toHaveClass('tw-w-5 tw-h-5');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders with medium size', () => {
    render(<AllowlistToolLoader size={AllowlistToolLoaderSize.MEDIUM} />);
    const svg = screen.getByRole('status', { hidden: true });
    expect(svg).toHaveClass('tw-w-10 tw-h-10');
  });

  it('renders with large size', () => {
    render(<AllowlistToolLoader size={AllowlistToolLoaderSize.LARGE} />);
    const svg = screen.getByRole('status', { hidden: true });
    expect(svg).toHaveClass('tw-w-20 tw-h-20');
  });
});
