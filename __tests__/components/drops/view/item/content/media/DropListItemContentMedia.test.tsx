import { render, screen } from '@testing-library/react';
import React from 'react';
import DropListItemContentMedia from '@/components/drops/view/item/content/media/DropListItemContentMedia';

jest.mock('@/components/drops/view/item/content/media/DropListItemContentMediaImage', () => ({ __esModule: true, default: () => <div data-testid="image" /> }));
jest.mock('@/components/drops/view/item/content/media/DropListItemContentMediaVideo', () => ({ __esModule: true, default: () => <div data-testid="video" /> }));
jest.mock('@/components/drops/view/item/content/media/DropListItemContentMediaAudio', () => ({ __esModule: true, default: () => <div data-testid="audio" /> }));
jest.mock('@/components/drops/view/item/content/media/DropListItemContentMediaGLB', () => ({ __esModule: true, default: () => <div data-testid="glb" /> }));
jest.mock('next/dynamic', () => (importer: any) => () => <div data-testid="glb" />);

describe('DropListItemContentMedia', () => {
  it('renders image component', () => {
    render(<DropListItemContentMedia media_mime_type="image/png" media_url="img" />);
    expect(screen.getByTestId('image')).toBeInTheDocument();
  });

  it('renders video component', () => {
    render(<DropListItemContentMedia media_mime_type="video/mp4" media_url="vid" />);
    expect(screen.getByTestId('video')).toBeInTheDocument();
  });

  it('renders audio component', () => {
    render(<DropListItemContentMedia media_mime_type="audio/mp3" media_url="aud" />);
    expect(screen.getByTestId('audio')).toBeInTheDocument();
  });

  it('renders glb component', () => {
    render(<DropListItemContentMedia media_mime_type="model/gltf-binary" media_url="file.glb" />);
    expect(screen.getByTestId('glb')).toBeInTheDocument();
  });

  it('renders empty fragment for unknown type', () => {
    const { container } = render(<DropListItemContentMedia media_mime_type="text/plain" media_url="file.txt" />);
    expect(container.firstChild).toBeNull();
  });
});
