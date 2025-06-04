import { render } from '@testing-library/react';
import React from 'react';
import RedditIcon from '../../../../../components/user/utils/icons/RedditIcon';

describe('RedditIcon', () => {
  it('renders svg with correct attributes', () => {
    const { container } = render(<RedditIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 90 90');
    expect(svg).toHaveClass('tw-w-full tw-h-full tw-align-top');
    const path = svg?.querySelector('path');
    expect(path).toHaveAttribute('fill', '#FF4500');
  });
});
