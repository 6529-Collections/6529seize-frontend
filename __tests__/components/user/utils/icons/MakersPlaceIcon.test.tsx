import { render } from '@testing-library/react';
import React from 'react';
import MakersPlaceIcon from '@/components/user/utils/icons/MakersPlaceIcon';

describe('MakersPlaceIcon', () => {
  it('renders img with correct attributes', () => {
    const { container } = render(<MakersPlaceIcon />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', '/Makersplace-icon.jpg');
    expect(img).toHaveAttribute('alt', 'Makersplace');
    expect(img).toHaveClass('tw-ring-1');
  });
});
