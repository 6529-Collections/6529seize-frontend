import LinkIcon from '@/components/user/utils/icons/LinkIcon';
import { render } from '@testing-library/react';

describe('LinkIcon', () => {
  it('renders svg with correct attributes', () => {
    const { container } = render(<LinkIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveClass('tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-iron-100 tw-align-top');
  });
});
