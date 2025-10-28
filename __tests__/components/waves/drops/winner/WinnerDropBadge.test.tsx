import { render } from '@testing-library/react';
import WinnerDropBadge from '@/components/waves/drops/winner/WinnerDropBadge';

describe('WinnerDropBadge', () => {
  it('returns null when no rank or position', () => {
    const { container } = render(<WinnerDropBadge rank={null} position={0} decisionTime={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders rank text and date', () => {
    const time = Date.now();
    const toLocaleString = jest.spyOn(Date.prototype, 'toLocaleString');
    toLocaleString.mockReturnValueOnce('Jan 1').mockReturnValueOnce('10:00 AM');
    const { getByText } = render(<WinnerDropBadge rank={2} position={1} decisionTime={time} />);
    expect(getByText('2nd')).toBeInTheDocument();
    expect(getByText('Jan 1')).toBeInTheDocument();
    expect(getByText(', 10:00 AM')).toBeInTheDocument();
    toLocaleString.mockRestore();
  });

  it('handles ordinal suffixes above third', () => {
    const { container } = render(<WinnerDropBadge rank={4} position={1} decisionTime={null} />);
    expect(container.textContent).toContain('4th');
  });
});
