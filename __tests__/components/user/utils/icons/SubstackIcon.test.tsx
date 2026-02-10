import { render } from '@testing-library/react';
import React from 'react';
import SubstackIcon from '@/components/user/utils/icons/SubstackIcon';

describe('SubstackIcon', () => {
  it('renders circle with orange fill', () => {
    const { container } = render(<SubstackIcon />);
    const circle = container.querySelector('circle');
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute('fill', '#FF6719');
  });
});
