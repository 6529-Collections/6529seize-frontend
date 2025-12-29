import { render, screen } from '@testing-library/react';
import UnreadDivider from '@/components/drops/view/UnreadDivider';

describe('UnreadDivider', () => {
  it('renders with default label', () => {
    render(<UnreadDivider />);
    expect(screen.getByText('New Messages')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<UnreadDivider label="Unread Items" />);
    expect(screen.getByText('Unread Items')).toBeInTheDocument();
  });

  it('renders horizontal lines', () => {
    const { container } = render(<UnreadDivider />);
    const lines = container.querySelectorAll(String.raw`.tw-h-0\.5.tw-bg-rose-500`);
    expect(lines.length).toBe(2);
  });
});

