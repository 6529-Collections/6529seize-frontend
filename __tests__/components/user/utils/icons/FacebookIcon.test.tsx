import { render } from '@testing-library/react';
import React from 'react';
import FacebookIcon from '../../../../../components/user/utils/icons/FacebookIcon';

describe('FacebookIcon', () => {
  it('renders svg with viewBox', () => {
    const { container } = render(<FacebookIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 90 90');
  });
});

