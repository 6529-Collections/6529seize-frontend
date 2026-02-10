import { render } from '@testing-library/react';
import UserCICHighlyAccurateIcon from '@/components/user/utils/user-cic-type/icons/UserCICHighlyAccurateIcon';

describe('UserCICHighlyAccurateIcon', () => {
  it('renders svg icon', () => {
    const { container } = render(<UserCICHighlyAccurateIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 183 183');
  });
});
