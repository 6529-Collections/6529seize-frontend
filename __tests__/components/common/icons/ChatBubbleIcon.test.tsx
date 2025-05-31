import { render } from '@testing-library/react';
import ChatBubbleIcon from '../../../../components/common/icons/ChatBubbleIcon';

describe('ChatBubbleIcon', () => {
  it('renders svg with class and stroke width', () => {
    const { container } = render(<ChatBubbleIcon className="foo" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('foo');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg?.getAttribute('stroke-width')).toBe('1.65');
  });

  it('renders expected path data', () => {
    const { container } = render(<ChatBubbleIcon />);
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path?.getAttribute('stroke-linecap')).toBe('round');
    expect(path?.getAttribute('stroke-linejoin')).toBe('round');
    expect(path?.getAttribute('d')).toContain('M7.5 8.25h9');
  });
});
