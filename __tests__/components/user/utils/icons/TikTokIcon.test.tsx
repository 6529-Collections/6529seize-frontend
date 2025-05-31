import { render } from '@testing-library/react';
import React from 'react';
import TikTokIcon from '../../../../../components/user/utils/icons/TikTokIcon';

describe('TikTokIcon', () => {
  it('renders svg with correct attributes', () => {
    const { container } = render(<TikTokIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 90 90');
    expect(svg).toHaveClass('tw-w-full tw-h-full tw-rounded-full tw-ring-1 tw-ring-white/20 tw-align-top');
  });
});
