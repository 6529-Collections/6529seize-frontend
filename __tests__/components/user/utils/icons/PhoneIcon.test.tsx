import { render } from '@testing-library/react';
import PhoneIcon from '../../../../../components/user/utils/icons/PhoneIcon';

describe('PhoneIcon', () => {
  it('renders svg element', () => {
    const { container } = render(<PhoneIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveClass('tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100 tw-align-top');
  });
});
