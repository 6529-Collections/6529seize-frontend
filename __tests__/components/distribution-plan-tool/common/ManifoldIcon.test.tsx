import { render } from '@testing-library/react';
import React from 'react';
import ManifoldIcon from '../../../../components/distribution-plan-tool/common/ManifoldIcon';

describe('ManifoldIcon', () => {
  it('renders svg with expected attributes', () => {
    const { container } = render(<ManifoldIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 400 192');
    const path = svg?.querySelector('path');
    expect(path).toHaveAttribute('fill', 'white');
  });
});
