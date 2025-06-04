import { render } from '@testing-library/react';
import React from 'react';
import WeChatIcon from '../../../../../components/user/utils/icons/WeChatIcon';

describe('WeChatIcon', () => {
  it('renders svg with green fill', () => {
    const { container } = render(<WeChatIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const path = svg?.querySelector('path');
    expect(path).toHaveAttribute('fill', '#00C327');
  });
});
