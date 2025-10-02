import { render } from '@testing-library/react';
import React from 'react';
import YoutubeIcon from '@/components/user/utils/icons/YoutubeIcon';

describe('YoutubeIcon', () => {
  it('renders svg with play button', () => {
    const { container } = render(<YoutubeIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 90 90');
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
  });
});
