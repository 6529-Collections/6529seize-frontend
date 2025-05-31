import React from 'react';
import { render } from '@testing-library/react';
import CreateDropSelectedFilePreview from '../../../../../../components/drops/create/utils/file/CreateDropSelectedFilePreview';

beforeAll(() => {
  (global as any).URL.createObjectURL = jest.fn(() => 'blob:preview');
});

describe('CreateDropSelectedFilePreview', () => {
  it('renders image preview', () => {
    const file = new File(['a'], 'img.png', { type: 'image/png' });
    const { container } = render(<CreateDropSelectedFilePreview file={file} />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'blob:preview');
  });

  it('renders video preview', () => {
    const file = new File(['a'], 'vid.mp4', { type: 'video/mp4' });
    const { container } = render(<CreateDropSelectedFilePreview file={file} />);
    expect(container.querySelector('video')).toBeInTheDocument();
  });

  it('renders audio preview', () => {
    const file = new File(['a'], 'sound.mp3', { type: 'audio/mpeg' });
    const { container } = render(<CreateDropSelectedFilePreview file={file} />);
    expect(container.querySelector('audio')).toBeInTheDocument();
  });

  it('renders nothing for unknown type', () => {
    const file = new File(['a'], 'file.bin', { type: 'application/octet-stream' });
    const { container } = render(<CreateDropSelectedFilePreview file={file} />);
    expect(container.querySelector('img,video,audio')).toBeNull();
  });
});
