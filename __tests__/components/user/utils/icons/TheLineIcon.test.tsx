import { render, screen } from '@testing-library/react';
import React from 'react';
import TheLineIcon from '@/components/user/utils/icons/TheLineIcon';

describe('TheLineIcon', () => {
  it('renders img with expected attributes', () => {
    render(<TheLineIcon />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/OnCyber-Icon.jpg');
    expect(img).toHaveAttribute('alt', 'OnCyber');
    expect(img).toHaveClass('tw-ring-1');
  });
});
