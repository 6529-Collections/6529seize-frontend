import React from 'react';
import { render } from '@testing-library/react';
import AllowlistToolLoader, { AllowlistToolLoaderSize } from '../../../components/allowlist-tool/common/AllowlistToolLoader';

describe('AllowlistToolLoader', () => {
  it('renders small loader by default', () => {
    const { container } = render(<AllowlistToolLoader />);
    expect(container.querySelector('svg')).toHaveClass('tw-w-5 tw-h-5');
  });

  it('renders loader with provided size', () => {
    const { container } = render(<AllowlistToolLoader size={AllowlistToolLoaderSize.LARGE} />);
    expect(container.querySelector('svg')).toHaveClass('tw-w-20 tw-h-20');
  });

  it('exposes expected enum values', () => {
    expect(AllowlistToolLoaderSize.SMALL).toBe('SMALL');
    expect(AllowlistToolLoaderSize.MEDIUM).toBe('MEDIUM');
    expect(AllowlistToolLoaderSize.LARGE).toBe('LARGE');
  });
});
