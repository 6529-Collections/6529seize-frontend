import { render, screen } from '@testing-library/react';
import UnreadDivider from '@/components/drops/view/UnreadDivider';

describe('UnreadDivider', () => {
  it('renders with default label', () => {
    render(<UnreadDivider serialNo={42} />);
    expect(screen.getByText('New Messages')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<UnreadDivider serialNo={42} label="Unread Items" />);
    expect(screen.getByText('Unread Items')).toBeInTheDocument();
  });

  it('renders horizontal lines', () => {
    const { container } = render(<UnreadDivider serialNo={42} />);
    const lines = container.querySelectorAll(String.raw`.tw-h-0\.5.tw-bg-indigo-500`);
    expect(lines.length).toBe(2);
  });
});
