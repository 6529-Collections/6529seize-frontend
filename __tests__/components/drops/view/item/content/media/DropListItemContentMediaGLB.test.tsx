import { render } from '@testing-library/react';
jest.mock('@google/model-viewer', () => ({}));
import DropListItemContentMediaGLB from '../../../../../../../components/drops/view/item/content/media/DropListItemContentMediaGLB';

describe('DropListItemContentMediaGLB', () => {
  it('renders GLB component with model-viewer', () => {
    const { container } = render(<DropListItemContentMediaGLB src="model.glb" />);
    const div = container.querySelector('div');
    expect(div).toBeInTheDocument();
    expect(div).toHaveClass('tw-w-full', 'tw-h-full');
    const modelViewer = container.querySelector('model-viewer');
    expect(modelViewer).toBeInTheDocument();
  });

  it('passes src prop to MediaDisplayGLB', () => {
    const { container } = render(<DropListItemContentMediaGLB src="test.glb" />);
    const modelViewer = container.querySelector('model-viewer');
    expect(modelViewer).toHaveAttribute('src', 'test.glb');
  });
});
