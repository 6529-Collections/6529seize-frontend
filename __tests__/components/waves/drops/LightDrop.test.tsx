import { render } from '@testing-library/react';
import React from 'react';
import LightDrop from '@/components/waves/drops/LightDrop';

const dummyDrop = { id: '1' } as any;

describe('LightDrop', () => {
  it('renders placeholder skeletons', () => {
    const { container } = render(<LightDrop drop={dummyDrop} />);
    const placeholders = container.querySelectorAll('.tw-bg-iron-800');
    expect(placeholders.length).toBe(7);
  });
});
