import { render, screen } from '@testing-library/react';
import React from 'react';
import FoundationIcon from '@/components/user/utils/icons/FoundationIcon';

describe('FoundationIcon', () => {
  it('renders img with alt text', () => {
    render(<FoundationIcon />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/foundation-icon.jpg');
    expect(img).toHaveAttribute('alt', 'Foundation App');
  });
});
