import { render, screen } from '@testing-library/react';
import AllowlistToolLoader, { AllowlistToolLoaderSize } from '../../../../components/allowlist-tool/common/AllowlistToolLoader';

describe('AllowlistToolLoader', () => {
  it('uses small size by default', () => {
    render(<AllowlistToolLoader />);
    const svg = screen.getByRole('status', { hidden: true });
    expect(svg).toHaveClass('tw-w-5 tw-h-5');
  });

  it('applies large size class', () => {
    render(<AllowlistToolLoader size={AllowlistToolLoaderSize.LARGE} />);
    const svg = screen.getByRole('status', { hidden: true });
    expect(svg).toHaveClass('tw-w-20 tw-h-20');
  });
});
