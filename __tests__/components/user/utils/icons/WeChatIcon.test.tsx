import { render } from '@testing-library/react';
import WeChatIcon from '../../../../../components/user/utils/icons/WeChatIcon';

describe('WeChatIcon', () => {
  it('renders svg element', () => {
    const { container } = render(<WeChatIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 90 90');
  });
});
