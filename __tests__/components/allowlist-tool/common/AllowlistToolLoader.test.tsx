import { render, screen } from '@testing-library/react';
import AllowlistToolLoader, {
  AllowlistToolLoaderSize,
} from '../../../../components/allowlist-tool/common/AllowlistToolLoader';

describe('AllowlistToolLoader', () => {
  it('renders with default small size', () => {
    render(<AllowlistToolLoader />);
    const svg = screen.getByRole('status', { hidden: true });
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveClass('tw-inline', 'tw-text-primary-400', 'tw-animate-spin', 'tw-w-5', 'tw-h-5');
  });

  it.each([
    [AllowlistToolLoaderSize.SMALL, 'tw-w-5 tw-h-5'],
    [AllowlistToolLoaderSize.MEDIUM, 'tw-w-10 tw-h-10'],
    [AllowlistToolLoaderSize.LARGE, 'tw-w-20 tw-h-20'],
  ])('applies correct classes for %s size', (size, expectedClasses) => {
    render(<AllowlistToolLoader size={size} />);
    const svg = screen.getByRole('status', { hidden: true });
    expectedClasses.split(' ').forEach(cls => {
      expect(svg).toHaveClass(cls);
    });
  });
});
