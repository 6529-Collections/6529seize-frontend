import { render, screen, act } from '@testing-library/react';
import ClientThumbnailGenerator from '@/components/drops/view/item/content/media/ClientThumbnailGenerator';

describe('ClientThumbnailGenerator', () => {
  const originalCreate = document.createElement;
  let eventMap: Record<string, () => void>;
  let videoMock: any;
  let canvasMock: any;

  beforeEach(() => {
    eventMap = {};
    canvasMock = {
      getContext: jest.fn(() => ({ drawImage: jest.fn() })),
      toDataURL: jest.fn(() => 'data:image/jpeg;base64,test'),
      width: 0,
      height: 0
    } as any;
    videoMock = {
      addEventListener: jest.fn((e, cb) => { eventMap[e] = cb; }),
      removeEventListener: jest.fn(),
      pause: jest.fn(),
      removeAttribute: jest.fn(),
      load: jest.fn(),
      currentTime: 0,
      videoWidth: 100,
      videoHeight: 100,
    } as any;
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'video') return videoMock;
      if (tag === 'canvas') return canvasMock;
      return originalCreate.call(document, tag);
    });
  });

  afterEach(() => {
    (document.createElement as jest.Mock).mockRestore();
  });

  it('renders loader initially', () => {
    const { container } = render(<ClientThumbnailGenerator src="video.mp4" />);
    expect(container.querySelector('.tw-animate-pulse')).toBeInTheDocument();
  });

  it('shows error placeholder on video error', () => {
    const { container } = render(<ClientThumbnailGenerator src="bad.mp4" />);
    act(() => {
      eventMap['error']();
    });
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders thumbnail after seeked', () => {
    render(<ClientThumbnailGenerator src="ok.mp4" />);
    act(() => {
      eventMap['loadedmetadata']();
      eventMap['seeked']();
    });
    const img = screen.getByAltText('Media thumbnail');
    expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,test');
  });
});
