import { render } from '@testing-library/react';
import React from 'react';
import LinkedInIcon from '../../../../../components/user/utils/icons/LinkedInIcon';

describe('LinkedInIcon', () => {
  it('renders svg with correct attributes', () => {
    const { container } = render(<LinkedInIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 90 90');
    expect(svg).toHaveClass('tw-w-full tw-h-full tw-align-top');
    const path = svg?.querySelector('path');
    expect(path).toHaveAttribute('fill', '#2867B2');
  });
});
