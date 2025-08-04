import { render } from '@testing-library/react';
jest.mock('@google/model-viewer', () => ({}));
import MediaDisplayGLB from '../../../../../../../components/drops/view/item/content/media/MediaDisplayGLB';

describe('MediaDisplayGLB', () => {
  it('renders model-viewer with provided src', () => {
    const { container } = render(<MediaDisplayGLB src="model.glb" />);
    const el = container.querySelector('model-viewer');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('src', 'model.glb');
  });

  it('includes auto-rotate and disable-pan attributes', () => {
    const { container } = render(<MediaDisplayGLB src="asset.glb" />);
    const el = container.querySelector('model-viewer');
    expect(el).toHaveAttribute('auto-rotate');
    expect(el).toHaveAttribute('disable-pan');
    expect(el).not.toHaveAttribute('camera-controls'); // Added dynamically via JS
  });

  it('shows 3D cube button by default', () => {
    const { container } = render(<MediaDisplayGLB src="asset.glb" />);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Enable 3D controls');
  });

  it('hides 3D cube button when disableMediaInteractions is true', () => {
    const { container } = render(<MediaDisplayGLB src="asset.glb" disableMediaInteractions={true} />);
    const button = container.querySelector('button');
    expect(button).not.toBeInTheDocument();
  });
});
