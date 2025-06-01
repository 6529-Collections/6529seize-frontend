import { render } from '@testing-library/react';
import WeiboIcon from '../../../../../components/user/utils/icons/WeiboIcon';

describe('WeiboIcon', () => {
  it('renders svg element', () => {
    const { container } = render(<WeiboIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 90 90');
  });
});
