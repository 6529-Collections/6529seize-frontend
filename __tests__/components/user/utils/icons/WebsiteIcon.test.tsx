import { render } from '@testing-library/react';
import WebsiteIcon from '../../../../../components/user/utils/icons/WebsiteIcon';

describe('WebsiteIcon', () => {
  it('renders svg with correct attributes', () => {
    const { container } = render(<WebsiteIcon />);
    const svg = container.querySelector('svg');
    const path = container.querySelector('path');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('stroke', 'currentColor');
  });
});
