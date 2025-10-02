import { render } from '@testing-library/react';
import React from 'react';
import InstagramIcon from '@/components/user/utils/icons/InstagramIcon';

describe('InstagramIcon', () => {
  it('renders svg element', () => {
    const { container } = render(<InstagramIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 90 90');
  });
});

