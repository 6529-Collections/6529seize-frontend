import { render } from '@testing-library/react';
import React from 'react';
import PhoneIcon from '@/components/user/utils/icons/PhoneIcon';

describe('PhoneIcon', () => {
  it('renders svg element', () => {
    const { container } = render(<PhoneIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });
});
