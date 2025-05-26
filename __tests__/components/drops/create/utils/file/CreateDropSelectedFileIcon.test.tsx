import { render } from '@testing-library/react';
import CreateDropSelectedFileIcon from '../../../../../../components/drops/create/utils/file/CreateDropSelectedFileIcon';

describe('CreateDropSelectedFileIcon', () => {
  function renderIcon(type: string) {
    const file = new File([''], `test.${type}`, { type: `${type}/${type}` });
    return render(<CreateDropSelectedFileIcon file={file} />);
  }

  it('renders image icon for image files', () => {
    const { container } = renderIcon('image');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders video icon for video files', () => {
    const { container } = renderIcon('video');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders audio icon for audio files', () => {
    const { container } = renderIcon('audio');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders nothing for unsupported files', () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' });
    const { container } = render(<CreateDropSelectedFileIcon file={file} />);
    expect(container.firstChild).toBeNull();
  });
});
