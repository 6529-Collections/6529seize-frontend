import { render } from '@testing-library/react';
import React from 'react';
import DropNotFound from '@/components/waves/drops/DropNotFound';

describe('DropNotFound', () => {
  it('renders not found text', () => {
    const { getByText } = render(<DropNotFound />);
    expect(getByText('Drop not found')).toBeInTheDocument();
  });
});
