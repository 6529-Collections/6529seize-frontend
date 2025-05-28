import { render } from '@testing-library/react';
import UserCICAccurateIcon from '../../../../../../components/user/utils/user-cic-type/icons/UserCICAccurateIcon';

describe('UserCICAccurateIcon', () => {
  it('renders svg icon with expected viewBox', () => {
    const { container } = render(<UserCICAccurateIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 183 183');
  });
});
