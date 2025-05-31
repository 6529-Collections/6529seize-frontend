import { render } from '@testing-library/react';
import DropListItemContentMediaGLB from '../../../../../../../components/drops/view/item/content/media/DropListItemContentMediaGLB';

describe('DropListItemContentMediaGLB', () => {
  it('renders an empty div for any src', () => {
    const { container } = render(<DropListItemContentMediaGLB src="model.glb" />);
    const div = container.querySelector('div');
    expect(div).toBeInTheDocument();
    expect(div?.childElementCount).toBe(0);
  });

  it('ignores the src prop but does not throw', () => {
    const { container } = render(<DropListItemContentMediaGLB src="anything.glb" />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });
});
