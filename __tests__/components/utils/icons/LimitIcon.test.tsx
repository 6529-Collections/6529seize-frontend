import { render } from '@testing-library/react';
import LimitIcon from '../../../../components/utils/icons/LimitIcon';

describe('LimitIcon', () => {
  it('renders svg with className', () => {
    const { container } = render(<LimitIcon className="test-class" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('test-class');
  });
});
