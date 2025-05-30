import { render, screen } from '@testing-library/react';
import React from 'react';
import OnCyberIcon from '../../../../../components/user/utils/icons/OnCyberIcon';

describe('OnCyberIcon', () => {
  it('renders img with expected attributes', () => {
    render(<OnCyberIcon />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/OnCyber-Icon.jpg');
    expect(img).toHaveAttribute('alt', 'OnCyber');
  });
});
