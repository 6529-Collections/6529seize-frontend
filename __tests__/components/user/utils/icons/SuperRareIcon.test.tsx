import { render } from '@testing-library/react';
import React from 'react';
import SuperRareIcon from '@/components/user/utils/icons/SuperRareIcon';

describe('SuperRareIcon', () => {
  it('renders svg with correct attributes', () => {
    const { container } = render(<SuperRareIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 90 90');
    expect(svg).toHaveClass('tw-w-full tw-h-full d-flex align-items-center tw-align-top');
  });
});
