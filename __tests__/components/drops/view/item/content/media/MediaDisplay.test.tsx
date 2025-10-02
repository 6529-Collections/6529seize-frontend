import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/components/drops/view/item/content/media/MediaDisplayImage', () => (props: any) => (
  <div data-testid="image" data-src={props.src} />
));
jest.mock('@/components/drops/view/item/content/media/MediaDisplayVideo', () => (props: any) => (
  <div data-testid="video" data-src={props.src} data-controls={String(props.showControls)} data-disable={String(props.disableClickHandler)} />
));
jest.mock('@/components/drops/view/item/content/media/MediaDisplayAudio', () => (props: any) => (
  <div data-testid="audio" data-src={props.src} data-controls={String(props.showControls)} />
));

jest.mock('next/dynamic', () => (importFn: any) => importFn().then ? () => <div data-testid="glb" /> : () => <div data-testid="glb" />);

import MediaDisplay from '@/components/drops/view/item/content/media/MediaDisplay';

describe('MediaDisplay', () => {
  it('renders image', () => {
    render(<MediaDisplay media_mime_type="image/png" media_url="img.png" />);
    expect(screen.getByTestId('image')).toHaveAttribute('data-src', 'img.png');
  });

  it('renders video', () => {
    render(<MediaDisplay media_mime_type="video/mp4" media_url="vid.mp4" />);
    const node = screen.getByTestId('video');
    expect(node).toHaveAttribute('data-src', 'vid.mp4');
    expect(node).toHaveAttribute('data-controls', 'true');
    expect(node).toHaveAttribute('data-disable', 'false');
  });

  it('renders audio', () => {
    render(<MediaDisplay media_mime_type="audio/mp3" media_url="a.mp3" disableMediaInteraction />);
    const node = screen.getByTestId('audio');
    expect(node).toHaveAttribute('data-src', 'a.mp3');
    expect(node).toHaveAttribute('data-controls', 'false');
  });

  it('renders glb', () => {
    render(<MediaDisplay media_mime_type="model" media_url="model.glb" />);
    expect(screen.getByTestId('glb')).toBeInTheDocument();
  });

  it('renders empty fragment for unknown', () => {
    const { container } = render(<MediaDisplay media_mime_type="text/plain" media_url="file.txt" />);
    expect(container).toBeEmptyDOMElement();
  });
});
