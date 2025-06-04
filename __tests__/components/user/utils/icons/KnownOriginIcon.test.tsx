import { render, screen } from '@testing-library/react';
import React from 'react';
import KnownOriginIcon from '../../../../../components/user/utils/icons/KnownOriginIcon';

describe('KnownOriginIcon', () => {
  it('renders img with correct attributes', () => {
    render(<KnownOriginIcon />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/KnownOrigin-icon.jpg');
    expect(img).toHaveAttribute('alt', 'KnownOrigin');
  });
});

