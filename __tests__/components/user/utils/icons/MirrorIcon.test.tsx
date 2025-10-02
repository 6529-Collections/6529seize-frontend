import { render } from '@testing-library/react';
import React from 'react';
import MirrorIcon from '@/components/user/utils/icons/MirrorIcon';

describe('MirrorIcon', () => {
  it('renders svg with correct viewBox', () => {
    const { container } = render(<MirrorIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 90 90');
    const circle = svg?.querySelector('circle');
    expect(circle).toHaveAttribute('fill', '#007AFF');
  });
});
