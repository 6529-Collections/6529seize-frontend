import { render } from '@testing-library/react';
import PermissionIcon from '../../../../components/utils/icons/PermissionIcon';

describe('PermissionIcon', () => {
  it('renders svg with provided class', () => {
    const { container } = render(<PermissionIcon className="test-class" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('test-class');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('renders default without class', () => {
    const { container } = render(<PermissionIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('class')).toBe('');
  });
});
