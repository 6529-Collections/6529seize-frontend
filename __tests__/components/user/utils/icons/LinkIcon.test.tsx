import { render } from '@testing-library/react';
import React from 'react';
import LinkIcon from '../../../../../components/user/utils/icons/LinkIcon';

describe('LinkIcon', () => {
  it('renders svg with correct attributes', () => {
    const { container } = render(<LinkIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveClass('tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-neutral-100 tw-align-top');
  });
});
