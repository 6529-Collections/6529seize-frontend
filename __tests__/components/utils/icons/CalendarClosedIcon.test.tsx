import { render } from '@testing-library/react';
import CalendarClosedIcon from '@/components/utils/icons/CalendarClosedIcon';

describe('CalendarClosedIcon', () => {
  it('renders svg paths and forwards className', () => {
    const { container } = render(<CalendarClosedIcon className="text-red" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveClass('text-red');
    const rect = container.querySelector('rect');
    const paths = container.querySelectorAll('path');
    expect(rect).not.toBeNull();
    expect(paths.length).toBeGreaterThan(0);
  });
});
