import { render } from '@testing-library/react';
import React from 'react';
import WeiboIcon from '../../../../../components/user/utils/icons/WeiboIcon';

describe('WeiboIcon', () => {
  it('renders svg with red fill', () => {
    const { container } = render(<WeiboIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const path = svg?.querySelector('path');
    expect(path).toHaveAttribute('fill', '#E22829');
  });
});
