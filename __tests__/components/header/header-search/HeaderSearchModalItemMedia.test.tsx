import React from 'react';
import { render, screen } from '@testing-library/react';
import HeaderSearchModalItemMedia from '../../../../components/header/header-search/HeaderSearchModalItemMedia';

jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));

describe('HeaderSearchModalItemMedia', () => {
  it('renders placeholder with rounded style when no image available', () => {
    const nft: any = { id: 1, name: 'NFT', icon_url: null, thumbnail_url: null, image_url: null };
    const { container } = render(<HeaderSearchModalItemMedia nft={nft} roundedFull />);
    const placeholder = container.querySelector('div');
    expect(placeholder).toHaveClass('tw-rounded-full');
    expect(placeholder).toHaveClass('tw-h-9');
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders provided src and alt', () => {
    render(<HeaderSearchModalItemMedia src="/pic.png" alt="pic" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/pic.png');
    expect(img).toHaveAttribute('alt', 'pic');
  });

  it('uses nft image and name', () => {
    const nft: any = { id: 2, name: 'Cool NFT', icon_url: 'icon.png', thumbnail_url: 'thumb.png', image_url: 'img.png' };
    render(<HeaderSearchModalItemMedia nft={nft} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'icon.png');
    expect(img).toHaveAttribute('alt', 'Cool NFT');
  });

  it('falls back to id when name missing', () => {
    const nft: any = { id: 42, name: null, icon_url: 'icon.png', thumbnail_url: null, image_url: null };
    render(<HeaderSearchModalItemMedia nft={nft} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', '#42');
  });
});
