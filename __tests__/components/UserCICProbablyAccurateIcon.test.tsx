import { render } from '@testing-library/react';
import UserCICProbablyAccurateIcon from '@/components/user/utils/user-cic-type/icons/UserCICProbablyAccurateIcon';

describe('UserCICProbablyAccurateIcon', () => {
  it('renders svg with expected elements', () => {
    const { container } = render(<UserCICProbablyAccurateIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 183 183');
    // should contain an ellipse with specific fill
    const ellipse = container.querySelector('ellipse');
    expect(ellipse).toBeInTheDocument();
    expect(ellipse).toHaveAttribute('fill', '#0A0A0A');
    // there should be multiple path elements
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0]).toHaveAttribute('fill', '#73E2A3');
  });
});
