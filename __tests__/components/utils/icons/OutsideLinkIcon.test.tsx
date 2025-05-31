import { render } from '@testing-library/react';
import OutsideLinkIcon from '../../../../components/utils/icons/OutsideLinkIcon';

describe('OutsideLinkIcon', () => {
  it('renders svg with expected attributes', () => {
    const { container } = render(<OutsideLinkIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    const cls = svg?.getAttribute('class') || '';
    expect(cls).toContain('tw-flex-shrink-0');
  });
});
