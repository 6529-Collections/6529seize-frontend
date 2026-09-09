import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DropListItemContentNft from '@/components/drops/view/item/content/nft-tag/DropListItemContentNft';

jest.mock('next/link', () => {
  return ({ href, children, target, onClick }: any) => (
    <a href={href} target={target} onClick={onClick} data-testid="link">{children}</a>
  );
});

jest.mock('@/hooks/useAlchemyNftQueries', () => ({
  useTokenMetadataQuery: jest.fn().mockReturnValue({
    data: [{ tokenIdRaw: '5', imageUrl: 'img' }],
  }),
}));

describe('DropListItemContentNft', () => {
  const baseNft = { contract: '0x1', token: '5', name: 'Name' } as any;

  it('links to internal pages for known contracts', async () => {
    const { MEMES_CONTRACT, GRADIENT_CONTRACT } = require('@/constants/constants');

    const { rerender } = render(<DropListItemContentNft nft={{ ...baseNft, contract: MEMES_CONTRACT }} />);
    await waitFor(() => expect(screen.getByTestId('link')).toHaveAttribute('href', `/the-memes/${baseNft.token}`));
    expect(screen.getByTestId('link')).toHaveAttribute('target', '');

    rerender(<DropListItemContentNft nft={{ ...baseNft, contract: GRADIENT_CONTRACT }} />);
    await waitFor(() => expect(screen.getByTestId('link')).toHaveAttribute('href', `/6529-gradient/${baseNft.token}`));
  });

  it('loads display metadata through the internal Alchemy proxy hook', () => {
    const {
      useTokenMetadataQuery,
    } = require('@/hooks/useAlchemyNftQueries');

    const { container } = render(<DropListItemContentNft nft={baseNft} />);

    expect(useTokenMetadataQuery).toHaveBeenCalledWith({
      tokens: [{ contract: '0x1', tokenId: '5' }],
      enabled: true,
    });
    expect(container.querySelector('img')).toHaveAttribute('src', 'img');
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('defaults to external link for other contracts', async () => {
    render(<DropListItemContentNft nft={{ ...baseNft, contract: '0xabc' }} />);
    await waitFor(() => expect(screen.getByTestId('link')).toHaveAttribute('href', `https://opensea.io/assets/ethereum/0xabc/${baseNft.token}`));
    expect(screen.getByTestId('link')).toHaveAttribute('target', '_blank');
  });

  it('uses phrasing content when rendered inside a markdown paragraph', () => {
    const { container } = render(
      <p>
        <DropListItemContentNft nft={baseNft} />
      </p>
    );

    expect(container.querySelector('p a')).not.toBeNull();
    expect(container.querySelector('p div')).toBeNull();
  });
});
