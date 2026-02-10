import { render } from '@testing-library/react';
import UserCICInaccurateIcon from '@/components/user/utils/user-cic-type/icons/UserCICInaccurateIcon';
import UserCICUnknownIcon from '@/components/user/utils/user-cic-type/icons/UserCICUnknownIcon';

describe('User CIC Icons', () => {
  it('renders the inaccurate icon svg correctly', () => {
    const { container } = render(<UserCICInaccurateIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 187 187');
    expect(container.querySelectorAll('path').length).toBeGreaterThan(0);
  });

  it('renders the unknown icon svg correctly', () => {
    const { container } = render(<UserCICUnknownIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 183 183');
    expect(container.querySelectorAll('path').length).toBeGreaterThan(0);
  });
});
