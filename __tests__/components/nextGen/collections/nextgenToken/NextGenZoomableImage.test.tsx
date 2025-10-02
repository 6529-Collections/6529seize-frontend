import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NextGenZoomableImage, { MIN_ZOOM_SCALE } from '@/components/nextGen/collections/nextgenToken/NextGenZoomableImage';
import useIsMobileDevice from '@/hooks/isMobileDevice';
import useIsMobileScreen from '@/hooks/isMobileScreen';

jest.mock('next/image', () => ({
  __esModule: true,
  default: React.forwardRef((props: any, ref) => <img ref={ref} data-testid="img" {...props} />),
}));

jest.mock('@/hooks/isMobileDevice');
jest.mock('@/hooks/isMobileScreen');

jest.mock('@/components/nextGen/collections/nextgenToken/NextGenTokenImage', () => ({
  get8KUrl: jest.fn(() => '8k'),
  get16KUrl: jest.fn(() => '16k'),
}));

jest.mock('@/components/dotLoader/DotLoader', () => () => <div data-testid="loader" />);

describe('NextGenZoomableImage', () => {
  const token = { id: 1, name: 'Token' } as any;

  it('uses 8k url on mobile devices and 16k otherwise', () => {
    (useIsMobileDevice as jest.Mock).mockReturnValueOnce(true);
    (useIsMobileScreen as jest.Mock).mockReturnValue(false);
    const setZoomScale = jest.fn();
    const onImageLoaded = jest.fn();
    render(
      <NextGenZoomableImage
        token={token}
        zoom_scale={1}
        setZoomScale={setZoomScale}
        maintain_aspect_ratio={false}
        onImageLoaded={onImageLoaded}
      />
    );
    expect(screen.getByTestId('img')).toHaveAttribute('src', '8k');

    (useIsMobileDevice as jest.Mock).mockReturnValueOnce(false);
    render(
      <NextGenZoomableImage
        token={token}
        zoom_scale={1}
        setZoomScale={setZoomScale}
        maintain_aspect_ratio={false}
        onImageLoaded={onImageLoaded}
      />
    );
    expect(screen.getAllByTestId('img')[1]).toHaveAttribute('src', '16k');
  });

  it('handles wheel zoom events', () => {
    (useIsMobileDevice as jest.Mock).mockReturnValue(false);
    (useIsMobileScreen as jest.Mock).mockReturnValue(false);
    const setZoomScale = jest.fn();
    const onImageLoaded = jest.fn();
    render(
      <NextGenZoomableImage
        token={token}
        zoom_scale={5}
        setZoomScale={setZoomScale}
        maintain_aspect_ratio={false}
        onImageLoaded={onImageLoaded}
      />
    );
    const img = screen.getByTestId('img');
    Object.defineProperty(img, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    });
    fireEvent.wheel(img, { deltaY: -1, clientX: 50, clientY: 60 });
    expect(setZoomScale).toHaveBeenCalledWith(4);
    expect(img.style.transformOrigin).toBe('50% 60%');
  });

  it('runs image load workflow', () => {
    jest.useFakeTimers();
    (useIsMobileDevice as jest.Mock).mockReturnValue(false);
    (useIsMobileScreen as jest.Mock).mockReturnValue(false);
    const setZoomScale = jest.fn();
    const onImageLoaded = jest.fn();
    render(
      <NextGenZoomableImage
        token={token}
        zoom_scale={2}
        setZoomScale={setZoomScale}
        maintain_aspect_ratio={false}
        onImageLoaded={onImageLoaded}
      />
    );
    const img = screen.getByTestId('img');
    fireEvent.load(img);
    expect(setZoomScale).toHaveBeenCalledWith(MIN_ZOOM_SCALE + 1);
    jest.advanceTimersByTime(8000);
    expect(setZoomScale).toHaveBeenCalledWith(MIN_ZOOM_SCALE);
    jest.advanceTimersByTime(5000);
    expect(onImageLoaded).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
