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

  it('includes AR, auto-rotate and camera controls', () => {
    const { container } = render(<MediaDisplayGLB src="asset.glb" />);
    const el = container.querySelector('model-viewer');
    expect(el).toHaveAttribute('ar');
    expect(el).toHaveAttribute('auto-rotate');
    expect(el).toHaveAttribute('camera-controls');
  });
});
