import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MediaDisplayVideo from '../../../../../../../components/drops/view/item/content/media/MediaDisplayVideo';

// mock hooks used inside component
jest.mock('../../../../../../../hooks/useInView', () => ({
  useInView: () => [jest.fn(), true],
}));

const playMock = jest.fn().mockResolvedValue(undefined);
const pauseMock = jest.fn();

jest.mock('../../../../../../../hooks/useOptimizedVideo', () => ({
  useOptimizedVideo: () => ({ playableUrl: 'video.mp4', isHls: false }),
}));

beforeAll(() => {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: playMock,
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: pauseMock,
  });
});

beforeEach(() => {
  playMock.mockClear();
  pauseMock.mockClear();
});

describe('MediaDisplayVideo', () => {
  it('uses controlled playback instead of autoplay attribute', () => {
    const { container } = render(<MediaDisplayVideo src="foo.mp4" />);
    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video.autoplay).toBe(false); // Component uses useEffect for controlled playback
  });

  it('toggles play state on click when controls hidden', async () => {
    const user = userEvent.setup();
    const { container } = render(<MediaDisplayVideo src="foo.mp4" />);
    const video = container.querySelector('video') as HTMLVideoElement;
    Object.defineProperty(video, 'paused', { writable: true, value: true });
    await user.click(video);
    expect(playMock).toHaveBeenCalled();
    (video as any).paused = false;
    await user.click(video);
    expect(pauseMock).toHaveBeenCalled();
  });
});
